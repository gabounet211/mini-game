import { Character, createHero, rollRarity } from "./character"
import { applyClassChange, canChangeClass, characterClasses, classChangeOffers, closestClasses, missingStats } from "./characterClass"
import { levels } from "./gltf"
import { deriveAttributes, Rarity, Stats } from "./stats"
import { addExperience, experienceToNextLevel, isDeadly, sacrificeExperience, sacrificeValue, summonRewardChance, transferExperience } from "./rewards"
import { equipmentBonuses, equippedStats, getItem, itemName, itemSlots, ItemSlot } from "./items"
import { SaveData, writeSave } from "./save"
import { describeAction } from "./action"
import { allEnemiesDefeated, allHeroesDefeated, objectiveText } from "./endCondition"
import { assignHarvest, harvestAmount, isHarvesting, Resource, resourceNames, resources, specialistResources } from "./base"
import { assignResearch, canStartResearch, isResearching, researchAmount, researchProjects, startResearch, summonChances, teamBonus } from "./research"
import { canAfford, Cost, craft, isRecipeUnlocked, dismantle, dismantleValue, recipes, upgrade, upgradeCost } from "./forge"
import { equippedActions, learnableSkills, learnCost, learnSkill, masteryNeeded, maxSkillRank, skillAction, skillSlots, toggleEquipped } from "./skill"

export type Building = "warHall" | "trainingGrounds" | "shrine" | "storehouse" | "fields" | "library" | "forge" | "summoning"

const itemIcons: Record<ItemSlot | "classItem", [string, string]> = {
    weapon: ["#6B3A2E", "M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2"],
    armor: ["#3E5A7A", "M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"],
    jewelry: ["#6E5A2A", "M12 8a6 6 0 1 0 0 12a6 6 0 1 0 0-12zM9 3h6l-3 5z"],
    classItem: ["#5A3F8A", "M12 2l7 7-7 13-7-13z"],
}

const rarityColors: Record<Rarity, string> = {
    common: "#9AA3BF",
    uncommon: "#6FCF8E",
    rare: "#7FA4FF",
    legendary: "#E8B23A",
}

const campLooks: Record<Resource, [string, string]> = {
    wood: ["Lumber Camp", "#7A5A34"],
    food: ["Farm", "#8A7A2E"],
    leather: ["Hunting Lodge", "#8A4E36"],
    ore: ["Mine", "#4E5466"],
}

const itemFilters: [ItemSlot | "classItem" | "all", string][] = [["all", "All"], ["weapon", "Weapons"], ["armor", "Armor"], ["jewelry", "Jewelry"], ["classItem", "Class items"]]

export const buildingNames: Record<Building, string> = {
    warHall: "War Hall",
    trainingGrounds: "Training Grounds",
    shrine: "Shrine",
    storehouse: "Storehouse",
    fields: "Fields & Camps",
    library: "Library",
    forge: "Forge",
    summoning: "Summoning Circle",
}

export class Lobby {
    private element = document.createElement('div')
    private details = document.createElement('div')
    private team = new Set<Character>()
    private levelKey: string
    private sacrifice: Character | undefined
    private receiver: Character | undefined
    private confirmingTransfer = false
    private trainee: Character | undefined
    private storedItem: string | undefined
    private lastSummon: Character | undefined
    private itemFilter: ItemSlot | "classItem" | "all" = "all"
    private building: Building = "warHall"

    constructor(private save: SaveData, private onStart: (team: Character[], levelKey: string) => void, private onBack: () => void) {
        const unlocked = levels.keys().slice(0, save.unlockedLevels)
        this.levelKey = unlocked[unlocked.length - 1] ?? levels.keys()[0]
        this.element.id = 'lobby'
        this.element.className = 'buildingScreen'
        this.element.style.display = 'none'
        this.details.id = 'heroWindow'
        document.body.append(this.element, this.details)
        const lastTeam = save.roster.filter(character => save.lastTeam.includes(character.id))
        for (const character of (lastTeam.length ? lastTeam : save.roster).filter(character => this.canBring(character)).slice(0, this.teamLimit()))
            this.team.add(character)
        this.render()
    }

    open(building: Building) {
        this.building = building
        this.showDetails(undefined)
        this.render()
        this.element.style.display = 'flex'
    }

    private close() {
        this.element.style.display = 'none'
        this.showDetails(undefined)
        this.onBack()
    }

    private canBring(character: Character) {
        return !character.injured && !this.facedChampion(character) && !isHarvesting(this.save, character) && !isResearching(this.save, character)
    }

    private facedChampion(character: Character) {
        const level = levels.getLevel(this.levelKey)
        return !!level.finale && character.finaleAttempts.includes(level.chapter)
    }

    private teamLimit() {
        return levels.getLevel(this.levelKey).teamSize + teamBonus(this.save)
    }

    private render() {
        const title = document.createElement('div')
        title.className = 'lobbyTitle'
        title.textContent = buildingNames[this.building]

        const backButton = document.createElement('button')
        backButton.className = 'backButton'
        backButton.textContent = 'Back to village'
        backButton.addEventListener('click', () => this.close())

        if (this.building !== "warHall") {
            const content = document.createElement('div')
            content.className = 'lobbyContent'
            content.append(...this.renderBuilding())
            this.element.replaceChildren(backButton, title, content)
            return
        }

        const startButton = document.createElement('button')
        startButton.className = 'startButton'
        startButton.textContent = 'Start'
        startButton.disabled = this.team.size === 0 || this.team.size > this.teamLimit()
        startButton.addEventListener('click', () => {
            this.element.remove()
            this.details.remove()
            const team = this.save.roster.filter(character => this.team.has(character))
            this.save.lastTeam = team.map(character => character.id)
            writeSave(this.save)
            this.onStart(team, this.levelKey)
        })

        const company = document.createElement('div')
        company.className = 'companyColumn'
        company.append(...this.renderCompany(), startButton)
        const body = document.createElement('div')
        body.className = 'warHallBody'
        body.append(this.renderMissions(), company)
        this.element.replaceChildren(backButton, title, body)
    }

    private renderBuilding() {
        switch (this.building) {
            case "trainingGrounds": return this.renderTraining()
            case "shrine": return this.renderShrine()
            case "storehouse": return this.renderInventory()
            case "fields": return this.renderBase()
            case "library": return this.renderResearch()
            case "forge": return this.renderForge()
            case "summoning": return this.renderSummoning()
            default: return []
        }
    }

    private renderSummoning() {
        const circleColumn = document.createElement('div')
        circleColumn.className = 'companyColumn summonColumn'
        const circle = document.createElement('div')
        circle.className = 'summonCircle'
        const tokens = document.createElement('div')
        tokens.className = 'summonTokens'
        const count = document.createElement('span')
        count.className = 'counterValue'
        count.textContent = String(this.save.summons)
        const label = document.createElement('span')
        label.className = 'heroDetails'
        label.textContent = 'summon tokens'
        tokens.append(count, label)
        circle.append(tokens)
        const summonButton = document.createElement('button')
        summonButton.className = 'summonButton'
        summonButton.textContent = 'Summon · 1 token'
        summonButton.disabled = this.save.summons < 1
        summonButton.addEventListener('click', () => this.summon())
        const hint = document.createElement('div')
        hint.className = 'heroDetails'
        hint.textContent = 'Tokens are sometimes found after a combat (' + Math.round(summonRewardChance * 100) + '% chance)'
        circleColumn.append(circle, summonButton, hint)
        if (this.lastSummon) {
            const joined = document.createElement('div')
            joined.className = 'skillCard equipped'
            const joinedTitle = document.createElement('span')
            joinedTitle.className = 'sheetTitle'
            joinedTitle.textContent = 'Joined your company'
            const joinedName = document.createElement('span')
            joinedName.className = 'plaqueName'
            joinedName.textContent = this.heroLabel(this.lastSummon)
            joined.append(joinedTitle, joinedName)
            circleColumn.append(joined)
        }

        const odds = document.createElement('div')
        odds.className = 'sideColumn itemPanel'
        const oddsTitle = document.createElement('div')
        oddsTitle.className = 'plaqueName'
        oddsTitle.textContent = 'Odds'
        odds.append(oddsTitle)
        for (const [rarity, chance] of Object.entries(summonChances(this.save)) as [Rarity, number][]) {
            const row = document.createElement('div')
            row.className = 'lobbyRow'
            const name = document.createElement('span')
            name.style.color = rarityColors[rarity]
            name.textContent = this.formatName(rarity)
            const value = document.createElement('span')
            value.textContent = Math.round(chance * 100) + '%'
            row.append(name, value)
            const bar = document.createElement('div')
            bar.className = 'bar'
            const fill = document.createElement('div')
            fill.className = 'barFill'
            fill.style.width = Math.round(chance * 100) + '%'
            fill.style.backgroundColor = rarityColors[rarity]
            bar.append(fill)
            odds.append(row, bar)
        }
        if (!this.save.research.done.includes("summoningRites")) {
            const note = document.createElement('div')
            note.className = 'heroDetails'
            note.textContent = 'Research Summoning Rites at the Library to improve the odds.'
            odds.append(note)
        }

        const body = document.createElement('div')
        body.className = 'warHallBody'
        body.append(circleColumn, odds)
        return [body]
    }

    private renderTraining() {
        const trainee = this.trainee && this.save.roster.includes(this.trainee) ? this.trainee : this.save.roster[0]
        this.trainee = trainee

        const heroColumn = document.createElement('div')
        heroColumn.className = 'sideColumn'
        const heroTitle = document.createElement('div')
        heroTitle.className = 'sheetTitle'
        heroTitle.textContent = 'Heroes'
        heroColumn.append(heroTitle, ...this.save.roster.map(character => {
            const button = document.createElement('button')
            button.className = 'sideHero'
            button.classList.toggle('selectedMission', character === trainee)
            const name = document.createElement('span')
            name.className = 'missionText'
            name.textContent = this.heroLabel(character)
            button.append(name)
            if (character.skillPoints) {
                const badge = document.createElement('span')
                badge.className = 'pointBadge'
                badge.textContent = String(character.skillPoints)
                button.append(badge)
            }
            button.addEventListener('click', () => {
                this.trainee = character
                this.render()
            })
            return button
        }))

        const body = document.createElement('div')
        body.className = 'warHallBody'
        if (!trainee) {
            body.append(heroColumn)
            return [body]
        }

        const detail = document.createElement('div')
        detail.className = 'companyColumn'
        const banner = document.createElement('div')
        banner.className = 'heroBanner'
        const bannerName = document.createElement('span')
        bannerName.className = 'plaqueName'
        bannerName.textContent = this.heroLabel(trainee)
        banner.append(bannerName, this.createCounter(trainee.skillPoints, 'Skill points'), this.createCounter(trainee.equippedSkills.length + ' / ' + skillSlots(trainee), 'Equipped'))

        const knownTitle = document.createElement('div')
        knownTitle.className = 'sheetTitle'
        knownTitle.textContent = 'Known skills · skills rank up by being used in combat'
        const known = document.createElement('div')
        known.className = 'skillGrid'
        for (const name of Object.keys(trainee.skills)) {
            const action = skillAction(trainee, name)
            if (!action)
                continue
            const equipped = trainee.equippedSkills.includes(name)
            const skill = trainee.skills[name]
            const needed = masteryNeeded(skill)

            const card = document.createElement('div')
            card.className = 'skillCard'
            card.classList.toggle('equipped', equipped)
            const header = document.createElement('div')
            header.className = 'lobbyRow'
            const skillName = document.createElement('span')
            skillName.className = 'plaqueName'
            skillName.textContent = this.formatName(name)
            const rank = document.createElement('span')
            rank.className = 'rankPips'
            rank.title = 'Rank ' + skill.rank + ' / ' + maxSkillRank
            for (let index = 1; index <= maxSkillRank; index++) {
                const pip = document.createElement('span')
                pip.className = 'rankPip' + (index <= skill.rank ? ' filled' : '')
                rank.append(pip)
            }
            header.append(skillName, rank)

            const description = document.createElement('div')
            description.className = 'heroDetails'
            description.textContent = describeAction(action)

            const mastery = document.createElement('div')
            mastery.className = 'masteryRow'
            const masteryBar = document.createElement('div')
            masteryBar.className = 'bar'
            const masteryFill = document.createElement('div')
            masteryFill.className = 'barFill mastery'
            masteryFill.style.width = needed === undefined ? '100%' : Math.min(100, (skill.mastery ?? 0) / needed * 100) + '%'
            masteryBar.append(masteryFill)
            const masteryText = document.createElement('span')
            masteryText.textContent = needed === undefined ? 'Max rank' : 'Mastery ' + (skill.mastery ?? 0) + ' / ' + needed
            mastery.append(masteryBar, masteryText)

            const footer = document.createElement('div')
            footer.className = 'lobbyRow'
            const state = document.createElement('span')
            state.className = equipped ? 'equippedText' : 'heroDetails'
            state.textContent = equipped ? 'Equipped' : 'Not equipped'
            const equipButton = document.createElement('button')
            equipButton.textContent = equipped ? 'Unequip' : 'Equip'
            equipButton.disabled = equipped ? trainee.equippedSkills.length <= 1 : trainee.equippedSkills.length >= skillSlots(trainee)
            equipButton.addEventListener('click', () => this.updateTrainee(() => toggleEquipped(trainee, name)))
            footer.append(state, equipButton)

            card.append(header, description, mastery, footer)
            known.append(card)
        }

        const learnTitle = document.createElement('div')
        learnTitle.className = 'sheetTitle'
        learnTitle.textContent = 'Learn · ' + learnCost + ' point each'
        const learnable = document.createElement('div')
        learnable.className = 'skillGrid'
        for (const action of learnableSkills(trainee)) {
            const card = document.createElement('div')
            card.className = 'skillCard learnable'
            const text = document.createElement('div')
            text.className = 'missionText'
            const skillName = document.createElement('span')
            skillName.className = 'plaqueName'
            skillName.textContent = this.formatName(action.name)
            const description = document.createElement('span')
            description.className = 'heroDetails'
            description.textContent = describeAction(action)
            text.append(skillName, description)
            const learnButton = document.createElement('button')
            learnButton.className = 'learnButton'
            learnButton.textContent = 'Learn'
            learnButton.disabled = trainee.skillPoints < learnCost
            learnButton.addEventListener('click', () => this.updateTrainee(() => learnSkill(trainee, action.name)))
            card.append(text, learnButton)
            learnable.append(card)
        }
        if (!learnable.children.length)
            learnable.textContent = 'Every skill of this class is learned.'

        detail.append(banner, knownTitle, known, learnTitle, learnable)
        body.append(heroColumn, detail)
        return [body]
    }

    private createCounter(value: number | string, label: string) {
        const counter = document.createElement('span')
        counter.className = 'counter'
        const number = document.createElement('span')
        number.className = 'counterValue'
        number.textContent = String(value)
        const text = document.createElement('span')
        text.className = 'heroDetails'
        text.textContent = label
        counter.append(number, text)
        return counter
    }

    private updateTrainee(change: () => unknown) {
        change()
        writeSave(this.save)
        this.render()
    }

    private createSkillRow(title: string, details: string, buttons: HTMLButtonElement[]) {
        const row = document.createElement('div')
        row.className = 'heroRow'
        const info = document.createElement('div')
        info.className = 'heroInfo'
        const name = document.createElement('div')
        name.textContent = title
        const detail = document.createElement('div')
        detail.className = 'heroDetails'
        detail.textContent = details
        info.append(name, detail)
        row.append(info, ...buttons)
        return row
    }

    private renderShrine() {
        const ritual = document.createElement('div')
        ritual.className = 'companyColumn'
        const intro = document.createElement('div')
        intro.className = 'heroDetails'
        intro.textContent = 'Sacrifice a hero to give all its experience (+' + sacrificeExperience + ' bonus) to another hero. Its equipment returns to the inventory.'

        const sacrifice = this.sacrifice
        const receiver = this.receiver
        const flow = document.createElement('div')
        flow.className = 'altarFlow'
        const amount = document.createElement('span')
        amount.className = 'counterValue'
        const result = document.createElement('span')
        result.className = 'heroDetails'
        if (sacrifice && receiver) {
            const value = sacrificeValue(sacrifice)
            const after = { ...receiver }
            addExperience(after, value)
            amount.textContent = '+' + value + ' XP'
            result.textContent = after.level > receiver.level ? 'Level ' + receiver.level + ' → ' + after.level : 'Level ' + receiver.level
        } else {
            amount.textContent = '→'
        }
        flow.append(amount, result)
        const altars = document.createElement('div')
        altars.className = 'altars'
        altars.append(this.createAltar('Sacrifice', sacrifice, 'sacrificeAltar'), flow, this.createAltar('Receives', receiver, 'receiverAltar'))

        const pickTitle = document.createElement('div')
        pickTitle.className = 'sheetTitle'
        pickTitle.textContent = 'Pick the hero to sacrifice, then the one who receives'
        const heroes = document.createElement('div')
        heroes.className = 'rosterGrid'
        heroes.append(...this.save.roster.map(character => {
            const button = document.createElement('button')
            button.className = 'sideHero'
            button.classList.toggle('sacrificePick', character === sacrifice)
            button.classList.toggle('selectedMission', character === receiver)
            const name = document.createElement('span')
            name.className = 'missionText'
            name.textContent = this.heroLabel(character)
            button.append(name)
            if (character === sacrifice || character === receiver) {
                const tag = document.createElement('span')
                tag.className = character === sacrifice ? 'sacrificeTag' : 'equippedText'
                tag.textContent = character === sacrifice ? 'Sacrifice' : 'Receives'
                button.append(tag)
            }
            button.addEventListener('click', () => this.pickForCombination(character))
            return button
        }))

        const footer = document.createElement('div')
        footer.className = 'altarFooter'
        if (this.confirmingTransfer) {
            const warning = document.createElement('span')
            warning.className = 'lobbyWarning'
            warning.textContent = 'This cannot be undone. Click again to confirm.'
            footer.append(warning)
        }
        const combineButton = document.createElement('button')
        combineButton.className = 'combineButton'
        combineButton.textContent = this.confirmingTransfer ? 'Confirm' : 'Combine'
        combineButton.disabled = !sacrifice || !receiver
        combineButton.addEventListener('click', () => {
            if (!sacrifice || !receiver)
                return
            if (!this.confirmingTransfer) {
                this.confirmingTransfer = true
            } else {
                transferExperience(this.save, sacrifice, receiver)
                this.team.delete(sacrifice)
                this.sacrifice = undefined
                this.confirmingTransfer = false
                this.showDetails(undefined)
                writeSave(this.save)
            }
            this.render()
        })
        footer.append(combineButton)
        ritual.append(intro, altars, pickTitle, heroes, footer)

        const memorial = document.createElement('div')
        memorial.className = 'sideColumn memorial'
        const memorialTitle = document.createElement('div')
        memorialTitle.className = 'plaqueName'
        memorialTitle.textContent = 'Memorial'
        memorial.append(memorialTitle)
        if (!this.save.memorial.length) {
            const empty = document.createElement('div')
            empty.className = 'heroDetails'
            empty.textContent = 'No hero has fallen yet.'
            memorial.append(empty)
        }
        memorial.append(...this.save.memorial.map(fallen => {
            const stone = document.createElement('div')
            stone.className = 'memorialStone'
            const name = document.createElement('span')
            name.className = 'plaqueName'
            name.textContent = fallen.name
            const details = document.createElement('span')
            details.className = 'heroDetails'
            details.textContent = 'Level ' + fallen.level + ' · fell in ' + fallen.levelTitle
            stone.append(name, details)
            return stone
        }))

        const body = document.createElement('div')
        body.className = 'warHallBody'
        body.append(ritual, memorial)
        return [body]
    }

    private pickForCombination(character: Character) {
        if (character === this.sacrifice)
            this.sacrifice = undefined
        else if (character === this.receiver)
            this.receiver = undefined
        else if (!this.sacrifice)
            this.sacrifice = character
        else
            this.receiver = character
        this.confirmingTransfer = false
        this.render()
    }

    private createAltar(label: string, character: Character | undefined, className: string) {
        const altar = document.createElement('div')
        altar.className = 'altar ' + className
        const title = document.createElement('span')
        title.className = 'sheetTitle'
        title.textContent = label
        const name = document.createElement('span')
        name.className = 'plaqueName'
        name.textContent = character ? this.heroLabel(character) : 'Choose a hero'
        altar.append(title, name)
        return altar
    }

    private heroLabel(character: Character) {
        const characterClass = character.characterClass ? characterClasses[character.characterClass] : undefined
        return (characterClass?.name ?? character.entity) + ' (' + character.rarity + ')' + (characterClass ? ' · Tier ' + characterClass.tier : '') + ' - Level ' + character.level
    }

    private renderInventory() {
        const counts = new Map<string, number>()
        for (const key of this.save.inventory)
            counts.set(key, (counts.get(key) ?? 0) + 1)
        const kindOf = (key: string) => getItem(key)?.slot ?? "classItem"
        if (this.storedItem && !counts.has(this.storedItem))
            this.storedItem = undefined

        const filters = document.createElement('div')
        filters.className = 'lobbyTabs'
        for (const [key, label] of itemFilters) {
            const button = document.createElement('button')
            button.textContent = label
            button.classList.toggle('activeTab', key === this.itemFilter)
            button.addEventListener('click', () => {
                this.itemFilter = key
                this.render()
            })
            filters.append(button)
        }

        const grid = document.createElement('div')
        grid.className = 'itemGrid'
        for (const [key, count] of counts) {
            if (this.itemFilter !== "all" && kindOf(key) !== this.itemFilter)
                continue
            const tile = document.createElement('button')
            tile.className = 'itemTile'
            tile.classList.toggle('selectedMission', key === this.storedItem)
            const name = document.createElement('span')
            name.className = 'plaqueName'
            name.textContent = itemName(key)
            const bonus = document.createElement('span')
            bonus.className = 'heroDetails'
            bonus.textContent = getItem(key) ? this.formatBonuses(key) : 'Class change item'
            tile.append(this.createItemIcon(kindOf(key)), name, bonus)
            if (count > 1) {
                const countTag = document.createElement('span')
                countTag.className = 'itemCount'
                countTag.textContent = '×' + count
                tile.append(countTag)
            }
            tile.addEventListener('click', () => {
                this.storedItem = key
                this.render()
            })
            grid.append(tile)
        }
        if (!grid.children.length)
            grid.textContent = counts.size ? 'No item of this kind.' : 'No unused items.'

        const items = document.createElement('div')
        items.className = 'companyColumn'
        items.append(this.renderStock(), filters, grid)

        const body = document.createElement('div')
        body.className = 'warHallBody'
        body.append(items)
        const key = this.storedItem
        if (key) {
            const panel = document.createElement('div')
            panel.className = 'sideColumn itemPanel'
            const header = document.createElement('div')
            header.className = 'itemHeader'
            const title = document.createElement('div')
            title.className = 'missionText'
            const name = document.createElement('span')
            name.className = 'plaqueName'
            name.textContent = itemName(key)
            const info = document.createElement('span')
            info.className = 'heroDetails'
            const item = getItem(key)
            info.textContent = (item ? this.formatName(item.slot) : 'Class change item') + ' · ×' + counts.get(key) + ' in storage'
            title.append(name, info)
            header.append(this.createItemIcon(kindOf(key)), title)
            panel.append(header)
            if (item) {
                for (const [stat, value] of Object.entries(item.bonuses)) {
                    const row = document.createElement('div')
                    row.className = 'sheetRow bonusRow'
                    const statName = document.createElement('span')
                    statName.textContent = this.formatName(stat)
                    const statValue = document.createElement('span')
                    statValue.className = 'bonusValue'
                    statValue.textContent = '+' + value
                    row.append(statName, statValue)
                    panel.append(row)
                }
                const equipTitle = document.createElement('div')
                equipTitle.className = 'sheetTitle'
                equipTitle.textContent = 'Equip on'
                panel.append(equipTitle, ...this.save.roster.map(character => {
                    const button = document.createElement('button')
                    button.className = 'sideHero'
                    const heroName = document.createElement('span')
                    heroName.className = 'missionText'
                    heroName.textContent = this.heroLabel(character)
                    const current = document.createElement('span')
                    current.className = 'heroDetails'
                    const equipped = character.equipment[item.slot]
                    current.textContent = equipped ? itemName(equipped) : 'Empty'
                    button.append(heroName, current)
                    button.addEventListener('click', () => this.equip(character, item.slot, key))
                    return button
                }))
            } else {
                const note = document.createElement('div')
                note.className = 'heroDetails'
                note.textContent = 'Used to change the class of a legendary hero.'
                panel.append(note)
            }
            body.append(panel)
        }
        return [body]
    }

    private createItemIcon(kind: ItemSlot | "classItem") {
        const [color, path] = itemIcons[kind]
        const icon = document.createElement('span')
        icon.className = 'itemIcon'
        icon.style.backgroundColor = color
        icon.innerHTML = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#F1E9D6" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + path + '"/></svg>'
        return icon
    }

    private renderStock() {
        const stock = document.createElement('div')
        stock.textContent = 'Stock: ' + resources.map(resource => resourceNames[resource] + ' ' + this.save.resources[resource]).join(' · ')
        return stock
    }

    private renderBase() {
        const camps = document.createElement('div')
        camps.className = 'campGrid'
        for (const resource of resources) {
            const [campName, color] = campLooks[resource]
            const workers = this.save.roster.filter(character => this.save.harvest[character.id] === resource)
            const specialist = Object.entries(specialistResources).find(([, value]) => value === resource)?.[0]
            const card = document.createElement('div')
            card.className = 'skillCard campCard'
            const banner = document.createElement('div')
            banner.className = 'campBanner'
            banner.style.backgroundColor = color
            const name = document.createElement('span')
            name.className = 'plaqueName'
            name.textContent = campName
            const info = document.createElement('span')
            info.textContent = resourceNames[resource] + ' · specialist: ' + (specialist ? characterClasses[specialist]?.name ?? this.formatName(specialist) : 'none yet')
            banner.append(name, info)
            const stock = document.createElement('div')
            stock.className = 'lobbyRow'
            const amount = document.createElement('span')
            amount.className = 'counterValue'
            amount.textContent = String(this.save.resources[resource])
            const gain = document.createElement('span')
            gain.className = 'bonusValue'
            gain.textContent = '+' + workers.reduce((total, character) => total + harvestAmount(character, resource), 0) + ' next combat'
            stock.append(amount, gain)
            card.append(banner, stock)
            for (const character of workers) {
                const worker = document.createElement('button')
                worker.className = 'sideHero'
                worker.title = 'Remove from the camp'
                const workerName = document.createElement('span')
                workerName.className = 'missionText'
                workerName.textContent = this.heroLabel(character) + (character.injured ? ' · Injured' : '')
                const workerGain = document.createElement('span')
                workerGain.className = 'bonusValue'
                workerGain.textContent = '+' + harvestAmount(character, resource)
                worker.append(workerName, workerGain)
                worker.addEventListener('click', () => this.assignWorker(character, undefined))
                card.append(worker)
            }
            if (!workers.length) {
                const empty = document.createElement('div')
                empty.className = 'heroDetails'
                empty.textContent = 'No worker'
                card.append(empty)
            }
            camps.append(card)
        }

        const idleTitle = document.createElement('div')
        idleTitle.className = 'sheetTitle'
        idleTitle.textContent = 'Heroes not at the fields · heroes working at the base cannot join the team, injured heroes do half'
        const idle = document.createElement('div')
        idle.className = 'rosterGrid'
        for (const character of this.save.roster.filter(character => !isHarvesting(this.save, character))) {
            const card = document.createElement('div')
            card.className = 'skillCard'
            const name = document.createElement('span')
            name.className = 'plaqueName'
            name.textContent = this.heroLabel(character)
            const state = document.createElement('span')
            state.className = 'heroDetails'
            state.textContent = isResearching(this.save, character) ? 'At the Library' : character.injured ? 'Injured' : 'Idle'
            const buttons = document.createElement('div')
            buttons.className = 'workButtons'
            for (const resource of resources) {
                const button = document.createElement('button')
                button.textContent = resourceNames[resource] + ' +' + harvestAmount(character, resource)
                button.addEventListener('click', () => this.assignWorker(character, resource))
                buttons.append(button)
            }
            card.append(name, state, buttons)
            idle.append(card)
        }

        const column = document.createElement('div')
        column.className = 'companyColumn'
        column.append(camps, idleTitle, idle)
        return [column]
    }

    private assignWorker(character: Character, resource: Resource | undefined) {
        assignHarvest(this.save, character, resource)
        if (resource)
            this.team.delete(character)
        writeSave(this.save)
        this.render()
    }

    private renderResearch() {
        const current = this.save.research.current
        const status = document.createElement('div')
        status.className = 'researchStatus'
        const progress = document.createElement('div')
        progress.className = 'companyColumn'
        const label = document.createElement('div')
        label.className = 'sheetTitle'
        label.textContent = current ? 'In progress' : 'No research in progress'
        const name = document.createElement('div')
        name.className = 'plaqueName researchName'
        name.textContent = current ? researchProjects[current].name : 'Start a project below'
        progress.append(label, name)
        if (current) {
            const project = researchProjects[current]
            const description = document.createElement('div')
            description.className = 'heroDetails'
            description.textContent = project.description
            const barRow = document.createElement('div')
            barRow.className = 'masteryRow'
            const bar = document.createElement('div')
            bar.className = 'bar researchBar'
            const fill = document.createElement('div')
            fill.className = 'barFill research'
            fill.style.width = Math.min(100, this.save.research.progress / project.points * 100) + '%'
            bar.append(fill)
            const points = document.createElement('span')
            points.textContent = this.save.research.progress + ' / ' + project.points + ' points'
            barRow.append(bar, points)
            progress.append(description, barRow)
        }

        const researchers = document.createElement('div')
        researchers.className = 'sideColumn'
        const researchersTitle = document.createElement('div')
        researchersTitle.className = 'sheetTitle'
        researchersTitle.textContent = 'Researchers · ' + this.save.researchers.length + ' · progress after each combat'
        researchers.append(researchersTitle)
        for (const character of this.save.roster) {
            const researching = isResearching(this.save, character)
            const button = document.createElement('button')
            button.className = 'sideHero'
            button.classList.toggle('selectedMission', researching)
            const heroName = document.createElement('span')
            heroName.className = 'missionText'
            heroName.textContent = this.heroLabel(character) + (character.injured ? ' · Injured' : '')
            const action = document.createElement('span')
            action.className = researching ? 'equippedText' : 'heroDetails'
            action.textContent = researching ? '+' + researchAmount(character) + ' / combat · Remove' : isHarvesting(this.save, character) ? 'At the fields · Assign' : 'Assign'
            button.append(heroName, action)
            button.addEventListener('click', () => {
                assignResearch(this.save, character, !researching)
                this.team.delete(character)
                writeSave(this.save)
                this.render()
            })
            researchers.append(button)
        }
        status.append(progress, researchers)

        const projectsTitle = document.createElement('div')
        projectsTitle.className = 'sheetTitle'
        projectsTitle.textContent = 'Projects · Scholars, Alchemists and Sages research faster, injured heroes do half'
        const projects = document.createElement('div')
        projects.className = 'skillGrid'
        for (const [key, project] of Object.entries(researchProjects)) {
            const done = this.save.research.done.includes(key)
            const card = document.createElement('div')
            card.className = 'skillCard'
            card.classList.toggle('equipped', key === current)
            const title = document.createElement('span')
            title.className = 'plaqueName'
            title.textContent = project.name
            const description = document.createElement('span')
            description.className = 'heroDetails'
            description.textContent = project.description
            const cost = this.createCostChips(project.cost)
            const pointsChip = document.createElement('span')
            pointsChip.className = 'costChip'
            pointsChip.textContent = project.points + ' points'
            cost.prepend(pointsChip)
            const startButton = document.createElement('button')
            startButton.className = 'researchButton'
            startButton.textContent = done ? 'Done' : key === current ? 'In progress' : current ? 'After the current research' : 'Start'
            startButton.disabled = !canStartResearch(this.save, key)
            startButton.addEventListener('click', () => this.updateTrainee(() => startResearch(this.save, key)))
            card.append(title, description, cost, startButton)
            projects.append(card)
        }

        const column = document.createElement('div')
        column.className = 'companyColumn'
        column.append(this.renderStock(), status, projectsTitle, projects)
        return [column]
    }

    private renderForge() {
        const craftColumn = document.createElement('div')
        craftColumn.className = 'companyColumn'
        const craftTitle = document.createElement('div')
        craftTitle.className = 'plaqueName'
        craftTitle.textContent = 'Craft'
        const craftList = document.createElement('div')
        craftList.className = 'skillGrid'
        const locked: string[] = []
        for (const [key, cost] of Object.entries(recipes)) {
            if (!isRecipeUnlocked(this.save, key)) {
                locked.push(itemName(key))
                continue
            }
            const card = document.createElement('div')
            card.className = 'skillCard recipeCard'
            const text = document.createElement('div')
            text.className = 'missionText'
            const name = document.createElement('span')
            name.className = 'plaqueName'
            name.textContent = itemName(key)
            const bonus = document.createElement('span')
            bonus.className = 'bonusValue'
            bonus.textContent = this.formatBonuses(key)
            text.append(name, bonus, this.createCostChips(cost))
            const craftButton = document.createElement('button')
            craftButton.className = 'forgeButton'
            craftButton.textContent = 'Craft'
            craftButton.disabled = !canAfford(this.save, cost)
            craftButton.addEventListener('click', () => this.updateTrainee(() => craft(this.save, key)))
            card.append(text, craftButton)
            craftList.append(card)
        }
        craftColumn.append(this.renderStock(), craftTitle, craftList)
        if (locked.length) {
            const lockedNote = document.createElement('div')
            lockedNote.className = 'lockedNote'
            lockedNote.textContent = locked.join(', ') + ' · research Advanced Smithing at the Library'
            craftColumn.append(lockedNote)
        }

        const workColumn = document.createElement('div')
        workColumn.className = 'sideColumn itemPanel'
        const workTitle = document.createElement('div')
        workTitle.className = 'plaqueName'
        workTitle.textContent = 'Upgrade or dismantle'
        const workInfo = document.createElement('div')
        workInfo.className = 'heroDetails'
        workInfo.textContent = 'Unused items from the Storehouse. Unequip an item to work on it.'
        workColumn.append(workTitle, workInfo)
        for (const key of new Set(this.save.inventory)) {
            const value = dismantleValue(key)
            if (!value)
                continue
            const cost = upgradeCost(key)
            const count = this.save.inventory.filter(other => other === key).length
            const card = document.createElement('div')
            card.className = 'skillCard'
            const header = document.createElement('div')
            header.className = 'lobbyRow'
            const name = document.createElement('span')
            name.className = 'plaqueName'
            name.textContent = itemName(key) + (count > 1 ? ' ×' + count : '')
            const bonus = document.createElement('span')
            bonus.className = 'bonusValue'
            bonus.textContent = this.formatBonuses(key)
            header.append(name, bonus)
            const buttons = document.createElement('div')
            buttons.className = 'workButtons'
            const upgradeButton = document.createElement('button')
            upgradeButton.className = 'forgeButton'
            upgradeButton.textContent = cost ? 'Upgrade · ' + this.formatCost(cost) : 'Max'
            upgradeButton.disabled = !cost || !canAfford(this.save, cost)
            upgradeButton.addEventListener('click', () => this.updateTrainee(() => upgrade(this.save, key)))
            const dismantleButton = document.createElement('button')
            dismantleButton.textContent = 'Dismantle · +' + this.formatCost(value)
            dismantleButton.addEventListener('click', () => this.updateTrainee(() => dismantle(this.save, key)))
            buttons.append(upgradeButton, dismantleButton)
            card.append(header, buttons)
            workColumn.append(card)
        }
        if (workColumn.children.length === 2) {
            const empty = document.createElement('div')
            empty.className = 'heroDetails'
            empty.textContent = 'No unused items.'
            workColumn.append(empty)
        }

        const body = document.createElement('div')
        body.className = 'warHallBody'
        body.append(craftColumn, workColumn)
        return [body]
    }

    private createCostChips(cost: Cost) {
        const chips = document.createElement('span')
        chips.className = 'costChips'
        for (const resource of resources) {
            const amount = cost[resource]
            if (!amount)
                continue
            const chip = document.createElement('span')
            chip.className = 'costChip' + (this.save.resources[resource] < amount ? ' missing' : '')
            chip.textContent = amount + ' ' + resourceNames[resource]
            chips.append(chip)
        }
        return chips
    }

    private formatCost(cost: Cost) {
        return resources.filter(resource => cost[resource]).map(resource => cost[resource] + ' ' + resourceNames[resource]).join(', ')
    }

    private selectLevel(key: string) {
        this.levelKey = key
        for (const character of [...this.team])
            if (!this.canBring(character))
                this.team.delete(character)
        this.render()
    }

    private renderMissions() {
        const column = document.createElement('div')
        column.className = 'missionColumn'
        const keys = levels.keys()
        let chapter = ''
        for (const [index, key] of keys.slice(0, this.save.unlockedLevels + 1).entries()) {
            const level = levels.getLevel(key)
            const [chapterName, missionName] = level.title.split(': ')
            if (level.chapter !== chapter) {
                chapter = level.chapter
                const heading = document.createElement('div')
                heading.className = 'sheetTitle'
                heading.textContent = chapterName.split(' - ')[0]
                column.append(heading)
            }
            const locked = index >= this.save.unlockedLevels
            const mission = document.createElement('button')
            mission.className = 'mission'
            mission.dataset.level = key
            mission.disabled = locked
            mission.classList.toggle('selectedMission', key === this.levelKey)
            const seal = document.createElement('span')
            seal.className = 'missionSeal'
            seal.textContent = chapterName.replace(/\D+/g, '-').replace(/^-|-$/g, '')
            const name = document.createElement('span')
            name.className = 'missionName'
            name.textContent = locked ? 'Locked' : missionName ?? level.title
            const info = document.createElement('span')
            info.className = 'heroDetails'
            info.textContent = locked ? 'Finish the previous mission' : 'Recommended Lv ' + (level.recommendedLevel ?? '-') + (isDeadly(key) ? ' · Deadly' : '')
            const text = document.createElement('span')
            text.className = 'missionText'
            text.append(name, info)
            mission.append(seal, text)
            mission.addEventListener('click', () => this.selectLevel(key))
            column.append(mission)
        }

        const level = levels.getLevel(this.levelKey)
        const brief = document.createElement('div')
        brief.className = 'missionBrief'
        const briefTitle = document.createElement('div')
        briefTitle.className = 'plaqueName'
        briefTitle.textContent = level.title
        const objective = document.createElement('div')
        objective.textContent = 'Objective: ' + objectiveText(level.victory ?? allEnemiesDefeated, level.defeat ?? allHeroesDefeated)
        const recommended = document.createElement('div')
        recommended.className = 'heroDetails'
        recommended.textContent = level.recommendedLevel ? 'Recommended level ' + level.recommendedLevel + ' · heroes more than 1 level above earn less XP' : ''
        const danger = document.createElement('div')
        danger.className = isDeadly(this.levelKey) ? 'lobbyWarning' : 'safeInfo'
        danger.textContent = isDeadly(this.levelKey)
            ? 'Deadly · heroes who fall in this level die for good.'
            : 'Safe · fallen heroes are only injured and miss the next combat.'
        brief.append(briefTitle, objective, recommended, danger)
        column.append(brief)
        return column
    }

    private renderCompany() {
        const heading = document.createElement('div')
        heading.className = 'plaqueName'
        heading.textContent = 'Your company · ' + this.team.size + ' / ' + this.teamLimit()

        const slots = document.createElement('div')
        slots.className = 'teamSlots'
        const members = this.save.roster.filter(character => this.team.has(character))
        for (let index = 0; index < this.teamLimit(); index++) {
            const character = members[index]
            const slot = document.createElement('button')
            slot.className = 'teamSlot' + (character ? ' filled' : '')
            slot.disabled = !character
            if (character) {
                const attributes = deriveAttributes(equippedStats(character))
                const name = document.createElement('span')
                name.className = 'plaqueName'
                name.textContent = this.heroLabel(character)
                const details = document.createElement('span')
                details.className = 'heroDetails'
                details.textContent = 'HP ' + attributes.maxHealt + ' · AP ' + attributes.maxActionPoints + ' · Ms ' + attributes.moveRange
                slot.title = 'Remove from the team'
                slot.append(name, details)
                slot.addEventListener('click', () => {
                    this.team.delete(character)
                    this.render()
                })
            } else {
                slot.textContent = 'Empty'
            }
            slots.append(slot)
        }

        const rosterTitle = document.createElement('div')
        rosterTitle.className = 'sheetTitle'
        rosterTitle.textContent = 'Available heroes'
        const roster = document.createElement('div')
        roster.className = 'rosterGrid'
        roster.append(...this.save.roster.map(character => this.createHeroCard(character)))
        return [heading, slots, rosterTitle, roster]
    }

    private createHeroCard(character: Character) {
        const card = document.createElement('div')
        card.className = 'heroCard'
        const inTeam = this.team.has(character)
        card.classList.toggle('inTeam', inTeam)

        const pick = document.createElement('button')
        pick.className = 'heroPick'
        pick.disabled = !inTeam && (!this.canBring(character) || this.team.size >= this.teamLimit())
        pick.addEventListener('click', () => {
            if (inTeam)
                this.team.delete(character)
            else
                this.team.add(character)
            this.render()
        })

        const attributes = deriveAttributes(equippedStats(character))
        const name = document.createElement('span')
        name.className = 'plaqueName'
        name.textContent = this.heroLabel(character)
        const details = document.createElement('span')
        details.className = 'heroDetails'
        details.textContent = 'HP ' + attributes.maxHealt + ' · AP ' + attributes.maxActionPoints + ' · Ms ' + attributes.moveRange
            + (character.talent ? ' · Talent: ' + character.talent.charAt(0).toUpperCase() + character.talent.slice(1) : '')
            + (character.statPoints ? ' · ' + character.statPoints + ' points to spend' : '')
            + (canChangeClass(character) ? ' · Class change ready!' : '')
            + (character.injured ? ' · Injured: misses the next combat' : '')
            + (isHarvesting(this.save, character) ? ' · At the base: ' + resourceNames[this.save.harvest[character.id]] : '')
            + (isResearching(this.save, character) ? ' · At the base: Research' : '')
            + (this.facedChampion(character) ? ' · Already faced the champion' : '')
        pick.append(name, details)

        const detailsButton = document.createElement('button')
        detailsButton.className = 'detailsButton'
        detailsButton.textContent = 'Details'
        detailsButton.addEventListener('click', () => this.showDetails(character))

        card.append(pick, detailsButton)
        return card
    }

    private showDetails(character: Character | undefined) {
        this.details.style.display = character ? 'flex' : 'none'
        if (!character)
            return
        const characterClass = character.characterClass ? characterClasses[character.characterClass] : undefined
        const attributes = deriveAttributes(equippedStats(character))
        const title = document.createElement('div')
        title.className = 'lobbyTitle'
        title.textContent = (characterClass?.name ?? character.entity) + ' (' + character.rarity + ')' + (characterClass ? ' · Tier ' + characterClass.tier : '')
        const closeButton = document.createElement('button')
        closeButton.textContent = 'Close'
        closeButton.addEventListener('click', () => this.showDetails(undefined))
        this.details.replaceChildren(
            title,
            this.createSection('Progress', [['Level', character.level], ['Experience', character.experience + '/' + experienceToNextLevel(character.level)], ['Stat points', character.statPoints], ['Talent', character.talent ? this.formatName(character.talent) : '-']]),
            this.createSection('Attributes', [['HP', attributes.maxHealt], ['AP', attributes.maxActionPoints], ['Ms', attributes.moveRange], ...(equippedActions(character).some(action => action.concentration) ? [['Concentration', attributes.maxConcentration] as [string, number]] : [])]),
            this.createStatsSection(character),
            this.createEquipmentSection(character),
            this.createSection('Actions', [...(characterClass?.inspiresAllies ? [['Inspire allies', '+1 damage'] as [string, string]] : []), ...equippedActions(character).map(action => [this.formatName(action.name), describeAction(action)] as [string, string])]),
            ...this.createClassChangeSection(character),
            closeButton,
        )
    }

    private createClassChangeSection(character: Character) {
        if (!canChangeClass(character))
            return []
        const section = this.createSection('Class change', [])
        const offers = classChangeOffers(character, this.save.inventory)
        if (!offers.length) {
            const text = document.createElement('div')
            text.textContent = character.rarity === "legendary" ? 'A special item is needed to change class.' : 'No class available yet. Closest:'
            section.append(text)
            for (const key of closestClasses(character)) {
                const row = document.createElement('div')
                row.className = 'heroDetails'
                row.textContent = characterClasses[key].name + ': ' + missingStats(character, key).map(([stat, value]) => '+' + value + ' ' + this.formatName(stat)).join(', ')
                section.append(row)
            }
        }
        for (const key of offers) {
            const characterClass = characterClasses[key]
            const button = document.createElement('button')
            const minimums = Object.entries(characterClass.minimums ?? {}).map(([stat, value]) => this.formatName(stat) + ' ' + value)
            button.textContent = 'Become ' + characterClass.name + (minimums.length ? ' (' + minimums.join(', ') + ')' : '')
            button.addEventListener('click', () => {
                if (!applyClassChange(character, key, this.save.inventory))
                    return
                writeSave(this.save)
                this.render()
                this.showDetails(character)
            })
            section.append(button)
        }
        return [section]
    }

    private createStatsSection(character: Character) {
        const section = this.createSection('Stats', [])
        const bonuses = equipmentBonuses(character)
        for (const stat of Object.keys(character.stats) as (keyof Stats)[]) {
            const row = document.createElement('div')
            row.className = 'sheetRow'
            const name = document.createElement('span')
            name.textContent = this.formatName(stat)
            const value = document.createElement('span')
            value.textContent = String(character.stats[stat] + bonuses[stat]) + (bonuses[stat] ? ' (+' + bonuses[stat] + ')' : '')
            row.append(name)
            if (character.statPoints > 0) {
                const plusButton = document.createElement('button')
                plusButton.className = 'statButton'
                plusButton.textContent = '+'
                plusButton.addEventListener('click', () => {
                    if (character.statPoints < 1)
                        return
                    character.stats[stat]++
                    character.statPoints--
                    writeSave(this.save)
                    this.render()
                    this.showDetails(character)
                })
                value.prepend(plusButton)
            }
            row.append(value)
            section.append(row)
        }
        return section
    }

    private createEquipmentSection(character: Character) {
        const section = this.createSection('Equipment', [])
        for (const slot of itemSlots) {
            const row = document.createElement('div')
            row.className = 'sheetRow'
            const name = document.createElement('span')
            name.textContent = this.formatName(slot)
            const select = document.createElement('select')
            const current = character.equipment[slot]
            const choices = [...new Set(this.save.inventory.filter(key => getItem(key)?.slot === slot))]
            for (const key of ['', ...(current ? [current] : []), ...choices.filter(key => key !== current)]) {
                const option = document.createElement('option')
                option.value = key
                option.textContent = key ? itemName(key) + ' (' + this.formatBonuses(key) + ')' : '-'
                option.selected = key === (current ?? '')
                select.append(option)
            }
            select.addEventListener('change', () => this.equip(character, slot, select.value || undefined))
            row.append(name, select)
            section.append(row)
        }
        return section
    }

    private formatBonuses(key: string) {
        return Object.entries(getItem(key)?.bonuses ?? {}).map(([stat, value]) => '+' + value + ' ' + this.formatName(stat)).join(', ')
    }

    private equip(character: Character, slot: ItemSlot, item: string | undefined) {
        const previous = character.equipment[slot]
        if (previous)
            this.save.inventory.push(previous)
        if (item)
            this.save.inventory.splice(this.save.inventory.indexOf(item), 1)
        character.equipment[slot] = item
        writeSave(this.save)
        this.render()
        if (this.details.style.display === 'flex')
            this.showDetails(character)
    }

    private createSection(title: string, rows: [string, string | number][]) {
        const section = document.createElement('div')
        section.className = 'sheetSection'
        const heading = document.createElement('div')
        heading.className = 'sheetTitle'
        heading.textContent = title
        section.append(heading)
        for (const [label, value] of rows) {
            const row = document.createElement('div')
            row.className = 'sheetRow'
            const name = document.createElement('span')
            name.textContent = label
            const content = document.createElement('span')
            content.textContent = String(value)
            row.append(name, content)
            section.append(row)
        }
        return section
    }

    private formatName(name: string) {
        const words = name.replace(/([A-Z])/g, ' $1').trim()
        return words.charAt(0).toUpperCase() + words.slice(1)
    }

    private summon() {
        if (this.save.summons < 1)
            return
        this.save.summons--
        this.lastSummon = createHero("hero", rollRarity(Math.random, summonChances(this.save)))
        this.save.roster.push(this.lastSummon)
        writeSave(this.save)
        this.render()
    }
}

import { Character, createHero } from "./character"
import { applyClassChange, canChangeClass, characterClasses, classChangeOffers, closestClasses, missingStats } from "./characterClass"
import { levels } from "./gltf"
import { deriveAttributes, Stats } from "./stats"
import { addExperience, experienceToNextLevel, isDeadly, sacrificeExperience, sacrificeValue, transferExperience } from "./rewards"
import { equipmentBonuses, equippedStats, itemName, items, itemSlots, ItemSlot } from "./items"
import { SaveData, writeSave } from "./save"
import { describeAction } from "./action"
import { equippedActions, learnableSkills, learnCost, learnSkill, masteryNeeded, maxSkillRank, skillAction, skillSlots, toggleEquipped } from "./skill"

type LobbyTab = "heroes" | "training" | "combination" | "inventory"

const tabs: [LobbyTab, string][] = [["heroes", "Heroes"], ["training", "Training"], ["combination", "Combination"], ["inventory", "Inventory"]]

export class Lobby {
    private element = document.createElement('div')
    private details = document.createElement('div')
    private team = new Set<Character>()
    private levelKey: string
    private sacrifice: Character | undefined
    private receiver: Character | undefined
    private confirmingTransfer = false
    private trainee: Character | undefined
    private tab: LobbyTab = "heroes"

    constructor(private save: SaveData, private onStart: (team: Character[], levelKey: string) => void) {
        const unlocked = levels.keys().slice(0, save.unlockedLevels)
        this.levelKey = unlocked[unlocked.length - 1] ?? levels.keys()[0]
        this.element.id = 'lobby'
        this.details.id = 'heroWindow'
        document.body.append(this.element, this.details)
        const lastTeam = save.roster.filter(character => save.lastTeam.includes(character.id))
        for (const character of (lastTeam.length ? lastTeam : save.roster).filter(character => this.canBring(character)).slice(0, this.teamLimit()))
            this.team.add(character)
        this.render()
    }

    private canBring(character: Character) {
        return !character.injured && !this.facedChampion(character)
    }

    private facedChampion(character: Character) {
        const level = levels.getLevel(this.levelKey)
        return !!level.finale && character.finaleAttempts.includes(level.chapter)
    }

    private teamLimit() {
        return levels.getLevel(this.levelKey).teamSize
    }

    private render() {
        const title = document.createElement('div')
        title.className = 'lobbyTitle'
        title.textContent = 'Lobby'

        const levelRow = document.createElement('label')
        levelRow.className = 'lobbyRow'
        levelRow.textContent = 'Level'
        const levelSelect = document.createElement('select')
        for (const key of levels.keys().slice(0, this.save.unlockedLevels)) {
            const option = document.createElement('option')
            option.value = key
            option.textContent = levels.getLevel(key).title
            option.selected = key === this.levelKey
            levelSelect.append(option)
        }
        levelSelect.addEventListener('change', () => {
            this.levelKey = levelSelect.value
            for (const character of [...this.team])
                if (!this.canBring(character))
                    this.team.delete(character)
            this.render()
        })
        levelRow.append(levelSelect)

        const teamInfo = document.createElement('div')
        teamInfo.textContent = 'Team: ' + this.team.size + '/' + this.teamLimit()

        const recommendedLevel = levels.getLevel(this.levelKey).recommendedLevel
        const recommendedInfo = document.createElement('div')
        recommendedInfo.className = 'heroDetails'
        recommendedInfo.textContent = recommendedLevel ? 'Recommended level: ' + recommendedLevel + ' (heroes more than 1 level above earn less XP)' : ''

        const dangerInfo = document.createElement('div')
        dangerInfo.className = isDeadly(this.levelKey) ? 'lobbyWarning' : 'heroDetails'
        dangerInfo.textContent = isDeadly(this.levelKey)
            ? 'Heroes who fall in this level die for good.'
            : 'Heroes who fall here are only injured and miss the next combat.'

        const tabRow = document.createElement('div')
        tabRow.className = 'lobbyTabs'
        for (const [key, label] of tabs) {
            const tabButton = document.createElement('button')
            tabButton.textContent = label
            tabButton.classList.toggle('activeTab', key === this.tab)
            tabButton.addEventListener('click', () => {
                this.tab = key
                this.render()
            })
            tabRow.append(tabButton)
        }

        const content = document.createElement('div')
        content.className = 'lobbyContent'
        content.append(...(this.tab === "heroes" ? this.renderHeroes() : this.tab === "training" ? this.renderTraining() : this.tab === "combination" ? this.renderCombination() : this.renderInventory()))

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

        this.element.replaceChildren(title, levelRow, recommendedInfo, dangerInfo, teamInfo, tabRow, content, startButton)
    }

    private renderHeroes() {
        const summonRow = document.createElement('div')
        summonRow.className = 'lobbyRow'
        summonRow.textContent = 'Summon tokens: ' + this.save.summons
        const summonButton = document.createElement('button')
        summonButton.textContent = 'Summon (1)'
        summonButton.disabled = this.save.summons < 1
        summonButton.addEventListener('click', () => this.summon())
        summonRow.append(summonButton)

        const heroList = document.createElement('div')
        heroList.className = 'heroList'
        heroList.append(...this.save.roster.map(character => this.createHeroRow(character)))
        if (!this.save.memorial.length)
            return [summonRow, heroList]

        const memorialTitle = document.createElement('div')
        memorialTitle.className = 'lobbyRow'
        memorialTitle.textContent = 'Memorial'
        const memorial = document.createElement('div')
        memorial.className = 'heroList'
        memorial.append(...this.save.memorial.map(fallen => {
            const row = document.createElement('div')
            row.className = 'heroDetails'
            row.textContent = fallen.name + ' - Level ' + fallen.level + ' · fell in ' + fallen.levelTitle
            return row
        }))
        return [summonRow, heroList, memorialTitle, memorial]
    }

    private renderTraining() {
        const trainee = this.trainee && this.save.roster.includes(this.trainee) ? this.trainee : this.save.roster[0]
        this.trainee = trainee
        const pickRow = this.createHeroSelect('Hero', trainee, undefined, character => this.trainee = character)
        if (!trainee)
            return [pickRow]

        const info = document.createElement('div')
        info.textContent = 'Skill points: ' + trainee.skillPoints + ' · Equipped: ' + trainee.equippedSkills.length + '/' + skillSlots(trainee) + ' · Skills rank up by being used in combat'

        const known = document.createElement('div')
        known.className = 'heroList'
        for (const name of Object.keys(trainee.skills)) {
            const action = skillAction(trainee, name)
            if (!action)
                continue
            const equipped = trainee.equippedSkills.includes(name)
            const equipButton = document.createElement('button')
            equipButton.textContent = equipped ? 'Unequip' : 'Equip'
            equipButton.disabled = equipped ? trainee.equippedSkills.length <= 1 : trainee.equippedSkills.length >= skillSlots(trainee)
            equipButton.addEventListener('click', () => this.updateTrainee(() => toggleEquipped(trainee, name)))
            const skill = trainee.skills[name]
            const needed = masteryNeeded(skill)
            const progress = needed === undefined ? ' · max rank' : ' · mastery ' + (skill.mastery ?? 0) + '/' + needed
            known.append(this.createSkillRow(this.formatName(name) + ' · rank ' + skill.rank + '/' + maxSkillRank + progress + (equipped ? ' · equipped' : ''), describeAction(action), [equipButton]))
        }

        const learnTitle = document.createElement('div')
        learnTitle.textContent = 'Learn (' + learnCost + ' point each)'
        const learnable = document.createElement('div')
        learnable.className = 'heroList'
        for (const action of learnableSkills(trainee)) {
            const learnButton = document.createElement('button')
            learnButton.textContent = 'Learn'
            learnButton.disabled = trainee.skillPoints < learnCost
            learnButton.addEventListener('click', () => this.updateTrainee(() => learnSkill(trainee, action.name)))
            learnable.append(this.createSkillRow(this.formatName(action.name), describeAction(action), [learnButton]))
        }
        if (!learnable.children.length)
            learnable.textContent = 'Every skill of this class is learned.'
        return [pickRow, info, known, learnTitle, learnable]
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

    private renderCombination() {
        const intro = document.createElement('div')
        intro.className = 'heroDetails'
        intro.textContent = 'Sacrifice a hero to give all its experience (+' + sacrificeExperience + ' bonus) to another hero. Its equipment returns to the inventory.'

        const sacrificeRow = this.createHeroSelect('Sacrifice', this.sacrifice, this.receiver, character => this.sacrifice = character)
        const receiverRow = this.createHeroSelect('Receive', this.receiver, this.sacrifice, character => this.receiver = character)

        const preview = document.createElement('div')
        const sacrifice = this.sacrifice
        const receiver = this.receiver
        if (sacrifice && receiver) {
            const amount = sacrificeValue(sacrifice)
            const result = { ...receiver }
            addExperience(result, amount)
            preview.textContent = this.heroLabel(receiver) + ': +' + amount + ' XP' + (result.level > receiver.level ? ' (Level ' + receiver.level + ' → ' + result.level + ')' : '')
        }

        const combineButton = document.createElement('button')
        combineButton.className = 'startButton'
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
        return [intro, sacrificeRow, receiverRow, preview, combineButton]
    }

    private createHeroSelect(label: string, current: Character | undefined, other: Character | undefined, onChange: (character: Character | undefined) => void) {
        const row = document.createElement('label')
        row.className = 'lobbyRow'
        row.textContent = label
        const select = document.createElement('select')
        for (const character of [undefined, ...this.save.roster.filter(character => character !== other)]) {
            const option = document.createElement('option')
            option.value = character?.id ?? ''
            option.textContent = character ? this.heroLabel(character) : '-'
            option.selected = character === current
            select.append(option)
        }
        select.addEventListener('change', () => {
            onChange(this.save.roster.find(character => character.id === select.value))
            this.confirmingTransfer = false
            this.render()
        })
        row.append(select)
        return row
    }

    private heroLabel(character: Character) {
        const characterClass = character.characterClass ? characterClasses[character.characterClass] : undefined
        return (characterClass?.name ?? character.entity) + ' (' + character.rarity + ')' + (characterClass ? ' · Tier ' + characterClass.tier : '') + ' - Level ' + character.level
    }

    private renderInventory() {
        const counts = new Map<string, number>()
        for (const key of this.save.inventory)
            counts.set(key, (counts.get(key) ?? 0) + 1)
        const list = document.createElement('div')
        list.className = 'heroList'
        if (!counts.size)
            list.textContent = 'No unused items.'
        for (const [key, count] of counts) {
            const row = document.createElement('div')
            row.className = 'heroRow'
            const info = document.createElement('div')
            info.className = 'heroInfo'
            const name = document.createElement('div')
            name.textContent = itemName(key) + (count > 1 ? ' ×' + count : '')
            const details = document.createElement('div')
            details.className = 'heroDetails'
            details.textContent = items[key] ? this.formatName(items[key].slot) + ' · ' + this.formatBonuses(key) : 'Class change item'
            info.append(name, details)
            row.append(info)
            list.append(row)
        }
        return [list]
    }

    private createHeroRow(character: Character) {
        const row = document.createElement('div')
        row.className = 'heroRow'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = this.team.has(character)
        checkbox.disabled = !this.canBring(character) || (!checkbox.checked && this.team.size >= this.teamLimit())
        checkbox.addEventListener('change', () => {
            if (checkbox.checked)
                this.team.add(character)
            else
                this.team.delete(character)
            this.render()
        })

        const attributes = deriveAttributes(equippedStats(character))
        const info = document.createElement('div')
        info.className = 'heroInfo'
        const name = document.createElement('div')
        name.textContent = this.heroLabel(character)
        const details = document.createElement('div')
        details.className = 'heroDetails'
        details.textContent = 'HP ' + attributes.maxHealt + ' · AP ' + attributes.maxActionPoints + ' · Ms ' + attributes.moveRange
            + (character.talent ? ' · Talent: ' + character.talent.charAt(0).toUpperCase() + character.talent.slice(1) : '')
            + (character.statPoints ? ' · ' + character.statPoints + ' points to spend' : '')
            + (canChangeClass(character) ? ' · Class change ready!' : '')
            + (character.injured ? ' · Injured: misses the next combat' : '')
            + (this.facedChampion(character) ? ' · Already faced the champion' : '')
        info.append(name, details)
        info.addEventListener('click', () => this.showDetails(character))

        row.append(checkbox, info)
        return row
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
            const choices = [...new Set(this.save.inventory.filter(key => items[key]?.slot === slot))]
            for (const key of ['', ...(current ? [current] : []), ...choices.filter(key => key !== current)]) {
                const option = document.createElement('option')
                option.value = key
                option.textContent = key ? items[key].name + ' (' + this.formatBonuses(key) + ')' : '-'
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
        return Object.entries(items[key].bonuses).map(([stat, value]) => '+' + value + ' ' + this.formatName(stat)).join(', ')
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
        this.save.roster.push(createHero("hero"))
        writeSave(this.save)
        this.render()
    }
}

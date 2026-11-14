import { Character, createHero } from "./character"
import { applyClassChange, canChangeClass, characterClasses, classChangeOffers } from "./characterClass"
import { levels } from "./gltf"
import { deriveAttributes, Stats } from "./stats"
import { experienceToNextLevel } from "./rewards"
import { equipmentBonuses, equippedStats, itemName, items, itemSlots, ItemSlot } from "./items"
import { SaveData, writeSave } from "./save"

type LobbyTab = "heroes" | "inventory"

const tabs: [LobbyTab, string][] = [["heroes", "Heroes"], ["inventory", "Inventory"]]

export class Lobby {
    private element = document.createElement('div')
    private details = document.createElement('div')
    private team = new Set<Character>()
    private levelKey: string
    private confirmingDelete: Character | undefined
    private tab: LobbyTab = "heroes"

    constructor(private save: SaveData, private onStart: (team: Character[], levelKey: string) => void) {
        const unlocked = levels.keys().slice(0, save.unlockedLevels)
        this.levelKey = unlocked[unlocked.length - 1] ?? levels.keys()[0]
        this.element.id = 'lobby'
        this.details.id = 'heroWindow'
        document.body.append(this.element, this.details)
        for (const character of save.roster.filter(character => this.canBring(character)).slice(0, this.teamLimit()))
            this.team.add(character)
        this.render()
    }

    private canBring(character: Character) {
        const level = levels.getLevel(this.levelKey)
        return !level.finale || !character.finaleAttempts.includes(level.chapter)
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
        content.append(...(this.tab === "heroes" ? this.renderHeroes() : this.renderInventory()))

        const startButton = document.createElement('button')
        startButton.className = 'startButton'
        startButton.textContent = 'Start'
        startButton.disabled = this.team.size === 0 || this.team.size > this.teamLimit()
        startButton.addEventListener('click', () => {
            this.element.remove()
            this.details.remove()
            this.onStart(this.save.roster.filter(character => this.team.has(character)), this.levelKey)
        })

        this.element.replaceChildren(title, levelRow, teamInfo, tabRow, content, startButton)
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
        return [summonRow, heroList]
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

        const characterClass = character.characterClass ? characterClasses[character.characterClass] : undefined
        const attributes = deriveAttributes(equippedStats(character))
        const info = document.createElement('div')
        info.className = 'heroInfo'
        const name = document.createElement('div')
        name.textContent = (characterClass?.name ?? character.entity) + ' (' + character.rarity + ') - Level ' + character.level
        const details = document.createElement('div')
        details.className = 'heroDetails'
        details.textContent = 'HP ' + attributes.maxHealt + ' · AP ' + attributes.maxActionPoints + ' · Ms ' + attributes.moveRange
            + (character.talent ? ' · Talent: ' + character.talent.charAt(0).toUpperCase() + character.talent.slice(1) : '')
            + (character.statPoints ? ' · ' + character.statPoints + ' points to spend' : '')
            + (canChangeClass(character) ? ' · Class change ready!' : '')
            + (this.canBring(character) ? '' : ' · Already faced the champion')
        info.append(name, details)
        info.addEventListener('click', () => this.showDetails(character))

        const deleteButton = document.createElement('button')
        deleteButton.textContent = this.confirmingDelete === character ? 'Confirm' : 'Delete'
        deleteButton.disabled = this.save.roster.length <= 1
        deleteButton.addEventListener('click', () => {
            if (this.confirmingDelete !== character) {
                this.confirmingDelete = character
            } else {
                for (const slot of itemSlots) {
                    const item = character.equipment[slot]
                    if (item)
                        this.save.inventory.push(item)
                }
                this.save.roster.splice(this.save.roster.indexOf(character), 1)
                this.showDetails(undefined)
                this.team.delete(character)
                this.confirmingDelete = undefined
                writeSave(this.save)
            }
            this.render()
        })

        row.append(checkbox, info, deleteButton)
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
        title.textContent = (characterClass?.name ?? character.entity) + ' (' + character.rarity + ')'
        const closeButton = document.createElement('button')
        closeButton.textContent = 'Close'
        closeButton.addEventListener('click', () => this.showDetails(undefined))
        this.details.replaceChildren(
            title,
            this.createSection('Progress', [['Level', character.level], ['Experience', character.experience + '/' + experienceToNextLevel(character.level)], ['Stat points', character.statPoints], ['Talent', character.talent ? this.formatName(character.talent) : '-']]),
            this.createSection('Attributes', [['HP', attributes.maxHealt], ['AP', attributes.maxActionPoints], ['Ms', attributes.moveRange], ['Range', characterClass?.attackRange ?? '-']]),
            this.createStatsSection(character),
            this.createEquipmentSection(character),
            this.createSection('Actions', [...(characterClass?.inspiresAllies ? [['Inspire allies', '+1 damage'] as [string, string]] : []), ...(characterClass?.actions ?? []).map(action => [this.formatName(action.name), action.cost + ' AP'] as [string, string])]),
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
            text.textContent = character.rarity === "legendary" ? 'A special item is needed to change class.' : 'No class available.'
            section.append(text)
        }
        for (const key of offers) {
            const characterClass = characterClasses[key]
            const button = document.createElement('button')
            const minimums = Object.entries(characterClass.requirement?.minimums ?? {}).map(([stat, value]) => this.formatName(stat) + ' ' + value)
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

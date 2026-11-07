import { Character, createHero } from "./character"
import { characterClasses } from "./characterClass"
import { levels } from "./gltf"
import { deriveAttributes } from "./stats"
import { SaveData, writeSave } from "./save"

export class Lobby {
    private element = document.createElement('div')
    private team = new Set<Character>()
    private levelKey = levels.keys()[0]
    private confirmingDelete: Character | undefined

    constructor(private save: SaveData, private onStart: (team: Character[], levelKey: string) => void) {
        this.element.id = 'lobby'
        document.body.append(this.element)
        for (const character of save.roster.slice(0, this.teamLimit()))
            this.team.add(character)
        this.render()
    }

    private teamLimit() {
        return levels.getLevel(this.levelKey).startCells.length
    }

    private render() {
        const title = document.createElement('div')
        title.className = 'lobbyTitle'
        title.textContent = 'Lobby'

        const levelRow = document.createElement('label')
        levelRow.className = 'lobbyRow'
        levelRow.textContent = 'Level'
        const levelSelect = document.createElement('select')
        for (const key of levels.keys()) {
            const option = document.createElement('option')
            option.value = key
            option.textContent = levels.getLevel(key).title
            option.selected = key === this.levelKey
            levelSelect.append(option)
        }
        levelSelect.addEventListener('change', () => {
            this.levelKey = levelSelect.value
            this.render()
        })
        levelRow.append(levelSelect)

        const summonRow = document.createElement('div')
        summonRow.className = 'lobbyRow'
        summonRow.textContent = 'Summon tokens: ' + this.save.summons
        const summonButton = document.createElement('button')
        summonButton.textContent = 'Summon (1)'
        summonButton.disabled = this.save.summons < 1
        summonButton.addEventListener('click', () => this.summon())
        summonRow.append(summonButton)

        const teamInfo = document.createElement('div')
        teamInfo.textContent = 'Team: ' + this.team.size + '/' + this.teamLimit()

        const heroList = document.createElement('div')
        heroList.className = 'heroList'
        heroList.append(...this.save.roster.map(character => this.createHeroRow(character)))

        const startButton = document.createElement('button')
        startButton.className = 'startButton'
        startButton.textContent = 'Start'
        startButton.disabled = this.team.size === 0 || this.team.size > this.teamLimit()
        startButton.addEventListener('click', () => {
            this.element.remove()
            this.onStart(this.save.roster.filter(character => this.team.has(character)), this.levelKey)
        })

        this.element.replaceChildren(title, levelRow, summonRow, teamInfo, heroList, startButton)
    }

    private createHeroRow(character: Character) {
        const row = document.createElement('div')
        row.className = 'heroRow'

        const checkbox = document.createElement('input')
        checkbox.type = 'checkbox'
        checkbox.checked = this.team.has(character)
        checkbox.disabled = !checkbox.checked && this.team.size >= this.teamLimit()
        checkbox.addEventListener('change', () => {
            if (checkbox.checked)
                this.team.add(character)
            else
                this.team.delete(character)
            this.render()
        })

        const characterClass = character.characterClass ? characterClasses[character.characterClass] : undefined
        const attributes = deriveAttributes(character.stats)
        const info = document.createElement('div')
        info.className = 'heroInfo'
        const name = document.createElement('div')
        name.textContent = (characterClass?.name ?? character.entity) + ' (' + character.rarity + ') - Level ' + character.level
        const details = document.createElement('div')
        details.className = 'heroDetails'
        details.textContent = 'HP ' + attributes.maxHealt + ' · AP ' + attributes.maxActionPoints + ' · Ms ' + attributes.moveRange
            + (character.talent ? ' · Talent: ' + character.talent.charAt(0).toUpperCase() + character.talent.slice(1) : '')
        info.append(name, details)

        const deleteButton = document.createElement('button')
        deleteButton.textContent = this.confirmingDelete === character ? 'Confirm' : 'Delete'
        deleteButton.disabled = this.save.roster.length <= 1
        deleteButton.addEventListener('click', () => {
            if (this.confirmingDelete !== character) {
                this.confirmingDelete = character
            } else {
                this.save.roster.splice(this.save.roster.indexOf(character), 1)
                this.team.delete(character)
                this.confirmingDelete = undefined
                writeSave(this.save)
            }
            this.render()
        })

        row.append(checkbox, info, deleteButton)
        return row
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

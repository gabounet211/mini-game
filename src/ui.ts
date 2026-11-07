import { Action } from "./action"
import { Game } from "./game"
import { VolumeKind } from "./audioManager"
import { Piece } from "./piece"
import { clearSave } from "./save"



export class Ui {

    private actionButtons = document.createElement('div')
    private endTurnButton = document.createElement('button')
    private settingButton = document.createElement('button')
    private settingMenu = document.createElement('div')
    private volumeSliders = new Map<VolumeKind, HTMLInputElement>()
    private partyCards = document.createElement('div')
    private cards = new Map<Piece, { element: HTMLDivElement, health: HTMLDivElement }>()
    private sheet = document.createElement('div')
    private sheetName = document.createElement('div')
    private sheetHealth = document.createElement('div')
    private sheetPoints = document.createElement('div')
    private sheetDetails = document.createElement('div')
    private inspected: Piece | undefined
    private endScreen = document.createElement('div')
    private endScreenShown = false

    constructor(public game: Game) {
        this.partyCards.id = 'partyCards'
        document.body.append(this.partyCards)

        this.sheet.id = 'characterSheet'
        this.sheetDetails.className = 'sheetDetails'
        this.sheet.append(this.sheetName, this.sheetHealth, this.sheetPoints, this.sheetDetails)
        document.body.append(this.sheet)

        this.settingButton.id = 'setting'
        this.settingButton.textContent = 'Setting'
        this.settingButton.addEventListener('click', () => this.setSettingMenuVisible(this.settingMenu.style.display !== 'flex'))
        document.body.append(this.settingButton)
        this.buildSettingMenu()

        this.endTurnButton.id = 'endTurn'
        this.endTurnButton.textContent = 'End turn'
        this.endTurnButton.addEventListener('click', () => this.game.endTurn())
        document.body.append(this.endTurnButton)

        this.actionButtons.id = 'thoseAreTheAction'
        document.body.append(this.actionButtons)

        this.endScreen.id = 'endScreen'
        document.body.append(this.endScreen)

    }

    update() {
        this.updateCards()
        this.updateSheet()
        this.updateEndScreen()
    }

    private updateEndScreen() {
        const state = this.game.gameLogic.state
        if (this.endScreenShown || (state !== "Victory" && state !== "Defeat"))
            return
        this.endScreenShown = true
        const title = document.createElement('div')
        title.className = 'endTitle'
        title.textContent = state
        const reward = document.createElement('div')
        reward.className = 'endRewards'
        reward.append(...this.game.gameLogic.rewards.map(line => {
            const row = document.createElement('div')
            row.textContent = line
            return row
        }))
        const lobbyButton = document.createElement('button')
        lobbyButton.textContent = 'Back to lobby'
        lobbyButton.addEventListener('click', () => location.reload())
        this.endScreen.append(title, reward, lobbyButton)
        setTimeout(() => this.endScreen.style.display = 'flex', 2500)
    }

    showSheet(piece: Piece | undefined) {
        this.inspected = piece
        this.sheet.style.display = piece ? 'flex' : 'none'
        if (!piece)
            return
        this.sheetName.textContent = piece.name + ' (' + piece.character.rarity + ')'
        this.sheetDetails.replaceChildren(
            this.createSection('Attributes', [['Level', piece.character.level], ['Talent', piece.character.talent ? this.formatName(piece.character.talent) : '-'], ['Ms', piece.moveRange], ['Range', piece.attackRange]]),
            this.createSection('Stats', Object.entries(piece.stats).map(([name, value]) => [this.formatName(name), value])),
            this.createSection('Equipment', [['Weapon', '-'], ['Armor', '-'], ['Jewelry', '-']]),
            this.createSection('Actions', piece.actions.map(action => [this.formatName(action.name), action.cost + ' AP'])),
        )
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

    private updateSheet() {
        const piece = this.inspected
        if (!piece)
            return
        if (piece.healt <= 0) {
            this.showSheet(undefined)
            return
        }
        this.setText(this.sheetHealth, 'HP: ' + piece.healt + '/' + piece.maxHealt)
        this.setText(this.sheetPoints, 'AP: ' + piece.actionPoints + '/' + piece.maxActionPoints)
    }

    private setText(element: HTMLElement, text: string) {
        if (element.textContent !== text)
            element.textContent = text
    }

    private updateCards() {
        const pieces = this.game.gameLogic.grid.getPieces(true)
        for (const [piece, card] of this.cards) {
            if (!pieces.includes(piece)) {
                card.element.remove()
                this.cards.delete(piece)
            }
        }
        for (const piece of pieces) {
            if (!this.cards.has(piece))
                this.cards.set(piece, this.createCard(piece))
        }
        for (const [piece, card] of this.cards) {
            card.element.classList.toggle('selected', piece === this.game.selector.selected)
            this.setText(card.health, 'HP: ' + piece.healt + '/' + piece.maxHealt)
        }
    }

    private createCard(piece: Piece) {
        const element = document.createElement('div')
        element.className = 'partyCard'
        element.addEventListener('click', () => this.game.selector.selectPiece(piece))
        const name = document.createElement('div')
        name.textContent = piece.name
        const health = document.createElement('div')
        element.append(name, health)
        this.partyCards.append(element)
        return { element, health }
    }

    private buildSettingMenu() {
        this.settingMenu.id = 'settingMenu'

        const resumeButton = document.createElement('button')
        resumeButton.textContent = 'Resume'
        resumeButton.addEventListener('click', () => this.setSettingMenuVisible(false))
        this.settingMenu.append(resumeButton)

        const volumes: [VolumeKind, string][] = [['main', 'Main volume'], ['sfx', 'SFX volume'], ['music', 'Music volume']]
        for (const [kind, name] of volumes) {
            const row = document.createElement('label')
            row.textContent = name
            const slider = document.createElement('input')
            slider.type = 'range'
            slider.min = '0'
            slider.max = '1'
            slider.step = '0.01'
            slider.addEventListener('input', () => this.game.audio.setVolume(kind, Number(slider.value)))
            this.volumeSliders.set(kind, slider)
            row.append(slider)
            this.settingMenu.append(row)
        }

        const resetButton = document.createElement('button')
        resetButton.textContent = 'Reset save'
        resetButton.addEventListener('click', () => {
            clearSave()
            location.reload()
        })
        this.settingMenu.append(resetButton)

        const quitButton = document.createElement('button')
        quitButton.textContent = 'Quit Game'
        quitButton.disabled = true
        this.settingMenu.append(quitButton)

        document.body.append(this.settingMenu)
    }

    private setSettingMenuVisible(visible: boolean) {
        this.settingMenu.style.display = visible ? 'flex' : 'none'
        if (!visible)
            return
        for (const [kind, slider] of this.volumeSliders)
            slider.value = String(this.game.audio.volumes[kind])
    }

    private formatName(name: string) {
        const words = name.replace(/([A-Z])/g, ' $1').trim()
        return words.charAt(0).toUpperCase() + words.slice(1)
    }

    setActionsVisible(visible: boolean) {
        this.actionButtons.style.display = visible ? 'flex' : 'none'
    }

    setActions(actions: Action[]) {
        this.actionButtons.innerHTML = ''
        const piece = this.game.selector.selected
        if (!piece)
            return

        const health = document.createElement('span')
        health.textContent = 'HP: ' + piece.healt + '/' + piece.maxHealt
        const points = document.createElement('span')
        points.textContent = 'AP: ' + piece.actionPoints + '/' + piece.maxActionPoints
        this.actionButtons.append(health, points)

        for (let index = 0; index < actions.length; index++) {
            const element = actions[index];

            const attackBouton = document.createElement('button');
            attackBouton.textContent = this.formatName(element.name) + ' (' + element.cost + ')';
            attackBouton.disabled = piece.actionPoints < element.cost
            this.actionButtons.append(attackBouton);
            attackBouton.addEventListener('click', () =>{
                if (piece.actionPoints < element.cost)
                    return
                if (element.needsTarget) {
                    this.game.selector.startTargeting(element)
                    return
                }
                element.action(this.game, undefined, piece)
                piece.actionPoints -= element.cost
                this.game.gameLogic.grid.removeDead()
                if (piece.healt <= 0)
                    this.game.selector.unselect()
                else
                    this.setActions(actions)
            }
            )
        }
    }
}


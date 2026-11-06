import { Action } from "./action"
import { Game } from "./game"
import { VolumeKind } from "./audioManager"
import { Piece } from "./piece"



export class Ui {

    private actionButtons = document.createElement('div')
    private endTurnButton = document.createElement('button')
    private settingButton = document.createElement('button')
    private settingMenu = document.createElement('div')
    private volumeSliders = new Map<VolumeKind, HTMLInputElement>()
    private partyCards = document.createElement('div')
    private cards = new Map<Piece, { element: HTMLDivElement, health: HTMLDivElement }>()
    private enemyPanel = document.createElement('div')
    private enemyName = document.createElement('div')
    private enemyHealth = document.createElement('div')
    private enemyPoints = document.createElement('div')
    private enemyActions = document.createElement('div')
    private inspectedEnemy: Piece | undefined

    constructor(public game: Game) {
        this.partyCards.id = 'partyCards'
        document.body.append(this.partyCards)

        this.enemyPanel.id = 'enemyPanel'
        this.enemyActions.className = 'enemyActions'
        this.enemyPanel.append(this.enemyName, this.enemyHealth, this.enemyPoints, this.enemyActions)
        document.body.append(this.enemyPanel)

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

    }

    update() {
        this.updateCards()
        this.updateEnemyPanel()
    }

    showEnemy(piece: Piece | undefined) {
        this.inspectedEnemy = piece
        this.enemyPanel.style.display = piece ? 'flex' : 'none'
        if (!piece)
            return
        this.enemyName.textContent = piece.config.name
        this.enemyActions.replaceChildren(...(piece.config.actions ?? []).map(action => {
            const row = document.createElement('div')
            row.textContent = this.formatName(action.name) + ' (' + action.cost + ')'
            return row
        }))
    }

    private updateEnemyPanel() {
        const piece = this.inspectedEnemy
        if (!piece)
            return
        if (piece.healt <= 0) {
            this.showEnemy(undefined)
            return
        }
        this.setText(this.enemyHealth, 'HP: ' + piece.healt + '/' + piece.config.maxHealt)
        this.setText(this.enemyPoints, 'AP: ' + piece.actionPoints + '/' + piece.config.maxActionPoints)
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
            this.setText(card.health, 'HP: ' + piece.healt + '/' + piece.config.maxHealt)
        }
    }

    private createCard(piece: Piece) {
        const element = document.createElement('div')
        element.className = 'partyCard'
        element.addEventListener('click', () => this.game.selector.selectPiece(piece))
        const name = document.createElement('div')
        name.textContent = piece.config.name
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
        health.textContent = 'HP: ' + piece.healt + '/' + piece.config.maxHealt
        const points = document.createElement('span')
        points.textContent = 'AP: ' + piece.actionPoints + '/' + piece.config.maxActionPoints
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
                element.action(this.game)
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


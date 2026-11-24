import { Action, canUse, describeAction, spendAction } from "./action"
import { objectiveText } from "./endCondition"
import { Game } from "./game"
import { VolumeKind } from "./audioManager"
import { Piece } from "./piece"
import { describeEffect } from "./effect"
import { clearSave } from "./save"
import { items } from "./items"
import { desktop } from "./desktop"



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
    private turnBanner = document.createElement('div')
    private objective = document.createElement('div')
    private actionButtonsByAction = new Map<Action, HTMLButtonElement>()
    private bannerTimeout: number | undefined
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

        this.turnBanner.id = 'turnBanner'
        document.body.append(this.turnBanner)

        this.objective.id = 'objective'
        document.body.append(this.objective)

    }

    update() {
        this.updateObjective()
        this.updateCards()
        this.updateSheet()
        this.updateEndScreen()
    }

    private updateObjective() {
        const logic = this.game.gameLogic
        const limit = logic.victory.rounds ?? logic.defeat.rounds
        const round = logic.state === "Placement" ? '' : ' · Round ' + logic.round + (limit ? '/' + limit : '')
        const text = 'Objective: ' + objectiveText(logic.victory, logic.defeat) + round
        if (this.objective.textContent !== text)
            this.objective.textContent = text
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
            this.createSection('Attributes', [...(piece.effects.length ? [['Effects', piece.effects.map(describeEffect).join(', ')] as [string, string]] : []), ['Level', piece.character.level], ['Talent', piece.character.talent ? this.formatName(piece.character.talent) : '-'], ['Ms', piece.movePoints + ' / ' + piece.moveRange]]),
            this.createSection('Stats', Object.entries(piece.stats).map(([name, value]) => [this.formatName(name), value])),
            this.createSection('Equipment', [['Weapon', items[piece.character.equipment.weapon ?? '']?.name ?? '-'], ['Armor', items[piece.character.equipment.armor ?? '']?.name ?? '-'], ['Jewelry', items[piece.character.equipment.jewelry ?? '']?.name ?? '-']]),
            this.createSection('Actions', [...(piece.inspiresAllies ? [['Inspire allies', '+1 damage'] as [string, string]] : []), ...piece.actions.map(action => [this.formatName(action.name), describeAction(action)] as [string, string])]),
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
        this.setText(this.sheetPoints, this.pointsText(piece))
    }

    private pointsText(piece: Piece) {
        return 'AP: ' + piece.actionPoints + '/' + piece.maxActionPoints + (piece.usesConcentration ? ' · Concentration: ' + piece.concentration + '/' + piece.maxConcentration : '')
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
        quitButton.disabled = !desktop
        quitButton.addEventListener('click', () => desktop?.quit())
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

    setEndTurnLabel(text: string) {
        this.endTurnButton.textContent = text
    }

    showBanner(text: string) {
        this.turnBanner.textContent = text
        this.turnBanner.classList.remove('visible')
        void this.turnBanner.offsetWidth
        this.turnBanner.classList.add('visible')
        clearTimeout(this.bannerTimeout)
        this.bannerTimeout = window.setTimeout(() => this.turnBanner.classList.remove('visible'), 1500)
    }

    setActionsVisible(visible: boolean) {
        this.actionButtons.style.display = visible ? 'flex' : 'none'
    }

    setTargeting(action: Action | undefined) {
        for (const [buttonAction, button] of this.actionButtonsByAction)
            button.classList.toggle('selectedAction', buttonAction === action)
        document.body.classList.toggle('targeting', !!action)
    }

    setActions(actions: Action[]) {
        this.actionButtons.innerHTML = ''
        this.actionButtonsByAction.clear()
        const piece = this.game.selector.selected
        if (!piece)
            return

        const health = document.createElement('span')
        health.textContent = 'HP: ' + piece.healt + '/' + piece.maxHealt
        const points = document.createElement('span')
        points.textContent = this.pointsText(piece)
        this.actionButtons.append(health, points)

        for (let index = 0; index < actions.length; index++) {
            const element = actions[index];

            const attackBouton = document.createElement('button');
            const cooldown = piece.cooldowns.get(element)
            attackBouton.textContent = this.formatName(element.name) + ' (' + element.cost + (element.concentration ? ', ' + element.concentration + 'C' : '') + ')' + (cooldown ? ' · ' + cooldown + 't' : '');
            attackBouton.title = describeAction(element)
            attackBouton.disabled = !canUse(piece, element)
            this.actionButtons.append(attackBouton);
            this.actionButtonsByAction.set(element, attackBouton)
            attackBouton.addEventListener('click', () =>{
                if (!canUse(piece, element))
                    return
                if (element.needsTarget) {
                    this.game.selector.startTargeting(element)
                    return
                }
                element.action(this.game, undefined, piece)
                spendAction(piece, element)
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


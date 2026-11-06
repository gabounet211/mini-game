import { Action } from "./action"
import { Game } from "./game"
import { VolumeKind } from "./audioManager"



export class Ui {

    private actionButtons = document.createElement('div')
    private endTurnButton = document.createElement('button')
    private settingButton = document.createElement('button')
    private settingMenu = document.createElement('div')
    private volumeSliders = new Map<VolumeKind, HTMLInputElement>()

    constructor(public game: Game) {
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


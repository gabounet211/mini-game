import { Action } from "./action"
import { Game } from "./game"



export class Ui {

    private actionButtons = document.createElement('div')
    private endTurnButton = document.createElement('button')

    constructor(public game: Game) {
        this.endTurnButton.id = 'endTurn'
        this.endTurnButton.textContent = 'End turn'
        this.endTurnButton.addEventListener('click', () => this.game.endTurn())
        document.body.append(this.endTurnButton)

        this.actionButtons.id = 'thoseAreTheAction'
        document.body.append(this.actionButtons)

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


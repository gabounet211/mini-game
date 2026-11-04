import { Action } from "./action"
import { Game } from "./game"



export class Ui {

    private musicButton = document.createElement('button')
    private actionButtons = document.createElement('div')
    private endTurnButton = document.createElement('button')

    constructor(public game: Game) {
        document.body.append(this.musicButton)

        this.endTurnButton.id = 'endTurn'
        this.endTurnButton.textContent = 'end turn'
        this.endTurnButton.addEventListener('click', () => this.game.endTurn())
        document.body.append(this.endTurnButton)

        this.actionButtons.id = 'thoseAreTheAction'
        document.body.append(this.actionButtons)

    }

    setActionsVisible(visible: boolean) {
        this.actionButtons.style.display = visible ? 'flex' : 'none'
    }

    setActions(actions: Action[]) {
        this.actionButtons.innerHTML = ''
        const piece = this.game.selector.selected
        if (!piece)
            return

        const points = document.createElement('span')
        points.textContent = 'AP ' + piece.actionPoints + '/' + piece.config.maxActionPoints
        this.actionButtons.append(points)

        for (let index = 0; index < actions.length; index++) {
            const element = actions[index];

            const attackBouton = document.createElement('button');
            attackBouton.textContent = element.name + ' (' + element.cost + ')';
            attackBouton.disabled = piece.actionPoints < element.cost
            this.actionButtons.append(attackBouton);
            attackBouton.addEventListener('click', () =>{
                if (piece.actionPoints < element.cost)
                    return
                element.action(this.game)
                piece.actionPoints -= element.cost
                this.setActions(actions)
            }
            )
        }
    }
}


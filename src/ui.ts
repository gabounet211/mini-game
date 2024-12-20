import { Action } from "./action"
import { Game } from "./game"



export class Ui {

    private musicButton = document.createElement('button')
    private actionButtons = document.createElement('div')

    constructor(public game: Game) {
        document.body.append(this.musicButton)

        this.actionButtons.id = 'thoseAreTheAction'
        document.body.append(this.actionButtons)

    }

    setActionsVisible(visible: boolean) {
        this.actionButtons.style.display = visible ? 'flex' : 'none'
    }

    setActions(actions: Action[]) {
        this.actionButtons.innerHTML = ''

        for (let index = 0; index < actions.length; index++) {
            const element = actions[index];

            const attackBouton = document.createElement('button');
            attackBouton.textContent = element.name;
            this.actionButtons.append(attackBouton);
            attackBouton.addEventListener('click', () =>{
                element.action(this.game)
            }
            )
        }
    }
}


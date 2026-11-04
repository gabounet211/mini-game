import { Game } from "./game"
import { Piece } from "./piece"


export interface Action{
    action(game: Game, target?: Piece) : void
    name : string
    cost : number
    needsTarget? : boolean
}

export const basicAttack: Action = {
    name: "basicAttack",
    cost: 1,
    needsTarget: true,
    action(_game, target) {
        if (!target)
            return
        target.healt -= 2
        console.log(target.healt)
    },
}

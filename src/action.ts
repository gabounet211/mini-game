import { Game } from "./game"
import { Piece } from "./piece"


export interface Action{
    action(game: Game, target?: Piece, user?: Piece) : void
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

export const magicAttack: Action = {
    name: "magicAttack",
    cost: 2,
    needsTarget: true,
    action(_game, target, user) {
        if (!target || !user)
            return
        target.healt -= 2 + user.stats.intelligence
    },
}

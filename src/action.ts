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
    action(_game, target, user) {
        if (!target || !user)
            return
        target.takeDamage(1 + Math.floor(user.stats.strength / 2), "physical")
    },
}

export const magicAttack: Action = {
    name: "magicAttack",
    cost: 2,
    needsTarget: true,
    action(_game, target, user) {
        if (!target || !user)
            return
        target.takeDamage(2 + user.stats.intelligence, "magic")
    },
}

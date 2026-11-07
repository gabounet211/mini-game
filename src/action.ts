import { Game } from "./game"
import { Piece } from "./piece"


export interface Action{
    action(game: Game, target?: Piece, user?: Piece) : void
    name : string
    cost : number
    needsTarget? : boolean
    targets? : "enemy" | "ally"
}

export function physicalAttack(name: string, cost: number): Action {
    return {
        name,
        cost,
        needsTarget: true,
        action(_game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(1 + Math.floor(user.stats.strength / 2), "physical")
        },
    }
}

export function magicalAttack(name: string, cost: number): Action {
    return {
        name,
        cost,
        needsTarget: true,
        action(_game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(2 + user.stats.intelligence, "magic")
        },
    }
}

export function healing(name: string, cost: number): Action {
    return {
        name,
        cost,
        needsTarget: true,
        targets: "ally",
        action(_game, target, user) {
            if (!target || !user)
                return
            target.heal(2 + Math.floor(user.stats.willpower / 2))
        },
    }
}

export const basicAttack = physicalAttack("basicAttack", 1)
export const magicAttack = magicalAttack("magicAttack", 2)

import { Game } from "./game"
import { Piece } from "./piece"


export interface Action{
    action(game: Game, target?: Piece, user?: Piece) : void
    name : string
    cost : number
    needsTarget? : boolean
    targets? : "enemy" | "ally"
}

export const moraleBonus = 1

export function allyBonus(game: Game, user: Piece) {
    const grid = game?.gameLogic?.grid
    if (!grid)
        return 0
    const inspired = grid.getPieces(user.player).some(ally => ally !== user && ally.healt > 0 && ally.inspiresAllies)
    return inspired ? moraleBonus : 0
}

export function physicalAttack(name: string, cost: number): Action {
    return {
        name,
        cost,
        needsTarget: true,
        action(game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(1 + Math.floor(user.stats.strength / 2) + allyBonus(game, user), "physical", user)
        },
    }
}

export function magicalAttack(name: string, cost: number): Action {
    return {
        name,
        cost,
        needsTarget: true,
        action(game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(2 + user.stats.intelligence + allyBonus(game, user), "magic", user)
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

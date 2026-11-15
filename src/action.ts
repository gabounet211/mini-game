import { Game } from "./game"
import { Piece } from "./piece"


export interface Action{
    action(game: Game, target?: Piece, user?: Piece) : void
    name : string
    cost : number
    range : number
    concentration? : number
    cooldown? : number
    needsTarget? : boolean
    targets? : "enemy" | "ally"
}

export type ActionCosts = Pick<Action, "concentration" | "cooldown">

export const moraleBonus = 1
export const concentrationRegen = 2

export function canUse(piece: Piece, action: Action) {
    return piece.actionPoints >= action.cost
        && piece.concentration >= (action.concentration ?? 0)
        && !piece.cooldowns.get(action)
}

export function describeAction(action: Action) {
    return [
        action.cost + ' AP',
        ...(action.concentration ? [action.concentration + ' concentration'] : []),
        'range ' + action.range,
        ...(action.cooldown ? ['cooldown ' + action.cooldown] : []),
    ].join(' · ')
}

export function spendAction(piece: Piece, action: Action) {
    piece.actionPoints -= action.cost
    piece.concentration -= action.concentration ?? 0
    if (action.cooldown) {
        piece.cooldowns.set(action, action.cooldown)
        piece.usedThisTurn.add(action)
    }
}

export function allyBonus(game: Game, user: Piece) {
    const grid = game?.gameLogic?.grid
    if (!grid)
        return 0
    const inspired = grid.getPieces(user.player).some(ally => ally !== user && ally.healt > 0 && ally.inspiresAllies)
    return inspired ? moraleBonus : 0
}

export function physicalAttack(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        action(game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(1 + Math.floor(user.stats.strength / 2) + allyBonus(game, user), "physical", user)
        },
    }
}

export function magicalAttack(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        action(game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(2 + user.stats.intelligence + allyBonus(game, user), "magic", user)
        },
    }
}

export function hybridAttack(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        action(game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(1 + Math.floor(user.stats.strength / 2) + allyBonus(game, user), "physical", user)
            target.takeDamage(2 + user.stats.intelligence, "magic", user)
        },
    }
}

export const drainDuration = 2

export function willpowerDrain(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        action(_game, target, user) {
            if (!target || !user)
                return
            target.drainWillpower(Math.max(1, Math.floor(user.stats.willpower / 3)), drainDuration)
        },
    }
}

export function healing(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        targets: "ally",
        action(_game, target, user) {
            if (!target || !user)
                return
            target.heal(2 + Math.floor(user.stats.willpower / 2))
        },
    }
}

export const basicAttack = physicalAttack("basicAttack", 1, 1)
export const magicAttack = magicalAttack("magicAttack", 2, 3)

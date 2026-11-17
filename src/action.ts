import { Game } from "./game"
import { Piece } from "./piece"
import { EffectKind, StatusEffect } from "./effect"


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
        action.range ? 'range ' + action.range : 'self',
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

export type EffectSpec = (user: Piece) => StatusEffect

export function effect(kind: EffectKind, turns: number, amount = 0): EffectSpec {
    return () => ({ kind, amount, turns })
}

export function damageBonus(game: Game, user: Piece) {
    return allyBonus(game, user) + user.effectAmount("damageUp")
}

export function applyEffect(target: Piece, user: Piece, effect?: EffectSpec) {
    if (!effect || target.healt <= 0)
        return
    const hostile = target.player !== user.player
    target.addEffect({ ...effect(user), fresh: !hostile }, hostile)
}

function physicalDamage(game: Game, user: Piece) {
    return 1 + Math.floor(user.stats.strength / 2) + damageBonus(game, user)
}

function magicDamage(game: Game, user: Piece) {
    return 2 + user.stats.intelligence + damageBonus(game, user)
}

export function physicalAttack(name: string, cost: number, range: number, costs: ActionCosts = {}, effect?: EffectSpec): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        action(game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(physicalDamage(game, user), "physical", user)
            applyEffect(target, user, effect)
        },
    }
}

export function magicalAttack(name: string, cost: number, range: number, costs: ActionCosts = {}, effect?: EffectSpec): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        action(game, target, user) {
            if (!target || !user)
                return
            target.takeDamage(magicDamage(game, user), "magic", user)
            applyEffect(target, user, effect)
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
            target.takeDamage(physicalDamage(game, user), "physical", user)
            target.takeDamage(2 + user.stats.intelligence, "magic", user)
        },
    }
}

export function statusAction(name: string, cost: number, range: number, costs: ActionCosts, targets: "enemy" | "ally" | "self", effect: EffectSpec): Action {
    return {
        ...costs,
        name,
        cost,
        range: targets === "self" ? 0 : range,
        needsTarget: targets !== "self",
        targets: targets === "self" ? undefined : targets,
        action(_game, target, user) {
            if (!user)
                return
            applyEffect(targets === "self" ? user : target ?? user, user, effect)
        },
    }
}

export const drainDuration = 2

export function willpowerDrain(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return statusAction(name, cost, range, costs, "enemy", user => ({ kind: "willpowerDown", amount: Math.max(1, Math.floor(user.stats.willpower / 3)), turns: drainDuration }))
}

export function willpowerBoost(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return statusAction(name, cost, range, costs, "ally", user => ({ kind: "willpowerUp", amount: Math.max(1, Math.floor(user.stats.willpower / 4)), turns: drainDuration }))
}

export function cure(name: string, cost: number, range: number, costs: ActionCosts = {}): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        needsTarget: true,
        targets: "ally",
        action(_game, target) {
            target?.cureEffects()
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

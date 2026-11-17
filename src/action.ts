import { Game } from "./game"
import { Piece } from "./piece"
import { EffectKind, StatusEffect } from "./effect"
import { forceMove, inLine, MoveKind } from "./movement"
import { Grid } from "./grid"
import { AreaShape, areaCells, piecesInArea } from "./area"
import { Vector2 } from "three"


export interface Action{
    action(game: Game, target?: Piece, user?: Piece, cell?: Vector2) : void
    name : string
    cost : number
    range : number
    concentration? : number
    cooldown? : number
    needsTarget? : boolean
    targets? : "enemy" | "ally" | "any"
    line? : boolean
    area? : AreaShape
    friendlyFire? : boolean
}

export type ActionCosts = Pick<Action, "concentration" | "cooldown">

export const moraleBonus = 1
export const concentrationRegen = 2

export function canUse(piece: Piece, action: Action) {
    return piece.actionPoints >= action.cost
        && piece.concentration >= (action.concentration ?? 0)
        && !piece.cooldowns.get(action)
}

export function canTarget(action: Action, from: Vector2, to: Vector2) {
    return Grid.manathanDistance(from, to) <= action.range && (!action.line || inLine(from, to))
}

export function describeAction(action: Action) {
    return [
        action.cost + ' AP',
        ...(action.concentration ? [action.concentration + ' concentration'] : []),
        action.range ? 'range ' + action.range : 'self',
        ...(action.line ? ['straight line'] : []),
        ...(action.area ? ['area'] : []),
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

export interface MoveSpec {
    kind: MoveKind
    cells?: number
    damage?: boolean
    effect?: EffectSpec
    line?: boolean
    targets?: "enemy" | "any"
}

export function moveAction(name: string, cost: number, range: number, costs: ActionCosts, spec: MoveSpec): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        line: spec.line,
        needsTarget: true,
        targets: spec.targets ?? "enemy",
        action(game, target, user) {
            const grid = game?.gameLogic?.grid
            if (!target || !user || !grid)
                return
            const movesUser = spec.kind === "dash" || spec.kind === "jump"
            if (movesUser)
                forceMove(grid, spec.kind, user, target, spec.cells)
            if (spec.damage)
                target.takeDamage(physicalDamage(game, user), "physical", user)
            const shielded = target.player !== user.player && target.hasEffect("immune")
            if (spec.kind === "retreat" || (!movesUser && !shielded && target.healt > 0))
                forceMove(grid, spec.kind, user, target, spec.cells)
            applyEffect(target, user, spec.effect)
        },
    }
}

export interface AreaSpec {
    shape: AreaShape
    damage?: "physical" | "magic"
    effect?: EffectSpec
    friendlyFire?: boolean
}

export function areaAction(name: string, cost: number, range: number, costs: ActionCosts, spec: AreaSpec): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        area: spec.shape,
        friendlyFire: spec.friendlyFire,
        needsTarget: true,
        targets: "enemy",
        action(game, target, user, cell) {
            const grid = game?.gameLogic?.grid
            if (!user || !grid)
                return
            const from = grid.getPosition(user)
            const center = cell ?? (target && grid.getPosition(target))
            if (!from || !center)
                return
            for (const piece of piecesInArea(grid, areaCells(spec.shape, from, center))) {
                if (piece === user || (!spec.friendlyFire && piece.player === user.player))
                    continue
                if (spec.damage === "physical")
                    piece.takeDamage(physicalDamage(game, user), "physical", user)
                else if (spec.damage === "magic")
                    piece.takeDamage(magicDamage(game, user), "magic", user)
                applyEffect(piece, user, spec.effect)
            }
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

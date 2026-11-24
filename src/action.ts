import { Game } from "./game"
import { Piece } from "./piece"
import { DamageKind } from "./stats"
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
    bonusDamage? : number
    bonusCrit? : number
    needsTarget? : boolean
    targets? : "enemy" | "ally" | "any"
    line? : boolean
    area? : AreaShape
    friendlyFire? : boolean
    ranks? : Action[]
}

export type ActionCosts = Pick<Action, "concentration" | "cooldown" | "bonusDamage" | "bonusCrit">

export const moraleBonus = 1
export const concentrationRegen = 2
export const critPerPerception = 0.03
export const critMultiplier = 2
export const critRoll = { next: () => Math.random() }

export function critChance(user: Piece, action?: Action) {
    return user.stats.perception * critPerPerception + (action?.bonusCrit ?? 0)
}

export function dealDamage(game: Game, target: Piece, amount: number, kind: DamageKind, user: Piece) {
    target.takeDamage(amount, kind, user)
    const grid = game?.gameLogic?.grid
    const from = grid?.getPosition(user)
    const to = grid?.getPosition(target)
    if (from && to && Grid.manathanDistance(from, to) <= 1 && target.player !== user.player && target.healt > 0 && user.healt > 0 && target.hasEffect("riposte"))
        user.takeDamage(1 + Math.floor(target.stats.strength / 2) + target.effectAmount("riposte"), "physical", target, false)
}

export function rollDamage(amount: number, user: Piece, action?: Action) {
    const total = amount + (action?.bonusDamage ?? 0)
    return critRoll.next() < critChance(user, action) ? total * critMultiplier : total
}

export function canUse(piece: Piece, action: Action) {
    return piece.actionPoints >= action.cost
        && piece.concentration >= (action.concentration ?? 0)
        && !piece.cooldowns.get(action)
}

export function withRanks(base: Action, rank2: Action, rank3: Action) {
    base.ranks = [rank2, rank3]
    return base
}

export function byRank(make: (rank: number) => Action) {
    return withRanks(make(1), make(2), make(3))
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
    piece.skillUses[action.name] = (piece.skillUses[action.name] ?? 0) + 1
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
            dealDamage(game, target, rollDamage(physicalDamage(game, user), user, this), "physical", user)
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
            dealDamage(game, target, rollDamage(magicDamage(game, user), user, this), "magic", user)
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
            dealDamage(game, target, rollDamage(physicalDamage(game, user), user, this), "physical", user)
            dealDamage(game, target, rollDamage(2 + user.stats.intelligence, user, this), "magic", user)
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
            if (spec.damage && target.player !== user.player)
                dealDamage(game, target, rollDamage(physicalDamage(game, user), user, this), "physical", user)
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
        needsTarget: range > 0,
        targets: range > 0 ? "enemy" : undefined,
        action(game, target, user, cell) {
            const grid = game?.gameLogic?.grid
            if (!user || !grid)
                return
            const from = grid.getPosition(user)
            const center = cell ?? (target && grid.getPosition(target)) ?? from
            if (!from || !center)
                return
            for (const piece of piecesInArea(grid, areaCells(spec.shape, from, center))) {
                if (piece === user || (!spec.friendlyFire && piece.player === user.player))
                    continue
                if (spec.damage === "physical")
                    dealDamage(game, piece, rollDamage(physicalDamage(game, user), user, this), "physical", user)
                else if (spec.damage === "magic")
                    dealDamage(game, piece, rollDamage(magicDamage(game, user), user, this), "magic", user)
                applyEffect(piece, user, spec.effect)
            }
        },
    }
}

export function groundZoneAction(name: string, cost: number, costs: ActionCosts, size: number, turns: number, effect: StatusEffect, range = 0): Action {
    return {
        ...costs,
        name,
        cost,
        range,
        area: { kind: "radius", size },
        needsTarget: range > 0,
        targets: range > 0 ? "enemy" : undefined,
        action(game, target, user, cell) {
            const logic = game?.gameLogic
            const center = cell ?? (target && logic?.grid.getPosition(target)) ?? (user && logic?.grid.getPosition(user))
            if (!user || !logic || !center)
                return
            logic.addGroundZone({ cells: areaCells({ kind: "radius", size }, center, center), player: user.player, effect, turns })
        },
    }
}

export function tauntAction(name: string, cost: number, range: number, costs: ActionCosts, turns: number): Action {
    return {
        ...costs,
        name,
        cost,
        range: 0,
        area: { kind: "radius", size: range },
        action(game, _target, user) {
            const grid = game?.gameLogic?.grid
            const center = user && grid?.getPosition(user)
            if (!user || !grid || !center)
                return
            for (const piece of piecesInArea(grid, areaCells({ kind: "radius", size: range }, center, center)))
                if (piece.player !== user.player)
                    piece.addEffect({ kind: "taunt", amount: 0, turns, source: user }, true)
        },
    }
}

export const drainDuration = 2

export function willpowerDrain(name: string, cost: number, range: number, costs: ActionCosts = {}, turns?: number): Action {
    return statusAction(name, cost, range, costs, "enemy", user => ({ kind: "willpowerDown", amount: Math.max(1, Math.floor(user.stats.willpower / 3)), turns: turns ?? drainDuration }))
}

export function willpowerBoost(name: string, cost: number, range: number, costs: ActionCosts = {}, turns?: number): Action {
    return statusAction(name, cost, range, costs, "ally", user => ({ kind: "willpowerUp", amount: Math.max(1, Math.floor(user.stats.willpower / 4)), turns: turns ?? drainDuration }))
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

export function healing(name: string, cost: number, range: number, costs: ActionCosts = {}, bonus = 0, effect?: EffectSpec): Action {
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
            target.heal(2 + bonus + Math.floor(user.stats.willpower / 2))
            applyEffect(target, user, effect)
        },
    }
}

export const basicAttack = physicalAttack("basicAttack", 1, 1)
export const magicAttack = magicalAttack("magicAttack", 2, 3)

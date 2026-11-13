import { Vector2 } from "three";
import { Game } from "./game";
import { Grid } from "./grid";
import { Piece } from "./piece";

export interface AiBehavior {
    takeTurn(piece: Piece, game: Game): Promise<void>
    initiative(piece: Piece, game: Game): number
}

export interface AiSteps {
    chooseTarget(piece: Piece, candidates: Piece[], game: Game): Piece | undefined
    chooseDestination(piece: Piece, target: Piece, game: Game): Vector2 | undefined
    initiative?(piece: Piece, game: Game): number
}

export function randomInitiative() {
    return Math.random()
}

export function delayedInitiative(delay: number) {
    return (piece: Piece, game: Game) => delay + nearestFirstInitiative(piece, game)
}

export function nearestFirstInitiative(piece: Piece, game: Game) {
    const grid = game.gameLogic.grid
    const from = grid.getPosition(piece)
    if (!from)
        return Infinity
    const distances = grid.distanceMap(from)
    return Math.min(...grid.getPieces(!piece.player).map(enemy => {
        const pos = grid.getPosition(enemy)
        return pos ? distances.get(pos) ?? 500 : 500
    }))
}

export function canAttackFrom(piece: Piece, from: Vector2, target: Piece, game: Game) {
    const grid = game.gameLogic.grid
    const targetPos = grid.getPosition(target)
    return !!targetPos
        && Grid.manathanDistance(from, targetPos) <= piece.attackRange
        && grid.canSee(from, targetPos)
}

export function nearestTarget(piece: Piece, candidates: Piece[], game: Game) {
    const grid = game.gameLogic.grid
    const from = grid.getPosition(piece)
    if (!from)
        return
    const distances = grid.distanceMap(from)
    let best: Piece | undefined
    let bestDistance = Infinity
    for (const candidate of candidates) {
        const pos = grid.getPosition(candidate)
        if (!pos)
            continue
        const distance = (distances.get(pos) ?? 500) + Grid.manathanDistance(from, pos) / 100
        if (distance < bestDistance) {
            best = candidate
            bestDistance = distance
        }
    }
    return best
}

export function weakestInRange(piece: Piece, candidates: Piece[], game: Game) {
    const from = game.gameLogic.grid.getPosition(piece)
    const inRange = from ? candidates.filter(candidate => canAttackFrom(piece, from, candidate, game)) : []
    if (!inRange.length)
        return nearestTarget(piece, candidates, game)
    return inRange.reduce((weakest, candidate) => candidate.healt < weakest.healt ? candidate : weakest)
}

function distanceToEnemies(piece: Piece, game: Game) {
    const grid = game.gameLogic.grid
    const maps = grid.getPieces(!piece.player)
        .map(enemy => grid.getPosition(enemy))
        .filter((pos): pos is Vector2 => !!pos)
        .map(pos => grid.distanceMap(pos))
    return (cell: Vector2) => Math.min(...maps.map(map => map.get(cell) ?? 500))
}

export function stayBehind(isAnchor: (ally: Piece) => boolean = () => true) {
    return (piece: Piece, target: Piece, game: Game) => {
        const anchors = game.gameLogic.grid.getPieces(piece.player).filter(ally => ally !== piece && isAnchor(ally))
        return moveBehind(piece, target, game, anchors.length ? anchors : undefined)
    }
}

export function stayBehindAllies(piece: Piece, target: Piece, game: Game) {
    return moveBehind(piece, target, game)
}

function moveBehind(piece: Piece, target: Piece, game: Game, anchors?: Piece[]) {
    const grid = game.gameLogic.grid
    const from = grid.getPosition(piece)
    const targetPos = grid.getPosition(target)
    if (!from || !targetPos || canAttackFrom(piece, from, target, game))
        return
    const enemyDistance = distanceToEnemies(piece, game)
    const allyDistances = (anchors ?? grid.getPieces(piece.player))
        .filter(ally => ally !== piece)
        .map(ally => grid.getPosition(ally))
        .filter((pos): pos is Vector2 => !!pos)
        .map(pos => enemyDistance(pos))
    const frontLine = allyDistances.length ? Math.min(...allyDistances) : 0
    const targetDistances = grid.distanceMap(targetPos)

    let attackCell: Vector2 | undefined
    let attackScore = -Infinity
    let safeCell: Vector2 | undefined
    let safeScore = Infinity
    grid.floodFill(from, piece.movePoints).forEach((x, y, reachable) => {
        if (!reachable)
            return
        const cell = new Vector2(x, y)
        const distance = enemyDistance(cell)
        if (canAttackFrom(piece, cell, target, game)) {
            const score = distance - Grid.manathanDistance(from, cell) / 100
            if (score > attackScore) {
                attackCell = cell
                attackScore = score
            }
        } else if (distance > frontLine) {
            const score = (targetDistances.get(cell) ?? 500) + Grid.manathanDistance(cell, targetPos) / 100
            if (score < safeScore) {
                safeCell = cell
                safeScore = score
            }
        }
    })
    return attackCell ?? safeCell ?? approachTarget(piece, target, game)
}

export function approachTarget(piece: Piece, target: Piece, game: Game) {
    const grid = game.gameLogic.grid
    const from = grid.getPosition(piece)
    const targetPos = grid.getPosition(target)
    if (!from || !targetPos || canAttackFrom(piece, from, target, game))
        return

    const distances = grid.distanceMap(targetPos)
    let best: Vector2 | undefined
    let bestScore = Infinity
    grid.floodFill(from, piece.movePoints).forEach((x, y, reachable) => {
        if (!reachable)
            return
        const cell = new Vector2(x, y)
        const score = canAttackFrom(piece, cell, target, game)
            ? Grid.manathanDistance(from, cell)
            : 1000 + (distances.get(cell) ?? 500) + Grid.manathanDistance(cell, targetPos) / 100
        if (score < bestScore) {
            best = cell
            bestScore = score
        }
    })
    return best
}

async function attackWhilePossible(piece: Piece, steps: AiSteps, game: Game) {
    const grid = game.gameLogic.grid
    const action = piece.actions.find(element => element.needsTarget && element.targets !== "ally")
    const from = grid.getPosition(piece)
    if (!action || !from)
        return

    for (let attacks = 0; attacks < piece.maxActionPoints && piece.actionPoints >= action.cost; attacks++) {
        const reachable = grid.getPieces(!piece.player).filter(candidate => canAttackFrom(piece, from, candidate, game))
        const target = steps.chooseTarget(piece, reachable, game)
        if (!target)
            return
        action.action(game, target, piece)
        piece.attack(target.obj.position)
        piece.actionPoints -= action.cost
        grid.removeDead()
        await piece.wait()
    }
}

export function createBehavior(steps: AiSteps): AiBehavior {
    return {
        initiative: steps.initiative ?? (() => 0),
        async takeTurn(piece, game) {
            const grid = game.gameLogic.grid
            const target = steps.chooseTarget(piece, grid.getPieces(!piece.player), game)
            if (!target)
                return

            const from = grid.getPosition(piece)
            const destination = piece.movePoints > 0 ? steps.chooseDestination(piece, target, game) : undefined
            if (from && destination) {
                piece.movePoints -= grid.move(from, destination)
                await piece.wait()
            }

            await attackWhilePossible(piece, steps, game)
        },
    }
}

export const aggressiveBehavior = createBehavior({
    chooseTarget: nearestTarget,
    chooseDestination: approachTarget,
})

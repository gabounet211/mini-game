import { Vector2 } from "three";
import { Game } from "./game";
import { Grid } from "./grid";
import { Piece } from "./piece";

export interface AiBehavior {
    takeTurn(piece: Piece, game: Game): Promise<void>
}

export interface AiSteps {
    chooseTarget(piece: Piece, candidates: Piece[], game: Game): Piece | undefined
    chooseDestination(piece: Piece, target: Piece, game: Game): Vector2 | undefined
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

export function approachTarget(piece: Piece, target: Piece, game: Game) {
    const grid = game.gameLogic.grid
    const from = grid.getPosition(piece)
    const targetPos = grid.getPosition(target)
    if (!from || !targetPos || canAttackFrom(piece, from, target, game))
        return

    const distances = grid.distanceMap(targetPos)
    let best: Vector2 | undefined
    let bestScore = Infinity
    grid.floodFill(from, piece.moveRange).forEach((x, y, reachable) => {
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
    const action = piece.config.actions?.find(element => element.needsTarget)
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
        async takeTurn(piece, game) {
            const grid = game.gameLogic.grid
            const target = steps.chooseTarget(piece, grid.getPieces(!piece.player), game)
            if (!target)
                return

            const from = grid.getPosition(piece)
            const destination = piece.hasMoved ? undefined : steps.chooseDestination(piece, target, game)
            if (from && destination) {
                grid.move(from, destination)
                piece.hasMoved = true
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

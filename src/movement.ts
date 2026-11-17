import { Vector2 } from "three"
import { Grid } from "./grid"
import { Piece } from "./piece"

export type MoveKind = "dash" | "push" | "pull" | "jump" | "retreat"

export function direction(from: Vector2, to: Vector2) {
    const dx = to.x - from.x
    const dy = to.y - from.y
    return Math.abs(dx) >= Math.abs(dy) ? new Vector2(Math.sign(dx), 0) : new Vector2(0, Math.sign(dy))
}

export function inLine(from: Vector2, to: Vector2) {
    return from.x === to.x || from.y === to.y
}

function slide(grid: Grid, start: Vector2, step: Vector2, cells: number) {
    let end = start.clone()
    for (let index = 0; index < cells; index++) {
        const next = end.clone().add(step)
        if (!grid.isFree(next))
            break
        end = next
    }
    return end
}

function moveTo(grid: Grid, from: Vector2, to: Vector2) {
    if (from.equals(to))
        return false
    grid.move(from, to)
    return true
}

export function forceMove(grid: Grid, kind: MoveKind, user: Piece, target: Piece, cells = 1) {
    const userPos = grid.getPosition(user)
    const targetPos = grid.getPosition(target)
    if (!userPos || !targetPos || userPos.equals(targetPos))
        return false
    const toward = direction(userPos, targetPos)
    switch (kind) {
        case "dash": {
            if (inLine(userPos, targetPos))
                return moveTo(grid, userPos, slide(grid, userPos, toward, Grid.manathanDistance(userPos, targetPos) - 1))
            const landing = [[1, 0], [-1, 0], [0, 1], [0, -1]]
                .map(([dx, dy]) => new Vector2(targetPos.x + dx, targetPos.y + dy))
                .filter(cell => grid.isFree(cell))
                .sort((a, b) => Grid.manathanDistance(userPos, a) - Grid.manathanDistance(userPos, b))[0]
            return !!landing && moveTo(grid, userPos, landing)
        }
        case "pull":
            return moveTo(grid, targetPos, slide(grid, targetPos, toward.clone().negate(), Grid.manathanDistance(userPos, targetPos) - 1))
        case "push":
            return moveTo(grid, targetPos, slide(grid, targetPos, toward, cells))
        case "retreat":
            return moveTo(grid, userPos, slide(grid, userPos, toward.clone().negate(), cells))
        case "jump": {
            const landing = targetPos.clone().add(toward)
            return grid.isFree(landing) && moveTo(grid, userPos, landing)
        }
    }
}

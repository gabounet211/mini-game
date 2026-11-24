import { Vector2 } from "three"
import { Grid } from "./grid"

export interface Battle {
    grid: Grid
    round: number
}

export interface EndCondition {
    description: string
    check: (battle: Battle) => boolean
    cells?: Vector2[]
    rounds?: number
}

function allPieces(grid: Grid) {
    return [...grid.getPieces(true), ...grid.getPieces(false)]
}

export const allEnemiesDefeated: EndCondition = {
    description: "Defeat every enemy",
    check: ({ grid }) => !grid.getPieces(false).length,
}

export const allHeroesDefeated: EndCondition = {
    description: "",
    check: ({ grid }) => !grid.getPieces(true).length,
}

export function pieceDefeated(name: string, label = name): EndCondition {
    return {
        description: "Defeat " + label,
        check: ({ grid }) => !allPieces(grid).some(piece => piece.name === name),
    }
}

export function keepAlive(name: string, label = name): EndCondition {
    return {
        description: "Keep " + label + " alive",
        check: ({ grid }) => !allPieces(grid).some(piece => piece.name === name),
    }
}

export function surviveRounds(rounds: number): EndCondition {
    return {
        description: "Survive " + rounds + " rounds",
        check: ({ round }) => round > rounds,
        rounds,
    }
}

export function roundLimit(rounds: number): EndCondition {
    return {
        description: "Win within " + rounds + " rounds",
        check: ({ round }) => round > rounds,
        rounds,
    }
}

export function reachCells(cells: [x: number, y: number][], name?: string, label = name): EndCondition {
    const targets = cells.map(([x, y]) => new Vector2(x, y))
    return {
        description: name ? "Bring " + label + " to the marked cells" : "Reach the marked cells",
        check: ({ grid }) => targets.some(cell => {
            const piece = grid.pieceAt(cell)
            return !!piece && piece.player && (!name || piece.name === name)
        }),
        cells: targets,
    }
}

export function anyOf(...conditions: EndCondition[]): EndCondition {
    return {
        description: conditions.map(condition => condition.description).filter(text => text).join(" · "),
        check: battle => conditions.some(condition => condition.check(battle)),
        cells: conditions.flatMap(condition => condition.cells ?? []),
        rounds: conditions.find(condition => condition.rounds)?.rounds,
    }
}

export function objectiveText(victory: EndCondition, defeat: EndCondition) {
    return [victory.description, defeat.description].filter(text => text).join(" · ")
}

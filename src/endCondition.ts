import { Grid } from "./grid"

export type EndCondition = (grid: Grid) => boolean

export const allEnemiesDefeated: EndCondition = grid => !grid.getPieces(false).length

export const allHeroesDefeated: EndCondition = grid => !grid.getPieces(true).length

export function pieceDefeated(name: string): EndCondition {
    return grid => ![...grid.getPieces(true), ...grid.getPieces(false)].some(piece => piece.config.name === name)
}

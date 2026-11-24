import { describe, expect, it } from "vitest"
import { Vector2 } from "three"
import type { Grid } from "./grid"
import type { Piece } from "./piece"
import { allEnemiesDefeated, anyOf, allHeroesDefeated, keepAlive, objectiveText, pieceDefeated, reachCells, roundLimit, surviveRounds } from "./endCondition"

function piece(name: string, player: boolean) {
    return { name, player } as Piece
}

function grid(positions: [x: number, y: number, piece: Piece][]) {
    return {
        getPieces: (player: boolean) => positions.map(([, , piece]) => piece).filter(piece => piece.player === player),
        pieceAt: (cell: Vector2) => positions.find(([x, y]) => cell.x === x && cell.y === y)?.[2],
    } as unknown as Grid
}

describe("end conditions", () => {
    const hero = piece("hero", true)
    const villager = piece("villager", true)
    const goblin = piece("goblin", false)

    it("wins after surviving the given number of rounds", () => {
        const battle = grid([[0, 0, hero], [5, 5, goblin]])
        expect(surviveRounds(3).check({ grid: battle, round: 3 })).toBe(false)
        expect(surviveRounds(3).check({ grid: battle, round: 4 })).toBe(true)
    })

    it("loses when the round limit is passed", () => {
        const defeat = anyOf(allHeroesDefeated, roundLimit(5))
        const battle = grid([[0, 0, hero], [5, 5, goblin]])
        expect(defeat.check({ grid: battle, round: 5 })).toBe(false)
        expect(defeat.check({ grid: battle, round: 6 })).toBe(true)
        expect(defeat.rounds).toBe(5)
    })

    it("loses when the protected piece falls", () => {
        const defeat = anyOf(allHeroesDefeated, keepAlive("villager", "the villager"))
        expect(defeat.check({ grid: grid([[0, 0, hero], [1, 0, villager]]), round: 1 })).toBe(false)
        expect(defeat.check({ grid: grid([[0, 0, hero]]), round: 1 })).toBe(true)
        expect(defeat.description).toBe("Keep the villager alive")
    })

    it("wins when a hero, or the named piece, reaches a marked cell", () => {
        const anyHero = reachCells([[4, 4]])
        expect(anyHero.check({ grid: grid([[4, 4, goblin], [0, 0, hero]]), round: 1 })).toBe(false)
        expect(anyHero.check({ grid: grid([[4, 4, hero]]), round: 1 })).toBe(true)
        const escort = reachCells([[4, 4]], "villager", "the villager")
        expect(escort.check({ grid: grid([[4, 4, hero], [0, 0, villager]]), round: 1 })).toBe(false)
        expect(escort.check({ grid: grid([[4, 4, villager]]), round: 1 })).toBe(true)
        expect(escort.cells).toHaveLength(1)
    })

    it("wins when only the named target is defeated", () => {
        const victory = pieceDefeated("goblinChief", "the goblin chief")
        expect(victory.check({ grid: grid([[0, 0, hero], [3, 3, piece("goblinChief", false)]]), round: 1 })).toBe(false)
        expect(victory.check({ grid: grid([[0, 0, hero], [5, 5, goblin]]), round: 1 })).toBe(true)
    })

    it("describes the objective without the default defeat rule", () => {
        expect(objectiveText(allEnemiesDefeated, allHeroesDefeated)).toBe("Defeat every enemy")
        expect(objectiveText(allEnemiesDefeated, anyOf(allHeroesDefeated, roundLimit(8)))).toBe("Defeat every enemy · Win within 8 rounds")
    })
})

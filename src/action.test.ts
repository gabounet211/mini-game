import { describe, expect, it } from "vitest"
import { Object3D } from "three"
import { Grid } from "./grid"
import { Piece, PieceConfig } from "./piece"
import { createCharacter } from "./character"
import { allyBonus, physicalAttack } from "./action"
import { Game } from "./game"

function piece(player: boolean, characterClass?: string) {
    const config: PieceConfig = { obj: new Object3D(), name: "test", offset: 0, rarity: "common", attackRange: 1, actions: [] }
    const character = createCharacter("test", "common")
    character.characterClass = characterClass
    character.stats = { strength: 4, resistance: 1, constitution: 10, willpower: 3, knowledge: 1, intelligence: 1, dexterity: 4, perception: 1 }
    return new Piece(config, character, player)
}

function setup(pieces: [x: number, y: number, piece: Piece][]) {
    const grid = Object.create(Grid.prototype) as Grid
    const cells: Record<string, true | Piece> = {}
    for (let x = 0; x < 6; x++)
        for (let y = 0; y < 6; y++)
            cells[x + ',' + y] = true
    for (const [x, y, piece] of pieces)
        cells[x + ',' + y] = piece
    Object.assign(grid, { cells })
    return { gameLogic: { grid } } as unknown as Game
}

describe("allyBonus", () => {
    it("adds 1 damage to allies of a living bard or skald", () => {
        const fighter = piece(true)
        const bard = piece(true, "bard")
        const enemy = piece(false)
        const game = setup([[0, 0, fighter], [5, 5, bard], [0, 1, enemy]])
        expect(allyBonus(game, fighter)).toBe(1)
        const before = enemy.healt
        physicalAttack("strike", 1).action(game, enemy, fighter)
        expect(before - enemy.healt).toBe(1 + 2 + 1)
    })

    it("does not boost the bard itself, enemies, or anyone once the bard is dead", () => {
        const fighter = piece(true)
        const bard = piece(true, "skald")
        const enemy = piece(false)
        const game = setup([[0, 0, fighter], [5, 5, bard], [0, 1, enemy]])
        expect(allyBonus(game, bard)).toBe(0)
        expect(allyBonus(game, enemy)).toBe(0)
        bard.healt = 0
        expect(allyBonus(game, fighter)).toBe(0)
    })

    it("does not stack with two bards", () => {
        const fighter = piece(true)
        const game = setup([[0, 0, fighter], [5, 5, piece(true, "bard")], [5, 4, piece(true, "skald")]])
        expect(allyBonus(game, fighter)).toBe(1)
    })
})

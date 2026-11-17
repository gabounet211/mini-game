import { describe, expect, it } from "vitest"
import { Object3D, Vector2 } from "three"
import { Grid } from "./grid"
import { Piece, PieceConfig } from "./piece"
import { createCharacter } from "./character"
import { areaCells } from "./area"
import { areaAction } from "./action"
import { Game } from "./game"

const at = (x: number, y: number) => new Vector2(x, y)
const keys = (cells: Vector2[]) => cells.map(cell => cell.x + ',' + cell.y).sort()

function piece(player: boolean) {
    const config: PieceConfig = { obj: new Object3D(), name: "test", offset: 0, rarity: "common", actions: [] }
    const character = createCharacter("test", "common")
    character.stats = { strength: 4, resistance: 1, constitution: 10, willpower: 3, knowledge: 1, intelligence: 1, dexterity: 4, perception: 1 }
    return new Piece(config, character, player)
}

function setup(pieces: [x: number, y: number, piece: Piece][]) {
    const grid = Object.create(Grid.prototype) as Grid
    const cells: Record<string, true | Piece> = {}
    for (let x = 0; x < 8; x++)
        for (let y = 0; y < 8; y++)
            cells[x + ',' + y] = true
    for (const [x, y, piece] of pieces)
        cells[x + ',' + y] = piece
    Object.assign(grid, { cells })
    return { gameLogic: { grid } } as unknown as Game
}

describe("areaCells", () => {
    it("builds a 2x2 square that extends away from the caster", () => {
        expect(keys(areaCells({ kind: "square", size: 2 }, at(0, 0), at(3, 3)))).toEqual(["3,3", "3,4", "4,3", "4,4"])
    })

    it("builds a radius around the target", () => {
        expect(areaCells({ kind: "radius", size: 2 }, at(0, 0), at(4, 4))).toHaveLength(13)
    })

    it("sweeps the target and one cell on each side", () => {
        expect(keys(areaCells({ kind: "sweep" }, at(2, 2), at(2, 3)))).toEqual(["1,3", "2,3", "3,3"])
    })
})

describe("areaAction", () => {
    it("hits only enemies unless friendly fire is on", () => {
        const user = piece(true), ally = piece(true), enemy = piece(false)
        const game = setup([[0, 0, user], [3, 3, enemy], [4, 4, ally]])
        const hpAlly = ally.healt, hpEnemy = enemy.healt
        areaAction("volley", 3, 3, {}, { shape: { kind: "square", size: 2 }, damage: "physical" }).action(game, undefined, user, at(3, 3))
        expect(enemy.healt).toBeLessThan(hpEnemy)
        expect(ally.healt).toBe(hpAlly)
        areaAction("bulletShower", 3, 3, {}, { shape: { kind: "square", size: 2 }, damage: "physical", friendlyFire: true }).action(game, undefined, user, at(3, 3))
        expect(ally.healt).toBeLessThan(hpAlly)
    })
})

import { describe, expect, it } from "vitest"
import { Object3D, Vector2 } from "three"
import { Grid } from "./grid"
import { Piece, PieceConfig } from "./piece"
import { createCharacter } from "./character"
import { delayedInitiative, nearestFirstInitiative, stayBehind, stayBehindAllies, weakestInRange } from "./aiBehavior"
import { Game } from "./game"

function setup(size: number, pieces: [x: number, y: number, piece: Piece][]) {
    const grid = Object.create(Grid.prototype) as Grid
    const cells: Record<string, true | Piece> = {}
    for (let x = 0; x < size; x++)
        for (let y = 0; y < size; y++)
            cells[x + ',' + y] = true
    for (const [x, y, piece] of pieces)
        cells[x + ',' + y] = piece
    Object.assign(grid, { cells })
    return { gameLogic: { grid } } as unknown as Game
}

function piece(player: boolean, attackRange: number, dexterity = 4, name = "test") {
    const config: PieceConfig = { obj: new Object3D(), name, offset: 0, rarity: "common", attackRange, actions: [] }
    const character = createCharacter("test", "common")
    character.stats = { strength: 2, resistance: 1, constitution: 5, willpower: 3, knowledge: 1, intelligence: 1, dexterity, perception: 1 }
    return new Piece(config, character, player)
}

describe("weakestInRange", () => {
    it("targets the hero with the least HP among those in range", () => {
        const chief = piece(false, 3)
        const strong = piece(true, 1)
        const weak = piece(true, 1)
        weak.healt = 3
        const game = setup(10, [[5, 5, chief], [5, 7, strong], [6, 7, weak]])
        expect(weakestInRange(chief, [strong, weak], game)).toBe(weak)
    })

    it("falls back to the nearest hero when none is in range", () => {
        const chief = piece(false, 3)
        const near = piece(true, 1)
        const far = piece(true, 1)
        near.healt = 20
        far.healt = 1
        const game = setup(20, [[5, 5, chief], [5, 10, near], [5, 18, far]])
        expect(weakestInRange(chief, [near, far], game)).toBe(near)
    })
})

describe("stayBehindAllies", () => {
    it("attacks from as far away as its range allows", () => {
        const chief = piece(false, 3)
        const hero = piece(true, 1)
        const game = setup(15, [[7, 0, hero], [7, 6, chief]])
        const destination = stayBehindAllies(chief, hero, game)!
        expect(Grid.manathanDistance(destination, new Vector2(7, 0))).toBe(3)
    })

    it("moves toward the target but stays behind its allies when it cannot attack", () => {
        const chief = piece(false, 3)
        const ally = piece(false, 1)
        const hero = piece(true, 1)
        const game = setup(15, [[7, 0, hero], [7, 4, ally], [7, 9, chief]])
        const destination = stayBehindAllies(chief, hero, game)!
        expect(Grid.manathanDistance(destination, new Vector2(7, 0))).toBe(5)
        expect(destination.equals(new Vector2(7, 4))).toBe(false)
    })

    it("does not move when it can already attack", () => {
        const chief = piece(false, 3)
        const hero = piece(true, 1)
        const game = setup(10, [[5, 2, hero], [5, 5, chief]])
        expect(stayBehindAllies(chief, hero, game)).toBeUndefined()
    })
})

describe("stayBehind", () => {
    it("stays behind the chosen ally rather than the whole front line", () => {
        const hero = piece(true, 1)
        const brawler = piece(false, 1)
        const marco = piece(false, 1, 4, "Marco")
        const apprentice = piece(false, 3)
        const game = setup(15, [[7, 0, hero], [7, 2, brawler], [7, 6, marco], [8, 10, apprentice]])
        const behindMarco = stayBehind(ally => ally.config.name === "Marco")(apprentice, hero, game)!
        expect(Grid.manathanDistance(behindMarco, new Vector2(7, 0))).toBe(7)
        const behindEveryone = stayBehindAllies(apprentice, hero, game)!
        expect(Grid.manathanDistance(behindEveryone, new Vector2(7, 0))).toBe(6)
    })

    it("falls back to every ally when the chosen one is gone", () => {
        const hero = piece(true, 1)
        const brawler = piece(false, 1)
        const apprentice = piece(false, 3)
        const game = setup(15, [[7, 0, hero], [7, 2, brawler], [7, 10, apprentice]])
        const destination = stayBehind(ally => ally.config.name === "Marco")(apprentice, hero, game)!
        expect(Grid.manathanDistance(destination, new Vector2(7, 0))).toBe(5)
    })
})

describe("initiative", () => {
    it("plays the closest first, and a delayed piece after all of them", () => {
        const hero = piece(true, 1)
        const near = piece(false, 1)
        const far = piece(false, 1)
        const marco = piece(false, 1)
        const game = setup(15, [[7, 0, hero], [7, 3, near], [7, 12, far], [7, 1, marco]])
        expect(nearestFirstInitiative(near, game)).toBeLessThan(nearestFirstInitiative(far, game))
        expect(delayedInitiative(1000)(marco, game)).toBeGreaterThan(nearestFirstInitiative(far, game))
    })
})

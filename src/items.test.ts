import { describe, expect, it } from "vitest"
import { createHero } from "./character"
import { equippedStats } from "./items"

describe("equippedStats", () => {
    it("adds the bonuses of every equipped item without changing the base stats", () => {
        const character = createHero("hero", "common")
        const base = { ...character.stats }
        character.equipment = { weapon: "rustySword", armor: "chainMail" }
        const stats = equippedStats(character)
        expect(stats.strength).toBe(base.strength + 2)
        expect(stats.resistance).toBe(base.resistance + 3)
        expect(stats.constitution).toBe(base.constitution + 1)
        expect(character.stats).toEqual(base)
    })
})

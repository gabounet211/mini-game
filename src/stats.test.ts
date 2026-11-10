import { describe, expect, it } from "vitest"
import { deriveAttributes, rarityBudget, rollStats, statNames } from "./stats"

describe("rollStats", () => {
    it("spends the whole budget with at least 1 in every stat", () => {
        for (let roll = 0; roll < 200; roll++) {
            const stats = rollStats(rarityBudget.rare)
            const values = statNames.map(name => stats[name])
            expect(values.reduce((sum, value) => sum + value, 0)).toBe(rarityBudget.rare)
            expect(Math.min(...values)).toBeGreaterThanOrEqual(1)
        }
    })

    it("favours the preferred stats of a class", () => {
        let strength = 0
        let intelligence = 0
        for (let roll = 0; roll < 2000; roll++) {
            const stats = rollStats(rarityBudget.common, { strength: 3 })
            strength += stats.strength
            intelligence += stats.intelligence
        }
        expect(strength).toBeGreaterThan(intelligence * 1.5)
    })
})

describe("deriveAttributes", () => {
    it("computes HP, AP and Ms from constitution, willpower and dexterity", () => {
        const stats = { strength: 1, resistance: 1, constitution: 5, willpower: 6, knowledge: 1, intelligence: 1, dexterity: 4, perception: 1 }
        expect(deriveAttributes(stats)).toEqual({ maxHealt: 16, maxActionPoints: 4, moveRange: 5 })
    })
})

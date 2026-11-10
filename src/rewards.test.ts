import { describe, expect, it, vi } from "vitest"

vi.mock("./gltf", () => ({ levels: { keys: () => [], getLevel: () => ({}) } }))

const { addExperience, experienceToNextLevel, statPointsPerLevel } = await import("./rewards")

describe("addExperience", () => {
    it("needs 10 × level XP to level up", () => {
        expect(experienceToNextLevel(1)).toBe(10)
        expect(experienceToNextLevel(3)).toBe(30)
    })

    it("keeps the leftover XP and gives stat points", () => {
        const character = { level: 1, experience: 0, statPoints: 0 } as Parameters<typeof addExperience>[0]
        expect(addExperience(character, 9)).toBe(0)
        expect(addExperience(character, 3)).toBe(1)
        expect(character).toMatchObject({ level: 2, experience: 2, statPoints: statPointsPerLevel })
    })

    it("can gain several levels at once", () => {
        const character = { level: 1, experience: 0, statPoints: 0 } as Parameters<typeof addExperience>[0]
        expect(addExperience(character, 60)).toBe(3)
        expect(character).toMatchObject({ level: 4, experience: 0, statPoints: 3 * statPointsPerLevel })
    })
})

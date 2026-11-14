import { describe, expect, it, vi } from "vitest"

vi.mock("./gltf", () => ({ levels: { keys: () => [], getLevel: () => ({}) } }))

const { addExperience, experienceToNextLevel, sacrificeExperience, statPointsPerLevel, totalExperience, transferExperience } = await import("./rewards")

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

describe("transferExperience", () => {
    function hero(level: number, experience: number) {
        return { level, experience, statPoints: 0, equipment: {} } as Parameters<typeof addExperience>[0]
    }

    it("counts the XP of every level already reached", () => {
        expect(totalExperience(hero(3, 5))).toBe(10 + 20 + 5)
    })

    it("gives all the XP plus a bonus and returns the equipment", () => {
        const from = hero(2, 4)
        from.equipment.weapon = "rustySword"
        const to = hero(1, 0)
        const save = { roster: [from, to], inventory: [] as string[] } as unknown as Parameters<typeof transferExperience>[0]
        transferExperience(save, from, to)
        expect(save.roster).toEqual([to])
        expect(save.inventory).toEqual(["rustySword"])
        expect(totalExperience(to)).toBe(14 + sacrificeExperience)
    })

    it("refuses to sacrifice a hero into itself", () => {
        const only = hero(2, 0)
        const save = { roster: [only], inventory: [] as string[] } as unknown as Parameters<typeof transferExperience>[0]
        expect(transferExperience(save, only, only)).toBe(0)
        expect(save.roster).toEqual([only])
    })
})

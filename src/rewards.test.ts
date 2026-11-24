import { describe, expect, it, vi } from "vitest"

vi.mock("./gltf", () => ({ levels: { keys: () => [], getLevel: (key: string) => ({ introduction: key === "goblins", title: key }) } }))

const { addExperience, applyCasualties, applyMastery, experienceShare, experienceToNextLevel, sacrificeExperience, statPointsPerLevel, totalExperience, transferExperience } = await import("./rewards")

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

describe("applyCasualties", () => {
    type Save = Parameters<typeof applyCasualties>[0]
    type Hero = Parameters<typeof applyCasualties>[1][number]

    function character(id: string) {
        return { id, entity: "hero", level: 3, equipment: {} } as Save["roster"][number]
    }

    function fought(target: Save["roster"][number], healt: number) {
        return { character: target, healt } as unknown as Hero
    }

    function save(...roster: Save["roster"]) {
        return { roster, inventory: [], lastTeam: roster.map(hero => hero.id), memorial: [] } as unknown as Save
    }

    it("only injures fallen heroes during the introduction", () => {
        const fallen = character("a"), standing = character("b"), resting = character("c")
        const data = save(fallen, standing, resting)
        applyCasualties(data, [fought(fallen, 0), fought(standing, 5)], "goblins")
        expect(data.roster).toEqual([fallen, standing, resting])
        expect(fallen.injured).toBe(1)
        expect(standing.injured).toBeUndefined()
        applyCasualties(data, [fought(standing, 5), fought(resting, 5)], "goblins")
        expect(fallen.injured).toBe(0)
    })

    it("kills fallen heroes after the introduction and keeps their equipment", () => {
        const fallen = character("a"), standing = character("b")
        fallen.equipment.weapon = "rustySword"
        const data = save(fallen, standing)
        const lines = applyCasualties(data, [fought(fallen, 0), fought(standing, 5)], "bandits")
        expect(data.roster).toEqual([standing])
        expect(data.inventory).toEqual(["rustySword"])
        expect(data.lastTeam).toEqual(["b"])
        expect(data.memorial).toEqual([{ name: "hero", level: 3, levelTitle: "bandits" }])
        expect(lines).toHaveLength(1)
    })

    it("lets the team recover when every hero is injured", () => {
        const first = character("a"), second = character("b")
        const data = save(first, second)
        applyCasualties(data, [fought(first, 0), fought(second, 0)], "goblins")
        expect(first.injured).toBe(0)
        expect(second.injured).toBe(0)
    })
})

describe("applyMastery", () => {
    it("ranks up the skills a hero used in combat", () => {
        const character = { id: "a", entity: "hero", skills: { standFirm: { rank: 1, from: "farmer", mastery: 4 } } } as unknown as Parameters<typeof addExperience>[0]
        const save = { roster: [character] } as unknown as Parameters<typeof applyMastery>[0]
        const hero = { character, skillUses: { standFirm: 7 } } as unknown as Parameters<typeof applyMastery>[1][number]
        expect(applyMastery(save, [hero])).toEqual(["hero: Stand Firm reached rank 2!"])
        expect(character.skills.standFirm).toEqual({ rank: 2, from: "farmer", mastery: 1 })
    })
})

describe("experienceShare", () => {
    it("gives full XP up to 1 level above the recommended level, then 25% less per level, at least 10%", () => {
        expect(experienceShare(3, 2)).toBe(1)
        expect(experienceShare(4, 2)).toBe(0.75)
        expect(experienceShare(5, 2)).toBe(0.5)
        expect(experienceShare(7, 2)).toBe(0.1)
        expect(experienceShare(1, 6)).toBe(1)
        expect(experienceShare(20)).toBe(1)
    })
})

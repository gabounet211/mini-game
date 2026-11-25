import { describe, expect, it } from "vitest"
import { assignHarvest, emptyResources } from "./base"
import { createCharacter, rarityChances, rollRarity } from "./character"
import { applyResearch, assignResearch, improvedSummonChances, researchProjects, startResearch, summonChances, teamBonus } from "./research"
import { SaveData } from "./save"

function save(...roster: SaveData["roster"]): SaveData {
    return { roster, summons: 0, inventory: [], unlockedLevels: 1, lastTeam: [], memorial: [], resources: emptyResources(), harvest: {}, researchers: [], research: { progress: 0, done: [] } }
}

describe("research", () => {
    it("pays the cost and runs one project at a time", () => {
        const data = save()
        expect(startResearch(data, "largerSquad")).toBe(false)
        data.resources.food = 30
        data.resources.ore = 4
        expect(startResearch(data, "largerSquad")).toBe(true)
        expect(data.resources.food).toBe(30 - 10)
        expect(startResearch(data, "summoningRites")).toBe(false)
    })

    it("moves forward with researchers who did not fight, faster with scholars", () => {
        const farmer = createCharacter("hero", "common", "farmer")
        const scholar = createCharacter("hero", "rare", "scholar")
        const soldier = createCharacter("hero", "uncommon", "soldier")
        const data = save(farmer, scholar, soldier)
        data.resources.food = 10
        startResearch(data, "largerSquad")
        for (const character of [farmer, scholar, soldier])
            assignResearch(data, character, true)
        applyResearch(data, [soldier.id])
        expect(data.research.progress).toBe(1 + 2)
    })

    it("finishes a project and applies its effect", () => {
        const scholar = createCharacter("hero", "rare", "scholar")
        const data = save(scholar)
        data.resources.food = 10
        startResearch(data, "largerSquad")
        assignResearch(data, scholar, true)
        expect(teamBonus(data)).toBe(0)
        for (let combat = 0; combat < researchProjects.largerSquad.points / 2; combat++)
            applyResearch(data, [])
        expect(data.research.done).toEqual(["largerSquad"])
        expect(data.research.current).toBeUndefined()
        expect(teamBonus(data)).toBe(1)
    })

    it("keeps a hero either at the harvest or at the research", () => {
        const hunter = createCharacter("hero", "common", "hunter")
        const data = save(hunter)
        assignHarvest(data, hunter, "leather")
        assignResearch(data, hunter, true)
        expect(data.harvest).toEqual({})
        assignHarvest(data, hunter, "wood")
        expect(data.researchers).toEqual([])
    })

    it("improves summon chances once researched", () => {
        const data = save()
        expect(summonChances(data)).toBe(rarityChances)
        data.research.done.push("summoningRites")
        expect(summonChances(data)).toBe(improvedSummonChances)
        expect(rollRarity(() => 0.92, improvedSummonChances)).toBe("legendary")
        expect(rollRarity(() => 0.92, rarityChances)).toBe("rare")
    })
})

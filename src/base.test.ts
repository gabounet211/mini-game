import { describe, expect, it } from "vitest"
import { applyHarvest, assignHarvest, emptyResources, harvestAmount, harvestYield, specialistBonus } from "./base"
import { createCharacter } from "./character"
import { SaveData } from "./save"

function save(...roster: SaveData["roster"]): SaveData {
    return { roster, summons: 0, inventory: [], unlockedLevels: 1, lastTeam: [], memorial: [], resources: emptyResources(), harvest: {} }
}

describe("harvest", () => {
    it("gives villager classes a bonus on their own resource", () => {
        const lumberjack = createCharacter("hero", "common", "lumberjack")
        expect(harvestAmount(lumberjack, "wood")).toBe(harvestYield + specialistBonus)
        expect(harvestAmount(lumberjack, "food")).toBe(harvestYield)
    })

    it("halves the harvest of an injured hero", () => {
        const farmer = createCharacter("hero", "common", "farmer")
        farmer.injured = 1
        expect(harvestAmount(farmer, "food")).toBe(Math.ceil((harvestYield + specialistBonus) / 2))
    })

    it("gathers for each hero at the base who did not fight", () => {
        const hunter = createCharacter("hero", "common", "hunter")
        const soldier = createCharacter("hero", "uncommon", "soldier")
        const data = save(hunter, soldier)
        assignHarvest(data, hunter, "leather")
        assignHarvest(data, soldier, "ore")
        const lines = applyHarvest(data, [soldier.id])
        expect(data.resources).toEqual({ wood: 0, food: 0, leather: harvestYield + specialistBonus, ore: 0 })
        expect(lines).toHaveLength(1)
    })

    it("forgets heroes who left the roster", () => {
        const farmer = createCharacter("hero", "common", "farmer")
        const data = save()
        assignHarvest(data, farmer, "food")
        applyHarvest(data, [])
        expect(data.harvest).toEqual({})
        expect(data.resources.food).toBe(0)
    })
})

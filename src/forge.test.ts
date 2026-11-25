import { describe, expect, it } from "vitest"
import { emptyResources } from "./base"
import { craft, dismantle, dismantleValue, maxUpgrade, recipes, upgrade, upgradeCost } from "./forge"
import { createHero } from "./character"
import { equippedStats, getItem, items, itemName } from "./items"
import { SaveData } from "./save"

function save(): SaveData {
    return { roster: [], summons: 0, inventory: [], unlockedLevels: 1, lastTeam: [], memorial: [], resources: emptyResources(), harvest: {}, researchers: [], research: { progress: 0, done: [] } }
}

describe("forge", () => {
    it("has a recipe for every loot item", () => {
        expect(Object.keys(recipes).sort()).toEqual(Object.keys(items).sort())
    })

    it("crafts an item only with enough resources", () => {
        const data = save()
        expect(craft(data, "rustySword")).toBe(false)
        data.resources.ore = 4
        data.resources.wood = 2
        expect(craft(data, "rustySword")).toBe(true)
        expect(data.inventory).toEqual(["rustySword"])
        expect(data.resources).toEqual(emptyResources())
    })

    it("upgrades an item up to +3, doubling the cost each time", () => {
        const data = save()
        data.inventory.push("rustySword")
        data.resources.ore = 3 + 6 + 12
        expect(upgradeCost("rustySword")).toEqual({ ore: 3 })
        expect(upgrade(data, "rustySword")).toBe(true)
        expect(upgradeCost("rustySword+1")).toEqual({ ore: 6 })
        expect(upgrade(data, "rustySword+1")).toBe(true)
        expect(upgrade(data, "rustySword+2")).toBe(true)
        expect(data.inventory).toEqual(["rustySword+" + maxUpgrade])
        expect(upgradeCost("rustySword+3")).toBeUndefined()
        expect(data.resources.ore).toBe(0)
    })

    it("adds the upgrade to every bonus of the item", () => {
        expect(getItem("chainMail+2")?.bonuses).toEqual({ resistance: 5, constitution: 3 })
        expect(itemName("chainMail+2")).toBe("Chain Mail +2")
        const character = createHero("hero", "common")
        character.equipment = { weapon: "rustySword+1" }
        expect(equippedStats(character).strength).toBe(character.stats.strength + 3)
    })

    it("dismantles an item into half its recipe and half its upgrades", () => {
        expect(dismantleValue("rustySword")).toEqual({ ore: 2, wood: 1 })
        expect(dismantleValue("rustySword+2")).toEqual({ ore: 2 + 4, wood: 1 })
        expect(dismantleValue("bloodTotem")).toBeUndefined()
        const data = save()
        data.inventory.push("huntingBow")
        expect(dismantle(data, "huntingBow")).toBe(true)
        expect(data.inventory).toEqual([])
        expect(data.resources).toMatchObject({ wood: 2, leather: 1 })
    })
})

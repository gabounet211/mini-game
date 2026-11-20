import { describe, expect, it, vi } from "vitest"
import { createCharacter } from "./character"
import { applyClassChange } from "./characterClass"

vi.mock("./gltf", () => ({ levels: { keys: () => [], getLevel: () => ({}) } }))

const { addExperience } = await import("./rewards")
import { equippedActions, learnSkill, rankUpSkill, skillAction, skillSlots, toggleEquipped } from "./skill"

function hero(characterClass: string, skillPoints = 0) {
    const character = createCharacter("hero", "rare", characterClass)
    character.skillPoints = skillPoints
    return character
}

describe("skills", () => {
    it("starts with the class basic attack and its first skill, both equipped", () => {
        const tracker = hero("tracker")
        expect(Object.keys(tracker.skills)).toEqual(["aimedShot", "knifeStrike"])
        expect(tracker.equippedSkills).toEqual(["aimedShot", "knifeStrike"])
        expect(tracker.skillPoints).toBe(0)
    })

    it("gives one skill point per level", () => {
        const tracker = hero("tracker")
        addExperience(tracker, 10 + 20)
        expect(tracker.skillPoints).toBe(2)
    })

    it("learns a class skill for 1 point and equips it while a slot is free", () => {
        const tracker = hero("tracker")
        expect(learnSkill(tracker, "legShot")).toBe(false)
        tracker.skillPoints = 1
        expect(learnSkill(tracker, "legShot")).toBe(true)
        expect(tracker.skillPoints).toBe(0)
        expect(tracker.equippedSkills).toEqual(["aimedShot", "knifeStrike", "legShot"])
    })

    it("limits equipped skills by tier", () => {
        const farmer = hero("farmer")
        expect(skillSlots(farmer)).toBe(2)
        const tracker = hero("tracker", 1)
        learnSkill(tracker, "legShot")
        expect(skillSlots(tracker)).toBe(3)
        toggleEquipped(tracker, "knifeStrike")
        expect(tracker.equippedSkills).toEqual(["aimedShot", "legShot"])
        toggleEquipped(tracker, "knifeStrike")
        expect(tracker.equippedSkills).toEqual(["aimedShot", "legShot", "knifeStrike"])
    })

    it("ranks up for 1 then 2 points, adding damage and shortening the cooldown at rank 3", () => {
        const sharpshooter = hero("sharpshooter", 3)
        sharpshooter.skills.headShot = { rank: 1, from: "sharpshooter" }
        expect(rankUpSkill(sharpshooter, "headShot")).toBe(true)
        expect(sharpshooter.skillPoints).toBe(2)
        expect(skillAction(sharpshooter, "headShot")!.bonusDamage).toBe(3)
        expect(rankUpSkill(sharpshooter, "headShot")).toBe(true)
        expect(sharpshooter.skillPoints).toBe(0)
        const headShot = skillAction(sharpshooter, "headShot")!
        expect(headShot.bonusDamage).toBe(4)
        expect(headShot.cooldown).toBe(1)
        expect(rankUpSkill(sharpshooter, "headShot")).toBe(false)
    })

    it("keeps skills on a class change, upgrading those the new class shares and swapping the basic attack", () => {
        const tracker = hero("tracker", 1)
        learnSkill(tracker, "legShot")
        tracker.skills.legShot.rank = 2
        tracker.level = 4
        tracker.championsDefeated = ["chapter1"]
        expect(applyClassChange(tracker, "sharpshooter", [])).toBe(true)
        expect(tracker.skills.legShot).toEqual({ rank: 2, from: "sharpshooter" })
        expect(tracker.skills.knifeStrike.from).toBe("tracker")
        expect(tracker.equippedSkills).toEqual(["piercingShot", "knifeStrike", "legShot"])
        expect(skillAction(tracker, "legShot")!.cooldown).toBe(2)
        expect(equippedActions(tracker).map(action => action.name)).toEqual(["piercingShot", "knifeStrike", "legShot"])
    })

    it("uses a skill's own rank versions when it has them", () => {
        const farmer = hero("farmer", 3)
        expect(Object.keys(farmer.skills)).toEqual(["pitchforkStrike", "standFirm"])
        rankUpSkill(farmer, "standFirm")
        expect(skillAction(farmer, "standFirm")!.cooldown).toBe(2)
        rankUpSkill(farmer, "standFirm")
        expect(skillAction(farmer, "standFirm")!.cooldown).toBe(1)
        const hunter = hero("hunter", 3)
        learnSkill(hunter, "snare")
        rankUpSkill(hunter, "snare")
        expect(skillAction(hunter, "snare")!.range).toBe(4)
    })
})

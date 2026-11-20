import { describe, expect, it, vi } from "vitest"
import { createCharacter } from "./character"
import { applyClassChange } from "./characterClass"

vi.mock("./gltf", () => ({ levels: { keys: () => [], getLevel: () => ({}) } }))

const { addExperience } = await import("./rewards")
import { equippedActions, learnSkill, rankedAction, rankUpSkill, skillAction, skillSlots, toggleEquipped } from "./skill"
import { physicalAttack } from "./action"

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

    it("ranks up for 1 then 2 points, with generic bonuses when a skill has no rank versions", () => {
        const duelist = hero("duelist", 3)
        duelist.skills.rapierSweep = { rank: 1, from: "duelist" }
        expect(rankUpSkill(duelist, "rapierSweep")).toBe(true)
        expect(duelist.skillPoints).toBe(2)
        expect(skillAction(duelist, "rapierSweep")!.bonusDamage).toBe(1)
        expect(rankUpSkill(duelist, "rapierSweep")).toBe(true)
        expect(duelist.skillPoints).toBe(0)
        expect(skillAction(duelist, "rapierSweep")!.bonusDamage).toBe(2)
        expect(rankUpSkill(duelist, "rapierSweep")).toBe(false)
        expect(rankedAction(physicalAttack("strike", 1, 1, { cooldown: 2 }), 3).cooldown).toBe(1)
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

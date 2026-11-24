import { describe, expect, it, vi } from "vitest"
import { createCharacter } from "./character"
import { applyClassChange } from "./characterClass"

vi.mock("./gltf", () => ({ levels: { keys: () => [], getLevel: () => ({}) } }))

const { addExperience } = await import("./rewards")
import { addMastery, equippedActions, learnSkill, masteryToRank, migrateMastery, pruneSkills, rankedAction, skillAction, skillSlots, toggleEquipped } from "./skill"
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

    it("ranks up after 10 then 25 uses, with generic bonuses when a skill has no rank versions", () => {
        const duelist = hero("duelist", 3)
        duelist.skills.rapierSweep = { rank: 1, from: "duelist", mastery: 0 }
        expect(addMastery(duelist, "rapierSweep", 9)).toBe(0)
        expect(addMastery(duelist, "rapierSweep", 1)).toBe(1)
        expect(duelist.skills.rapierSweep).toEqual({ rank: 2, from: "duelist", mastery: 0 })
        expect(duelist.skillPoints).toBe(3)
        expect(skillAction(duelist, "rapierSweep")!.bonusDamage).toBe(1)
        expect(addMastery(duelist, "rapierSweep", 30)).toBe(1)
        expect(duelist.skills.rapierSweep).toEqual({ rank: 3, from: "duelist", mastery: 0 })
        expect(skillAction(duelist, "rapierSweep")!.bonusDamage).toBe(2)
        expect(addMastery(duelist, "rapierSweep", 50)).toBe(0)
        expect(rankedAction(physicalAttack("strike", 1, 1, { cooldown: 2 }), 3).cooldown).toBe(1)
    })

    it("keeps skills on a class change, upgrading those the new class shares and swapping the basic attack", () => {
        const tracker = hero("tracker", 1)
        learnSkill(tracker, "legShot")
        tracker.skills.legShot.rank = 2
        tracker.level = 4
        tracker.championsDefeated = ["chapter1"]
        expect(applyClassChange(tracker, "sharpshooter", [])).toBe(true)
        expect(tracker.skills.legShot).toEqual({ rank: 2, from: "sharpshooter", mastery: 0 })
        expect(tracker.skills.knifeStrike.from).toBe("tracker")
        expect(tracker.equippedSkills).toEqual(["piercingShot", "knifeStrike", "legShot"])
        expect(skillAction(tracker, "legShot")!.cooldown).toBe(2)
        expect(equippedActions(tracker).map(action => action.name)).toEqual(["piercingShot", "knifeStrike", "legShot"])
    })

    it("uses a skill's own rank versions when it has them", () => {
        const farmer = hero("farmer", 3)
        expect(Object.keys(farmer.skills)).toEqual(["pitchforkStrike", "standFirm"])
        addMastery(farmer, "standFirm", masteryToRank[2])
        expect(skillAction(farmer, "standFirm")!.cooldown).toBe(2)
        addMastery(farmer, "standFirm", masteryToRank[3])
        expect(skillAction(farmer, "standFirm")!.cooldown).toBe(1)
        const hunter = hero("hunter", 3)
        learnSkill(hunter, "snare")
        addMastery(hunter, "snare", masteryToRank[2])
        expect(skillAction(hunter, "snare")!.range).toBe(4)
    })

    it("evolves a legendary's skills to the tier 5 versions at the same rank", () => {
        const cleric = createCharacter("hero", "legendary", "cleric")
        cleric.skillPoints = 2
        learnSkill(cleric, "holyWard")
        addMastery(cleric, "holyWard", masteryToRank[2])
        cleric.level = 4
        cleric.championsDefeated = ["chapter1"]
        const inventory = ["holyRelic"]
        expect(applyClassChange(cleric, "saint", inventory)).toBe(true)
        expect(cleric.skills.holyWard).toEqual({ rank: 2, from: "saint", mastery: 0 })
        expect(skillAction(cleric, "holyWard")!.range).toBe(4)
        expect(skillSlots(cleric)).toBe(5)
        expect(inventory).toEqual([])
    })

    it("removes skills that no longer exist and gives their points back", () => {
        const elementalist = createCharacter("hero", "legendary", "elementalist")
        elementalist.skills = { staffStrike: { rank: 1, from: "elementalist" }, elementalBlast: { rank: 3, from: "elementalist" } }
        elementalist.equippedSkills = ["staffStrike", "elementalBlast"]
        elementalist.skillPoints = 0
        migrateMastery(elementalist)
        pruneSkills(elementalist)
        expect(Object.keys(elementalist.skills)).toEqual(["staffStrike"])
        expect(elementalist.equippedSkills).toEqual(["staffStrike"])
        expect(elementalist.skillPoints).toBe(1 + 1 + 2)
    })

    it("gives back the points spent on ranks before mastery, once", () => {
        const scholar = hero("scholar", 0)
        scholar.skills.bookSmack = { rank: 3, from: "scholar" }
        migrateMastery(scholar)
        expect(scholar.skillPoints).toBe(1 + 2)
        expect(scholar.skills.bookSmack).toEqual({ rank: 3, from: "scholar", mastery: 0 })
        migrateMastery(scholar)
        expect(scholar.skillPoints).toBe(1 + 2)
    })
})

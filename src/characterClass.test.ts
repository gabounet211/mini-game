import { describe, expect, it } from "vitest"
import { Character, createHero } from "./character"
import { applyClassChange, canChangeClass, characterClasses, classChangeOffers } from "./characterClass"
import { Stats } from "./stats"

function hero(characterClass: string, rarity: Character["rarity"], stats: Partial<Stats>): Character {
    const character = createHero("hero", rarity)
    character.characterClass = characterClass
    character.stats = { strength: 1, resistance: 1, constitution: 1, willpower: 1, knowledge: 1, intelligence: 1, dexterity: 1, perception: 1, ...stats }
    character.level = 4
    character.championsDefeated = ["chapter1"]
    return character
}

describe("createHero", () => {
    it("only gives starting classes of the rarity's tier", () => {
        for (let roll = 0; roll < 300; roll++) {
            const character = createHero("hero")
            const characterClass = characterClasses[character.characterClass!]
            expect(characterClass.starting).toBe(true)
            expect(characterClass.tier).toBe({ common: 1, rare: 2, legendary: 3 }[character.rarity])
        }
    })
})

describe("canChangeClass", () => {
    it("needs level 4 and a defeated champion not yet used", () => {
        const character = hero("lumberjack", "common", { strength: 8 })
        expect(canChangeClass(character)).toBe(true)
        character.level = 3
        expect(canChangeClass(character)).toBe(false)
        character.level = 4
        character.classChanges = ["chapter1"]
        expect(canChangeClass(character)).toBe(false)
    })
})

describe("classChangeOffers", () => {
    it("offers the easy class of the highest stat", () => {
        expect(classChangeOffers(hero("lumberjack", "common", { strength: 8 }), [])).toEqual(["soldier"])
    })

    it("adds the demanding class when its minimum is met", () => {
        const offers = classChangeOffers(hero("lumberjack", "common", { intelligence: 8, strength: 6 }), [])
        expect(offers).toContain("mageblade")
        expect(offers).toContain("apprentice")
    })

    it("never offers more than 3 classes", () => {
        const offers = classChangeOffers(hero("farmer", "common", { strength: 5, resistance: 5, constitution: 5, willpower: 5 }), [])
        expect(offers.length).toBeLessThanOrEqual(3)
        expect(offers.length).toBeGreaterThan(0)
    })

    it("stops commons at tier 3", () => {
        expect(classChangeOffers(hero("knight", "common", { resistance: 9 }), [])).toEqual([])
    })

    it("needs the class item for legendaries", () => {
        expect(classChangeOffers(hero("cleric", "legendary", { willpower: 9 }), [])).toEqual([])
        expect(classChangeOffers(hero("cleric", "legendary", { willpower: 9 }), ["holyRelic"])).toEqual(["saint"])
    })
})

describe("applyClassChange", () => {
    it("changes the class, uses the chapter and consumes the item", () => {
        const character = hero("cleric", "legendary", { willpower: 9 })
        const inventory = ["holyRelic", "rustySword"]
        expect(applyClassChange(character, "saint", inventory)).toBe(true)
        expect(character.characterClass).toBe("saint")
        expect(character.classChanges).toEqual(["chapter1"])
        expect(inventory).toEqual(["rustySword"])
        expect(canChangeClass(character)).toBe(false)
    })
})

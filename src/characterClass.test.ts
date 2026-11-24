import { describe, expect, it } from "vitest"
import { Character, createHero } from "./character"
import { applyClassChange, canChangeClass, characterClasses, classChangeOffers, closestClasses, missingStats } from "./characterClass"
import { Stats } from "./stats"

function hero(characterClass: string, rarity: Character["rarity"], stats: Partial<Stats>): Character {
    const character = createHero("hero", rarity)
    character.characterClass = characterClass
    character.stats = { strength: 1, resistance: 1, constitution: 1, willpower: 1, knowledge: 1, intelligence: 1, dexterity: 1, perception: 1, ...stats }
    character.level = 6
    character.championsDefeated = ["chapter1"]
    return character
}

describe("createHero", () => {
    it("only gives starting classes of the rarity's tier", () => {
        for (let roll = 0; roll < 300; roll++) {
            const character = createHero("hero")
            const characterClass = characterClasses[character.characterClass!]
            expect(characterClass.starting).toBe(true)
            expect(characterClass.tier).toBe({ common: 1, uncommon: 2, rare: 3, legendary: 4 }[character.rarity])
        }
    })
})

describe("canChangeClass", () => {
    it("needs level 6 and a defeated champion not yet used", () => {
        const character = hero("lumberjack", "common", { strength: 8 })
        expect(canChangeClass(character)).toBe(true)
        character.level = 5
        expect(canChangeClass(character)).toBe(false)
        character.level = 6
        character.classChanges = ["chapter1"]
        expect(canChangeClass(character)).toBe(false)
    })
})

describe("classChangeOffers", () => {
    it("offers a class once all its minimums are met", () => {
        expect(classChangeOffers(hero("lumberjack", "common", { strength: 5, resistance: 4 }), [])).toEqual(["soldier"])
        expect(classChangeOffers(hero("lumberjack", "common", { strength: 5, resistance: 3 }), [])).toEqual([])
    })

    it("offers every class whose minimums are met", () => {
        const offers = classChangeOffers(hero("apprentice", "uncommon", { intelligence: 7, knowledge: 6, strength: 6, dexterity: 4 }), [])
        expect(offers).toEqual(["scholar", "mageblade"])
    })

    it("shows the closest classes and the missing stats", () => {
        const character = hero("lumberjack", "common", { strength: 3, resistance: 4 })
        expect(closestClasses(character)[0]).toBe("soldier")
        expect(missingStats(character, "soldier")).toEqual([["strength", 2]])
    })

    it("stops commons at the rare tier", () => {
        expect(classChangeOffers(hero("guard", "common", { resistance: 9 }), [])).toEqual([])
        expect(closestClasses(hero("guard", "common", { resistance: 9 }))).toEqual([])
    })

    it("lets rares reach the legendary tier", () => {
        expect(classChangeOffers(hero("guard", "rare", { resistance: 8, strength: 6 }), [])).toEqual(["knight"])
    })

    it("needs the class item for legendaries", () => {
        expect(classChangeOffers(hero("cleric", "legendary", { willpower: 9 }), [])).toEqual([])
        expect(classChangeOffers(hero("cleric", "legendary", { willpower: 9 }), ["holyRelic"])).toEqual(["saint"])
    })
})

describe("bard and skald", () => {
    it("always offers Skald to a bard", () => {
        expect(classChangeOffers(hero("bard", "uncommon", {}), [])).toEqual(["skald"])
        expect(classChangeOffers(hero("bard", "uncommon", { strength: 7, dexterity: 5, constitution: 4 }), [])).toEqual(["skald", "mercenary"])
    })
})

describe("one class change for now", () => {
    it("does not offer a second class change after another champion", () => {
        const character = hero("lumberjack", "common", { strength: 8 })
        character.championsDefeated = ["chapter1", "chapter2"]
        character.classChanges = ["chapter1"]
        expect(canChangeClass(character)).toBe(false)
    })

    it("lets a hero who missed the first chapter change class after the second", () => {
        const character = hero("lumberjack", "common", { strength: 8 })
        character.championsDefeated = ["chapter2"]
        expect(canChangeClass(character)).toBe(true)
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

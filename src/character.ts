import { characterClasses, rarityTier, talentChance, talentWeight } from "./characterClass"
import { Rarity, rarityBudget, rollStats, statNames, Stats, StatWeights } from "./stats"
import { initSkills, KnownSkill } from "./skill"

export interface Equipment {
    weapon?: string,
    armor?: string,
    jewelry?: string,
}

export interface Character {
    id: string,
    entity: string,
    rarity: Rarity,
    characterClass?: string,
    talent?: keyof Stats,
    stats: Stats,
    level: number,
    experience: number,
    statPoints: number,
    equipment: Equipment,
    finaleAttempts: string[],
    championsDefeated: string[],
    classChanges: string[],
    skills: Record<string, KnownSkill>,
    equippedSkills: string[],
    skillPoints: number,
    injured?: number,
}

export function createId() {
    return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export const rarityChances: Record<Rarity, number> = {
    common: 0.5,
    uncommon: 0.28,
    rare: 0.15,
    legendary: 0.07,
}

export function rollRarity(random = Math.random, chances = rarityChances): Rarity {
    let roll = random()
    for (const [rarity, chance] of Object.entries(chances) as [Rarity, number][]) {
        roll -= chance
        if (roll < 0)
            return rarity
    }
    return "common"
}

export function createCharacter(entity: string, rarity: Rarity, characterClass?: string): Character {
    const character: Character = {
        id: createId(),
        entity,
        rarity,
        characterClass,
        stats: rollStats(rarityBudget[rarity], characterClass ? characterClasses[characterClass].statWeights : {}),
        level: 1,
        experience: 0,
        statPoints: 0,
        equipment: {},
        finaleAttempts: [],
        championsDefeated: [],
        classChanges: [],
        skills: {},
        equippedSkills: [],
        skillPoints: 0,
    }
    initSkills(character)
    return character
}

export function createHero(entity: string, rarity = rollRarity(), random = Math.random): Character {
    const choices = Object.keys(characterClasses).filter(key => characterClasses[key].starting && characterClasses[key].tier === rarityTier[rarity])
    const characterClass = choices[Math.floor(random() * choices.length)]
    const weights: StatWeights = { ...characterClasses[characterClass].statWeights }
    let talent: keyof Stats | undefined
    if (rarity === "common" && random() < talentChance) {
        talent = statNames[Math.floor(random() * statNames.length)]
        weights[talent] = (weights[talent] ?? 1) + talentWeight
    }
    const character: Character = {
        id: createId(),
        entity,
        rarity,
        characterClass,
        talent,
        stats: rollStats(rarityBudget[rarity], weights, random),
        level: 1,
        experience: 0,
        statPoints: 0,
        equipment: {},
        finaleAttempts: [],
        championsDefeated: [],
        classChanges: [],
        skills: {},
        equippedSkills: [],
        skillPoints: 0,
    }
    initSkills(character)
    return character
}

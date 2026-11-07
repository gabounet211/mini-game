import { characterClasses, rarityTier, talentChance, talentWeight } from "./characterClass"
import { Rarity, rarityBudget, rollStats, statNames, Stats, StatWeights } from "./stats"

export interface Equipment {
    weapon?: string,
    armor?: string,
    jewelry?: string,
}

export interface Character {
    entity: string,
    rarity: Rarity,
    characterClass?: string,
    talent?: keyof Stats,
    stats: Stats,
    level: number,
    experience: number,
    equipment: Equipment,
}

export const rarityChances: Record<Rarity, number> = {
    common: 0.6,
    rare: 0.3,
    legendary: 0.1,
}

export function rollRarity(random = Math.random): Rarity {
    let roll = random()
    for (const [rarity, chance] of Object.entries(rarityChances) as [Rarity, number][]) {
        roll -= chance
        if (roll < 0)
            return rarity
    }
    return "common"
}

export function createCharacter(entity: string, rarity: Rarity): Character {
    return {
        entity,
        rarity,
        stats: rollStats(rarityBudget[rarity]),
        level: 1,
        experience: 0,
        equipment: {},
    }
}

export function createHero(entity: string, rarity = rollRarity(), random = Math.random): Character {
    const choices = Object.keys(characterClasses).filter(key => characterClasses[key].tier === rarityTier[rarity])
    const characterClass = choices[Math.floor(random() * choices.length)]
    const weights: StatWeights = { ...characterClasses[characterClass].statWeights }
    let talent: keyof Stats | undefined
    if (rarity === "common" && random() < talentChance) {
        talent = statNames[Math.floor(random() * statNames.length)]
        weights[talent] = (weights[talent] ?? 1) + talentWeight
    }
    return {
        entity,
        rarity,
        characterClass,
        talent,
        stats: rollStats(rarityBudget[rarity], weights, random),
        level: 1,
        experience: 0,
        equipment: {},
    }
}

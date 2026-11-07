import { Action, healing, magicalAttack, physicalAttack } from "./action"
import { Rarity, StatWeights } from "./stats"

export interface CharacterClass {
    name: string,
    tier: number,
    attackRange: number,
    actions: Action[],
    statWeights: StatWeights,
}

export const characterClasses: Record<string, CharacterClass> = {
    farmer: { name: "Farmer", tier: 1, attackRange: 1, actions: [physicalAttack("pitchforkStrike", 1)], statWeights: { constitution: 3, resistance: 2 } },
    lumberjack: { name: "Lumberjack", tier: 1, attackRange: 1, actions: [physicalAttack("axeChop", 1)], statWeights: { strength: 3, constitution: 2 } },
    hunter: { name: "Hunter", tier: 1, attackRange: 3, actions: [physicalAttack("slingShot", 1)], statWeights: { dexterity: 3, perception: 2 } },
    soldier: { name: "Soldier", tier: 2, attackRange: 1, actions: [physicalAttack("swordStrike", 1)], statWeights: { strength: 3, resistance: 3 } },
    apprentice: { name: "Apprentice", tier: 2, attackRange: 3, actions: [physicalAttack("staffStrike", 1), magicalAttack("arcaneBolt", 2)], statWeights: { intelligence: 3, knowledge: 3 } },
    healer: { name: "Healer", tier: 2, attackRange: 2, actions: [physicalAttack("staffStrike", 1), magicalAttack("lightRay", 2), healing("healingTouch", 2)], statWeights: { willpower: 3, intelligence: 2 } },
    berserker: { name: "Berserker", tier: 3, attackRange: 1, actions: [physicalAttack("frenzyStrike", 1)], statWeights: { strength: 4, constitution: 3 } },
    elementalist: { name: "Elementalist", tier: 3, attackRange: 4, actions: [physicalAttack("staffStrike", 1), magicalAttack("elementalBlast", 2)], statWeights: { intelligence: 4, knowledge: 2 } },
    cleric: { name: "Cleric", tier: 3, attackRange: 3, actions: [physicalAttack("maceStrike", 1), magicalAttack("smite", 2), healing("divineHealing", 2)], statWeights: { willpower: 3, intelligence: 3 } },
}

export const rarityTier: Record<Rarity, number> = {
    common: 1,
    rare: 2,
    legendary: 3,
}

export const talentChance = 0.25
export const talentWeight = 4

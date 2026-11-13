import { Action, healing, magicalAttack, physicalAttack } from "./action"
import { Rarity, Stats, StatWeights } from "./stats"
import { Character } from "./character"

export interface CharacterClass {
    name: string,
    tier: number,
    attackRange: number,
    actions: Action[],
    statWeights: StatWeights,
    starting?: boolean,
    requirement?: { highest: keyof Stats, minimums?: Partial<Stats> },
    evolvesFrom?: string,
    requiredItem?: string,
    inspiresAllies?: boolean,
}

export const characterClasses: Record<string, CharacterClass> = {
    farmer: { name: "Farmer", tier: 1, starting: true, attackRange: 1, actions: [physicalAttack("pitchforkStrike", 1)], statWeights: { constitution: 3, resistance: 2 } },
    lumberjack: { name: "Lumberjack", tier: 1, starting: true, attackRange: 1, actions: [physicalAttack("axeChop", 1)], statWeights: { strength: 3, constitution: 2 } },
    hunter: { name: "Hunter", tier: 1, starting: true, attackRange: 3, actions: [physicalAttack("slingShot", 1)], statWeights: { dexterity: 3, perception: 2 } },
    soldier: { name: "Soldier", tier: 2, starting: true, attackRange: 1, actions: [physicalAttack("swordStrike", 1)], statWeights: { strength: 3, resistance: 3 }, requirement: { highest: "strength" } },
    apprentice: { name: "Apprentice", tier: 2, starting: true, attackRange: 3, actions: [physicalAttack("staffStrike", 1), magicalAttack("arcaneBolt", 2)], statWeights: { intelligence: 3, knowledge: 3 }, requirement: { highest: "intelligence" } },
    healer: { name: "Healer", tier: 2, starting: true, attackRange: 2, actions: [physicalAttack("staffStrike", 1), magicalAttack("lightRay", 2), healing("healingTouch", 2)], statWeights: { willpower: 3, intelligence: 2 }, requirement: { highest: "willpower" } },
    bard: { name: "Bard", tier: 2, starting: true, attackRange: 2, actions: [physicalAttack("rapierStrike", 1), magicalAttack("dissonantChord", 2)], statWeights: { willpower: 3, dexterity: 2 } },
    berserker: { name: "Berserker", tier: 3, starting: true, attackRange: 1, actions: [physicalAttack("frenzyStrike", 1)], statWeights: { strength: 4, constitution: 3 }, requirement: { highest: "strength" } },
    elementalist: { name: "Elementalist", tier: 3, starting: true, attackRange: 4, actions: [physicalAttack("staffStrike", 1), magicalAttack("elementalBlast", 2)], statWeights: { intelligence: 4, knowledge: 2 }, requirement: { highest: "intelligence" } },
    cleric: { name: "Cleric", tier: 3, starting: true, attackRange: 3, actions: [physicalAttack("maceStrike", 1), magicalAttack("smite", 2), healing("divineHealing", 2)], statWeights: { willpower: 3, intelligence: 3 }, requirement: { highest: "willpower" } },

    guard: { name: "Guard", tier: 2, attackRange: 1, actions: [physicalAttack("shieldBash", 1)], statWeights: {}, requirement: { highest: "resistance" } },
    brawler: { name: "Brawler", tier: 2, attackRange: 1, actions: [physicalAttack("haymaker", 1)], statWeights: {}, requirement: { highest: "constitution" } },
    scholar: { name: "Scholar", tier: 2, attackRange: 3, actions: [physicalAttack("bookSmack", 1), magicalAttack("arcaneSpark", 2)], statWeights: {}, requirement: { highest: "knowledge" } },
    scout: { name: "Scout", tier: 2, attackRange: 3, actions: [physicalAttack("knifeThrow", 1)], statWeights: {}, requirement: { highest: "dexterity" } },
    tracker: { name: "Tracker", tier: 2, attackRange: 4, actions: [physicalAttack("aimedShot", 1)], statWeights: {}, requirement: { highest: "perception" } },
    mercenary: { name: "Mercenary", tier: 2, attackRange: 1, actions: [physicalAttack("bladeStrike", 1)], statWeights: {}, requirement: { highest: "strength", minimums: { dexterity: 5 } } },
    shieldbearer: { name: "Shieldbearer", tier: 2, attackRange: 1, actions: [physicalAttack("shieldSlam", 1)], statWeights: {}, requirement: { highest: "resistance", minimums: { constitution: 6 } } },
    warden: { name: "Warden", tier: 2, attackRange: 1, actions: [physicalAttack("wardenStrike", 1)], statWeights: {}, requirement: { highest: "constitution", minimums: { resistance: 5 } } },
    exorcist: { name: "Exorcist", tier: 2, attackRange: 3, actions: [physicalAttack("staffStrike", 1), magicalAttack("banish", 2)], statWeights: {}, requirement: { highest: "willpower", minimums: { intelligence: 5 } } },
    alchemist: { name: "Alchemist", tier: 2, attackRange: 3, actions: [physicalAttack("flaskThrow", 1), magicalAttack("acidSplash", 2)], statWeights: {}, requirement: { highest: "knowledge", minimums: { dexterity: 5 } } },
    mageblade: { name: "Mageblade", tier: 2, attackRange: 2, actions: [physicalAttack("arcaneSlash", 1), magicalAttack("spellStrike", 2)], statWeights: {}, requirement: { highest: "intelligence", minimums: { strength: 6 } } },
    duelist: { name: "Duelist", tier: 2, attackRange: 1, actions: [physicalAttack("riposte", 1)], statWeights: {}, requirement: { highest: "dexterity", minimums: { strength: 5 } } },
    sharpshooter: { name: "Sharpshooter", tier: 2, attackRange: 5, actions: [physicalAttack("piercingShot", 1)], statWeights: {}, requirement: { highest: "perception", minimums: { dexterity: 6 } } },

    skald: { name: "Skald", tier: 3, attackRange: 2, actions: [physicalAttack("axeStrike", 1), magicalAttack("warChant", 2)], statWeights: {}, evolvesFrom: "bard", inspiresAllies: true },
    knight: { name: "Knight", tier: 3, attackRange: 1, actions: [physicalAttack("lanceStrike", 1)], statWeights: {}, requirement: { highest: "resistance" } },
    juggernaut: { name: "Juggernaut", tier: 3, attackRange: 1, actions: [physicalAttack("crush", 1)], statWeights: {}, requirement: { highest: "constitution" } },
    sage: { name: "Sage", tier: 3, attackRange: 4, actions: [physicalAttack("staffStrike", 1), magicalAttack("mindBlast", 2), healing("restore", 2)], statWeights: {}, requirement: { highest: "knowledge" } },
    ranger: { name: "Ranger", tier: 3, attackRange: 4, actions: [physicalAttack("longShot", 1)], statWeights: {}, requirement: { highest: "dexterity" } },
    marksman: { name: "Marksman", tier: 3, attackRange: 5, actions: [physicalAttack("snipe", 1)], statWeights: {}, requirement: { highest: "perception" } },
    warlord: { name: "Warlord", tier: 3, attackRange: 1, actions: [physicalAttack("warStrike", 1)], statWeights: {}, requirement: { highest: "strength", minimums: { willpower: 7 } } },
    paladin: { name: "Paladin", tier: 3, attackRange: 2, actions: [physicalAttack("holyStrike", 1), healing("layOnHands", 2)], statWeights: {}, requirement: { highest: "resistance", minimums: { willpower: 7 } } },
    gladiator: { name: "Gladiator", tier: 3, attackRange: 1, actions: [physicalAttack("gladiusStrike", 1)], statWeights: {}, requirement: { highest: "constitution", minimums: { strength: 7 } } },
    inquisitor: { name: "Inquisitor", tier: 3, attackRange: 2, actions: [physicalAttack("maceStrike", 1), magicalAttack("judgment", 2)], statWeights: {}, requirement: { highest: "willpower", minimums: { strength: 7 } } },
    runesmith: { name: "Runesmith", tier: 3, attackRange: 2, actions: [physicalAttack("runeHammer", 1), magicalAttack("runeBlast", 2)], statWeights: {}, requirement: { highest: "knowledge", minimums: { strength: 6 } } },
    spellblade: { name: "Spellblade", tier: 3, attackRange: 2, actions: [physicalAttack("spellSlash", 1), magicalAttack("arcaneBurst", 2)], statWeights: {}, requirement: { highest: "intelligence", minimums: { dexterity: 7 } } },
    assassin: { name: "Assassin", tier: 3, attackRange: 1, actions: [physicalAttack("backstab", 1)], statWeights: {}, requirement: { highest: "dexterity", minimums: { perception: 7 } } },
    beastmaster: { name: "Beastmaster", tier: 3, attackRange: 3, actions: [physicalAttack("beastClaw", 1)], statWeights: {}, requirement: { highest: "perception", minimums: { willpower: 6 } } },

    ravager: { name: "Ravager", tier: 4, attackRange: 1, actions: [physicalAttack("ravage", 1)], statWeights: {}, evolvesFrom: "berserker", requiredItem: "bloodTotem" },
    archmage: { name: "Archmage", tier: 4, attackRange: 5, actions: [physicalAttack("staffStrike", 1), magicalAttack("meteor", 2)], statWeights: {}, evolvesFrom: "elementalist", requiredItem: "elementalCore" },
    saint: { name: "Saint", tier: 4, attackRange: 4, actions: [physicalAttack("maceStrike", 1), magicalAttack("smite", 2), healing("divineHealing", 2)], statWeights: {}, evolvesFrom: "cleric", requiredItem: "holyRelic" },
}

export const rarityTier: Record<Rarity, number> = {
    common: 1,
    rare: 2,
    legendary: 3,
}

export const classChangeLevel = 4
export const commonTierCap = 3

export const maxClassChanges = 1

export function canChangeClass(character: Character) {
    return character.level >= classChangeLevel
        && character.classChanges.length < maxClassChanges
        && character.championsDefeated.some(chapter => !character.classChanges.includes(chapter))
}

export function classChangeOffers(character: Character, inventory: string[]) {
    const current = character.characterClass ? characterClasses[character.characterClass] : undefined
    if (!current)
        return []
    const keys = Object.keys(characterClasses)
    if (character.rarity === "legendary")
        return keys.filter(key => {
            const characterClass = characterClasses[key]
            return characterClass.evolvesFrom === character.characterClass && (!characterClass.requiredItem || inventory.includes(characterClass.requiredItem))
        })
    const tier = current.tier + 1
    if (tier > commonTierCap)
        return []
    const highest = Math.max(...Object.values(character.stats))
    const eligible = keys.filter(key => {
        const requirement = characterClasses[key].requirement
        return characterClasses[key].tier === tier && !!requirement
            && character.stats[requirement.highest] === highest
            && Object.entries(requirement.minimums ?? {}).every(([stat, value]) => character.stats[stat as keyof Stats] >= value)
    })
    const path = keys.filter(key => characterClasses[key].tier === tier && characterClasses[key].evolvesFrom === character.characterClass && !characterClasses[key].requiredItem)
    const hard = eligible.filter(key => characterClasses[key].requirement?.minimums)
    const easy = eligible.filter(key => !characterClasses[key].requirement?.minimums)
    return [...path, ...hard.slice(0, 2), ...easy].slice(0, 3)
}

export function applyClassChange(character: Character, classKey: string, inventory: string[]) {
    const chapter = character.championsDefeated.find(chapter => !character.classChanges.includes(chapter))
    const requiredItem = characterClasses[classKey].requiredItem
    if (!chapter || (requiredItem && !inventory.includes(requiredItem)))
        return false
    if (requiredItem)
        inventory.splice(inventory.indexOf(requiredItem), 1)
    character.characterClass = classKey
    character.classChanges.push(chapter)
    return true
}

export const talentChance = 0.25
export const talentWeight = 4

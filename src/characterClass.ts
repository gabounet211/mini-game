import { Action, areaAction, cure, effect, healing, hybridAttack, magicalAttack, moveAction, physicalAttack, statusAction, willpowerBoost, willpowerDrain } from "./action"
import { Rarity, Stats, StatWeights } from "./stats"
import { Character } from "./character"

export interface CharacterClass {
    name: string,
    tier: number,
    actions: Action[],
    statWeights: StatWeights,
    starting?: boolean,
    minimums?: Partial<Stats>,
    evolvesFrom?: string,
    requiredItem?: string,
    inspiresAllies?: boolean,
}

export const characterClasses: Record<string, CharacterClass> = {
    farmer: { name: "Farmer", tier: 1, starting: true, actions: [physicalAttack("pitchforkStrike", 1, 1)], statWeights: { constitution: 3, resistance: 2 } },
    lumberjack: { name: "Lumberjack", tier: 1, starting: true, actions: [physicalAttack("axeChop", 1, 1)], statWeights: { strength: 3, constitution: 2 } },
    hunter: { name: "Hunter", tier: 1, starting: true, actions: [physicalAttack("slingShot", 1, 3)], statWeights: { dexterity: 3, perception: 2 } },
    soldier: { name: "Soldier", tier: 2, starting: true, actions: [physicalAttack("swordStrike", 1, 1), physicalAttack("pummelStrike", 3, 1, { cooldown: 2 }, effect("stun", 1)), statusAction("guardUp", 2, 0, {}, "self", effect("resistanceUp", 1, 2))], statWeights: { strength: 3, resistance: 3 }, minimums: { strength: 5, resistance: 4 } },
    apprentice: { name: "Apprentice", tier: 2, starting: true, actions: [physicalAttack("staffStrike", 1, 1), magicalAttack("arcaneBolt", 2, 3, { concentration: 1 }), magicalAttack("arcaneFire", 2, 3, { concentration: 2 }, effect("burn", 2))], statWeights: { intelligence: 3, knowledge: 3 }, minimums: { intelligence: 5, knowledge: 4 } },
    healer: { name: "Healer", tier: 3, starting: true, actions: [physicalAttack("staffStrike", 1, 1), magicalAttack("lightRay", 2, 2, { concentration: 1 }), healing("healingTouch", 2, 2, { concentration: 2 }), cure("cureTouch", 2, 2, { concentration: 2 })], statWeights: { willpower: 3, intelligence: 2 }, minimums: { willpower: 6, intelligence: 5 } },
    bard: { name: "Bard", tier: 2, starting: true, actions: [physicalAttack("rapierStrike", 1, 1), willpowerDrain("dissonantChord", 2, 2, { concentration: 2 }), willpowerBoost("inspireChord", 2, 2, { concentration: 2 })], statWeights: { willpower: 3, dexterity: 2 }, minimums: { willpower: 5, dexterity: 4 } },
    berserker: { name: "Berserker", tier: 4, starting: true, actions: [physicalAttack("frenzyStrike", 1, 1)], statWeights: { strength: 4, constitution: 3 }, minimums: { strength: 8, constitution: 6 } },
    elementalist: { name: "Elementalist", tier: 4, starting: true, actions: [physicalAttack("staffStrike", 1, 4), magicalAttack("elementalBlast", 2, 4)], statWeights: { intelligence: 4, knowledge: 2 }, minimums: { intelligence: 8, willpower: 6 } },
    cleric: { name: "Cleric", tier: 4, starting: true, actions: [physicalAttack("maceStrike", 1, 3), magicalAttack("smite", 2, 3), healing("divineHealing", 2, 3)], statWeights: { willpower: 3, intelligence: 3 }, minimums: { willpower: 8, knowledge: 6 } },

    guard: { name: "Guard", tier: 3, starting: true, actions: [physicalAttack("shieldBash", 2, 1, { cooldown: 1 }, effect("stun", 1)), physicalAttack("swordStrike", 1, 1)], statWeights: { resistance: 3, constitution: 2 }, minimums: { resistance: 6, constitution: 5 } },
    brawler: { name: "Brawler", tier: 3, starting: true, actions: [physicalAttack("haymaker", 1, 1), physicalAttack("fistFight", 1, 1), moveAction("knockBack", 2, 1, {}, { kind: "push", cells: 2, damage: true }), moveAction("fistCharge", 2, 3, {}, { kind: "dash", line: true, damage: true })], statWeights: { constitution: 3, strength: 2 }, minimums: { constitution: 6, strength: 5 } },
    scholar: { name: "Scholar", tier: 3, starting: true, actions: [physicalAttack("bookSmack", 1, 1), magicalAttack("arcaneSpark", 2, 3, { concentration: 2 }), statusAction("enchant", 3, 3, { concentration: 3 }, "ally", effect("damageUp", 2, 1)), areaAction("slow", 2, 4, { concentration: 3 }, { shape: { kind: "radius", size: 2 }, effect: effect("slow", 1, 1) })], statWeights: { knowledge: 3, intelligence: 2 }, minimums: { knowledge: 6, intelligence: 5 } },
    scout: { name: "Scout", tier: 2, starting: true, actions: [physicalAttack("knifeThrow", 1, 3), physicalAttack("knifeStrike", 1, 1), moveAction("jump", 2, 1, {}, { kind: "jump", targets: "any" })], statWeights: { dexterity: 3, perception: 2 }, minimums: { dexterity: 5, constitution: 4 } },
    tracker: { name: "Tracker", tier: 2, starting: true, actions: [physicalAttack("aimedShot", 1, 4), physicalAttack("knifeStrike", 1, 1), physicalAttack("legShot", 2, 4, {}, effect("slow", 1, 1))], statWeights: { perception: 3, dexterity: 2 }, minimums: { perception: 5, dexterity: 4 } },
    mercenary: { name: "Mercenary", tier: 3, actions: [physicalAttack("bladeStrike", 1, 1), physicalAttack("gunShot", 2, 3), areaAction("bulletShower", 3, 3, { cooldown: 2 }, { shape: { kind: "square", size: 2 }, damage: "physical", friendlyFire: true })], statWeights: {}, minimums: { strength: 7, dexterity: 5, constitution: 4 } },
    shieldbearer: { name: "Shieldbearer", tier: 3, actions: [physicalAttack("shieldSlam", 1, 1), moveAction("shieldDash", 3, 3, { cooldown: 3 }, { kind: "dash", line: true, damage: true, effect: effect("stun", 1) }), statusAction("shieldUp", 2, 0, { cooldown: 2 }, "self", effect("resistanceUp", 1, 3))], statWeights: {}, minimums: { resistance: 7, constitution: 6, strength: 4 } },
    warden: { name: "Warden", tier: 3, actions: [physicalAttack("wardenStrike", 1, 1), statusAction("wardenHindrance", 2, 1, { concentration: 2, cooldown: 2 }, "enemy", effect("root", 1)), moveAction("wardenPush", 2, 1, { concentration: 2, cooldown: 2 }, { kind: "push", cells: 1 })], statWeights: {}, minimums: { constitution: 7, resistance: 5, perception: 4 } },
    exorcist: { name: "Exorcist", tier: 3, actions: [physicalAttack("staffStrike", 1, 1), magicalAttack("banish", 2, 3, { concentration: 1 }), magicalAttack("holyFire", 2, 3, { concentration: 2, cooldown: 3 }, effect("burn", 2)), statusAction("holyChain", 2, 3, { concentration: 2, cooldown: 3 }, "enemy", effect("root", 1))], statWeights: {}, minimums: { willpower: 7, intelligence: 5, knowledge: 4 } },
    alchemist: { name: "Alchemist", tier: 3, actions: [physicalAttack("flaskThrow", 1, 3), magicalAttack("acidSplash", 2, 3, { concentration: 2, cooldown: 2 }), magicalAttack("burningSplash", 2, 3, { concentration: 2, cooldown: 3 }, effect("burn", 2)), magicalAttack("poisonSplash", 2, 3, { concentration: 2, cooldown: 2 }, effect("poison", 2))], statWeights: {}, minimums: { knowledge: 7, dexterity: 5, intelligence: 4 } },
    mageblade: { name: "Mageblade", tier: 3, actions: [physicalAttack("arcaneSlash", 1, 1), hybridAttack("spellStrike", 2, 1, { concentration: 1 }), moveAction("windPull", 2, 3, { concentration: 2, cooldown: 3 }, { kind: "pull", line: true }), moveAction("windDash", 2, 3, { concentration: 2, cooldown: 3 }, { kind: "dash" })], statWeights: {}, minimums: { intelligence: 7, strength: 6, dexterity: 4 } },
    duelist: { name: "Duelist", tier: 3, actions: [physicalAttack("rapierSwing", 1, 1), statusAction("rapierCounter", 2, 0, { cooldown: 2 }, "self", effect("immune", 1)), areaAction("rapierSweep", 3, 1, {}, { shape: { kind: "sweep" }, damage: "physical" })], statWeights: {}, minimums: { dexterity: 7, strength: 5, perception: 4 } },
    sharpshooter: { name: "Sharpshooter", tier: 3, actions: [physicalAttack("piercingShot", 1, 5), physicalAttack("legShot", 2, 4, { cooldown: 2 }, effect("slow", 1, 1)), moveAction("repositionningShot", 2, 3, { cooldown: 2 }, { kind: "retreat", cells: 2, damage: true })], statWeights: {}, minimums: { perception: 7, dexterity: 6, strength: 4 } },

    skald: { name: "Skald", tier: 3, actions: [physicalAttack("axeStrike", 1, 1), willpowerBoost("warChant", 2, 2, { concentration: 2, cooldown: 2 }), willpowerDrain("dissonantChant", 2, 2, { concentration: 2 })], statWeights: {}, evolvesFrom: "bard", inspiresAllies: true },
    knight: { name: "Knight", tier: 4, actions: [physicalAttack("lanceStrike", 1, 1)], statWeights: {}, minimums: { resistance: 8, strength: 6 } },
    juggernaut: { name: "Juggernaut", tier: 4, actions: [physicalAttack("crush", 1, 1)], statWeights: {}, minimums: { constitution: 8, resistance: 6 } },
    sage: { name: "Sage", tier: 4, actions: [physicalAttack("staffStrike", 1, 4), magicalAttack("mindBlast", 2, 4), healing("restore", 2, 4)], statWeights: {}, minimums: { knowledge: 8, intelligence: 6 } },
    ranger: { name: "Ranger", tier: 4, actions: [physicalAttack("longShot", 1, 4)], statWeights: {}, minimums: { dexterity: 8, perception: 6 } },
    marksman: { name: "Marksman", tier: 4, actions: [physicalAttack("snipe", 1, 5)], statWeights: {}, minimums: { perception: 8, dexterity: 6 } },
    warlord: { name: "Warlord", tier: 4, actions: [physicalAttack("warStrike", 1, 1)], statWeights: {}, minimums: { strength: 9, willpower: 7, constitution: 5 } },
    paladin: { name: "Paladin", tier: 4, actions: [physicalAttack("holyStrike", 1, 2), healing("layOnHands", 2, 2)], statWeights: {}, minimums: { resistance: 8, willpower: 7, constitution: 5, strength: 5 } },
    gladiator: { name: "Gladiator", tier: 4, actions: [physicalAttack("gladiusStrike", 1, 1)], statWeights: {}, minimums: { constitution: 9, strength: 7, dexterity: 5 } },
    inquisitor: { name: "Inquisitor", tier: 4, actions: [physicalAttack("maceStrike", 1, 2), magicalAttack("judgment", 2, 2)], statWeights: {}, minimums: { willpower: 9, strength: 7, intelligence: 5 } },
    runesmith: { name: "Runesmith", tier: 4, actions: [physicalAttack("runeHammer", 1, 2), magicalAttack("runeBlast", 2, 2)], statWeights: {}, minimums: { knowledge: 9, strength: 6, intelligence: 6 } },
    spellblade: { name: "Spellblade", tier: 4, actions: [physicalAttack("spellSlash", 1, 2), magicalAttack("arcaneBurst", 2, 2)], statWeights: {}, minimums: { intelligence: 9, dexterity: 7, strength: 5 } },
    assassin: { name: "Assassin", tier: 4, actions: [physicalAttack("backstab", 1, 1)], statWeights: {}, minimums: { dexterity: 9, perception: 7, strength: 5 } },
    beastmaster: { name: "Beastmaster", tier: 4, actions: [physicalAttack("beastClaw", 1, 3)], statWeights: {}, minimums: { perception: 8, willpower: 7, constitution: 5, dexterity: 5 } },

    ravager: { name: "Ravager", tier: 5, actions: [physicalAttack("ravage", 1, 1)], statWeights: {}, evolvesFrom: "berserker", requiredItem: "bloodTotem" },
    archmage: { name: "Archmage", tier: 5, actions: [physicalAttack("staffStrike", 1, 5), magicalAttack("meteor", 2, 5)], statWeights: {}, evolvesFrom: "elementalist", requiredItem: "elementalCore" },
    saint: { name: "Saint", tier: 5, actions: [physicalAttack("maceStrike", 1, 4), magicalAttack("smite", 2, 4), healing("divineHealing", 2, 4)], statWeights: {}, evolvesFrom: "cleric", requiredItem: "holyRelic" },
}

export const rarityTier: Record<Rarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    legendary: 4,
}

export const rarityTierCap: Record<Rarity, number> = {
    common: 3,
    uncommon: 4,
    rare: 4,
    legendary: 5,
}

export const classChangeLevel = 4

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
    if (tier > rarityTierCap[character.rarity])
        return []
    const path = keys.filter(key => characterClasses[key].tier === tier && characterClasses[key].evolvesFrom === character.characterClass && !characterClasses[key].requiredItem)
    const eligible = keys.filter(key => characterClasses[key].tier === tier && characterClasses[key].minimums && missingStats(character, key).length === 0)
    return [...new Set([...path, ...eligible])]
}

export function missingStats(character: Character, classKey: string) {
    return Object.entries(characterClasses[classKey].minimums ?? {})
        .filter(([stat, value]) => character.stats[stat as keyof Stats] < value)
        .map(([stat, value]) => [stat, value - character.stats[stat as keyof Stats]] as [keyof Stats, number])
}

export function closestClasses(character: Character, count = 3) {
    const current = character.characterClass ? characterClasses[character.characterClass] : undefined
    if (!current || character.rarity === "legendary" || current.tier + 1 > rarityTierCap[character.rarity])
        return []
    const missing = (key: string) => missingStats(character, key).reduce((sum, [, value]) => sum + value, 0)
    return Object.keys(characterClasses)
        .filter(key => characterClasses[key].tier === current.tier + 1 && characterClasses[key].minimums)
        .sort((a, b) => missing(a) - missing(b))
        .slice(0, count)
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

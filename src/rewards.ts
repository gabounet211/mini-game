import { Character } from "./character"
import { characterClasses } from "./characterClass"
import { Piece } from "./piece"
import { loadSave, SaveData, writeSave } from "./save"
import { addMastery, formatSkillName, skillPointsPerLevel } from "./skill"
import { randomItem, itemName, itemSlots } from "./items"
import { levels } from "./gltf"
import { applyHarvest } from "./base"
import { applyResearch } from "./research"

export const killExperience = 6
export const victoryExperience = 3
export const championExperience = 10
export const statPointsPerLevel = 2
export const summonRewardChance = 0.25
export const lootChance = 0.5
export const sacrificeExperience = 5
export const injuryCombats = 1

export const freeLevelGap = 1
export const reductionPerLevel = 0.25
export const minimumExperienceShare = 0.1

export function experienceShare(heroLevel: number, recommendedLevel?: number) {
    if (recommendedLevel === undefined)
        return 1
    const gap = heroLevel - recommendedLevel - freeLevelGap
    return gap <= 0 ? 1 : Math.max(minimumExperienceShare, 1 - gap * reductionPerLevel)
}

export function characterName(character: Character) {
    return character.characterClass ? characterClasses[character.characterClass].name : character.entity
}

export function isDeadly(levelKey: string) {
    return !levels.getLevel(levelKey).introduction
}

export function applyCasualties(save: SaveData, heroes: Piece[], levelKey: string) {
    const lines: string[] = []
    const fighting = new Set(heroes.map(hero => hero.character.id))
    for (const character of save.roster)
        if (character.injured && !fighting.has(character.id))
            character.injured--
    for (const hero of heroes) {
        const character = save.roster.find(candidate => candidate.id === hero.character.id)
        if (!character || hero.healt > 0)
            continue
        if (!isDeadly(levelKey)) {
            character.injured = injuryCombats
            lines.push(characterName(character) + ' is injured and will miss the next combat.')
            continue
        }
        for (const slot of itemSlots) {
            const item = character.equipment[slot]
            if (item)
                save.inventory.push(item)
        }
        save.roster.splice(save.roster.indexOf(character), 1)
        save.lastTeam = save.lastTeam.filter(id => id !== character.id)
        save.memorial.push({ name: characterName(character), level: character.level, levelTitle: levels.getLevel(levelKey).title })
        lines.push(characterName(character) + ' has fallen. Their equipment returns to the inventory.')
    }
    if (save.roster.length && save.roster.every(character => character.injured)) {
        for (const character of save.roster)
            character.injured = 0
        lines.push('With no one left standing, the whole team rests and recovers.')
    }
    return lines
}

export function experienceToNextLevel(level: number) {
    return 10 * level
}

export function addExperience(character: Character, amount: number) {
    let levelsGained = 0
    character.experience += amount
    while (character.experience >= experienceToNextLevel(character.level)) {
        character.experience -= experienceToNextLevel(character.level)
        character.level++
        character.statPoints += statPointsPerLevel
        character.skillPoints += skillPointsPerLevel
        levelsGained++
    }
    return levelsGained
}

export function totalExperience(character: Character) {
    let total = character.experience
    for (let level = 1; level < character.level; level++)
        total += experienceToNextLevel(level)
    return total
}

export function sacrificeValue(character: Character) {
    return totalExperience(character) + sacrificeExperience
}

export function transferExperience(save: SaveData, from: Character, to: Character) {
    if (from === to || !save.roster.includes(from) || !save.roster.includes(to))
        return 0
    for (const slot of itemSlots) {
        const item = from.equipment[slot]
        if (item)
            save.inventory.push(item)
    }
    save.roster.splice(save.roster.indexOf(from), 1)
    return addExperience(to, sacrificeValue(from))
}

function recordFinale(character: Character, levelKey: string, won: boolean) {
    const level = levels.getLevel(levelKey)
    if (!level.finale)
        return
    character.finaleAttempts.push(level.chapter)
    if (won)
        character.championsDefeated.push(level.chapter)
}

export function applyMastery(save: SaveData, heroes: Piece[]) {
    const lines: string[] = []
    for (const hero of heroes) {
        const character = save.roster.find(candidate => candidate.id === hero.character.id)
        if (!character)
            continue
        for (const [name, uses] of Object.entries(hero.skillUses))
            if (addMastery(character, name, uses))
                lines.push(characterName(character) + ': ' + formatSkillName(name) + ' reached rank ' + character.skills[name].rank + '!')
    }
    return lines
}

export function grantDefeatResults(heroes: Piece[], levelKey: string) {
    const save = loadSave()
    const lines = [...applyHarvest(save, heroes.map(hero => hero.character.id)), ...applyResearch(save, heroes.map(hero => hero.character.id)), ...applyCasualties(save, heroes, levelKey), ...applyMastery(save, heroes)]
    for (const hero of heroes) {
        const character = save.roster.find(candidate => candidate.id === hero.character.id)
        if (character)
            recordFinale(character, levelKey, false)
    }
    writeSave(save)
    return lines
}

export function grantVictoryRewards(heroes: Piece[], levelKey: string) {
    const save = loadSave()
    const lines = [...applyHarvest(save, heroes.map(hero => hero.character.id)), ...applyResearch(save, heroes.map(hero => hero.character.id)), ...applyCasualties(save, heroes, levelKey), ...applyMastery(save, heroes)]
    const keys = levels.keys()
    const nextUnlocked = Math.min(keys.length, keys.indexOf(levelKey) + 2)
    if (nextUnlocked > save.unlockedLevels) {
        save.unlockedLevels = nextUnlocked
        lines.push('New level unlocked: ' + levels.getLevel(keys[nextUnlocked - 1]).title)
    }
    for (const hero of heroes) {
        const character = save.roster.find(candidate => candidate.id === hero.character.id)
        if (!character)
            continue
        recordFinale(character, levelKey, true)
        const classItem = Object.values(characterClasses).find(characterClass => characterClass.evolvesFrom === character.characterClass)?.requiredItem
        if (levels.getLevel(levelKey).finale && character.rarity === "legendary" && classItem) {
            save.inventory.push(classItem)
            lines.push('The champion dropped: ' + itemName(classItem))
        }
        const fullAmount = victoryExperience + hero.kills * killExperience + (levels.getLevel(levelKey).finale ? championExperience : 0)
        const share = experienceShare(character.level, levels.getLevel(levelKey).recommendedLevel)
        const amount = Math.max(1, Math.round(fullAmount * share))
        const levelsGained = addExperience(character, amount)
        lines.push(characterName(character) + ': +' + amount + ' XP' + (share < 1 ? ' (reduced: level too high)' : '') + (levelsGained ? ' - Level up! (Level ' + character.level + ')' : ''))
    }
    if (Math.random() < summonRewardChance) {
        save.summons++
        lines.push('You found a summon token!')
    }
    if (Math.random() < lootChance) {
        const item = randomItem()
        save.inventory.push(item)
        lines.push('You found: ' + itemName(item))
    }
    writeSave(save)
    return lines
}

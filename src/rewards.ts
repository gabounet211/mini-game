import { Character } from "./character"
import { characterClasses } from "./characterClass"
import { Piece } from "./piece"
import { loadSave, writeSave } from "./save"
import { items, randomItem, itemName } from "./items"
import { levels } from "./gltf"

export const killExperience = 6
export const victoryExperience = 3
export const championExperience = 10
export const statPointsPerLevel = 2
export const summonRewardChance = 0.25
export const lootChance = 0.5

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
        levelsGained++
    }
    return levelsGained
}

function recordFinale(character: Character, levelKey: string, won: boolean) {
    const level = levels.getLevel(levelKey)
    if (!level.finale)
        return
    character.finaleAttempts.push(level.chapter)
    if (won)
        character.championsDefeated.push(level.chapter)
}

export function grantDefeatResults(heroes: Piece[], levelKey: string) {
    const save = loadSave()
    for (const hero of heroes) {
        const character = save.roster.find(candidate => candidate.id === hero.character.id)
        if (character)
            recordFinale(character, levelKey, false)
    }
    writeSave(save)
}

export function grantVictoryRewards(heroes: Piece[], levelKey: string) {
    const save = loadSave()
    const lines: string[] = []
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
        const amount = victoryExperience + hero.kills * killExperience + (levels.getLevel(levelKey).finale ? championExperience : 0)
        const levelsGained = addExperience(character, amount)
        const name = character.characterClass ? characterClasses[character.characterClass].name : character.entity
        lines.push(name + ': +' + amount + ' XP' + (levelsGained ? ' - Level up! (Level ' + character.level + ')' : ''))
    }
    if (Math.random() < summonRewardChance) {
        save.summons++
        lines.push('You found a summon token!')
    }
    if (Math.random() < lootChance) {
        const item = randomItem()
        save.inventory.push(item)
        lines.push('You found: ' + items[item].name)
    }
    writeSave(save)
    return lines
}

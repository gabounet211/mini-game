import { Character } from "./character"
import { characterClasses } from "./characterClass"
import { Piece } from "./piece"
import { loadSave, writeSave } from "./save"

export const killExperience = 6
export const victoryExperience = 3
export const statPointsPerLevel = 2
export const summonRewardChance = 0.25

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

export function grantVictoryRewards(heroes: Piece[]) {
    const save = loadSave()
    const lines: string[] = []
    for (const hero of heroes) {
        const character = save.roster.find(candidate => candidate.id === hero.character.id)
        if (!character)
            continue
        const amount = victoryExperience + hero.kills * killExperience
        const levelsGained = addExperience(character, amount)
        const name = character.characterClass ? characterClasses[character.characterClass].name : character.entity
        lines.push(name + ': +' + amount + ' XP' + (levelsGained ? ' - Level up! (Level ' + character.level + ')' : ''))
    }
    if (Math.random() < summonRewardChance) {
        save.summons++
        lines.push('You found a summon token!')
    }
    writeSave(save)
    return lines
}

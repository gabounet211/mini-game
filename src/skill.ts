import { Action } from "./action"
import type { Character } from "./character"
import { characterClasses } from "./characterClass"

export interface KnownSkill {
    rank: number
    from: string
    mastery?: number
}

export const maxSkillRank = 3
export const skillPointsPerLevel = 1
export const learnCost = 1
export const masteryToRank: Record<number, number> = { 2: 10, 3: 25 }
const formerRankCosts: Record<number, number> = { 2: 1, 3: 2 }
const slotsByTier: Record<number, number> = { 1: 2, 2: 3, 3: 4, 4: 5, 5: 5 }

function newSkill(from: string): KnownSkill {
    return { rank: 1, from, mastery: 0 }
}

export function formatSkillName(name: string) {
    const words = name.replace(/([A-Z])/g, ' $1').trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
}

function classActions(classKey?: string) {
    return classKey ? characterClasses[classKey]?.actions ?? [] : []
}

export function skillSlots(character: Character) {
    const tier = character.characterClass ? characterClasses[character.characterClass]?.tier ?? 1 : 1
    return slotsByTier[tier] ?? 5
}

export function initSkills(character: Character, skillPoints = 0) {
    character.skills = {}
    character.equippedSkills = []
    character.skillPoints = skillPoints
    for (const action of classActions(character.characterClass).slice(0, 2)) {
        character.skills[action.name] = newSkill(character.characterClass!)
        character.equippedSkills.push(action.name)
    }
}

export function skillAction(character: Character, name: string) {
    const known = character.skills[name]
    const action = known && classActions(known.from).find(action => action.name === name)
    return action && rankedAction(action, known.rank)
}

export function rankedAction(action: Action, rank: number): Action {
    if (rank <= 1)
        return action
    const specific = action.ranks?.[Math.min(rank, maxSkillRank) - 2]
    if (specific)
        return specific
    return {
        ...action,
        bonusDamage: (action.bonusDamage ?? 0) + rank - 1,
        cooldown: rank >= 3 && action.cooldown ? action.cooldown - 1 : action.cooldown,
    }
}

export function equippedActions(character: Character) {
    return character.equippedSkills
        .map(name => skillAction(character, name))
        .filter((action): action is Action => !!action)
}

export function learnableSkills(character: Character) {
    return classActions(character.characterClass).filter(action => !character.skills[action.name])
}

export function learnSkill(character: Character, name: string) {
    if (character.skillPoints < learnCost || !learnableSkills(character).some(action => action.name === name))
        return false
    character.skillPoints -= learnCost
    character.skills[name] = newSkill(character.characterClass!)
    if (character.equippedSkills.length < skillSlots(character))
        character.equippedSkills.push(name)
    return true
}

export function masteryNeeded(known: KnownSkill) {
    return known.rank < maxSkillRank ? masteryToRank[known.rank + 1] : undefined
}

export function addMastery(character: Character, name: string, uses: number) {
    const known = character.skills[name]
    if (!known)
        return 0
    let ranksGained = 0
    known.mastery = (known.mastery ?? 0) + uses
    for (let needed = masteryNeeded(known); needed !== undefined && known.mastery >= needed; needed = masteryNeeded(known)) {
        known.mastery -= needed
        known.rank++
        ranksGained++
    }
    if (known.rank >= maxSkillRank)
        known.mastery = 0
    return ranksGained
}

export function migrateMastery(character: Character) {
    for (const known of Object.values(character.skills)) {
        if (known.mastery !== undefined)
            continue
        for (let rank = 2; rank <= known.rank; rank++)
            character.skillPoints += formerRankCosts[rank]
        known.mastery = 0
    }
}

export function toggleEquipped(character: Character, name: string) {
    if (character.equippedSkills.includes(name)) {
        if (character.equippedSkills.length > 1)
            character.equippedSkills = character.equippedSkills.filter(other => other !== name)
    } else if (character.skills[name] && character.equippedSkills.length < skillSlots(character)) {
        character.equippedSkills.push(name)
    }
}

export function pruneSkills(character: Character) {
    for (const [name, known] of Object.entries(character.skills)) {
        if (classActions(known.from).some(action => action.name === name))
            continue
        character.skillPoints += learnCost
        delete character.skills[name]
    }
    character.equippedSkills = character.equippedSkills.filter(name => character.skills[name])
    const basic = classActions(character.characterClass)[0]?.name
    if (!character.equippedSkills.length && basic && character.skills[basic])
        character.equippedSkills.push(basic)
}

export function upgradeSkillsForClass(character: Character, previousClass?: string) {
    const actions = classActions(character.characterClass)
    for (const action of actions)
        if (character.skills[action.name])
            character.skills[action.name].from = character.characterClass!
    const basic = actions[0]
    if (!basic || character.skills[basic.name])
        return
    character.skills[basic.name] = newSkill(character.characterClass!)
    const oldBasic = classActions(previousClass)[0]?.name
    const index = oldBasic ? character.equippedSkills.indexOf(oldBasic) : -1
    if (index >= 0)
        character.equippedSkills[index] = basic.name
    else if (character.equippedSkills.length < skillSlots(character))
        character.equippedSkills.push(basic.name)
}

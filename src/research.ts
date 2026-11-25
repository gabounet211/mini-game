import { Character, rarityChances } from "./character"
import { canAfford, Cost, pay } from "./forge"
import { SaveData } from "./save"
import { Rarity } from "./stats"

export interface ResearchProject {
    name: string,
    description: string,
    points: number,
    cost: Cost,
}

export const researchProjects: Record<string, ResearchProject> = {
    largerSquad: { name: "Larger Squad", description: "+1 hero in the team for every level", points: 8, cost: { food: 10 } },
    summoningRites: { name: "Summoning Rites", description: "Summons: 40% common, 30% uncommon, 20% rare, 10% legendary", points: 10, cost: { food: 8, ore: 4 } },
    advancedSmithing: { name: "Advanced Smithing", description: "The forge can craft Steel Sword, Longbow, Runed Staff, Plate Armor and Silver Amulet", points: 12, cost: { food: 6, ore: 10 } },
}

export const researchPoints = 1
export const scholarBonus = 1
export const scholarClasses = ["scholar", "alchemist", "sage"]
export const improvedSummonChances: Record<Rarity, number> = { common: 0.4, uncommon: 0.3, rare: 0.2, legendary: 0.1 }

export function hasResearch(save: SaveData, key: string) {
    return save.research.done.includes(key)
}

export function researchAmount(character: Character) {
    const amount = researchPoints + (scholarClasses.includes(character.characterClass ?? "") ? scholarBonus : 0)
    return character.injured ? Math.ceil(amount / 2) : amount
}

export function isResearching(save: SaveData, character: Character) {
    return save.researchers.includes(character.id)
}

export function assignResearch(save: SaveData, character: Character, researching: boolean) {
    save.researchers = save.researchers.filter(id => id !== character.id)
    if (researching) {
        delete save.harvest[character.id]
        save.researchers.push(character.id)
    }
}

export function canStartResearch(save: SaveData, key: string) {
    const project = researchProjects[key]
    return !!project && !save.research.current && !hasResearch(save, key) && canAfford(save, project.cost)
}

export function startResearch(save: SaveData, key: string) {
    if (!canStartResearch(save, key))
        return false
    pay(save, researchProjects[key].cost)
    save.research.current = key
    save.research.progress = 0
    return true
}

export function applyResearch(save: SaveData, fightingIds: string[]) {
    save.researchers = save.researchers.filter(id => save.roster.some(character => character.id === id))
    const key = save.research.current
    if (!key)
        return []
    for (const id of save.researchers) {
        const character = save.roster.find(candidate => candidate.id === id)
        if (character && !fightingIds.includes(id))
            save.research.progress += researchAmount(character)
    }
    const project = researchProjects[key]
    if (save.research.progress < project.points)
        return ['Research: ' + project.name + ' ' + save.research.progress + '/' + project.points]
    save.research.done.push(key)
    save.research.current = undefined
    save.research.progress = 0
    return ['Research complete: ' + project.name + '!']
}

export function teamBonus(save: SaveData) {
    return hasResearch(save, "largerSquad") ? 1 : 0
}

export function summonChances(save: SaveData) {
    return hasResearch(save, "summoningRites") ? improvedSummonChances : rarityChances
}

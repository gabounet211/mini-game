import { Character } from "./character"
import { SaveData } from "./save"

export type Resource = "wood" | "food" | "leather" | "ore"

export const resources: Resource[] = ["wood", "food", "leather", "ore"]

export const resourceNames: Record<Resource, string> = {
    wood: "Wood",
    food: "Food",
    leather: "Leather",
    ore: "Ore",
}

export const specialistResources: Record<string, Resource> = {
    lumberjack: "wood",
    farmer: "food",
    hunter: "leather",
}

export const harvestYield = 2
export const specialistBonus = 2

export function emptyResources(): Record<Resource, number> {
    return { wood: 0, food: 0, leather: 0, ore: 0 }
}

export function harvestAmount(character: Character, resource: Resource) {
    const amount = harvestYield + (specialistResources[character.characterClass ?? ""] === resource ? specialistBonus : 0)
    return character.injured ? Math.ceil(amount / 2) : amount
}

export function isHarvesting(save: SaveData, character: Character) {
    return character.id in save.harvest
}

export function assignHarvest(save: SaveData, character: Character, resource?: Resource) {
    if (resource) {
        save.harvest[character.id] = resource
        save.researchers = save.researchers.filter(id => id !== character.id)
    }
    else
        delete save.harvest[character.id]
}

export function applyHarvest(save: SaveData, fightingIds: string[]) {
    const gathered = emptyResources()
    for (const [id, resource] of Object.entries(save.harvest)) {
        const character = save.roster.find(candidate => candidate.id === id)
        if (!character) {
            delete save.harvest[id]
            continue
        }
        if (fightingIds.includes(id))
            continue
        gathered[resource] += harvestAmount(character, resource)
    }
    const lines: string[] = []
    for (const resource of resources) {
        save.resources[resource] += gathered[resource]
        if (gathered[resource])
            lines.push('Harvest: +' + gathered[resource] + ' ' + resourceNames[resource])
    }
    return lines
}

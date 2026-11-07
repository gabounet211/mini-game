import { Rarity, rarityBudget, rollStats, Stats } from "./stats"

export interface Equipment {
    weapon?: string,
    armor?: string,
    jewelry?: string,
}

export interface Character {
    entity: string,
    rarity: Rarity,
    stats: Stats,
    level: number,
    experience: number,
    equipment: Equipment,
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

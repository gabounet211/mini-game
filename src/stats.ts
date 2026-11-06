export interface Stats {
    resistance: number,
    constitution: number,
    willpower: number,
    knowledge: number,
    intelligence: number,
    dexterity: number,
    perception: number,
}

export type Rarity = "common" | "rare" | "legendary"

export const rarityBudget: Record<Rarity, number> = {
    common: 21,
    rare: 28,
    legendary: 35,
}

const statNames: (keyof Stats)[] = ["resistance", "constitution", "willpower", "knowledge", "intelligence", "dexterity", "perception"]

export function rollStats(budget: number, random = Math.random): Stats {
    const stats = Object.fromEntries(statNames.map(name => [name, 1])) as unknown as Stats
    for (let points = statNames.length; points < budget; points++)
        stats[statNames[Math.floor(random() * statNames.length)]]++
    return stats
}

export function deriveAttributes(stats: Stats) {
    return {
        maxHealt: 6 + stats.constitution * 2,
        maxActionPoints: 2 + Math.floor(stats.willpower / 3),
        moveRange: 3 + Math.floor(stats.dexterity / 2),
    }
}

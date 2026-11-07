export interface Stats {
    strength: number,
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
    common: 24,
    rare: 32,
    legendary: 40,
}

export type StatWeights = Partial<Record<keyof Stats, number>>

export const statNames: (keyof Stats)[] = ["strength", "resistance", "constitution", "willpower", "knowledge", "intelligence", "dexterity", "perception"]

export function rollStats(budget: number, weights: StatWeights = {}, random = Math.random): Stats {
    const stats = Object.fromEntries(statNames.map(name => [name, 1])) as unknown as Stats
    const total = statNames.reduce((sum, name) => sum + (weights[name] ?? 1), 0)
    for (let points = statNames.length; points < budget; points++) {
        let roll = random() * total
        const name = statNames.find(name => (roll -= weights[name] ?? 1) < 0) ?? statNames[statNames.length - 1]
        stats[name]++
    }
    return stats
}

export type DamageKind = "physical" | "magic"

export function damageReduction(stats: Stats, kind: DamageKind) {
    return kind === "physical" ? Math.floor(stats.resistance / 3) : 0
}

export function deriveAttributes(stats: Stats) {
    return {
        maxHealt: 6 + stats.constitution * 2,
        maxActionPoints: 2 + Math.floor(stats.willpower / 3),
        moveRange: 3 + Math.floor(stats.dexterity / 2),
    }
}

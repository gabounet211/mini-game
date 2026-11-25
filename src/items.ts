import { Character, Equipment } from "./character"
import { statNames, Stats } from "./stats"

export type ItemSlot = keyof Equipment

export interface Item {
    name: string,
    slot: ItemSlot,
    bonuses: Partial<Stats>,
    advanced?: boolean,
}

export const items: Record<string, Item> = {
    rustySword: { name: "Rusty Sword", slot: "weapon", bonuses: { strength: 2 } },
    huntingBow: { name: "Hunting Bow", slot: "weapon", bonuses: { dexterity: 2, perception: 1 } },
    oakStaff: { name: "Oak Staff", slot: "weapon", bonuses: { intelligence: 2 } },
    leatherArmor: { name: "Leather Armor", slot: "armor", bonuses: { resistance: 2 } },
    chainMail: { name: "Chain Mail", slot: "armor", bonuses: { resistance: 3, constitution: 1 } },
    apprenticeRobe: { name: "Apprentice Robe", slot: "armor", bonuses: { knowledge: 2, willpower: 1 } },
    ringOfVigor: { name: "Ring of Vigor", slot: "jewelry", bonuses: { constitution: 2 } },
    amuletOfFocus: { name: "Amulet of Focus", slot: "jewelry", bonuses: { willpower: 2 } },
    luckyCharm: { name: "Lucky Charm", slot: "jewelry", bonuses: { perception: 2 } },
    steelSword: { name: "Steel Sword", slot: "weapon", bonuses: { strength: 4 }, advanced: true },
    longbow: { name: "Longbow", slot: "weapon", bonuses: { dexterity: 3, perception: 2 }, advanced: true },
    runedStaff: { name: "Runed Staff", slot: "weapon", bonuses: { intelligence: 4, knowledge: 1 }, advanced: true },
    plateArmor: { name: "Plate Armor", slot: "armor", bonuses: { resistance: 5, constitution: 2 }, advanced: true },
    silverAmulet: { name: "Silver Amulet", slot: "jewelry", bonuses: { willpower: 3, knowledge: 1 }, advanced: true },
}

export const classChangeItems: Record<string, { name: string }> = {
    bloodTotem: { name: "Blood Totem" },
    elementalCore: { name: "Elemental Core" },
    holyRelic: { name: "Holy Relic" },
}

export function parseItemKey(key: string) {
    const [base, level] = key.split("+")
    return { base, upgrade: Number(level ?? 0) }
}

export function upgradedKey(base: string, upgrade: number) {
    return upgrade ? base + "+" + upgrade : base
}

export function getItem(key: string): Item | undefined {
    const { base, upgrade } = parseItemKey(key)
    const item = items[base]
    if (!item || !upgrade)
        return item
    const bonuses = Object.fromEntries(Object.entries(item.bonuses).map(([stat, value]) => [stat, value + upgrade]))
    return { ...item, name: item.name + " +" + upgrade, bonuses }
}

export function itemName(key: string) {
    return getItem(key)?.name ?? classChangeItems[key]?.name ?? key
}

export const itemSlots: ItemSlot[] = ["weapon", "armor", "jewelry"]

export function equipmentBonuses(character: Character) {
    const bonuses = Object.fromEntries(statNames.map(name => [name, 0])) as unknown as Stats
    for (const slot of itemSlots) {
        const item = getItem(character.equipment[slot] ?? "")
        for (const [stat, value] of Object.entries(item?.bonuses ?? {}) as [keyof Stats, number][])
            bonuses[stat] += value
    }
    return bonuses
}

export function equippedStats(character: Character): Stats {
    const bonuses = equipmentBonuses(character)
    return Object.fromEntries(statNames.map(name => [name, character.stats[name] + bonuses[name]])) as unknown as Stats
}

export function randomItem(random = Math.random) {
    const keys = Object.keys(items).filter(key => !items[key].advanced)
    return keys[Math.floor(random() * keys.length)]
}

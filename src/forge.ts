import { Resource, resources } from "./base"
import { getItem, items, parseItemKey, upgradedKey } from "./items"
import { SaveData } from "./save"

export type Cost = Partial<Record<Resource, number>>

export const recipes: Record<string, Cost> = {
    rustySword: { ore: 4, wood: 2 },
    huntingBow: { wood: 4, leather: 2 },
    oakStaff: { wood: 5, ore: 1 },
    leatherArmor: { leather: 6 },
    chainMail: { ore: 6, leather: 2 },
    apprenticeRobe: { leather: 4, ore: 1 },
    ringOfVigor: { ore: 4 },
    amuletOfFocus: { ore: 3, wood: 1 },
    luckyCharm: { wood: 2, leather: 2 },
    steelSword: { ore: 8, wood: 2 },
    longbow: { wood: 7, leather: 3 },
    runedStaff: { wood: 6, ore: 3 },
    plateArmor: { ore: 10, leather: 3 },
    silverAmulet: { ore: 7 },
}

export function isRecipeUnlocked(save: SaveData, base: string) {
    return !items[base]?.advanced || save.research.done.includes("advancedSmithing")
}

export const maxUpgrade = 3
export const firstUpgradeCost = 3

function mainResource(base: string) {
    return Object.keys(recipes[base])[0] as Resource
}

function upgradeAmount(upgrade: number) {
    return firstUpgradeCost * 2 ** upgrade
}

export function canAfford(save: SaveData, cost: Cost) {
    return resources.every(resource => save.resources[resource] >= (cost[resource] ?? 0))
}

export function pay(save: SaveData, cost: Cost) {
    for (const resource of resources)
        save.resources[resource] -= cost[resource] ?? 0
}

export function craft(save: SaveData, base: string) {
    const cost = recipes[base]
    if (!cost || !isRecipeUnlocked(save, base) || !canAfford(save, cost))
        return false
    pay(save, cost)
    save.inventory.push(base)
    return true
}

export function upgradeCost(key: string): Cost | undefined {
    const { base, upgrade } = parseItemKey(key)
    if (!items[base] || !recipes[base] || upgrade >= maxUpgrade)
        return undefined
    const cost: Cost = {}
    cost[mainResource(base)] = upgradeAmount(upgrade)
    return cost
}

export function upgrade(save: SaveData, key: string) {
    const index = save.inventory.indexOf(key)
    const cost = upgradeCost(key)
    if (index < 0 || !cost || !canAfford(save, cost))
        return false
    pay(save, cost)
    const { base, upgrade } = parseItemKey(key)
    save.inventory[index] = upgradedKey(base, upgrade + 1)
    return true
}

export function dismantleValue(key: string): Cost | undefined {
    const { base, upgrade } = parseItemKey(key)
    if (!getItem(key) || !recipes[base])
        return undefined
    const value: Cost = {}
    for (const [resource, amount] of Object.entries(recipes[base]) as [Resource, number][])
        value[resource] = Math.floor(amount / 2)
    let spent = 0
    for (let level = 0; level < upgrade; level++)
        spent += upgradeAmount(level)
    const main = mainResource(base)
    value[main] = (value[main] ?? 0) + Math.floor(spent / 2)
    return value
}

export function dismantle(save: SaveData, key: string) {
    const index = save.inventory.indexOf(key)
    const value = dismantleValue(key)
    if (index < 0 || !value)
        return false
    save.inventory.splice(index, 1)
    for (const resource of resources)
        save.resources[resource] += value[resource] ?? 0
    return true
}

import { Character, createHero } from "./character"

const saveKey = "miniGameSave"
const saveVersion = 1
const startingHeroes = 5

export interface SaveData {
    roster: Character[],
    summons: number,
}

export function loadSave(): SaveData {
    try {
        const data = JSON.parse(localStorage.getItem(saveKey) ?? "null")
        if (data?.version === saveVersion && Array.isArray(data.roster))
            return { roster: data.roster, summons: data.summons ?? 0 }
    } catch (error) {
        console.warn("Save could not be loaded", error)
    }
    return { roster: [], summons: 0 }
}

export function loadOrCreateSave(): SaveData {
    const save = loadSave()
    if (!save.roster.length) {
        save.roster = Array.from({ length: startingHeroes }, () => createHero("hero"))
        writeSave(save)
    }
    return save
}

export function writeSave(save: SaveData) {
    try {
        localStorage.setItem(saveKey, JSON.stringify({ version: saveVersion, ...save }))
    } catch (error) {
        console.warn("Save could not be written", error)
    }
}

export function clearSave() {
    try {
        localStorage.removeItem(saveKey)
    } catch (error) {
        console.warn("Save could not be cleared", error)
    }
}

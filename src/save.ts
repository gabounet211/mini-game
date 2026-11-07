import { Character } from "./character"

const saveKey = "miniGameSave"
const saveVersion = 1

interface SaveData {
    version: number,
    roster: Character[],
}

export function loadRoster(): Character[] {
    try {
        const data: SaveData = JSON.parse(localStorage.getItem(saveKey) ?? "null")
        if (data?.version === saveVersion && Array.isArray(data.roster))
            return data.roster
    } catch (error) {
        console.warn("Save could not be loaded", error)
    }
    return []
}

export function saveRoster(roster: Character[]) {
    try {
        const data: SaveData = { version: saveVersion, roster }
        localStorage.setItem(saveKey, JSON.stringify(data))
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

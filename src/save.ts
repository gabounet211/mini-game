import { initSkills, pruneSkills, skillPointsPerLevel } from "./skill"
import { Character, createHero, createId } from "./character"

const saveKey = "miniGameSave"
const saveVersion = 1
const startingHeroes = 5

export interface SaveData {
    roster: Character[],
    summons: number,
    inventory: string[],
    unlockedLevels: number,
    lastTeam: string[],
}

export function loadSave(): SaveData {
    try {
        const data = JSON.parse(localStorage.getItem(saveKey) ?? "null")
        if (data?.version === saveVersion && Array.isArray(data.roster)) {
            const roster: Character[] = data.roster.map((stored: Character) => {
                const character = {
                    ...stored,
                    id: stored.id ?? createId(),
                    statPoints: stored.statPoints ?? 0,
                    finaleAttempts: stored.finaleAttempts ?? [],
                    championsDefeated: stored.championsDefeated ?? [],
                    classChanges: stored.classChanges ?? [],
                }
                if (!character.skills)
                    initSkills(character, (character.level - 1) * skillPointsPerLevel)
                else
                    pruneSkills(character)
                return character
            })
            return { roster, summons: data.summons ?? 0, inventory: data.inventory ?? [], unlockedLevels: data.unlockedLevels ?? 1, lastTeam: data.lastTeam ?? [] }
        }
    } catch (error) {
        console.warn("Save could not be loaded", error)
    }
    return { roster: [], summons: 0, inventory: [], unlockedLevels: 1, lastTeam: [] }
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

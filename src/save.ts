import { initSkills, migrateMastery, pruneSkills, skillPointsPerLevel } from "./skill"
import { Character, createHero, createId } from "./character"

const saveKey = "miniGameSave"
const saveVersion = 1
const levelLayout = 2
const oldChapterLength = 5
const addedChapterOneLevels = 5
const startingHeroes = 5

export interface SaveData {
    roster: Character[],
    summons: number,
    inventory: string[],
    unlockedLevels: number,
    lastTeam: string[],
    memorial: FallenHero[],
}

export interface FallenHero {
    name: string,
    level: number,
    levelTitle: string,
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
                else {
                    migrateMastery(character)
                    pruneSkills(character)
                }
                return character
            })
            return { roster, summons: data.summons ?? 0, inventory: data.inventory ?? [], unlockedLevels: migrateUnlockedLevels(data), lastTeam: data.lastTeam ?? [], memorial: data.memorial ?? [] }
        }
    } catch (error) {
        console.warn("Save could not be loaded", error)
    }
    return { roster: [], summons: 0, inventory: [], unlockedLevels: 1, lastTeam: [], memorial: [] }
}

function migrateUnlockedLevels(data: { unlockedLevels?: number, levelLayout?: number }) {
    const unlocked = data.unlockedLevels ?? 1
    return data.levelLayout !== levelLayout && unlocked > oldChapterLength ? unlocked + addedChapterOneLevels : unlocked
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
        localStorage.setItem(saveKey, JSON.stringify({ version: saveVersion, levelLayout, ...save }))
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

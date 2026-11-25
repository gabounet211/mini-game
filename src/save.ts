import { initSkills, migrateMastery, pruneSkills, skillPointsPerLevel } from "./skill"
import { Character, createHero, createId } from "./character"
import { emptyResources, Resource } from "./base"

const saveKey = "miniGameSave"
const saveVersion = 1
const levelLayout = 3
const chapterLength = 10
const chapterOneOldLength = 5
const chapterTwoNewPositions = [0, 1, 3, 5, 6, 10]
const startingHeroes = 5

export interface SaveData {
    roster: Character[],
    summons: number,
    inventory: string[],
    unlockedLevels: number,
    lastTeam: string[],
    memorial: FallenHero[],
    resources: Record<Resource, number>,
    harvest: Record<string, Resource>,
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
            return { roster, summons: data.summons ?? 0, inventory: data.inventory ?? [], unlockedLevels: migrateUnlockedLevels(data), lastTeam: data.lastTeam ?? [], memorial: data.memorial ?? [], resources: { ...emptyResources(), ...data.resources }, harvest: data.harvest ?? {} }
        }
    } catch (error) {
        console.warn("Save could not be loaded", error)
    }
    return { roster: [], summons: 0, inventory: [], unlockedLevels: 1, lastTeam: [], memorial: [], resources: emptyResources(), harvest: {} }
}

function migrateUnlockedLevels(data: { unlockedLevels?: number, levelLayout?: number }) {
    let unlocked = data.unlockedLevels ?? 1
    const layout = data.levelLayout ?? 1
    if (layout < 2 && unlocked > chapterOneOldLength)
        unlocked += chapterLength - chapterOneOldLength
    if (layout < 3 && unlocked > chapterLength)
        unlocked = chapterLength + chapterTwoNewPositions[Math.min(unlocked - chapterLength, chapterTwoNewPositions.length - 1)]
    return unlocked
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

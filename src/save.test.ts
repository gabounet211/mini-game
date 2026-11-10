import { beforeEach, describe, expect, it } from "vitest"
import { clearSave, loadOrCreateSave, loadSave, writeSave } from "./save"

beforeEach(() => {
    const store = new Map<string, string>()
    globalThis.localStorage = {
        getItem: key => store.get(key) ?? null,
        setItem: (key, value) => void store.set(key, value),
        removeItem: key => void store.delete(key),
    } as Storage
})

describe("save", () => {
    it("starts a new save with 5 heroes and only the first level unlocked", () => {
        const save = loadOrCreateSave()
        expect(save.roster).toHaveLength(5)
        expect(save.unlockedLevels).toBe(1)
        expect(loadSave().roster.map(character => character.id)).toEqual(save.roster.map(character => character.id))
    })

    it("fills fields missing from an older save", () => {
        localStorage.setItem("miniGameSave", JSON.stringify({ version: 1, roster: [{ entity: "hero", rarity: "common", stats: {}, level: 2, experience: 0, equipment: {} }] }))
        const save = loadSave()
        expect(save.summons).toBe(0)
        expect(save.inventory).toEqual([])
        expect(save.roster[0]).toMatchObject({ statPoints: 0, finaleAttempts: [], championsDefeated: [], classChanges: [] })
        expect(save.roster[0].id).toBeTruthy()
    })

    it("can be written and cleared", () => {
        const save = loadOrCreateSave()
        save.summons = 3
        writeSave(save)
        expect(loadSave().summons).toBe(3)
        clearSave()
        expect(loadSave().roster).toEqual([])
    })
})

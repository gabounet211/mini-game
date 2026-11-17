import { beforeEach, describe, expect, it } from "vitest"
import { Object3D } from "three"
import { Grid } from "./grid"
import { Piece, PieceConfig } from "./piece"
import { createCharacter } from "./character"
import { allyBonus, canUse, critRoll, cure, hybridAttack, magicalAttack, physicalAttack, spendAction, statusAction, tauntAction, willpowerDrain } from "./action"
import { Game } from "./game"

function piece(player: boolean, characterClass?: string) {
    const config: PieceConfig = { obj: new Object3D(), name: "test", offset: 0, rarity: "common", actions: [] }
    const character = createCharacter("test", "common")
    character.characterClass = characterClass
    character.stats = { strength: 4, resistance: 1, constitution: 10, willpower: 3, knowledge: 1, intelligence: 1, dexterity: 4, perception: 1 }
    return new Piece(config, character, player)
}

function setup(pieces: [x: number, y: number, piece: Piece][]) {
    const grid = Object.create(Grid.prototype) as Grid
    const cells: Record<string, true | Piece> = {}
    for (let x = 0; x < 6; x++)
        for (let y = 0; y < 6; y++)
            cells[x + ',' + y] = true
    for (const [x, y, piece] of pieces)
        cells[x + ',' + y] = piece
    Object.assign(grid, { cells })
    return { gameLogic: { grid } } as unknown as Game
}

beforeEach(() => {
    critRoll.next = () => 1
})

describe("allyBonus", () => {
    it("adds 1 damage to allies of a living skald", () => {
        const fighter = piece(true)
        const bard = piece(true, "skald")
        const enemy = piece(false)
        const game = setup([[0, 0, fighter], [5, 5, bard], [0, 1, enemy]])
        expect(allyBonus(game, fighter)).toBe(1)
        const before = enemy.healt
        physicalAttack("strike", 1, 1).action(game, enemy, fighter)
        expect(before - enemy.healt).toBe(1 + 2 + 1)
    })

    it("does not boost the bard itself, enemies, or anyone once the bard is dead", () => {
        const fighter = piece(true)
        const bard = piece(true, "skald")
        const enemy = piece(false)
        const game = setup([[0, 0, fighter], [5, 5, bard], [0, 1, enemy]])
        expect(allyBonus(game, bard)).toBe(0)
        expect(allyBonus(game, enemy)).toBe(0)
        bard.healt = 0
        expect(allyBonus(game, fighter)).toBe(0)
    })

    it("does not stack with two skalds", () => {
        const fighter = piece(true)
        const game = setup([[0, 0, fighter], [5, 5, piece(true, "skald")], [5, 4, piece(true, "skald")]])
        expect(allyBonus(game, fighter)).toBe(1)
    })

    it("is not given by a bard", () => {
        const fighter = piece(true)
        const game = setup([[0, 0, fighter], [5, 5, piece(true, "bard")]])
        expect(allyBonus(game, fighter)).toBe(0)
    })
})

describe("willpowerDrain", () => {
    function bardWith(willpower: number) {
        const bard = piece(true, "bard")
        bard.stats.willpower = willpower
        return bard
    }

    function enemyWith(willpower: number) {
        const enemy = piece(false)
        enemy.baseStats.willpower = willpower
        enemy.refreshStats()
        return enemy
    }

    it("lowers the target's willpower by the bard's willpower / 3, and its AP with it", () => {
        const enemy = enemyWith(9)
        const maxBefore = enemy.maxActionPoints
        willpowerDrain("dissonantChord", 2, 2).action(setup([]), enemy, bardWith(9))
        expect(enemy.stats.willpower).toBe(6)
        expect(enemy.maxActionPoints).toBe(maxBefore - 1)
    })

    it("lasts 2 of the target's turns, then restores everything", () => {
        const enemy = enemyWith(9)
        willpowerDrain("dissonantChord", 2, 2).action(setup([]), enemy, bardWith(6))
        expect(enemy.stats.willpower).toBe(7)
        enemy.endOwnTurn()
        expect(enemy.stats.willpower).toBe(7)
        enemy.endOwnTurn()
        expect(enemy.stats.willpower).toBe(9)
        expect(enemy.effects).toEqual([])
    })

    it("does not stack: casting again only refreshes the duration", () => {
        const enemy = enemyWith(9)
        const chord = willpowerDrain("dissonantChord", 2, 2)
        chord.action(setup([]), enemy, bardWith(6))
        enemy.endOwnTurn()
        chord.action(setup([]), enemy, bardWith(6))
        expect(enemy.stats.willpower).toBe(7)
        expect(enemy.effects[0].turns).toBe(2)
    })

    it("deals no damage and drains at least 1", () => {
        const enemy = piece(false)
        const before = enemy.healt
        willpowerDrain("dissonantChord", 2, 2).action(setup([]), enemy, bardWith(1))
        expect(enemy.healt).toBe(before)
        expect(enemy.effectAmount("willpowerDown")).toBe(1)
    })
})

describe("status effects", () => {
    it("stuns the target for its next turn", () => {
        const fighter = piece(true)
        const enemy = piece(false)
        physicalAttack("bash", 2, 1, {}, () => ({ kind: "stun", amount: 0, turns: 1 })).action(setup([]), enemy, fighter)
        enemy.startOwnTurn(0)
        expect(enemy.actionPoints).toBe(0)
        expect(enemy.movePoints).toBe(0)
        enemy.endOwnTurn()
        enemy.startOwnTurn(0)
        expect(enemy.actionPoints).toBe(enemy.maxActionPoints)
    })

    it("burns for 2 magic damage and poisons for 1 damage that ignores resistance", () => {
        const enemy = piece(false)
        enemy.baseStats.resistance = 9
        enemy.refreshStats()
        enemy.addEffect({ kind: "burn", amount: 0, turns: 2 }, true)
        enemy.addEffect({ kind: "poison", amount: 0, turns: 2 }, true)
        const before = enemy.healt
        enemy.startOwnTurn(0)
        expect(before - enemy.healt).toBe(3)
    })

    it("slows and roots movement", () => {
        const enemy = piece(false)
        enemy.addEffect({ kind: "slow", amount: 1, turns: 1 }, true)
        enemy.startOwnTurn(0)
        expect(enemy.movePoints).toBe(enemy.moveRange - 1)
        enemy.addEffect({ kind: "root", amount: 0, turns: 1 }, true)
        enemy.startOwnTurn(0)
        expect(enemy.movePoints).toBe(0)
    })

    it("keeps a buff cast on the caster's own turn through the next enemy turn", () => {
        const guard = piece(true)
        const guardUp = statusAction("guardUp", 2, 0, {}, "self", () => ({ kind: "resistanceUp", amount: 2, turns: 1 }))
        guardUp.action(setup([]), undefined, guard)
        expect(guard.stats.resistance).toBe(3)
        guard.endOwnTurn()
        expect(guard.stats.resistance).toBe(3)
        guard.endOwnTurn()
        expect(guard.stats.resistance).toBe(1)
    })

    it("lets an immune hero ignore hostile effects, and cure removes harmful ones", () => {
        const duelist = piece(true)
        duelist.addEffect({ kind: "immune", amount: 0, turns: 1 }, false)
        expect(duelist.addEffect({ kind: "stun", amount: 0, turns: 1 }, true)).toBe(false)
        const ally = piece(true)
        ally.addEffect({ kind: "poison", amount: 0, turns: 2 }, true)
        ally.addEffect({ kind: "damageUp", amount: 1, turns: 2 }, false)
        cure("cureTouch", 2, 2).action(setup([]), ally, piece(true))
        expect(ally.effects.map(effect => effect.kind)).toEqual(["damageUp"])
    })

    it("adds damageUp to the user's attacks", () => {
        const fighter = piece(true)
        const enemy = piece(false)
        fighter.addEffect({ kind: "damageUp", amount: 1, turns: 2 }, false)
        const before = enemy.healt
        physicalAttack("strike", 1, 1).action(setup([]), enemy, fighter)
        expect(before - enemy.healt).toBe(1 + 2 + 1)
    })
})

describe("concentration and cooldowns", () => {
    it("needs enough concentration and spends it", () => {
        const mage = piece(true)
        const bolt = magicalAttack("bolt", 1, 3, { concentration: 3 })
        expect(mage.concentration).toBe(4)
        expect(canUse(mage, bolt)).toBe(true)
        spendAction(mage, bolt)
        expect(mage.concentration).toBe(1)
        expect(canUse(mage, bolt)).toBe(false)
    })

    it("blocks an action for its cooldown, counted in the user's own turns", () => {
        const fighter = piece(true)
        const bash = physicalAttack("bash", 1, 1, { cooldown: 2 })
        spendAction(fighter, bash)
        fighter.endOwnTurn()
        fighter.actionPoints = fighter.maxActionPoints
        expect(canUse(fighter, bash)).toBe(false)
        fighter.endOwnTurn()
        expect(canUse(fighter, bash)).toBe(false)
        fighter.endOwnTurn()
        expect(canUse(fighter, bash)).toBe(true)
    })

    it("deals physical and magic damage with a hybrid attack", () => {
        const user = piece(true)
        const enemy = piece(false)
        const before = enemy.healt
        hybridAttack("spellStrike", 2, 1).action(setup([]), enemy, user)
        expect(before - enemy.healt).toBe(3 + 3)
    })
})

describe("critical hits and reactions", () => {
    it("doubles the damage on a critical hit, more likely with perception and headShot", () => {
        const user = piece(true)
        const enemy = piece(false)
        critRoll.next = () => 0.02
        let before = enemy.healt
        physicalAttack("strike", 1, 1).action(setup([]), enemy, user)
        expect(before - enemy.healt).toBe(6)
        critRoll.next = () => 0.2
        before = enemy.healt
        physicalAttack("strike", 1, 1).action(setup([]), enemy, user)
        expect(before - enemy.healt).toBe(3)
        before = enemy.healt
        physicalAttack("headShot", 3, 5, { bonusDamage: 2, bonusCrit: 0.3 }).action(setup([]), enemy, user)
        expect(before - enemy.healt).toBe(10)
    })

    it("makes the protector take the damage instead of the protected ally", () => {
        const guard = piece(true)
        const ally = piece(true)
        const enemy = piece(false)
        statusAction("protect", 3, 2, {}, "ally", user => ({ kind: "protected", amount: 0, turns: 1, source: user })).action(setup([]), ally, guard)
        const allyBefore = ally.healt, guardBefore = guard.healt
        physicalAttack("strike", 1, 1).action(setup([]), ally, enemy)
        expect(ally.healt).toBe(allyBefore)
        expect(guard.healt).toBe(guardBefore - 3)
    })

    it("hits back the attacker while riposte is active", () => {
        const duelist = piece(true)
        const enemy = piece(false)
        duelist.addEffect({ kind: "riposte", amount: 0, turns: 1 }, false)
        const before = enemy.healt
        physicalAttack("strike", 1, 1).action(setup([]), duelist, enemy)
        expect(before - enemy.healt).toBe(3)
    })

    it("taunts the enemies around the caster", () => {
        const guard = piece(true)
        const near = piece(false)
        const far = piece(false)
        const game = setup([[0, 0, guard], [2, 1, near], [5, 5, far]])
        tauntAction("taunt", 2, 3, {}, 2).action(game, undefined, guard)
        expect(near.effects[0]).toMatchObject({ kind: "taunt", source: guard, turns: 2 })
        expect(far.hasEffect("taunt")).toBe(false)
    })
})

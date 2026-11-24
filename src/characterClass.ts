import { Action, areaAction, cure, groundZoneAction, tauntAction, effect, healing, hybridAttack, magicalAttack, moveAction, physicalAttack, statusAction, willpowerBoost, willpowerDrain, withRanks, byRank } from "./action"
import { Rarity, Stats, StatWeights } from "./stats"
import { upgradeSkillsForClass } from "./skill"
import { Character } from "./character"

export interface CharacterClass {
    name: string,
    tier: number,
    actions: Action[],
    statWeights: StatWeights,
    starting?: boolean,
    minimums?: Partial<Stats>,
    evolvesFrom?: string,
    requiredItem?: string,
    inspiresAllies?: boolean,
}

export const characterClasses: Record<string, CharacterClass> = {
    farmer: { name: "Farmer", tier: 1, starting: true, actions: [
        physicalAttack("pitchforkStrike", 1, 1),
        withRanks(statusAction("standFirm", 2, 0, { cooldown: 2 }, "self", effect("resistanceUp", 1, 2)),
            statusAction("standFirm", 2, 0, { cooldown: 2 }, "self", effect("resistanceUp", 1, 3)),
            statusAction("standFirm", 2, 0, { cooldown: 1 }, "self", effect("resistanceUp", 1, 3))),
        withRanks(tauntAction("farmerShout", 2, 2, { cooldown: 3 }, 1),
            tauntAction("farmerShout", 2, 3, { cooldown: 3 }, 1),
            tauntAction("farmerShout", 2, 3, { cooldown: 3 }, 2)),
        withRanks(moveAction("pitchforkShove", 2, 1, { cooldown: 1 }, { kind: "push", cells: 1, damage: true }),
            moveAction("pitchforkShove", 2, 1, { cooldown: 1, bonusDamage: 1 }, { kind: "push", cells: 1, damage: true }),
            moveAction("pitchforkShove", 2, 1, { cooldown: 1, bonusDamage: 1 }, { kind: "push", cells: 2, damage: true })),
    ], statWeights: { constitution: 3, resistance: 2 } },
    lumberjack: { name: "Lumberjack", tier: 1, starting: true, actions: [
        physicalAttack("axeChop", 1, 1),
        withRanks(physicalAttack("heavyChop", 2, 1, { cooldown: 1, bonusDamage: 2 }),
            physicalAttack("heavyChop", 2, 1, { cooldown: 1, bonusDamage: 3 }),
            physicalAttack("heavyChop", 2, 1, { cooldown: 1, bonusDamage: 4 })),
        withRanks(areaAction("timberSwing", 3, 1, { cooldown: 2 }, { shape: { kind: "sweep" }, damage: "physical" }),
            areaAction("timberSwing", 3, 1, { cooldown: 2, bonusDamage: 1 }, { shape: { kind: "sweep" }, damage: "physical" }),
            areaAction("timberSwing", 3, 1, { cooldown: 1, bonusDamage: 1 }, { shape: { kind: "sweep" }, damage: "physical" })),
        withRanks(physicalAttack("logThrow", 2, 2, { cooldown: 2 }, effect("slow", 1, 1)),
            physicalAttack("logThrow", 2, 3, { cooldown: 2 }, effect("slow", 1, 1)),
            physicalAttack("logThrow", 2, 3, { cooldown: 2 }, effect("slow", 1, 2))),
    ], statWeights: { strength: 3, constitution: 2 } },
    hunter: { name: "Hunter", tier: 1, starting: true, actions: [
        physicalAttack("slingShot", 1, 3),
        withRanks(physicalAttack("aimedStone", 2, 4, { cooldown: 1, bonusCrit: 0.2 }),
            physicalAttack("aimedStone", 2, 4, { cooldown: 1, bonusCrit: 0.3 }),
            physicalAttack("aimedStone", 2, 4, { bonusCrit: 0.3 })),
        withRanks(statusAction("snare", 2, 3, { cooldown: 3 }, "enemy", effect("root", 1)),
            statusAction("snare", 2, 4, { cooldown: 3 }, "enemy", effect("root", 1)),
            statusAction("snare", 2, 4, { cooldown: 2 }, "enemy", effect("root", 1))),
        withRanks(moveAction("skirmish", 2, 3, { cooldown: 2 }, { kind: "retreat", cells: 2, damage: true }),
            moveAction("skirmish", 2, 3, { cooldown: 2, bonusDamage: 1 }, { kind: "retreat", cells: 2, damage: true }),
            moveAction("skirmish", 2, 3, { cooldown: 2, bonusDamage: 1 }, { kind: "retreat", cells: 3, damage: true })),
    ], statWeights: { dexterity: 3, perception: 2 } },
    soldier: { name: "Soldier", tier: 2, starting: true, actions: [
        physicalAttack("swordStrike", 1, 1),
        byRank(rank => physicalAttack("pummelStrike", 3, 1, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, effect("stun", 1))),
        byRank(rank => statusAction("guardUp", 2, 0, {}, "self", effect("resistanceUp", rank === 3 ? 2 : 1, rank === 1 ? 2 : 3))),
        byRank(rank => moveAction("lunge", 2, rank === 1 ? 2 : 3, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", line: true, damage: true })),
    ], statWeights: { strength: 3, resistance: 3 }, minimums: { strength: 5, resistance: 4 } },
    apprentice: { name: "Apprentice", tier: 2, starting: true, actions: [
        physicalAttack("staffStrike", 1, 1),
        byRank(rank => magicalAttack("arcaneBolt", 2, rank === 3 ? 4 : 3, { concentration: 1, bonusDamage: rank > 1 ? 1 : 0 })),
        byRank(rank => magicalAttack("arcaneFire", 2, 3, { concentration: 2, bonusDamage: rank > 1 ? 1 : 0 }, effect("burn", rank === 3 ? 3 : 2))),
        byRank(rank => magicalAttack("frostBolt", 2, 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, effect("slow", 1, rank === 1 ? 1 : 2))),
    ], statWeights: { intelligence: 3, knowledge: 3 }, minimums: { intelligence: 5, knowledge: 4 } },
    healer: { name: "Healer", tier: 3, starting: true, actions: [
        physicalAttack("staffStrike", 1, 1),
        byRank(rank => magicalAttack("lightRay", 2, rank === 3 ? 3 : 2, { concentration: 1, bonusDamage: rank > 1 ? 1 : 0 })),
        byRank(rank => healing("healingTouch", 2, rank === 1 ? 2 : 3, { concentration: rank === 3 ? 1 : 2 })),
        byRank(rank => cure("cureTouch", rank === 3 ? 1 : 2, rank === 1 ? 2 : 3, { concentration: 2 })),
        byRank(rank => statusAction("blessing", 2, 2, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, "ally", effect("resistanceUp", 2, rank === 1 ? 2 : 3))),
    ], statWeights: { willpower: 3, intelligence: 2 }, minimums: { willpower: 6, intelligence: 5 } },
    bard: { name: "Bard", tier: 2, starting: true, actions: [
        physicalAttack("rapierStrike", 1, 1),
        byRank(rank => willpowerDrain("dissonantChord", 2, rank === 1 ? 2 : 3, { concentration: 2 }, rank === 3 ? 3 : 2)),
        byRank(rank => willpowerBoost("inspireChord", 2, rank === 1 ? 2 : 3, { concentration: 2 }, rank === 3 ? 3 : 2)),
        byRank(rank => healing("soothingSong", 3, rank === 1 ? 2 : 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 })),
    ], statWeights: { willpower: 3, dexterity: 2 }, minimums: { willpower: 5, dexterity: 4 } },
    berserker: { name: "Berserker", tier: 4, starting: true, actions: [
        physicalAttack("frenzyStrike", 1, 1),
        byRank(rank => statusAction("rage", 2, 0, { cooldown: rank === 3 ? 2 : 3 }, "self", effect("damageUp", 2, rank === 1 ? 2 : 3))),
        byRank(rank => areaAction("whirlwind", 3, 0, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "radius", size: 1 }, damage: "physical" })),
        byRank(rank => moveAction("bloodCharge", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", damage: true })),
        byRank(rank => physicalAttack("recklessBlow", 3, 1, { cooldown: rank === 3 ? 0 : 1, bonusDamage: rank === 1 ? 3 : 4 })),
        byRank(rank => statusAction("ignorePain", 2, 0, { cooldown: rank === 3 ? 2 : 3 }, "self", effect("immune", rank === 1 ? 1 : 2))),
    ], statWeights: { strength: 4, constitution: 3 }, minimums: { strength: 8, constitution: 6 } },
    elementalist: { name: "Elementalist", tier: 4, starting: true, actions: [
        physicalAttack("staffStrike", 1, 4),
        byRank(rank => magicalAttack("lightningBolt", 2, 5, { concentration: 2, cooldown: rank === 3 ? 0 : 1, bonusDamage: rank === 1 ? 2 : 3 })),
        byRank(rank => areaAction("fireball", 3, 4, { concentration: 3, cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "radius", size: 1 }, damage: "magic", effect: effect("burn", 2) })),
        byRank(rank => areaAction("frostNova", 3, 3, { concentration: 3, cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "radius", size: 1 }, damage: "magic", effect: effect("slow", 1, 2) })),
        byRank(rank => moveAction("gust", 2, 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, { kind: "push", cells: rank === 1 ? 2 : 3, line: true })),
        byRank(rank => statusAction("stoneSkin", 2, 0, { concentration: 1, cooldown: rank === 3 ? 1 : 2 }, "self", effect("resistanceUp", 1, rank === 1 ? 3 : 4))),
    ], statWeights: { intelligence: 4, knowledge: 2 }, minimums: { intelligence: 8, willpower: 6 } },
    cleric: { name: "Cleric", tier: 4, starting: true, actions: [
        physicalAttack("maceStrike", 1, 3),
        byRank(rank => healing("divineHealing", 2, rank === 1 ? 3 : 4, { concentration: rank === 3 ? 1 : 2 })),
        byRank(rank => magicalAttack("smite", 2, rank === 3 ? 4 : 3, { concentration: 1, bonusDamage: rank > 1 ? 1 : 0 })),
        byRank(rank => cure("purge", 2, rank === 1 ? 3 : 4, { concentration: 2, cooldown: rank === 3 ? 0 : 1 })),
        byRank(rank => statusAction("holyWard", 2, 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, "ally", effect("resistanceUp", 2, rank === 1 ? 2 : 3))),
        byRank(rank => statusAction("prayerOfMight", 3, 3, { concentration: 3, cooldown: rank === 3 ? 2 : 3 }, "ally", effect("damageUp", 2, rank === 1 ? 1 : 2))),
    ], statWeights: { willpower: 3, intelligence: 3 }, minimums: { willpower: 8, knowledge: 6 } },

    guard: { name: "Guard", tier: 3, starting: true, actions: [
        physicalAttack("swordStrike", 1, 1),
        byRank(rank => physicalAttack("shieldBash", 2, 1, { cooldown: rank === 3 ? 0 : 1, bonusDamage: rank > 1 ? 1 : 0 }, effect("stun", 1))),
        byRank(rank => tauntAction("taunt", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 2 : 3 }, 2)),
        byRank(rank => statusAction("protect", 3, rank === 1 ? 2 : 3, { cooldown: rank === 3 ? 2 : 3 }, "ally", user => ({ kind: "protected", amount: 0, turns: 1, source: user }))),
        byRank(rank => moveAction("intercept", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", targets: "any" })),
    ], statWeights: { resistance: 3, constitution: 2 }, minimums: { resistance: 6, constitution: 5 } },
    brawler: { name: "Brawler", tier: 3, starting: true, actions: [
        physicalAttack("haymaker", 1, 1),
        byRank(rank => physicalAttack("fistFight", 1, 1, { bonusDamage: rank })),
        byRank(rank => moveAction("knockBack", 2, 1, { bonusDamage: rank > 1 ? 1 : 0 }, { kind: "push", cells: rank === 3 ? 3 : 2, damage: true })),
        byRank(rank => moveAction("fistCharge", 2, rank === 1 ? 3 : 4, { bonusDamage: rank === 3 ? 1 : 0 }, { kind: "dash", line: true, damage: true })),
        byRank(rank => physicalAttack("uppercut", 3, 1, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, effect("stun", 1))),
    ], statWeights: { constitution: 3, strength: 2 }, minimums: { constitution: 6, strength: 5 } },
    scholar: { name: "Scholar", tier: 3, starting: true, actions: [
        physicalAttack("bookSmack", 1, 1),
        byRank(rank => magicalAttack("arcaneSpark", 2, rank === 3 ? 4 : 3, { concentration: 2, bonusDamage: rank > 1 ? 1 : 0 })),
        byRank(rank => statusAction("enchant", 3, 3, { concentration: 3 }, "ally", effect("damageUp", rank === 3 ? 3 : 2, rank === 1 ? 1 : 2))),
        byRank(rank => areaAction("slow", 2, 4, { concentration: 3 }, { shape: { kind: "radius", size: 2 }, effect: effect("slow", rank === 3 ? 2 : 1, rank === 1 ? 1 : 2) })),
        byRank(rank => statusAction("arcaneBarrier", 2, 3, { concentration: 2, cooldown: 2 }, "ally", effect("resistanceUp", rank === 1 ? 1 : 2, rank === 3 ? 3 : 2))),
    ], statWeights: { knowledge: 3, intelligence: 2 }, minimums: { knowledge: 6, intelligence: 5 } },
    scout: { name: "Scout", tier: 2, starting: true, actions: [
        physicalAttack("knifeThrow", 1, 3),
        physicalAttack("knifeStrike", 1, 1),
        byRank(rank => moveAction("jump", rank === 1 ? 3 : 2, 1, {}, { kind: "jump", targets: "any", damage: rank === 3 })),
        byRank(rank => physicalAttack("poisonedKnife", 2, rank === 1 ? 3 : 4, { cooldown: 2 }, effect("poison", rank === 3 ? 3 : 2))),
    ], statWeights: { dexterity: 3, perception: 2 }, minimums: { dexterity: 5, constitution: 4 } },
    tracker: { name: "Tracker", tier: 2, starting: true, actions: [
        physicalAttack("aimedShot", 1, 4),
        physicalAttack("knifeStrike", 1, 1),
        byRank(rank => physicalAttack("legShot", 2, 4, {}, effect("slow", rank === 3 ? 2 : 1, rank === 1 ? 1 : 2))),
        byRank(rank => areaAction("volley", 3, 4, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "square", size: 2 }, damage: "physical" })),
    ], statWeights: { perception: 3, dexterity: 2 }, minimums: { perception: 5, dexterity: 4 } },
    mercenary: { name: "Mercenary", tier: 3, actions: [
        physicalAttack("bladeStrike", 1, 1),
        byRank(rank => physicalAttack("gunShot", 2, rank === 3 ? 4 : 3, { bonusDamage: rank > 1 ? 1 : 0 })),
        byRank(rank => areaAction("bulletShower", 3, 3, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "square", size: 2 }, damage: "physical", friendlyFire: true })),
        byRank(rank => physicalAttack("cripplingShot", 2, 3, { cooldown: rank === 3 ? 1 : 2 }, effect("slow", 1, rank === 1 ? 1 : 2))),
        byRank(rank => areaAction("bladeFlurry", 3, 1, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "sweep" }, damage: "physical" })),
    ], statWeights: {}, minimums: { strength: 7, dexterity: 5, constitution: 4 } },
    shieldbearer: { name: "Shieldbearer", tier: 3, actions: [
        physicalAttack("shieldSlam", 1, 1),
        byRank(rank => moveAction("shieldDash", 3, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 2 : 3 }, { kind: "dash", line: true, damage: true, effect: effect("stun", 1) })),
        byRank(rank => tauntAction("taunt", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 2 : 3 }, 2)),
        byRank(rank => statusAction("shieldUp", 2, 0, { cooldown: 2 }, "self", effect("resistanceUp", rank === 3 ? 2 : 1, rank === 1 ? 3 : 4))),
        byRank(rank => statusAction("cover", 3, rank === 1 ? 2 : 3, { cooldown: rank === 3 ? 2 : 3 }, "ally", user => ({ kind: "protected", amount: 0, turns: 1, source: user }))),
    ], statWeights: {}, minimums: { resistance: 7, constitution: 6, strength: 4 } },
    warden: { name: "Warden", tier: 3, actions: [
        physicalAttack("wardenStrike", 1, 1),
        byRank(rank => groundZoneAction("wardenSlow", 2, { concentration: 2, cooldown: 3 }, rank === 1 ? 2 : 3, rank === 3 ? 3 : 2, { kind: "slow", amount: 1, turns: 1 })),
        byRank(rank => statusAction("wardenHindrance", 2, rank === 1 ? 1 : 2, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, "enemy", effect("root", 1))),
        byRank(rank => moveAction("wardenPush", 2, 1, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, { kind: "push", cells: rank === 1 ? 1 : 2 })),
        byRank(rank => groundZoneAction("sealingRune", 3, { concentration: 3, cooldown: 3 }, rank === 3 ? 2 : 1, rank === 1 ? 1 : 2, { kind: "root", amount: 0, turns: 1 }, 3)),
    ], statWeights: {}, minimums: { constitution: 7, resistance: 5, perception: 4 } },
    exorcist: { name: "Exorcist", tier: 3, actions: [
        physicalAttack("staffStrike", 1, 1),
        byRank(rank => magicalAttack("banish", 2, rank === 3 ? 4 : 3, { concentration: 1, bonusDamage: rank > 1 ? 1 : 0 })),
        byRank(rank => magicalAttack("holyFire", 2, 3, { concentration: 2, cooldown: 3, bonusDamage: rank > 1 ? 1 : 0 }, effect("burn", rank === 3 ? 3 : 2))),
        byRank(rank => statusAction("holyChain", 2, rank === 1 ? 3 : 4, { concentration: 2, cooldown: rank === 3 ? 2 : 3 }, "enemy", effect("root", 1))),
        byRank(rank => cure("purify", 2, rank === 1 ? 2 : 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 })),
    ], statWeights: {}, minimums: { willpower: 7, intelligence: 5, knowledge: 4 } },
    alchemist: { name: "Alchemist", tier: 3, actions: [
        physicalAttack("flaskThrow", 1, 3),
        byRank(rank => magicalAttack("acidSplash", 2, 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 })),
        byRank(rank => magicalAttack("burningSplash", 2, 3, { concentration: 2, cooldown: 3, bonusDamage: rank > 1 ? 1 : 0 }, effect("burn", rank === 3 ? 3 : 2))),
        byRank(rank => magicalAttack("poisonSplash", 2, 3, { concentration: 2, cooldown: 2, bonusDamage: rank > 1 ? 1 : 0 }, effect("poison", rank === 3 ? 3 : 2))),
        byRank(rank => healing("healingDraught", 2, rank === 1 ? 2 : 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 })),
    ], statWeights: {}, minimums: { knowledge: 7, dexterity: 5, intelligence: 4 } },
    mageblade: { name: "Mageblade", tier: 3, actions: [
        physicalAttack("arcaneSlash", 1, 1),
        hybridAttack("spellStrike", 2, 1, { concentration: 1 }),
        byRank(rank => moveAction("windPull", 2, rank === 1 ? 3 : 4, { concentration: 2, cooldown: rank === 3 ? 2 : 3 }, { kind: "pull", line: true })),
        byRank(rank => moveAction("windDash", 2, rank === 1 ? 3 : 4, { concentration: 2, cooldown: rank === 3 ? 2 : 3 }, { kind: "dash" })),
        byRank(rank => statusAction("arcaneGuard", 2, 0, { concentration: 1, cooldown: rank === 3 ? 1 : 2 }, "self", effect("resistanceUp", 1, rank === 1 ? 2 : 3))),
    ], statWeights: {}, minimums: { intelligence: 7, strength: 6, dexterity: 4 } },
    duelist: { name: "Duelist", tier: 3, actions: [
        physicalAttack("rapierSwing", 1, 1),
        byRank(rank => statusAction("riposte", 2, 0, { cooldown: rank === 3 ? 1 : 2 }, "self", effect("riposte", rank === 1 ? 1 : 2))),
        areaAction("rapierSweep", 3, 1, {}, { shape: { kind: "sweep" }, damage: "physical" }),
        byRank(rank => statusAction("rapierCounter", 2, 0, { cooldown: rank === 3 ? 1 : 2 }, "self", effect("immune", rank === 1 ? 1 : 2))),
        byRank(rank => moveAction("fleche", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", line: true, damage: true })),
    ], statWeights: {}, minimums: { dexterity: 7, strength: 5, perception: 4 } },
    sharpshooter: { name: "Sharpshooter", tier: 3, actions: [
        physicalAttack("piercingShot", 1, 5),
        byRank(rank => physicalAttack("headShot", 3, 5, { cooldown: rank === 3 ? 1 : 2, bonusDamage: 2, bonusCrit: rank === 1 ? 0.3 : 0.4 })),
        byRank(rank => physicalAttack("legShot", 2, 4, { cooldown: 2 }, effect("slow", rank === 3 ? 2 : 1, rank === 1 ? 1 : 2))),
        byRank(rank => moveAction("repositionningShot", 2, 3, { cooldown: 2, bonusDamage: rank > 1 ? 1 : 0 }, { kind: "retreat", cells: rank === 3 ? 3 : 2, damage: true })),
        byRank(rank => physicalAttack("pinningShot", 3, 5, { cooldown: rank === 3 ? 2 : 3, bonusDamage: rank > 1 ? 1 : 0 }, effect("root", 1))),
    ], statWeights: {}, minimums: { perception: 7, dexterity: 6, strength: 4 } },

    skald: { name: "Skald", tier: 3, actions: [
        physicalAttack("axeStrike", 1, 1),
        byRank(rank => willpowerBoost("warChant", 2, rank === 1 ? 2 : 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 })),
        byRank(rank => willpowerDrain("dissonantChant", 2, rank === 1 ? 2 : 3, { concentration: 2 }, rank === 3 ? 3 : 2)),
        byRank(rank => physicalAttack("axeThrow", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 0 : 1, bonusDamage: 1 })),
    ], statWeights: {}, evolvesFrom: "bard", inspiresAllies: true },
    knight: { name: "Knight", tier: 4, actions: [
        physicalAttack("lanceStrike", 1, 1),
        byRank(rank => statusAction("shieldWall", 2, 0, { cooldown: rank === 3 ? 1 : 2 }, "self", effect("resistanceUp", 1, rank === 1 ? 3 : 4))),
        byRank(rank => tauntAction("challenge", 2, rank === 1 ? 3 : 4, { cooldown: 3 }, rank === 3 ? 3 : 2)),
        byRank(rank => statusAction("guardian", 3, rank === 1 ? 2 : 3, { cooldown: rank === 3 ? 2 : 3 }, "ally", user => ({ kind: "protected", amount: 0, turns: 1, source: user }))),
        physicalAttack("heavyStrike", 2, 1, { cooldown: 1, bonusDamage: 3 }),
        byRank(rank => moveAction("lanceCharge", 3, rank === 1 ? 4 : 5, { cooldown: 3 }, { kind: "dash", line: true, damage: true, effect: effect("stun", rank === 3 ? 2 : 1) })),
        byRank(rank => areaAction("cleave", 3, 1, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "sweep" }, damage: "physical" })),
    ], statWeights: {}, minimums: { resistance: 8, strength: 6 } },
    juggernaut: { name: "Juggernaut", tier: 4, actions: [
        physicalAttack("crush", 1, 1),
        byRank(rank => statusAction("ironSkin", 2, 0, { cooldown: 2 }, "self", effect("resistanceUp", rank === 3 ? 2 : 1, rank === 1 ? 3 : 4))),
        byRank(rank => statusAction("unstoppable", 2, 0, { cooldown: rank === 3 ? 2 : 3 }, "self", effect("immune", rank === 1 ? 1 : 2))),
        byRank(rank => moveAction("bodyCheck", 2, 1, { cooldown: rank === 3 ? 0 : 1 }, { kind: "push", cells: rank === 1 ? 2 : 3, damage: true })),
        byRank(rank => areaAction("groundSlam", 3, 1, { cooldown: rank === 1 ? 3 : 2 }, { shape: { kind: "radius", size: 1 }, damage: "physical", effect: rank === 3 ? effect("stun", 1) : undefined })),
        byRank(rank => moveAction("juggernautCharge", 3, rank === 1 ? 4 : 5, { cooldown: 3 }, { kind: "dash", line: true, damage: true, effect: rank === 3 ? effect("stun", 1) : undefined })),
    ], statWeights: {}, minimums: { constitution: 8, resistance: 6 } },
    sage: { name: "Sage", tier: 4, actions: [
        physicalAttack("staffStrike", 1, 4),
        byRank(rank => magicalAttack("mindBlast", 2, rank === 3 ? 5 : 4, { concentration: 2, bonusDamage: rank === 1 ? 1 : 2 })),
        byRank(rank => healing("restore", 2, rank === 1 ? 3 : 4, { concentration: 2, cooldown: rank === 3 ? 0 : 1 })),
        byRank(rank => statusAction("arcaneInsight", 3, 3, { concentration: 3, cooldown: rank === 3 ? 1 : 2 }, "ally", effect("damageUp", rank === 1 ? 2 : 3, 2))),
        byRank(rank => areaAction("timeSlow", 3, 4, { concentration: 3, cooldown: rank === 3 ? 2 : 3 }, { shape: { kind: "radius", size: 2 }, effect: effect("slow", rank === 1 ? 1 : 2, 2) })),
        byRank(rank => statusAction("mentalShield", 2, 3, { concentration: 2, cooldown: rank === 3 ? 2 : 3 }, "ally", effect("immune", rank === 1 ? 1 : 2))),
    ], statWeights: {}, minimums: { knowledge: 8, intelligence: 6 } },
    ranger: { name: "Ranger", tier: 4, actions: [
        physicalAttack("longShot", 1, 5),
        byRank(rank => physicalAttack("aimedShot", 2, 6, { cooldown: rank === 3 ? 0 : 1, bonusDamage: rank === 1 ? 2 : 3 })),
        byRank(rank => areaAction("multiShot", 3, 5, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "square", size: 2 }, damage: "physical" })),
        byRank(rank => groundZoneAction("trap", 2, { cooldown: rank === 3 ? 2 : 3 }, 1, rank === 1 ? 2 : 3, { kind: "root", amount: 0, turns: 1 }, 4)),
        byRank(rank => moveAction("evasiveShot", 2, 4, { cooldown: rank === 3 ? 1 : 2 }, { kind: "retreat", cells: rank === 1 ? 2 : 3, damage: true })),
        byRank(rank => moveAction("piercingArrow", 3, 5, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank === 1 ? 1 : 2 }, { kind: "push", cells: 1, damage: true, line: true })),
    ], statWeights: {}, minimums: { dexterity: 8, perception: 6 } },
    marksman: { name: "Marksman", tier: 4, actions: [
        physicalAttack("snipe", 1, 6),
        byRank(rank => physicalAttack("headShot", 3, 6, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank === 1 ? 2 : 3, bonusCrit: 0.3 })),
        byRank(rank => physicalAttack("pinningShot", 2, rank === 1 ? 5 : 6, { cooldown: rank === 3 ? 2 : 3 }, effect("root", 1))),
        byRank(rank => physicalAttack("deadeye", 3, 7, { cooldown: rank === 3 ? 2 : 3, bonusDamage: rank === 1 ? 5 : 6 })),
        byRank(rank => moveAction("repositionningShot", 2, 5, { cooldown: rank === 3 ? 1 : 2 }, { kind: "retreat", cells: rank === 1 ? 2 : 3, damage: true })),
        byRank(rank => areaAction("suppressingFire", 3, 5, { cooldown: rank === 3 ? 2 : 3, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "square", size: 2 }, damage: "physical", effect: effect("slow", 1, 2) })),
    ], statWeights: {}, minimums: { perception: 8, dexterity: 6 } },
    warlord: { name: "Warlord", tier: 4, actions: [
        physicalAttack("warStrike", 1, 1),
        byRank(rank => statusAction("battleOrder", 2, 3, { cooldown: rank === 3 ? 1 : 2 }, "ally", effect("damageUp", 2, rank === 1 ? 1 : 2))),
        byRank(rank => statusAction("rallyingCry", 2, 3, { cooldown: rank === 3 ? 1 : 2 }, "ally", effect("resistanceUp", 2, rank === 1 ? 2 : 3))),
        byRank(rank => tauntAction("warlordChallenge", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 2 : 3 }, 2)),
        byRank(rank => physicalAttack("crushingBlow", 3, 1, { cooldown: rank === 3 ? 2 : 3, bonusDamage: rank > 1 ? 1 : 0 }, effect("stun", 1))),
        byRank(rank => moveAction("forwardMarch", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", damage: true, targets: "any" })),
    ], statWeights: {}, minimums: { strength: 9, willpower: 7, constitution: 5 } },
    paladin: { name: "Paladin", tier: 4, actions: [
        physicalAttack("holyStrike", 1, 2),
        byRank(rank => healing("layOnHands", 2, rank === 1 ? 1 : 2, { concentration: 2, cooldown: rank === 3 ? 1 : 2 })),
        byRank(rank => statusAction("divineShield", 2, 2, { concentration: 2, cooldown: 2 }, "ally", effect("resistanceUp", rank === 3 ? 2 : 1, rank === 1 ? 3 : 4))),
        byRank(rank => statusAction("guardian", 3, rank === 1 ? 2 : 3, { cooldown: rank === 3 ? 2 : 3 }, "ally", user => ({ kind: "protected", amount: 0, turns: 1, source: user }))),
        byRank(rank => tauntAction("holyChallenge", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 2 : 3 }, 2)),
        byRank(rank => groundZoneAction("consecrate", 3, { concentration: 3, cooldown: 3 }, rank === 1 ? 2 : 3, rank === 3 ? 3 : 2, { kind: "burn", amount: 0, turns: 1 })),
    ], statWeights: {}, minimums: { resistance: 8, willpower: 7, constitution: 5, strength: 5 } },
    gladiator: { name: "Gladiator", tier: 4, actions: [
        physicalAttack("gladiusStrike", 1, 1),
        byRank(rank => statusAction("netThrow", 2, rank === 1 ? 3 : 4, { cooldown: 3 }, "enemy", effect("root", rank === 3 ? 2 : 1))),
        byRank(rank => statusAction("crowdPleaser", 2, 0, { cooldown: rank === 3 ? 2 : 3 }, "self", effect("damageUp", rank === 1 ? 2 : 3, 2))),
        byRank(rank => areaAction("arenaSweep", 2, 1, { cooldown: rank === 3 ? 0 : 1, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "sweep" }, damage: "physical" })),
        byRank(rank => moveAction("tridentPull", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 1 : 2 }, { kind: "pull", damage: true, line: true })),
        byRank(rank => statusAction("riposte", 2, 0, { cooldown: 2 }, "self", effect("riposte", rank === 3 ? 2 : 1, rank === 1 ? 0 : 1))),
    ], statWeights: {}, minimums: { constitution: 9, strength: 7, dexterity: 5 } },
    inquisitor: { name: "Inquisitor", tier: 4, actions: [
        physicalAttack("maceStrike", 1, 2),
        byRank(rank => magicalAttack("judgment", 2, 3, { concentration: 2, cooldown: rank === 3 ? 0 : 1, bonusDamage: rank === 1 ? 2 : 3 })),
        byRank(rank => magicalAttack("holyFire", 2, 3, { concentration: 2, cooldown: rank === 1 ? 3 : 2 }, effect("burn", rank === 3 ? 4 : 3))),
        byRank(rank => magicalAttack("condemn", 3, rank === 1 ? 3 : 4, { concentration: 2, cooldown: rank === 3 ? 2 : 3 }, effect("root", 1))),
        byRank(rank => willpowerDrain("interrogate", 2, rank === 1 ? 2 : 3, { concentration: 2 }, rank === 3 ? 3 : 2)),
        byRank(rank => moveAction("zealotCharge", 2, rank === 1 ? 3 : 4, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", line: true, damage: true })),
    ], statWeights: {}, minimums: { willpower: 9, strength: 7, intelligence: 5 } },
    runesmith: { name: "Runesmith", tier: 4, actions: [
        physicalAttack("runeHammer", 1, 2),
        byRank(rank => magicalAttack("runeBlast", 2, rank === 3 ? 4 : 3, { concentration: 2, bonusDamage: rank > 1 ? 1 : 0 })),
        hybridAttack("runeStrike", 2, 1, { concentration: 1 }),
        byRank(rank => statusAction("forgeRune", 3, rank === 1 ? 2 : 3, { concentration: 3, cooldown: 2 }, "ally", effect("damageUp", rank === 3 ? 3 : 2, 2))),
        byRank(rank => statusAction("wardRune", 2, rank === 1 ? 2 : 3, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, "ally", effect("resistanceUp", 2, 3))),
        byRank(rank => groundZoneAction("trapRune", 3, { concentration: 3, cooldown: 3 }, rank === 1 ? 1 : 2, rank === 3 ? 3 : 2, { kind: "root", amount: 0, turns: 1 }, 4)),
    ], statWeights: {}, minimums: { knowledge: 9, strength: 6, intelligence: 6 } },
    spellblade: { name: "Spellblade", tier: 4, actions: [
        physicalAttack("spellSlash", 1, 2),
        hybridAttack("spellStrike", 2, 1, { concentration: 1, bonusDamage: 1 }),
        byRank(rank => areaAction("arcaneBurst", 3, 2, { concentration: 3, cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "radius", size: 1 }, damage: "magic" })),
        byRank(rank => moveAction("blinkStrike", 2, rank === 1 ? 4 : 5, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", damage: true })),
        byRank(rank => moveAction("windPull", 2, rank === 1 ? 4 : 5, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, { kind: "pull", line: true })),
        byRank(rank => statusAction("arcaneGuard", 2, 0, { concentration: 1, cooldown: rank === 3 ? 1 : 2 }, "self", effect("resistanceUp", 1, rank === 1 ? 3 : 4))),
    ], statWeights: {}, minimums: { intelligence: 9, dexterity: 7, strength: 5 } },
    assassin: { name: "Assassin", tier: 4, actions: [
        physicalAttack("backstab", 1, 1, { bonusCrit: 0.2 }),
        byRank(rank => physicalAttack("poisonedBlade", 2, 1, { cooldown: rank === 3 ? 1 : 2 }, effect("poison", rank === 1 ? 3 : 4))),
        byRank(rank => moveAction("shadowStep", 2, rank === 1 ? 4 : 5, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", damage: true, targets: "any" })),
        byRank(rank => physicalAttack("assassinate", 3, 1, { cooldown: rank === 3 ? 2 : 3, bonusDamage: rank === 1 ? 4 : 5, bonusCrit: 0.3 })),
        byRank(rank => statusAction("smokeBomb", 2, 0, { cooldown: rank === 3 ? 2 : 3 }, "self", effect("immune", rank === 1 ? 1 : 2))),
        byRank(rank => physicalAttack("cripplingStrike", 2, 1, { cooldown: rank === 3 ? 1 : 2 }, effect("slow", 2, rank === 1 ? 2 : 3))),
    ], statWeights: {}, minimums: { dexterity: 9, perception: 7, strength: 5 } },
    beastmaster: { name: "Beastmaster", tier: 4, actions: [
        physicalAttack("beastClaw", 1, 1),
        byRank(rank => moveAction("beastCharge", 2, rank === 1 ? 4 : 5, { cooldown: rank === 3 ? 1 : 2 }, { kind: "dash", line: true, damage: true })),
        byRank(rank => physicalAttack("maul", 3, 1, { cooldown: rank === 3 ? 2 : 3, bonusDamage: rank > 1 ? 1 : 0 }, effect("stun", 1))),
        byRank(rank => willpowerDrain("terrify", 2, rank === 1 ? 3 : 4, {}, rank === 3 ? 3 : 2)),
        byRank(rank => statusAction("packHunt", 2, 3, { cooldown: rank === 3 ? 1 : 2 }, "ally", effect("damageUp", 2, rank === 1 ? 1 : 2))),
        byRank(rank => statusAction("thickHide", 2, 0, { cooldown: rank === 3 ? 1 : 2 }, "self", effect("resistanceUp", 2, rank === 1 ? 2 : 3))),
    ], statWeights: {}, minimums: { perception: 8, willpower: 7, constitution: 5, dexterity: 5 } },

    ravager: { name: "Ravager", tier: 5, actions: [
        physicalAttack("ravage", 1, 1, { bonusDamage: 1 }),
        byRank(rank => statusAction("rage", 2, 0, { cooldown: rank === 3 ? 2 : 3 }, "self", effect("damageUp", 2, rank === 1 ? 3 : 4))),
        byRank(rank => areaAction("whirlwind", 3, 0, { cooldown: rank === 3 ? 1 : 2, bonusDamage: rank === 1 ? 1 : 2 }, { shape: { kind: "radius", size: 1 }, damage: "physical" })),
        byRank(rank => moveAction("bloodCharge", 2, rank === 1 ? 4 : 5, { cooldown: rank === 3 ? 1 : 2, bonusDamage: 1 }, { kind: "dash", damage: true })),
        byRank(rank => statusAction("ignorePain", 2, 0, { cooldown: rank === 3 ? 2 : 3 }, "self", effect("immune", 2))),
        byRank(rank => physicalAttack("devastate", 4, 1, { cooldown: rank === 3 ? 3 : 4, bonusDamage: rank === 1 ? 5 : 6 }, effect("stun", 1))),
    ], statWeights: {}, evolvesFrom: "berserker", requiredItem: "bloodTotem" },
    archmage: { name: "Archmage", tier: 5, actions: [
        physicalAttack("staffStrike", 1, 5, { bonusDamage: 1 }),
        byRank(rank => magicalAttack("lightningBolt", 2, 6, { concentration: 2, cooldown: rank === 3 ? 0 : 1, bonusDamage: rank === 1 ? 3 : 4 })),
        byRank(rank => areaAction("fireball", 3, 5, { concentration: 3, cooldown: rank === 3 ? 1 : 2, bonusDamage: rank === 1 ? 1 : 2 }, { shape: { kind: "radius", size: 1 }, damage: "magic", effect: effect("burn", 2) })),
        byRank(rank => areaAction("frostNova", 3, 4, { concentration: 3, cooldown: rank === 3 ? 1 : 2, bonusDamage: rank > 1 ? 1 : 0 }, { shape: { kind: "radius", size: 1 }, damage: "magic", effect: effect("slow", 1, 3) })),
        byRank(rank => areaAction("timeSlow", 3, 5, { concentration: 3, cooldown: rank === 3 ? 2 : 3 }, { shape: { kind: "radius", size: 2 }, effect: effect("slow", 2, rank === 1 ? 2 : 3) })),
        byRank(rank => areaAction("meteor", 4, 5, { concentration: 5, cooldown: rank === 3 ? 3 : 4, bonusDamage: rank === 1 ? 2 : 3 }, { shape: { kind: "radius", size: 2 }, damage: "magic", effect: effect("burn", 2) })),
    ], statWeights: {}, evolvesFrom: "elementalist", requiredItem: "elementalCore" },
    saint: { name: "Saint", tier: 5, actions: [
        physicalAttack("maceStrike", 1, 3, { bonusDamage: 1 }),
        byRank(rank => healing("divineHealing", 2, rank === 1 ? 4 : 5, { concentration: rank === 3 ? 1 : 2 }, 1)),
        byRank(rank => magicalAttack("smite", 2, rank === 3 ? 5 : 4, { concentration: 1, bonusDamage: rank === 1 ? 1 : 2 })),
        byRank(rank => cure("purge", 1, rank === 1 ? 4 : 5, { concentration: 2, cooldown: rank === 3 ? 0 : 1 })),
        byRank(rank => statusAction("holyWard", 2, 4, { concentration: 2, cooldown: rank === 3 ? 1 : 2 }, "ally", effect("resistanceUp", 2, rank === 1 ? 3 : 4))),
        byRank(rank => statusAction("prayerOfMight", 3, 4, { concentration: 3, cooldown: rank === 3 ? 2 : 3 }, "ally", effect("damageUp", 2, rank === 1 ? 2 : 3))),
        byRank(rank => healing("divineIntervention", 3, rank === 1 ? 4 : 5, { concentration: 4, cooldown: rank === 3 ? 3 : 4 }, 1, effect("immune", 2))),
    ], statWeights: {}, evolvesFrom: "cleric", requiredItem: "holyRelic" },
}

export const rarityTier: Record<Rarity, number> = {
    common: 1,
    uncommon: 2,
    rare: 3,
    legendary: 4,
}

export const rarityTierCap: Record<Rarity, number> = {
    common: 3,
    uncommon: 4,
    rare: 4,
    legendary: 5,
}

export const classChangeLevel = 6

export const maxClassChanges = 1

export function canChangeClass(character: Character) {
    return character.level >= classChangeLevel
        && character.classChanges.length < maxClassChanges
        && character.championsDefeated.some(chapter => !character.classChanges.includes(chapter))
}

export function classChangeOffers(character: Character, inventory: string[]) {
    const current = character.characterClass ? characterClasses[character.characterClass] : undefined
    if (!current)
        return []
    const keys = Object.keys(characterClasses)
    if (character.rarity === "legendary")
        return keys.filter(key => {
            const characterClass = characterClasses[key]
            return characterClass.evolvesFrom === character.characterClass && (!characterClass.requiredItem || inventory.includes(characterClass.requiredItem))
        })
    const tier = current.tier + 1
    if (tier > rarityTierCap[character.rarity])
        return []
    const path = keys.filter(key => characterClasses[key].tier === tier && characterClasses[key].evolvesFrom === character.characterClass && !characterClasses[key].requiredItem)
    const eligible = keys.filter(key => characterClasses[key].tier === tier && characterClasses[key].minimums && missingStats(character, key).length === 0)
    return [...new Set([...path, ...eligible])]
}

export function missingStats(character: Character, classKey: string) {
    return Object.entries(characterClasses[classKey].minimums ?? {})
        .filter(([stat, value]) => character.stats[stat as keyof Stats] < value)
        .map(([stat, value]) => [stat, value - character.stats[stat as keyof Stats]] as [keyof Stats, number])
}

export function closestClasses(character: Character, count = 3) {
    const current = character.characterClass ? characterClasses[character.characterClass] : undefined
    if (!current || character.rarity === "legendary" || current.tier + 1 > rarityTierCap[character.rarity])
        return []
    const missing = (key: string) => missingStats(character, key).reduce((sum, [, value]) => sum + value, 0)
    return Object.keys(characterClasses)
        .filter(key => characterClasses[key].tier === current.tier + 1 && characterClasses[key].minimums)
        .sort((a, b) => missing(a) - missing(b))
        .slice(0, count)
}

export function applyClassChange(character: Character, classKey: string, inventory: string[]) {
    const chapter = character.championsDefeated.find(chapter => !character.classChanges.includes(chapter))
    const requiredItem = characterClasses[classKey].requiredItem
    if (!chapter || (requiredItem && !inventory.includes(requiredItem)))
        return false
    if (requiredItem)
        inventory.splice(inventory.indexOf(requiredItem), 1)
    const previousClass = character.characterClass
    character.characterClass = classKey
    character.classChanges.push(chapter)
    upgradeSkillsForClass(character, previousClass)
    return true
}

export const talentChance = 0.25
export const talentWeight = 4

import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url';
import characterAsset from '../public/assets/roughCharacter.glb?url';
import { Group } from "three";
import { Levels } from "./level";
import { basicAttack, effect, magicalAttack, physicalAttack } from "./action";
import { allHeroesDefeated, anyOf, keepAlive, pieceDefeated, reachCells, roundLimit, surviveRounds } from "./endCondition";
import { approachTarget, createBehavior, delayedInitiative, nearestFirstInitiative, nearestTarget, randomInitiative, stayBehind, stayBehindAllies, weakestInRange } from "./aiBehavior";
import { Piece } from "./piece";

const goblinBehavior = createBehavior({
    chooseTarget: nearestTarget,
    chooseDestination: approachTarget,
    initiative: randomInitiative,
})

const goblinChiefBehavior = createBehavior({
    chooseTarget: weakestInRange,
    chooseDestination: stayBehindAllies,
    initiative: randomInitiative,
})

const banditBehavior = createBehavior({
    chooseTarget: nearestTarget,
    chooseDestination: approachTarget,
    initiative: nearestFirstInitiative,
})

const marcoBehavior = createBehavior({
    chooseTarget: nearestTarget,
    chooseDestination: approachTarget,
    initiative: delayedInitiative(1000),
})

const banditApprenticeBehavior = createBehavior({
    chooseTarget: nearestTarget,
    chooseDestination: stayBehind((ally: Piece) => ally.config.name === "Marco"),
    initiative: delayedInitiative(2000),
})

const loader = new GLTFLoader();

export const gltf = await loader.loadAsync(asset)

const characterGltf = await loader.loadAsync(characterAsset)
const characterModel = new Group()
characterGltf.scene.scale.setScalar(0.4)
characterGltf.scene.position.x = -0.12 * 0.4
characterModel.add(characterGltf.scene)

const heroModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0x4f7fe0 }
const championModel = new Group()
const championScene = characterGltf.scene.clone()
championScene.scale.setScalar(0.5)
championScene.position.x = -0.12 * 0.5
championModel.add(championScene)

const goblinModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0x7cc456 }
const banditModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0xc0602a }
const banditLeaderModel = { obj: championModel, offset: 0, animations: characterGltf.animations, color: 0x8a2b1a }
const goblinAdultModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0x4f8f35 }
const goblinChiefModel = { obj: championModel, offset: 0, animations: characterGltf.animations, color: 0x3d7a28 }
const goblinBruteModel = { obj: championModel, offset: 0, animations: characterGltf.animations, color: 0x4f8f35 }
const villagerModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0xd8b27a }

export const levels = new Levels({
    map1: gltf.scenes.find(d => d.name == '1Map')!
}, {
    hero: {
        name: "Hero",
        rarity: "common",
        ...heroModel,
        actions: [basicAttack],
    },
    goblinYoung: {
        name: "Young Goblin",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [physicalAttack("goblinStab", 1, 1)],
        ...goblinModel,
    },
    goblinWarrior: {
        name: "Goblin Warrior",
        rarity: "rare",
        behavior: goblinBehavior,
        actions: [physicalAttack("goblinSlash", 1, 1)],
        ...goblinAdultModel,
    },
    goblinArcher: {
        name: "Goblin Archer",
        rarity: "rare",
        behavior: goblinBehavior,
        actions: [physicalAttack("goblinShot", 1, 4)],
        ...goblinAdultModel,
    },
    goblinBrute: {
        name: "Goblin Brute",
        rarity: "legendary",
        behavior: goblinBehavior,
        actions: [physicalAttack("bruteSmash", 2, 1, { cooldown: 2, bonusDamage: 2 }, effect("stun", 1)), physicalAttack("goblinSlash", 1, 1)],
        ...goblinBruteModel,
    },
    villager: {
        name: "Villager",
        rarity: "common",
        npc: true,
        actions: [],
        ...villagerModel,
    },
    goblinChief: {
        name: "Goblin Chief",
        rarity: "legendary",
        behavior: goblinChiefBehavior,
        actions: [magicalAttack("hexBolt", 2, 3), physicalAttack("staffStrike", 1, 3)],
        ...goblinChiefModel,
    },
    banditBrawler: {
        name: "Bandit Brawler",
        rarity: "rare",
        characterClass: "brawler",
        behavior: banditBehavior,
        ...banditModel,
    },
    banditMercenary: {
        name: "Bandit Mercenary",
        rarity: "rare",
        characterClass: "mercenary",
        behavior: banditBehavior,
        ...banditModel,
    },
    banditScout: {
        name: "Bandit Scout",
        rarity: "rare",
        characterClass: "scout",
        behavior: banditBehavior,
        ...banditModel,
    },
    banditApprentice: {
        name: "Bandit Apprentice",
        rarity: "rare",
        characterClass: "apprentice",
        behavior: banditApprenticeBehavior,
        ...banditModel,
    },
    banditBerserker: {
        name: "Loyal Berserker",
        rarity: "legendary",
        characterClass: "berserker",
        behavior: banditBehavior,
        ...banditLeaderModel,
    },
    marco: {
        name: "Marco",
        rarity: "legendary",
        characterClass: "warlord",
        behavior: marcoBehavior,
        ...banditLeaderModel,
    },
})

const startCells: [number, number][] = [[14, 2], [15, 2], [16, 2], [15, 1], [14, 1], [16, 1], [14, 0], [15, 0], [16, 0]]
const teamSize = 4
const championMusic = 'championMusic.mp3'

levels.createLevel("chapter1-1", {
    title: "Chapter 1 - 1: First Steps",
    chapter: "chapter1",
    recommendedLevel: 1,
    introduction: true,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [15, 29, "goblinYoung"],
        [15, 28, "goblinYoung"],
        [13, 28, "goblinYoung"],
    ]
})

levels.createLevel("chapter1-2", {
    title: "Chapter 1 - 2: Patrol",
    chapter: "chapter1",
    recommendedLevel: 1,
    introduction: true,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [13, 28, "goblinYoung"],
        [15, 28, "goblinYoung"],
        [17, 28, "goblinYoung"],
        [15, 29, "goblinWarrior"],
    ]
})

levels.createLevel("chapter1-3", {
    title: "Chapter 1 - 3: Ambush",
    chapter: "chapter1",
    recommendedLevel: 2,
    introduction: true,
    map: "map1",
    startCells,
    teamSize,
    victory: surviveRounds(5),
    entities: [
        [10, 1, "goblinYoung"],
        [10, 3, "goblinYoung"],
        [20, 1, "goblinYoung"],
        [20, 3, "goblinYoung"],
        [13, 6, "goblinYoung"],
        [15, 6, "goblinYoung"],
        [17, 6, "goblinYoung"],
        [11, 5, "goblinWarrior"],
        [19, 5, "goblinWarrior"],
    ]
})

levels.createLevel("chapter1-4", {
    title: "Chapter 1 - 4: Scouts",
    chapter: "chapter1",
    recommendedLevel: 2,
    introduction: true,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [13, 28, "goblinYoung"],
        [15, 28, "goblinYoung"],
        [17, 28, "goblinYoung"],
        [14, 29, "goblinWarrior"],
        [16, 29, "goblinArcher"],
    ]
})

levels.createLevel("chapter1-5", {
    title: "Chapter 1 - 5: The Brute (Mini-boss)",
    chapter: "chapter1",
    recommendedLevel: 3,
    introduction: true,
    music: championMusic,
    map: "map1",
    startCells,
    teamSize,
    defeat: anyOf(allHeroesDefeated, keepAlive("Villager", "the villager")),
    entities: [
        [15, 11, "villager", true],
        [15, 21, "goblinBrute"],
        [13, 20, "goblinYoung"],
        [17, 20, "goblinYoung"],
    ]
})

levels.createLevel("chapter1-6", {
    title: "Chapter 1 - 6: Into the Woods",
    chapter: "chapter1",
    recommendedLevel: 3,
    map: "map1",
    startCells,
    teamSize,
    victory: reachCells([[14, 22], [15, 22], [16, 22]]),
    entities: [
        [12, 10, "goblinYoung"],
        [18, 10, "goblinYoung"],
        [15, 16, "goblinYoung"],
        [13, 20, "goblinWarrior"],
        [17, 20, "goblinWarrior"],
        [15, 26, "goblinArcher"],
    ]
})

levels.createLevel("chapter1-7", {
    title: "Chapter 1 - 7: Village Defense",
    chapter: "chapter1",
    recommendedLevel: 4,
    map: "map1",
    startCells,
    teamSize,
    victory: surviveRounds(6),
    defeat: anyOf(allHeroesDefeated, keepAlive("Villager", "the villagers", 2)),
    entities: [
        [14, 4, "villager", true],
        [16, 4, "villager", true],
        [10, 10, "goblinYoung"],
        [13, 11, "goblinYoung"],
        [17, 11, "goblinYoung"],
        [20, 10, "goblinYoung"],
        [15, 13, "goblinYoung"],
        [12, 13, "goblinWarrior"],
        [18, 13, "goblinWarrior"],
        [15, 17, "goblinArcher"],
    ]
})

levels.createLevel("chapter1-8", {
    title: "Chapter 1 - 8: Camp Outskirts",
    chapter: "chapter1",
    recommendedLevel: 4,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [12, 27, "goblinYoung"],
        [15, 27, "goblinYoung"],
        [18, 27, "goblinYoung"],
        [13, 28, "goblinWarrior"],
        [17, 28, "goblinWarrior"],
        [15, 29, "goblinArcher"],
    ]
})

levels.createLevel("chapter1-9", {
    title: "Chapter 1 - 9: Raise the Alarm",
    chapter: "chapter1",
    recommendedLevel: 5,
    map: "map1",
    startCells,
    teamSize,
    defeat: anyOf(allHeroesDefeated, roundLimit(7)),
    entities: [
        [12, 18, "goblinYoung"],
        [15, 18, "goblinYoung"],
        [18, 18, "goblinYoung"],
        [15, 21, "goblinYoung"],
        [12, 22, "goblinWarrior"],
        [18, 22, "goblinWarrior"],
        [13, 26, "goblinArcher"],
        [17, 26, "goblinArcher"],
    ]
})

levels.createLevel("chapter1-10", {
    title: "Chapter 1 - 10: Goblin Chief (Champion)",
    chapter: "chapter1",
    recommendedLevel: 6,
    finale: true,
    music: championMusic,
    map: "map1",
    startCells,
    teamSize,
    victory: pieceDefeated("Goblin Chief", "the Goblin Chief"),
    entities: [
        [15, 29, "goblinChief"],
        [13, 27, "goblinYoung"],
        [17, 27, "goblinYoung"],
        [12, 28, "goblinWarrior"],
        [18, 28, "goblinWarrior"],
        [13, 29, "goblinArcher"],
        [17, 29, "goblinArcher"],
    ]
})

levels.createLevel("chapter2-1", {
    title: "Chapter 2 - 1",
    chapter: "chapter2",
    recommendedLevel: 6,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [13, 28, "banditBrawler"],
        [17, 28, "banditBrawler"],
        [15, 29, "banditScout"],
    ]
})

levels.createLevel("chapter2-2", {
    title: "Chapter 2 - 2",
    chapter: "chapter2",
    recommendedLevel: 7,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [13, 28, "banditBrawler"],
        [17, 28, "banditBrawler"],
        [15, 28, "banditMercenary"],
        [15, 29, "banditScout"],
    ]
})

levels.createLevel("chapter2-3", {
    title: "Chapter 2 - 3",
    chapter: "chapter2",
    recommendedLevel: 7,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [12, 28, "banditBrawler"],
        [18, 28, "banditBrawler"],
        [14, 28, "banditMercenary"],
        [16, 28, "banditMercenary"],
        [15, 29, "banditScout"],
    ]
})

levels.createLevel("chapter2-4", {
    title: "Chapter 2 - 4 (Loyal Berserker)",
    chapter: "chapter2",
    recommendedLevel: 8,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [15, 27, "banditBerserker"],
        [12, 28, "banditBrawler"],
        [18, 28, "banditBrawler"],
        [15, 28, "banditMercenary"],
        [13, 29, "banditScout"],
        [17, 29, "banditScout"],
    ]
})

levels.createLevel("chapter2-5", {
    title: "Chapter 2 - 5 (Marco)",
    chapter: "chapter2",
    recommendedLevel: 8,
    finale: true,
    music: championMusic,
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [15, 28, "marco"],
        [13, 27, "banditBrawler"],
        [17, 27, "banditBrawler"],
        [12, 28, "banditMercenary"],
        [18, 28, "banditMercenary"],
        [14, 29, "banditApprentice"],
        [16, 29, "banditApprentice"],
    ]
})

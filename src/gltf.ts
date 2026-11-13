import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url';
import characterAsset from '../public/assets/roughCharacter.glb?url';
import { Group } from "three";
import { Levels } from "./level";
import { basicAttack, magicalAttack, physicalAttack } from "./action";
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

export const levels = new Levels({
    map1: gltf.scenes.find(d => d.name == '1Map')!
}, {
    hero: {
        name: "Hero",
        rarity: "common",
        attackRange: 1,
        ...heroModel,
        actions: [basicAttack],
    },
    goblinYoung: {
        name: "Young Goblin",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [physicalAttack("goblinStab", 1)],
        attackRange: 1,
        ...goblinModel,
    },
    goblinWarrior: {
        name: "Goblin Warrior",
        rarity: "rare",
        behavior: goblinBehavior,
        actions: [physicalAttack("goblinSlash", 1)],
        attackRange: 1,
        ...goblinAdultModel,
    },
    goblinArcher: {
        name: "Goblin Archer",
        rarity: "rare",
        behavior: goblinBehavior,
        actions: [physicalAttack("goblinShot", 1)],
        attackRange: 4,
        ...goblinAdultModel,
    },
    goblinChief: {
        name: "Goblin Chief",
        rarity: "legendary",
        behavior: goblinChiefBehavior,
        actions: [magicalAttack("hexBolt", 2), physicalAttack("staffStrike", 1)],
        attackRange: 3,
        ...goblinChiefModel,
    },
    banditBrawler: {
        name: "Bandit Brawler",
        rarity: "rare",
        characterClass: "brawler",
        behavior: banditBehavior,
        attackRange: 1,
        ...banditModel,
    },
    banditMercenary: {
        name: "Bandit Mercenary",
        rarity: "rare",
        characterClass: "mercenary",
        behavior: banditBehavior,
        attackRange: 1,
        ...banditModel,
    },
    banditScout: {
        name: "Bandit Scout",
        rarity: "rare",
        characterClass: "scout",
        behavior: banditBehavior,
        attackRange: 3,
        ...banditModel,
    },
    banditApprentice: {
        name: "Bandit Apprentice",
        rarity: "rare",
        characterClass: "apprentice",
        behavior: banditApprenticeBehavior,
        attackRange: 3,
        ...banditModel,
    },
    banditBerserker: {
        name: "Loyal Berserker",
        rarity: "legendary",
        characterClass: "berserker",
        behavior: banditBehavior,
        attackRange: 1,
        ...banditLeaderModel,
    },
    marco: {
        name: "Marco",
        rarity: "legendary",
        characterClass: "warlord",
        behavior: marcoBehavior,
        attackRange: 1,
        ...banditLeaderModel,
    },
})

const startCells: [number, number][] = [[14, 2], [15, 2], [16, 2], [15, 1], [14, 1], [16, 1], [14, 0], [15, 0], [16, 0]]
const teamSize = 4

levels.createLevel("level1", {
    title: "Chapter 1 - 1",
    chapter: "chapter1",
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [15, 29, "goblinYoung"],
        [15, 28, "goblinYoung"],
        [13, 28, "goblinYoung"],
    ]
})

levels.createLevel("level2", {
    title: "Chapter 1 - 2",
    chapter: "chapter1",
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

levels.createLevel("level3", {
    title: "Chapter 1 - 3",
    chapter: "chapter1",
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

levels.createLevel("level4", {
    title: "Chapter 1 - 4",
    chapter: "chapter1",
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

levels.createLevel("level5", {
    title: "Chapter 1 - 5 (Champion)",
    chapter: "chapter1",
    finale: true,
    map: "map1",
    startCells,
    teamSize,
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

levels.createLevel("level6", {
    title: "Chapter 2 - 1",
    chapter: "chapter2",
    map: "map1",
    startCells,
    teamSize,
    entities: [
        [13, 28, "banditBrawler"],
        [17, 28, "banditBrawler"],
        [15, 29, "banditScout"],
    ]
})

levels.createLevel("level7", {
    title: "Chapter 2 - 2",
    chapter: "chapter2",
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

levels.createLevel("level8", {
    title: "Chapter 2 - 3",
    chapter: "chapter2",
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

levels.createLevel("level9", {
    title: "Chapter 2 - 4 (Loyal Berserker)",
    chapter: "chapter2",
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

levels.createLevel("level10", {
    title: "Chapter 2 - 5 (Marco)",
    chapter: "chapter2",
    finale: true,
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

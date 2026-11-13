import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url';
import characterAsset from '../public/assets/roughCharacter.glb?url';
import { Group } from "three";
import { Levels } from "./level";
import { basicAttack, magicalAttack, physicalAttack } from "./action";
import { approachTarget, createBehavior, nearestTarget, randomInitiative, stayBehindAllies, weakestInRange } from "./aiBehavior";

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
})

const startCells: [number, number][] = [[15, 0], [15, 3], [13, 1], [17, 1]]

levels.createLevel("level1", {
    title: "Chapter 1 - 1",
    chapter: "chapter1",
    map: "map1",
    startCells,
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

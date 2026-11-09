import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url';
import characterAsset from '../public/assets/roughCharacter.glb?url';
import { Group } from "three";
import { Levels } from "./level";
import { basicAttack } from "./action";
import { approachTarget, createBehavior, nearestTarget, randomInitiative } from "./aiBehavior";

const goblinBehavior = createBehavior({
    chooseTarget: nearestTarget,
    chooseDestination: approachTarget,
    initiative: randomInitiative,
})


const loader = new GLTFLoader();

export const gltf = await loader.loadAsync(asset)
console.log(gltf.scenes)

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

const goblinModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0x5fa040 }
const goblinChampionModel = { obj: championModel, offset: 0, animations: characterGltf.animations, color: 0x3d7a28 }

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
    goblinCleric: {
        name: "Goblin Cleric",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        ...goblinModel,
    },
    goblinFigther: {
        name: "Goblin Fighter",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        ...goblinModel,
    },
    goblinTank: {
        name: "Goblin Tank",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        ...goblinModel,
    },
    goblinChampion: {
        name: "Goblin Champion",
        rarity: "legendary",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        ...goblinChampionModel,
    },
    goblinArcher: {
        name: "Goblin Archer",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 4,
        ...goblinModel,
    },
})

const startCells: [number, number][] = [[15, 0], [15, 3], [13, 1], [17, 1]]

levels.createLevel("level1", {
    title: "Chapter 1 - 1",
    chapter: "chapter1",
    map: "map1",
    startCells,
    entities: [
        [15, 29, "goblinTank"],
        [15, 28, "goblinCleric"],
    ]
})

levels.createLevel("level2", {
    title: "Chapter 1 - 2",
    chapter: "chapter1",
    map: "map1",
    startCells,
    entities: [
        [13, 28, "goblinFigther"],
        [15, 29, "goblinTank"],
        [17, 29, "goblinArcher"],
    ]
})

levels.createLevel("level3", {
    title: "Chapter 1 - 3",
    chapter: "chapter1",
    map: "map1",
    startCells,
    entities: [
        [13, 28, "goblinFigther"],
        [15, 28, "goblinTank"],
        [17, 28, "goblinFigther"],
        [15, 29, "goblinCleric"],
    ]
})

levels.createLevel("level4", {
    title: "Chapter 1 - 4",
    chapter: "chapter1",
    map: "map1",
    startCells,
    entities: [
        [12, 27, "goblinFigther"],
        [15, 27, "goblinTank"],
        [18, 27, "goblinFigther"],
        [13, 29, "goblinArcher"],
        [17, 29, "goblinArcher"],
    ]
})

levels.createLevel("level5", {
    title: "Chapter 1 - 5 (Champion)",
    chapter: "chapter1",
    finale: true,
    map: "map1",
    startCells,
    entities: [
        [15, 28, "goblinChampion"],
        [13, 27, "goblinTank"],
        [17, 27, "goblinTank"],
        [12, 29, "goblinArcher"],
        [18, 29, "goblinCleric"],
    ]
})

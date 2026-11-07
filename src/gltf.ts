import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url';
import characterAsset from '../public/assets/roughCharacter.glb?url';
import { Group } from "three";
import { Levels } from "./level";
import { basicAttack, magicAttack } from "./action";
import { aggressiveBehavior } from "./aiBehavior";

const goblinBehavior = aggressiveBehavior


const loader = new GLTFLoader();

export const gltf = await loader.loadAsync(asset)
console.log(gltf.scenes)

const characterGltf = await loader.loadAsync(characterAsset)
const characterModel = new Group()
characterGltf.scene.scale.setScalar(0.4)
characterGltf.scene.position.x = -0.12 * 0.4
characterModel.add(characterGltf.scene)

const heroModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0x4f7fe0 }
const goblinModel = { obj: characterModel, offset: 0, animations: characterGltf.animations, color: 0x5fa040 }

export const levels = new Levels({
    map1: gltf.scenes.find(d => d.name == '1Map')!
}, {
    cleric: {
        offset: 0.1,
        name: "Cleric",
        rarity: "rare",
        attackRange: 3,
        ...heroModel,
        actions: [basicAttack, magicAttack, {
            action(game) {
                const piece = game.selector.selected
                if (!piece)
                    return
                piece.healt -= 2

            },
            name: "allo",
            cost: 2,
        }, {
            action(game) {
                console.log((game.selector.selected as any).healt)
            },
            name: "log life",
            cost: 0,
        }]

    },
    figther: {
        offset: 0.1,
        name: "Fighter",
        rarity: "rare",
        actions: [basicAttack],
        attackRange: 1,
        ...heroModel,
    },
    tank: {
        offset: 0.1,
        name: "Tank",
        rarity: "rare",
        actions: [basicAttack],
        attackRange: 1,
        ...heroModel,
    },
    archer: {
        offset: 0.1,
        name: "Archer",
        rarity: "rare",
        actions: [basicAttack],
        attackRange: 4,
        ...heroModel,
    },
    goblinCleric: {
        offset: 0.1,
        name: "Goblin Cleric",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        ...goblinModel,
    },
    goblinFigther: {
        offset: 0.1,
        name: "Goblin Fighter",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        ...goblinModel,
    },
    goblinTank: {
        offset: 0.1,
        name: "Goblin Tank",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        ...goblinModel,
    },
    goblinArcher: {
        offset: 0.1,
        name: "Goblin Archer",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 4,
        ...goblinModel,
    },
})

levels.createLevel("level1", {
    title: "level1",
    map: "map1",
    entities: [
        [15, 0, "cleric", true],
        [15, 3, "figther", true],
        [15, 29, "goblinTank"],
        [15, 28, "goblinCleric"],
    ]
})
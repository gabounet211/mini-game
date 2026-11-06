import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url';
import { Levels } from "./level";
import { basicAttack } from "./action";
import { aggressiveBehavior } from "./aiBehavior";

const goblinBehavior = aggressiveBehavior


const loader = new GLTFLoader();

export const gltf = await loader.loadAsync(asset)
console.log(gltf.scenes)

export const levels = new Levels({
    map1: gltf.scenes.find(d => d.name == '1Map')!
}, {
    cleric: {
        offset: 0.1,
        name: "Cleric",
        rarity: "rare",
        attackRange: 3,
        obj: gltf.scenes.find(d => d.name == 'cleric')!,
        actions: [basicAttack, {
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
        obj: gltf.scenes.find(d => d.name == 'fighter')!
    },
    tank: {
        offset: 0.1,
        name: "Tank",
        rarity: "rare",
        actions: [basicAttack],
        attackRange: 1,
        obj: gltf.scenes.find(d => d.name == 'tank')!
    },
    archer: {
        offset: 0.1,
        name: "Archer",
        rarity: "rare",
        actions: [basicAttack],
        attackRange: 4,
        obj: gltf.scenes.find(d => d.name == 'archer')!
    },
    goblinCleric: {
        offset: 0.1,
        name: "Goblin Cleric",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        obj: gltf.scenes.find(d => d.name == 'goblinCleric')!
    },
    goblinFigther: {
        offset: 0.1,
        name: "Goblin Fighter",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        obj: gltf.scenes.find(d => d.name == 'goblinFighter')!
    },
    goblinTank: {
        offset: 0.1,
        name: "Goblin Tank",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 1,
        obj: gltf.scenes.find(d => d.name == 'goblinTank')!
    },
    goblinArcher: {
        offset: 0.1,
        name: "Goblin Archer",
        rarity: "common",
        behavior: goblinBehavior,
        actions: [basicAttack],
        attackRange: 4,
        obj: gltf.scenes.find(d => d.name == 'goblinArcher')!
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
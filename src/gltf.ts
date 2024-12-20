import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url';
import { Levels } from "./level";


const loader = new GLTFLoader();

export const gltf = await loader.loadAsync(asset)
console.log(gltf.scenes)

export const levels = new Levels({
    map1: gltf.scenes.find(d => d.name == '1Map')!
}, {
    cleric: {
        offset: 0.1,
        maxHealt: 12,
        attackRange: 1,
        moveRange: 5,
        obj: gltf.scenes.find(d => d.name == 'cleric')!,
        actions: [{
            action(game) {
                const piece = game.selector.selected
                if (!piece)
                    return
                piece.healt -= 2

            },
            name: "allo",
        }, {
            action(game) {
                console.log((game.selector.selected as any).healt)
            },
            name: "log life"
        }]

    },
    figther: {
        offset: 0.1,
        maxHealt: 15,
        attackRange: 1,
        moveRange: 7,
        obj: gltf.scenes.find(d => d.name == 'fighter')!
    },
    tank: {
        offset: 0.1,
        maxHealt: 20,
        attackRange: 1,
        moveRange: 3,
        obj: gltf.scenes.find(d => d.name == 'tank')!
    },
    archer: {
        offset: 0.1,
        maxHealt: 10,
        attackRange: 4,
        moveRange: 5,
        obj: gltf.scenes.find(d => d.name == 'archer')!
    },
    goblinCleric: {
        offset: 0.1,
        maxHealt: 12,
        attackRange: 1,
        moveRange: 5,
        obj: gltf.scenes.find(d => d.name == 'goblinCleric')!
    },
    goblinFigther: {
        offset: 0.1,
        maxHealt: 15,
        attackRange: 1,
        moveRange: 7,
        obj: gltf.scenes.find(d => d.name == 'goblinFighter')!
    },
    goblinTank: {
        offset: 0.1,
        maxHealt: 20,
        attackRange: 1,
        moveRange: 3,
        obj: gltf.scenes.find(d => d.name == 'goblinTank')!
    },
    goblinArcher: {
        offset: 0.1,
        maxHealt: 10,
        attackRange: 4,
        moveRange: 5,
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
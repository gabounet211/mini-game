import { GLTFLoader } from "three/addons";
import asset from '../public/assets/assets.gltf?url'
import { PieceEntity } from "./entity";


const loader = new GLTFLoader();
export const gltf = await loader.loadAsync(asset)
console.log(gltf.scenes)

export const map1 = gltf.scenes.find(d => d.name == '1Map')!

export class Cleric extends PieceEntity{
    constructor(){
        super({
            offset: 0.1,
            maxHealt : 12,
            attackRange : 1,
            moveRange : 5,
            obj : gltf.scenes.find(d => d.name == 'cleric')!
        });
    }
}

export class Fighter extends PieceEntity{
    constructor(){
        super({
            offset: 0.1,
            maxHealt : 15,
            attackRange : 1,
            moveRange : 7,
            obj : gltf.scenes.find(d => d.name == 'fighter')!
        });
    }
}

export class Tank extends PieceEntity{
    constructor(){
        super({
            offset: 0.1,
            maxHealt : 20,
            attackRange : 1,
            moveRange : 3,
            obj : gltf.scenes.find(d => d.name == 'tank')!
        });
    }
}

export class Archer extends PieceEntity{
    constructor(){
        super({
            offset: 0.1,
            maxHealt : 10,
            attackRange : 4,
            moveRange : 5,
            obj : gltf.scenes.find(d => d.name == 'archer')!
        });
    }
}

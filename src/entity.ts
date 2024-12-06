import { Object3D, Vector3 } from "three";


export interface Entity {
    obj: Object3D
    offset:number
    to: Vector3
}

export interface PieceConfig{
    obj: Object3D,
    offset: number,

    maxHealt: number,
    attackRange: number,
    moveRange: number,
}

export class PieceEntity implements Entity{
    
    healt: number
    
    offset: number
    obj: Object3D
    to = new Vector3()

    constructor(public config: PieceConfig){
        this.obj = config.obj;
        this.healt = config.maxHealt
        this.offset = config.offset;
    }
}


import { ColorRepresentation, Object3D, Vector3 } from "three";

export interface PieceConfig {
    obj: Object3D,
    offset: number,

    maxHealt: number,
    attackRange: number,
    moveRange: number,
}

export class Piece {
    obj: Object3D

    offset: number
    to = new Vector3()
    
    healt: number

    constructor(public config: PieceConfig) {
        this.obj = config.obj.clone();
        this.healt = config.maxHealt
        this.offset = config.offset;
    }
}

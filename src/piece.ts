import { Object3D, Vector3 } from "three";
import { Action } from "./action";

export interface PieceConfig {
    obj: Object3D,
    offset: number,

    maxHealt: number,
    maxActionPoints: number,
    attackRange: number,
    moveRange: number,
    actions ?: Action[],
}

export class Piece {
    obj: Object3D

    offset: number
    to = new Vector3()
    
    healt: number
    hasMoved = false
    actionPoints: number

    constructor(public config: PieceConfig, public player = false) {
        this.obj = config.obj.clone();
        this.healt = config.maxHealt
        this.actionPoints = config.maxActionPoints
        this.offset = config.offset;
    }
}

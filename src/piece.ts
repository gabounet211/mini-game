import { Object3D, Vector3 } from "three";
import { Action } from "./action";
import { AiBehavior } from "./aiBehavior";
import { deriveAttributes, Rarity, rarityBudget, rollStats, Stats } from "./stats";

export interface PieceConfig {
    obj: Object3D,
    name: string,
    offset: number,

    rarity: Rarity,
    attackRange: number,
    actions ?: Action[],
    behavior ?: AiBehavior,
}

export class Piece {
    obj: Object3D

    offset: number
    to = new Vector3()
    
    hasMoved = false
    actionPoints: number

    stats: Stats
    maxHealt: number
    maxActionPoints: number
    moveRange: number

    private currentHealt: number

    constructor(public config: PieceConfig, public player = false) {
        this.obj = config.obj.clone();
        this.stats = rollStats(rarityBudget[config.rarity])
        const attributes = deriveAttributes(this.stats)
        this.maxHealt = attributes.maxHealt
        this.maxActionPoints = attributes.maxActionPoints
        this.moveRange = attributes.moveRange
        this.currentHealt = this.maxHealt
        this.actionPoints = this.maxActionPoints
        this.offset = config.offset;

    }

    get healt() {
        return this.currentHealt
    }

    set healt(value: number) {
        this.currentHealt = value
    }
}

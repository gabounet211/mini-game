import { Box3, Object3D, Sprite, SpriteMaterial, Vector3 } from "three";
import { Action } from "./action";
import { AiBehavior } from "./aiBehavior";

const barWidth = 0.8
const barHeight = 0.1

export interface PieceConfig {
    obj: Object3D,
    name: string,
    offset: number,

    maxHealt: number,
    maxActionPoints: number,
    attackRange: number,
    moveRange: number,
    actions ?: Action[],
    behavior ?: AiBehavior,
}

export class Piece {
    obj: Object3D

    offset: number
    to = new Vector3()
    
    hasMoved = false
    actionPoints: number

    private currentHealt: number
    private healthFill: Sprite

    constructor(public config: PieceConfig, public player = false) {
        this.obj = config.obj.clone();
        this.currentHealt = config.maxHealt
        this.actionPoints = config.maxActionPoints
        this.offset = config.offset;

        const barTop = new Box3().setFromObject(this.obj).max.y + 0.2
        this.addBarSprite(0x222222, 1, barTop)
        this.healthFill = this.addBarSprite(player ? 0x33cc55 : 0xcc3333, 2, barTop)
    }

    get healt() {
        return this.currentHealt
    }

    set healt(value: number) {
        this.currentHealt = value
        const ratio = Math.max(0, value) / this.config.maxHealt
        this.healthFill.visible = ratio > 0
        this.healthFill.scale.x = barWidth * ratio
        this.healthFill.center.x = 0.5 / Math.max(ratio, 0.0001)
    }

    private addBarSprite(color: number, renderOrder: number, height: number) {
        const sprite = new Sprite(new SpriteMaterial({ color: color, depthTest: false, depthWrite: false }))
        sprite.scale.set(barWidth, barHeight, 1)
        sprite.position.set(0, height, 0)
        sprite.renderOrder = renderOrder
        this.obj.add(sprite)
        return sprite
    }
}

import { AnimationClip, AnimationMixer, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { Action } from "./action";
import { AiBehavior } from "./aiBehavior";
import { DamageKind, damageReduction, deriveAttributes, Rarity, rarityBudget, rollStats, Stats } from "./stats";

export interface PieceConfig {
    obj: Object3D,
    name: string,
    offset: number,

    rarity: Rarity,
    attackRange: number,
    actions ?: Action[],
    behavior ?: AiBehavior,
    animations ?: AnimationClip[],
    color ?: number,
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
    attackRange: number

    private currentHealt: number
    private mixer: AnimationMixer

    constructor(public config: PieceConfig, public player = false) {
        this.obj = config.obj.clone();
        this.stats = rollStats(rarityBudget[config.rarity])
        const attributes = deriveAttributes(this.stats)
        this.maxHealt = attributes.maxHealt
        this.maxActionPoints = attributes.maxActionPoints
        this.moveRange = attributes.moveRange
        this.attackRange = config.attackRange
        this.currentHealt = this.maxHealt
        this.actionPoints = this.maxActionPoints
        this.offset = config.offset;
        if (!player)
            this.obj.rotation.y = Math.PI

        this.obj.traverse(child => {
            if (config.color !== undefined && child instanceof Mesh) {
                child.material = new MeshStandardMaterial({ color: config.color })
            }
        })
        this.mixer = new AnimationMixer(this.obj)
        this.play('idle')

    }

    get healt() {
        return this.currentHealt
    }

    set healt(value: number) {
        this.currentHealt = value
    }

    play(name: string) {
        const clip = this.config.animations?.find(animation => animation.name.toLowerCase() === name)
        if (clip)
            this.mixer.clipAction(clip).play()
    }

    update(delta: number) {
        this.mixer.update(delta)
    }

    takeDamage(amount: number, kind: DamageKind) {
        this.healt -= Math.max(1, amount - damageReduction(this.stats, kind))
    }
}

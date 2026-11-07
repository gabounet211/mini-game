import { AnimationAction, AnimationClip, AnimationMixer, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { Action } from "./action";
import { AiBehavior } from "./aiBehavior";
import { DamageKind, damageReduction, deriveAttributes, Rarity, rarityBudget, rollStats, Stats } from "./stats";

const walkSpeed = 2.5

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
    private currentAction: AnimationAction | undefined
    private path: Vector3[] = []

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
        if (!clip)
            return
        const action = this.mixer.clipAction(clip)
        if (action === this.currentAction)
            return
        this.currentAction?.fadeOut(0.2)
        action.reset().fadeIn(0.2).play()
        this.currentAction = action
    }

    walk(path: Vector3[]) {
        this.path = path
        this.play('walk')
    }

    update(delta: number) {
        this.mixer.update(delta)
        let distance = walkSpeed * delta
        while (this.path.length && distance > 0) {
            const next = this.path[0]
            const direction = next.clone().sub(this.obj.position)
            const length = direction.length()
            if (length > 0.0001)
                this.obj.rotation.y = Math.atan2(direction.x, direction.z)
            if (length <= distance) {
                this.obj.position.copy(next)
                this.path.shift()
                distance -= length
                if (!this.path.length)
                    this.play('idle')
            } else {
                this.obj.position.addScaledVector(direction, distance / length)
                distance = 0
            }
        }
    }

    takeDamage(amount: number, kind: DamageKind) {
        this.healt -= Math.max(1, amount - damageReduction(this.stats, kind))
    }
}

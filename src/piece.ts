import { AnimationAction, AnimationClip, AnimationMixer, LoopOnce, LoopRepeat, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { Action } from "./action";
import { AiBehavior } from "./aiBehavior";
import { DamageKind, damageReduction, deriveAttributes, Rarity, Stats } from "./stats";
import { Character } from "./character";
import { characterClasses } from "./characterClass";
import { equippedStats } from "./items";
import { burnDamage, effectStatChanges, EffectKind, harmfulEffects, poisonDamage, StatusEffect } from "./effect";

const walkSpeed = 1.5
const walkAnimationSpeed = 2
const hitDelay = 0.5

export interface PieceConfig {
    obj: Object3D,
    name: string,
    offset: number,

    rarity: Rarity,
    characterClass?: string,
    actions ?: Action[],
    behavior ?: AiBehavior,
    animations ?: AnimationClip[],
    color ?: number,
}

export class Piece {
    obj: Object3D

    offset: number
    to = new Vector3()
    
    movePoints: number
    actionPoints: number
    concentration: number
    maxConcentration: number
    usesConcentration: boolean
    cooldowns = new Map<Action, number>()
    usedThisTurn = new Set<Action>()

    stats: Stats
    baseStats: Stats
    effects: StatusEffect[] = []
    maxHealt: number
    maxActionPoints: number
    moveRange: number
    actions: Action[]
    name: string
    inspiresAllies: boolean

    kills = 0
    lastAttacker: Piece | undefined

    private currentHealt: number
    private mixer: AnimationMixer
    private currentAction: AnimationAction | undefined
    private path: Vector3[] = []
    private playingOnce = false
    private dead = false
    private waiting: (() => void)[] = []

    constructor(public config: PieceConfig, public character: Character, public player = false) {
        this.obj = config.obj.clone();
        this.baseStats = equippedStats(character)
        this.stats = { ...this.baseStats }
        const attributes = deriveAttributes(this.stats)
        this.maxHealt = attributes.maxHealt
        this.maxActionPoints = attributes.maxActionPoints
        this.moveRange = attributes.moveRange
        const characterClass = character.characterClass ? characterClasses[character.characterClass] : undefined
        this.actions = characterClass?.actions ?? config.actions ?? []
        this.name = config.characterClass ? config.name : characterClass?.name ?? config.name
        this.inspiresAllies = !!characterClass?.inspiresAllies
        this.currentHealt = this.maxHealt
        this.actionPoints = this.maxActionPoints
        this.movePoints = this.moveRange
        this.maxConcentration = attributes.maxConcentration
        this.concentration = this.maxConcentration
        this.usesConcentration = this.actions.some(action => action.concentration)
        this.offset = config.offset;
        if (!player)
            this.obj.rotation.y = Math.PI

        this.obj.traverse(child => {
            if (config.color !== undefined && child instanceof Mesh) {
                child.material = new MeshStandardMaterial({ color: config.color })
            }
        })
        this.mixer = new AnimationMixer(this.obj)
        this.mixer.addEventListener('finished', event => {
            if (event.action !== this.currentAction)
                return
            this.playingOnce = false
            if (this.dead) {
                this.resolveWaiting()
                return
            }
            if (this.path.length)
                this.play('walk', walkAnimationSpeed)
            else
                this.play('idle')
            this.resolveWaiting()
        })
        this.play('idle')

    }

    get healt() {
        return this.currentHealt
    }

    set healt(value: number) {
        this.currentHealt = value
    }

    play(name: string, timeScale = 1, once = false) {
        const clip = this.config.animations?.find(animation => animation.name.toLowerCase() === name)
        if (!clip)
            return
        const action = this.mixer.clipAction(clip)
        if (action === this.currentAction && !once)
            return
        if (action !== this.currentAction)
            this.currentAction?.fadeOut(0.2)
        action.setLoop(once ? LoopOnce : LoopRepeat, Infinity)
        action.clampWhenFinished = once
        action.reset().setEffectiveTimeScale(timeScale).fadeIn(0.2).play()
        this.currentAction = action
        this.playingOnce = once
    }

    attack(targetPosition: Vector3) {
        if (targetPosition.distanceTo(this.obj.position) > 0.01)
            this.obj.rotation.y = Math.atan2(targetPosition.x - this.obj.position.x, targetPosition.z - this.obj.position.z)
        this.play('attack', 1, true)
    }

    async die() {
        this.dead = true
        this.path = []
        await new Promise(resolve => setTimeout(resolve, hitDelay * 1000))
        this.play('death', 1, true)
        await this.wait()
    }

    wait() {
        if (!this.path.length && !this.playingOnce)
            return Promise.resolve()
        return new Promise<void>(resolve => this.waiting.push(resolve))
    }

    private resolveWaiting() {
        if (this.path.length || this.playingOnce)
            return
        for (const resolve of this.waiting.splice(0))
            resolve()
    }

    walk(path: Vector3[]) {
        this.path = path
        this.play('walk', walkAnimationSpeed)
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
                if (!this.path.length && !this.playingOnce) {
                    this.play('idle')
                    this.resolveWaiting()
                }
            } else {
                this.obj.position.addScaledVector(direction, distance / length)
                distance = 0
            }
        }
    }

    hasEffect(kind: EffectKind) {
        return this.effects.some(effect => effect.kind === kind)
    }

    effectAmount(kind: EffectKind) {
        return this.effects.filter(effect => effect.kind === kind).reduce((sum, effect) => sum + effect.amount, 0)
    }

    addEffect(effect: StatusEffect, hostile: boolean) {
        if (hostile && this.hasEffect("immune"))
            return false
        this.effects = this.effects.filter(other => other.kind !== effect.kind)
        this.effects.push(effect)
        this.refreshStats()
        return true
    }

    cureEffects() {
        this.effects = this.effects.filter(effect => !harmfulEffects.includes(effect.kind))
        this.refreshStats()
    }

    refreshStats() {
        const changes = effectStatChanges(this.effects)
        this.stats = { ...this.baseStats }
        for (const [stat, value] of Object.entries(changes) as [keyof Stats, number][])
            this.stats[stat] = Math.max(0, this.stats[stat] + value)
        this.maxActionPoints = deriveAttributes(this.stats).maxActionPoints
    }

    startOwnTurn(concentrationRegen: number) {
        const stunned = this.hasEffect("stun")
        this.actionPoints = stunned ? 0 : this.maxActionPoints
        this.movePoints = stunned || this.hasEffect("root") ? 0 : Math.max(0, this.moveRange - this.effectAmount("slow"))
        this.concentration = Math.min(this.maxConcentration, this.concentration + concentrationRegen)
        if (this.hasEffect("burn"))
            this.takeDamage(burnDamage, "magic", this.lastAttacker, false)
        if (this.hasEffect("poison"))
            this.takeDamage(poisonDamage, "pure", this.lastAttacker, false)
    }

    endOwnTurn() {
        for (const [action, turns] of this.cooldowns) {
            if (!this.usedThisTurn.has(action))
                this.cooldowns.set(action, Math.max(0, turns - 1))
        }
        this.usedThisTurn.clear()
        for (const effect of this.effects) {
            if (effect.fresh)
                effect.fresh = false
            else
                effect.turns--
        }
        this.effects = this.effects.filter(effect => effect.turns > 0)
        this.refreshStats()
    }

    heal(amount: number) {
        this.healt = Math.min(this.maxHealt, this.healt + amount)
    }

    takeDamage(amount: number, kind: DamageKind, attacker?: Piece, direct = true) {
        const protector = direct ? this.effects.find(effect => effect.kind === "protected")?.source : undefined
        if (protector && protector !== this && protector.healt > 0) {
            protector.takeDamage(amount, kind, attacker, false)
            return
        }
        this.lastAttacker = attacker
        this.healt -= Math.max(1, amount - damageReduction(this.stats, kind))
        if (direct && attacker && attacker.player !== this.player && attacker.healt > 0 && this.healt > 0 && this.hasEffect("riposte"))
            attacker.takeDamage(1 + Math.floor(this.stats.strength / 2), "physical", this, false)
    }
}

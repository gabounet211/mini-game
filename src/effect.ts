import { Stats } from "./stats"

export type EffectKind = "stun" | "root" | "slow" | "burn" | "poison" | "willpowerDown" | "willpowerUp" | "resistanceUp" | "damageUp" | "immune"

export interface StatusEffect {
    kind: EffectKind
    amount: number
    turns: number
    fresh?: boolean
}

export const burnDamage = 2
export const poisonDamage = 1

export const harmfulEffects: EffectKind[] = ["stun", "root", "slow", "burn", "poison", "willpowerDown"]

export const effectNames: Record<EffectKind, string> = {
    stun: "Stunned",
    root: "Rooted",
    slow: "Slowed",
    burn: "Burning",
    poison: "Poisoned",
    willpowerDown: "Willpower down",
    willpowerUp: "Willpower up",
    resistanceUp: "Resistance up",
    damageUp: "Damage up",
    immune: "Immune to effects",
}

export function effectStatChanges(effects: StatusEffect[]): Partial<Stats> {
    const amount = (kind: EffectKind) => effects.filter(effect => effect.kind === kind).reduce((sum, effect) => sum + effect.amount, 0)
    return {
        willpower: amount("willpowerUp") - amount("willpowerDown"),
        resistance: amount("resistanceUp"),
    }
}

export function describeEffect(effect: StatusEffect) {
    const amount = ["stun", "root", "burn", "poison", "immune"].includes(effect.kind) ? '' : ' ' + (effect.kind === "slow" || effect.kind === "willpowerDown" ? '-' : '+') + effect.amount
    return effectNames[effect.kind] + amount + ' (' + effect.turns + (effect.turns > 1 ? ' turns' : ' turn') + ')'
}

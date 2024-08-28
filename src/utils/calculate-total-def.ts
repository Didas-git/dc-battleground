export function calculateDef(def: number, armor: number): number {
    const calculated_def = armorToDef(armor) * def;
    const final_def = Math.round((calculated_def + Number.EPSILON) * 100) / 100;
    if (final_def < 0.01) return 0;
    if (final_def > 0.85) return 0.85;
    return final_def;
}

export function armorToDef(armor: number): number {
    if (armor < 3000) return (armor / 30000) * 10;
    else if (armor < 27000) {
        const t = (armor - 3000) / (27000 - 3000);
        return 10 + (t * (35 - 10));
    }

    return 35 + ((Math.exp((armor - 27000) / 1000) - 1) * (5 / (Math.exp(3) - 1)));
}

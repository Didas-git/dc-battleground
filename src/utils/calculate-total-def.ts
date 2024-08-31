export function calculateDef(def: number, armor: number): number {
    const calculatedDef = armorToDef(armor) * def;
    const finalDef = Math.round((calculatedDef + Number.EPSILON) * 100) / 100;
    if (finalDef < 0.01) return 0;
    if (finalDef > 0.85) return 0.85;
    return finalDef;
}

export function armorToDef(armor: number): number {
    if (armor < 3000) return (armor / 30000) * 10;
    else if (armor < 27000) {
        const t = (armor - 3000) / (27000 - 3000);
        return 10 + (t * (35 - 10));
    }

    return 35 + ((Math.exp((armor - 27000) / 1000) - 1) * (5 / (Math.exp(3) - 1)));
}

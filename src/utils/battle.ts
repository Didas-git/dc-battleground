import * as Battle from "#models/battle.js";
import * as Player from "#models/player.js";
import * as Stats from "#models/stats.js";
import * as Item from "#models/item.js";

export function calculateDef(def: number, armor: number): number {
    const calculatedDef = armorToDef(armor) * def;
    const finalDef = Math.round(calculatedDef + Number.EPSILON) / 100;
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

    return 35 + ((Math.exp((armor - 27000) / 1000) - 1) * (11 / (Math.exp(3) - 1)));
}

function scaleArmorBasedOnPlayerLevel(armor: number, level: number): number {
    if (level <= 10) return armor;
    if (level >= 2000) return 30000/* armor cap */;
    const calculatedArmor = Math.round((armor * Math.log(level)) + Number.EPSILON);
    if (calculatedArmor > 30000) return 30000;/* armor cap */
    return calculatedArmor;
}

/**
 * This gets the player stats, their equipment and returns them appended in one single object
 */
function getPlayerFullStats(playerId: string): Stats.GenericStats {
    const playerStats = Stats.get(playerId);
    if (playerStats === null) throw new Error("Something went terribly wrong.");
    const equipment = Player.Inventory.getEquipment(playerId);

    const statKeys: Array<keyof typeof playerStats> = Object.keys(playerStats) as never;
    const bonusKeys: Array<keyof typeof playerStats.resistances> = Object.keys(playerStats.bonus) as never;

    for (let i = 0, values = Object.values(equipment), { length } = values; i < length; i++) {
        const id = values[i];
        if (id === null) continue;

        const item = Item.getItemMeta(id);
        if (item.type !== Item.ItemType.Equipment) throw new Error("Invalid equipment.");

        const { stats: itemStats } = item.data;

        for (let j = 0, len = statKeys.length; j < len; j++) {
            const sKey = statKeys[j];

            if (sKey === "hp" || sKey === "mana") playerStats[sKey].max += itemStats[sKey];
            else if (sKey === "bonus" || sKey === "resistances") {
                for (let k = 0, l = bonusKeys.length; k < l; k++) {
                    const bKey = bonusKeys[k];
                    if (sKey === "resistances" && bKey === <never>"atk") continue;
                    playerStats[sKey][bKey] += itemStats[sKey][bKey];
                }
            } else playerStats[sKey] += itemStats[sKey];
        }
    }

    return playerStats;
}

export function calculateDamage(attackerId: string, defenderId: string, type: Battle.BattleFlowType): { calculated: number, final: number } {
    const playerStats = getPlayerFullStats(attackerId);
    const playerLevel = Player.getCurrentLevel(attackerId);

    const defenderStats = Stats.get(defenderId);
    if (defenderStats === null) throw new Error("Something went terribly wrong.");

    const ATK = playerStats.atk * (1 + playerStats.bonus.atk);
    //! TODO Skill based dmg
    // const skillHit = ...
    // TODO Be skill dependant
    const elementBonus = (1 + playerStats.bonus.physical);
    const genericBonus = (1 + playerStats.bonus.melee);

    const shouldCrit = Math.random() >= (1 - playerStats.crit_rate);
    const calculatedDamage = ATK * genericBonus * elementBonus * (shouldCrit ? playerStats.crit_damage : 1);

    // TODO Be element dependant
    const elementRes = (defenderStats.resistances.physical);
    const genericRes = (defenderStats.resistances.melee);

    const calculatedDef = calculateDef(defenderStats.def, type === Battle.BattleFlowType.Player ? defenderStats.armor : scaleArmorBasedOnPlayerLevel(defenderStats.armor, playerLevel.level));

    //! TODO Resistance negation
    const finalDamage = calculatedDamage * calculatedDef * genericRes * elementRes;

    return { calculated: calculatedDamage, final: finalDamage };
}

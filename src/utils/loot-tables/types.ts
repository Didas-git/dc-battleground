import type { GenericStats } from "../../schemas/stats.js";
import type { LootTable } from "./loot-table.js";

export const enum LootTableValueType {
    Item,
    Table,
    Enemy
}

export type LootTableContent = ({
    type: LootTableValueType.Table,
    value: LootTable
} | {
    type: LootTableValueType.Item,
    value: string,
    amount: number
} | {
    type: LootTableValueType.Enemy,
    value: string
}) & { unique: boolean, always: boolean, count: number, droppable: boolean, inclusive: boolean, probability: number, enabled: boolean };

export interface LootTableJSON {
    type: "item" | "table" | "enemy";
    /** id reference */
    id: string;
    amount?: boolean;
    unique: boolean;
    always: boolean;
    count?: number;
    droppable?: boolean;
    inclusive?: boolean;
    probability: number;
    enabled: boolean;
}

export interface ItemJSON {
    type: "equipment" | "crafting" | "consumable" | "currency";
    rarity: "cursed" | "normal" | "advanced" | "epic" | "legendary";
    amount?: number;
    name: string;
    description: string;
    meta: {
        type: "armor" | "weapon",
        inner_type: "sword" | "bow",
        sub_type: "normal" | "magic"
    };
}

export interface EnemyJSON {
    class: "undead" | "iter";
    name: string;
    description: string;
    loot_table: string;
    stats: Partial<Omit<GenericStats, "hp" | "atk" | "crit_rate" | "crit_damage" | "def" | "armor" | "mana">>
        & { hp: number, atk: number, crit_rate: number, crit_damage: number, def: number, armor: number, mana?: number };
}

import type { EntityStats } from "#models/stats.js";
import type { LootTable } from "./index.js";

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
    stats: EntityStats;
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
    stats: EntityStats;
}

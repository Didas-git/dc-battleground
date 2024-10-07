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
    value: string
} | {
    type: LootTableValueType.Enemy,
    value: string
}) & { unique: boolean, always: boolean, amount: number, droppable: boolean, inclusive: boolean, probability: number, enabled: boolean };

export interface LootTableJSON {
    type: "item" | "table" | "enemy";
    /** id reference */
    id: string;
    unique: boolean;
    always: boolean;
    amount?: boolean;
    droppable?: boolean;
    inclusive?: boolean;
    probability: number;
    enabled: boolean;
}

export interface ItemJSON {
    type: "equipment" | "crafting" | "consumable";
    rarity: "cursed" | "normal" | "advanced" | "epic" | "legendary";
    name: string;
    description: string;
    meta: {
        type: "armor" | "weapon",
        inner_type: "sword" | "bow",
        sub_type: "normal" | "magic"
    };
}

export interface EnemyJSON {
    class: "undead";
    name: string;
    description: string;
    loot_table: string;
}

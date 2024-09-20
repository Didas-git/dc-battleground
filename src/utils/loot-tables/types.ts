import type { LootTable } from "./loot-table.js";

export const enum ValueType {
    Item,
    Table
}

export type LootTableContent = ({
    type: ValueType.Table,
    value: LootTable
} | {
    type: ValueType.Item,
    value: string
}) & { unique: boolean, always: boolean, probability: number, enabled: boolean };

export interface LootTableJSON {
    type: "item" | "table";
    /** id reference */
    id: string;
    unique: boolean;
    always: boolean;
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

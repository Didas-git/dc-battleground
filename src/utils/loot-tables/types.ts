import type { LootTable } from "./loot-table.js";

export const enum ValueType {
    Table,
    Item
}

export type LootTableContent = ({
    type: ValueType.Table,
    value: LootTable
} | {
    type: ValueType.Item,
    value: string
}) & { unique: boolean, always: boolean, probability: number, enabled: boolean };

export type LootTableContentJSON = ({
    type: ValueType.Table,
    id: string /** id reference */
} | {
    type: ValueType.Item,
    id: string /** id reference */
}) & { unique: boolean, always: boolean, probability: number, enabled: boolean };

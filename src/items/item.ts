import { LootTable } from "../utils/loot-table.js";
import { ChestRarity } from "../schemas/board.js";
import { NormalItemTable } from "./normal.js";

import type { LootTableValue } from "../utils/loot-table.js";

export type ItemStructure = CraftingItem | ConsumableItem;

export interface ItemBaseStructure {
    id: string;
    type: ItemType;
    rarity: ItemRarity;
    name: string;
    description: string;
}

export interface CraftingItem extends ItemBaseStructure {
    type: ItemType.Crafting;
}

export interface ConsumableItem extends ItemBaseStructure {
    type: ItemType.Consumable;
}

export const enum ItemType {
    Crafting,
    Consumable
}

export const enum ItemRarity {
    Cursed,
    Normal,
    Advanced,
    Epic,
    Legendary
}

export abstract class Item implements LootTableValue<ItemStructure> {
    public abstract rdsProbability: number;
    public abstract rdsUnique: boolean;
    public abstract rdsAlways: boolean;
    public abstract rdsEnabled: boolean;

    public abstract rdsValue: ItemStructure;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export interface ItemTable {
    resultsBetween: (min: number, max: number) => Array<Item>;
    get rdsResults(): Array<Item>;
    rdsContents: Array<Item>;
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-declaration-merging
export class ItemTable extends LootTable {
    public onRDSPreResultEvaluation = undefined;
    public onRDSHit = undefined;
    public onRDSPostResultEvaluation = undefined;
    public rdsProbability = 0;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsCount = 0;
}

export function mapChestRarityToLootTable(rarity: ChestRarity): ItemTable {
    switch (rarity) {
        case ChestRarity.Cursed: { throw new Error("Not implemented yet: ChestRarity.Cursed case"); }
        case ChestRarity.Basic: { return NormalItemTable; }
        case ChestRarity.Normal: { throw new Error("Not implemented yet: ChestRarity.Normal case"); }
        case ChestRarity.Epic: { throw new Error("Not implemented yet: ChestRarity.Epic case"); }
        case ChestRarity.Legendary: { throw new Error("Not implemented yet: ChestRarity.Legendary case"); }
    }
}

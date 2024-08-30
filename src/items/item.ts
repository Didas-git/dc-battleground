import { LootTable } from "../utils/loot-table.js";

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

export class ItemTable extends LootTable<Item> {
    public onRDSPreResultEvaluation = undefined;
    public onRDSHit = undefined;
    public onRDSPostResultEvaluation = undefined;
    public rdsProbability = 1;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsCount = 0;
}


import { LootTable } from "../utils/loot-table.js";
import { ChestRarity } from "../schemas/board.js";
import { NormalItemTable } from "./normal.js";

import type { LootTableValue } from "../utils/loot-table.js";
import { AdvancedItemTable } from "./advanced.js";
import { EpicItemTable } from "./epic.js";
import { LegendaryItemTable } from "./legendary.js";

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

class ChestTable extends LootTable<ItemTable> {
    public onRDSPreResultEvaluation = undefined;
    public onRDSHit = undefined;
    public onRDSPostResultEvaluation = undefined;
    public rdsProbability = 0;
    public rdsUnique = false;
    public rdsAlways = false;
    public rdsEnabled = true;
    public rdsCount = 1;
}

const BasicChestTable = new ChestTable()
    .add(NormalItemTable, 1, 1);

const NormalChestTable = new ChestTable()
    .add(NormalItemTable, 0.8, 1)
    .add(AdvancedItemTable, 0.2, 1);

const EpicChestTable = new ChestTable()
    .add(NormalItemTable, 0.1, 1)
    .add(AdvancedItemTable, 0.6, 1)
    .add(EpicItemTable, 0.3, 1);

const LegendaryChestTable = new ChestTable()
    .add(NormalItemTable, 0.05, 1)
    .add(AdvancedItemTable, 0.16, 1)
    .add(EpicItemTable, 0.65, 1)
    .add(LegendaryItemTable, 0.14, 1);

export function mapChestRarityToLootTable(rarity: ChestRarity): ChestTable {
    switch (rarity) {
        case ChestRarity.Cursed: { throw new Error("Not implemented yet: ChestRarity.Cursed case"); }
        case ChestRarity.Basic: { return BasicChestTable; }
        case ChestRarity.Normal: { return NormalChestTable; }
        case ChestRarity.Epic: { return EpicChestTable; }
        case ChestRarity.Legendary: { return LegendaryChestTable; }
    }
}

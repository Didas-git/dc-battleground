import { NormalItemTable } from "./normal.js";
import { AdvancedItemTable } from "./advanced.js";
import { EpicItemTable } from "./epic.js";
import { LegendaryItemTable } from "./legendary.js";
import { LootTable } from "../utils/loot-table.js";

import type { ItemTable } from "./item.js";
import { ChestRarity } from "../schemas/board.js";

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
        // TODO: Make cursed loot table for cursed drops and chests
        case ChestRarity.Cursed: { return BasicChestTable; }
        case ChestRarity.Basic: { return BasicChestTable; }
        case ChestRarity.Normal: { return NormalChestTable; }
        case ChestRarity.Epic: { return EpicChestTable; }
        case ChestRarity.Legendary: { return LegendaryChestTable; }
    }
}

import { ValueType } from "./types.js";
import { join } from "node:path";

import * as Item from "../../schemas/item.js";

import { items, loot_tables, enemies } from "../../../config.json";

import type { LootTableJSON, ItemJSON } from "./types.js";

interface Config {
    items: Record<string, ItemJSON>;
    loot_tables: Record<string, Array<LootTableJSON>>;
    enemies: Record<string, { name: string, description: string, loot_table: string }>;
}

function mapItemType(type: ItemJSON["type"]): Item.ItemType {
    switch (type) {
        case "equipment": return Item.ItemType.Equipment;
        case "crafting": return Item.ItemType.Crafting;
        case "consumable": return Item.ItemType.Consumable;
        default: throw new Error("Invalid item type");
    }
}

function mapItemRarity(rarity: ItemJSON["rarity"]): Item.ItemRarity {
    switch (rarity) {
        case "cursed": return Item.ItemRarity.Cursed;
        case "normal": return Item.ItemRarity.Normal;
        case "advanced": return Item.ItemRarity.Advanced;
        case "epic": return Item.ItemRarity.Epic;
        case "legendary": return Item.ItemRarity.Legendary;
        default: throw new Error("Invalid item rarity");
    }
}

function mapItemMeta(meta: ItemJSON["meta"] | undefined): Item.EquipmentData | null {
    if (typeof meta === "undefined") return null;

    let firstByte = 0;
    let secondByte = 0;
    let thirdByte = 0;

    switch (meta.type) {
        case "armor": { firstByte = Item.EquipmentType.Armor; break; }
        case "weapon": { firstByte = Item.EquipmentType.Weapon; break; }
    }
    switch (meta.inner_type) {
        case "sword": { secondByte = Item.EquipmentInnerType.Sword; break; }
        case "bow": { secondByte = Item.EquipmentInnerType.Bow; break; }
    }
    switch (meta.sub_type) {
        case "normal": { thirdByte = Item.WeaponSubType.Normal; break; }
        case "magic": { thirdByte = Item.WeaponSubType.Magic; break; }
    }

    if (firstByte === 0) throw new Error("Missing equipment type");
    if (secondByte === 0) throw new Error("Missing equipment inner type");
    if (thirdByte === 0) throw new Error("Missing equipment sub type");

    return {
        type: (firstByte << 16) | (secondByte << 8) | thirdByte
    };
}

function parseItemsAndTables(config: Config): Array<string> {
    const fileContents: Array<string> = ["import { LootTable } from \"./loot-table.js\";"];

    for (let i = 0, entries = Object.entries(config.items), { length } = entries; i < length; i++) {
        const [id, data] = entries[i];

        Item.addItem(id, <never>{
            type: mapItemType(data.type),
            rarity: mapItemRarity(data.rarity),
            name: data.name,
            description: data.description,
            data: mapItemMeta(data.meta)
        });
    }

    for (let i = 0, entries = Object.entries(config.loot_tables), { length } = entries; i < length; i++) {
        const [id, table] = entries[i];
        const idParts = id.slice(1).split("_");
        const tableName = idParts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
        const tableContents: Array<string> = [];

        for (let j = 0, l = table.length; j < l; j++) {
            const item = table[j];
            switch (item.type) {
                case "table": {
                    const nameParts = item.id.slice(1).split("_");
                    const name = nameParts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");

                    if (name === tableName) throw new Error("A table cannot reference itself in its contents");

                    tableContents.push(`${j > 0 ? "\n" : ""}        {
            type: ${ValueType.Table},
            value: new ${name}(),
            unique: ${item.unique},
            always: ${item.always},
            probability: ${item.probability},
            enabled: ${item.enabled}
        }`);
                    break;
                }
                case "item": {
                    tableContents.push(`${j > 0 ? "\n" : ""}        {
            type: ${ValueType.Item},
            value: "${item.id}",
            unique: ${item.unique},
            always: ${item.always},
            probability: ${item.probability},
            enabled: ${item.enabled}
        }`);
                    break;
                }
            }
        }

        fileContents.push(`export class ${tableName} extends LootTable {
    public override contents = [\n${tableContents.join(",")}\n    ];
}`);
    }

    const fn: Array<string> = [
        "export function mapEnemyToLootTable(enemy: { id: string }): new () => LootTable {",
        "    switch (enemy.id) {"
    ];
    for (let i = 0, entries = Object.entries(config.enemies), { length } = entries; i < length; i++) {
        const [id, enemy] = entries[i];

        fn.push(
            `        case "${id}": {`,
            `            return ${enemy.loot_table.slice(1).split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join("")};`,
            "        }"
        );
    }

    fn.push(
        "        default: throw new Error(\"This enemy does not have a loot table associated with it.\");",
        "    }",
        "}"
    );

    fileContents.push(fn.join("\n"));

    return fileContents;
}

const arr = parseItemsAndTables(<never>{ items, loot_tables, enemies });

await Bun.write(join(import.meta.dir, "generated-tables.ts"), `${arr.join("\n\n")}\n`);
console.log("Finished generating Items and Loot Tables.");

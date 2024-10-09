import { LootTableValueType } from "./types.js";
import { join } from "node:path";

import * as Enemy from "#models/enemy.js";
import * as Item from "#models/item.js";

import { items, loot_tables, enemies } from "../../config.json";

import type { LootTableJSON, ItemJSON, EnemyJSON } from "./types.js";

interface Config {
    items: Record<string, ItemJSON>;
    loot_tables: Record<string, Array<LootTableJSON>>;
    enemies: Record<string, EnemyJSON>;
}

function mapItemType(type: ItemJSON["type"]): Item.ItemType {
    switch (type) {
        case "currency": return Item.ItemType.Currency;
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

function mapEnemyClass(eClass: EnemyJSON["class"]): Enemy.EnemyClass {
    switch (eClass) {
        case "undead": return Enemy.EnemyClass.Undead;
        case "iter": { throw new Error("Placeholder"); }
    }
}

export function parseLootTableName(name: string): string {
    const idParts = name.slice(1).split("_");
    return idParts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
}

function parseItemsAndTables(config: Config): Array<string> {
    const fileContents: Array<string> = ["import { LootTable } from \"./index.js\";"];

    for (let i = 0, entries = Object.entries(config.items), { length } = entries; i < length; i++) {
        const [id, data] = entries[i];

        Item.addItem(id, <never>{
            type: mapItemType(data.type),
            rarity: mapItemRarity(data.rarity),
            amount: data.amount ?? 1,
            name: data.name,
            description: data.description,
            data: mapItemMeta(data.meta)
        });
    }

    for (let i = 0, entries = Object.entries(config.loot_tables), { length } = entries; i < length; i++) {
        const [id, table] = entries[i];
        const tableName = parseLootTableName(id);
        const tableContents: Array<string> = [];

        for (let j = 0, l = table.length; j < l; j++) {
            const item = table[j];
            switch (item.type) {
                case "table": {
                    const name = parseLootTableName(item.id);

                    if (name === tableName) throw new Error("A table cannot reference itself in its contents");

                    tableContents.push(`${j > 0 ? "\n" : ""}        {
            type: ${LootTableValueType.Table},
            value: new ${name}(),
            unique: ${item.unique},
            always: ${item.always},
            count: ${item.count ?? 1},
            droppable: ${item.droppable ?? false},
            inclusive: ${item.inclusive ?? true},
            probability: ${item.probability},
            enabled: ${item.enabled}
        }`);
                    break;
                }
                case "item": {
                    tableContents.push(`${j > 0 ? "\n" : ""}        {
            type: ${LootTableValueType.Item},
            value: "${item.id}",
            amount: ${item.amount ?? 1},
            unique: ${item.unique},
            always: ${item.always},
            count: ${item.count ?? 1},
            droppable: ${item.droppable ?? false},
            inclusive: ${item.inclusive ?? true},
            probability: ${item.probability},
            enabled: ${item.enabled}
        }`);
                    break;
                }
                case "enemy": {
                    tableContents.push(`${j > 0 ? "\n" : ""}        {
            type: ${LootTableValueType.Enemy},
            value: "${item.id.slice(1)}",
            unique: ${item.unique},
            always: ${item.always},
            count: ${item.count ?? 1},
            droppable: ${item.droppable ?? false},
            inclusive: ${item.inclusive ?? true},
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
        "export function mapEnemyToLootTable(id: string): new () => LootTable {",
        "    switch (id) {"
    ];
    for (let i = 0, entries = Object.entries(config.enemies), { length } = entries; i < length; i++) {
        const [idWithPrefix, enemy] = entries[i];
        const id = idWithPrefix.slice(1);

        const enemyData: Enemy.Enemy = {
            class: mapEnemyClass(enemy.class),
            name: enemy.name,
            description: enemy.description,
            stats: {
                hp: 0,
                ward: 0,
                atk: 0,
                mana: 0,
                crit_rate: 0,
                crit_damage: 1,
                def: 1,
                armor: 0,
                bonus: {
                    elemental: 0,
                    ranged: 0,
                    melee: 0,
                    physical: 0,
                    fire: 0,
                    water: 0,
                    nature: 0,
                    electric: 0,
                    ice: 0,
                    wind: 0,
                    light: 0,
                    cosmos: 0,
                    poison: 0
                },
                resistances: {
                    elemental: 0,
                    ranged: 0,
                    melee: 0,
                    physical: 0,
                    fire: 0,
                    water: 0,
                    nature: 0,
                    electric: 0,
                    ice: 0,
                    wind: 0,
                    light: 0,
                    cosmos: 0,
                    poison: 0
                }
            }
        };

        for (let j = 0, stats = Object.entries(enemy.stats), le = stats.length; j < le; j++) {
            const [key, value] = stats[j];
            if (typeof value === "object") {
                for (let k = 0, innerStats = Object.entries(value), l = innerStats.length; k < l; k++) {
                    const [ke, val] = innerStats[k];
                    enemyData.stats[<"resistances"><unknown>key][<keyof typeof enemyData.stats.resistances>ke] = val;
                }
            } else enemyData.stats[<keyof typeof enemyData.stats>key] = <never>value;
        }

        Enemy.addEnemy(id, enemyData);

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
console.log("Finished generating Items, Enemies and Loot Tables.");

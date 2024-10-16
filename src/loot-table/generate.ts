import { readdirSync, readFileSync } from "node:fs";
import { LootTableValueType } from "./types.js";
import { join } from "node:path";

import * as Enemy from "#models/enemy.js";
import * as Item from "#models/item.js";

import type { LootTableJSON, ItemJSON, EnemyJSON } from "./types.js";

import type * as Stats from "#models/stats.js";

const PATH = join(import.meta.dir, `${import.meta.file.endsWith(".ts") ? "" : "../"}../../config`);
const TOP_LEVEL_CONFIG_FILES = ["floors.json"];

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

function mapItemMeta(stats: ItemJSON["stats"], meta: ItemJSON["meta"]): Item.EquipmentData | null {
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

    const parsedStats: Stats.EntityStats = {
        hp: 0,
        ward: 0,
        atk: 0,
        mana: 0,
        crit_rate: 0,
        crit_damage: 1,
        def: 1,
        armor: 0,
        bonus: {
            atk: 0,
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
    };

    for (let i = 0, s = Object.entries(stats), { length } = s; i < length; i++) {
        const [key, value] = s[i];
        if (typeof value === "object") {
            for (let j = 0, innerStats = Object.entries(value), l = innerStats.length; j < l; j++) {
                const [ke, val] = innerStats[j];
                parsedStats[<"resistances"><unknown>key][<keyof typeof parsedStats.resistances>ke] = val;
            }
        } else parsedStats[<keyof typeof parsedStats>key] = <never>value;
    }

    return {
        type: (firstByte << 16) | (secondByte << 8) | thirdByte,
        stats
    };
}

function mapEnemyClass(eClass: EnemyJSON["class"]): Enemy.EnemyClass {
    switch (eClass) {
        case "undead": return Enemy.EnemyClass.Undead;
        case "iter": { throw new Error("Placeholder"); }
    }
}

export function parseLootTableName(name: string): string {
    const idParts = name.split("_");
    return idParts.map((p) => p[0].toUpperCase() + p.slice(1)).join("");
}

function readDirAndAppendToObject(object: Record<string, any>, path: string): void {
    const root = readdirSync(path, { withFileTypes: true });
    for (let i = 0, { length } = root; i < length; i++) {
        const dirent = root[i];
        if (dirent.isDirectory()) throw new Error("Cannot have nested directories inside config folder.");
        if (!dirent.name.endsWith(".json")) throw new Error("Non JSON file found in config folder.");

        const name = dirent.name.slice(0, -5);
        const data = readFileSync(`${dirent.parentPath}/${dirent.name}`, { encoding: "utf-8" });
        const json = <ItemJSON>JSON.parse(data);
        object[name] = json;
    }
}

function parseConfigDir(path: string): Config {
    const root = readdirSync(path, { withFileTypes: true });
    const items: Config["items"] = {};
    const tables: Config["loot_tables"] = {};
    const enemies: Config["enemies"] = {};

    for (let i = 0, { length } = root; i < length; i++) {
        const dirent = root[i];
        if (dirent.isDirectory()) {
            if (dirent.name === "items") readDirAndAppendToObject(items, `${path}/items`);
            else if (dirent.name === "tables") readDirAndAppendToObject(tables, `${path}/tables`);
            else if (dirent.name === "enemies") readDirAndAppendToObject(enemies, `${path}/enemies`);

            continue;
        }
        if (!dirent.name.endsWith(".json")) throw new Error("Non JSON file found in config folder.");
        if (!TOP_LEVEL_CONFIG_FILES.includes(dirent.name)) throw new Error(`Invalid top level config file: '${dirent.name}'.`);
    }

    return { items, loot_tables: tables, enemies };
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
            data: mapItemMeta(data.stats, data.meta)
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
            value: "${item.id}",
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
        const [id, enemy] = entries[i];

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
                    atk: 0,
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
            `            return ${enemy.loot_table.split("_").map((p) => p[0].toUpperCase() + p.slice(1)).join("")};`,
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

const arr = parseItemsAndTables(parseConfigDir(PATH));

await Bun.write(join(import.meta.dir, "generated-tables.ts"), `${arr.join("\n\n")}\n`);
console.log("Finished generating Items, Enemies and Loot Tables.");

import { join } from "node:path";
import { db } from "../db.js";

export type ItemStructure = CraftingItem;

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

db.run("CREATE TABLE IF NOT EXISTS Items ( id TEXT PRIMARY KEY, type INTEGER NOT NULL, RARITY INTEGER NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL )");

if (db.query("SELECT * FROM Items").all({ name: "Items" }).length === 0) {
    const items = await Bun.file(join(import.meta.dir, "items.json")).json() as Array<ItemStructure>;
    const query = db.query("INSERT INTO Items (id, type, rarity, name, description) VALUES ($id, $type, $rarity, $name, $description)");
    for (let i = 0, { length } = items; i < length; i++) {
        const { id, type, rarity, name, description } = items[i];

        query.run({
            id,
            type,
            rarity,
            name,
            description
        });
    }
}

const ITEM_CACHE = new Map<ItemRarity, Array<string>>();

export function getItemsByRarity(rarity: ItemRarity): Array<string> {
    const cacheHit = ITEM_CACHE.get(rarity);
    if (typeof cacheHit !== "undefined") return cacheHit;

    const result = (<Array<{ id: string }>>db.query("SELECT id FROM Items WHERE rarity = $rarity").all({ rarity })).map((el) => el.id);
    ITEM_CACHE.set(rarity, result);
    return result;
}

import { db } from "../db.js";

export interface Item {
    type: ItemType;
    rarity: ItemRarity;
    name: string;
    description: string;
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

db.run("CREATE TABLE IF NOT EXISTS Items ( id TEXT PRIMARY KEY, type INTEGER NOT NULL, rarity INTEGER NOT NULL, name TEXT NOT NULL, description TEXT NOT NULL )");

export function addItem(id: string, item: Item): void {
    db.query("INSERT OR REPLACE INTO Items (id, type, rarity, name, description) VALUES ($id, $type, $rarity, $name, $description)").run({
        id,
        type: item.type,
        rarity: item.rarity,
        name: item.name,
        description: item.description
    });
}

export function getItemMeta(id: string): Item {
    return <Item>db.query("SELECT type, rarity, name, description FROM Items WHERE id = $id").get({ id });
}

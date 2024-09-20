import { db } from "../db.js";

export type Item = NormalItem | Equipment;

interface NormalItem {
    type: ItemType.Crafting | ItemType.Consumable;
    rarity: ItemRarity;
    name: string;
    description: string;
    data: null;
}

interface Equipment {
    type: ItemType.Equipment;
    rarity: ItemRarity;
    name: string;
    description: string;
    data: EquipmentData;
}

export interface EquipmentData {
    /** A 3 byte bit field (EquipmentType + InnerType + SubType) */
    type: number;
}

export const enum EquipmentType {
    Armor = 1,
    Weapon
}

export const enum EquipmentInnerType {
    Sword = 1,
    Bow
}

export const enum WeaponSubType {
    Normal = 1,
    Magic
}

export const enum ItemType {
    Equipment,
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

db.run(`
CREATE TABLE IF NOT EXISTS Items ( 
    id TEXT PRIMARY KEY,
    type INTEGER NOT NULL,
    rarity INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    data
)`);

export function addItem(id: string, item: Item): void {
    db.query("INSERT OR REPLACE INTO Items (id, type, rarity, name, description, data) VALUES ($id, $type, $rarity, $name, $description, $data)").run({
        id,
        type: item.type,
        rarity: item.rarity,
        name: item.name,
        description: item.description,
        data: item.data === null ? null : JSON.stringify(item.data)
    });
}

export function getItemMeta(id: string): Item {
    const item = <{ data: string | null }>db.query("SELECT type, rarity, name, description, data FROM Items WHERE id = $id").get({ id });

    if (item.data !== null) item.data = <never>JSON.parse(item.data);
    return <never>item;
}

import { db } from "../db.js";

import type { EntityStats } from "./stats.js";

export type Item = NormalItem | Equipment | Currency;

interface BaseItem {
    rarity: ItemRarity;
    name: string;
    description: string;
    amount: number;
}

interface NormalItem extends BaseItem {
    type: ItemType.Crafting | ItemType.Consumable;
    data: null;
}

interface Equipment extends BaseItem {
    type: ItemType.Equipment;
    data: EquipmentData;
}

interface Currency extends BaseItem {
    type: ItemType.Currency;
}

export interface EquipmentData {
    /** A 3 byte bit field (EquipmentType + InnerType + SubType) */
    type: number;
    stats: EntityStats;
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
    Currency,
    Crafting,
    Equipment,
    Consumable
}

export const enum ItemRarity {
    Cursed,
    Normal,
    Advanced,
    Epic,
    Legendary
}

db.run(`CREATE TABLE IF NOT EXISTS Items ( 
    id TEXT PRIMARY KEY,
    type INTEGER NOT NULL,
    rarity INTEGER NOT NULL,
    amount INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    data
)`);

export function addItem(id: string, item: Item): void {
    db.query("INSERT OR REPLACE INTO Items (id, type, rarity, amount, name, description, data) VALUES ($id, $type, $rarity, $amount, $name, $description, $data)").run({
        id,
        type: item.type,
        rarity: item.rarity,
        amount: item.amount,
        name: item.name,
        description: item.description,
        data: "data" in item ? item.data === null ? null : JSON.stringify(item.data) : null
    });
}

export function getItemMeta(id: string): Item {
    const item = <{ data: string | null }>db.query("SELECT type, rarity, name, description, data FROM Items WHERE id = $id").get({ id });

    if (item.data !== null) item.data = <never>JSON.parse(item.data);
    return <never>item;
}

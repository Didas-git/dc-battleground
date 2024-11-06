import { db } from "../db.js";

import type { InventoryStructure } from "./player.js";

db.run(`
CREATE TABLE IF NOT EXISTS Inventory (
    id TEXT PRIMARY KEY,
    coins INTEGER NOT NULL,
    items TEXT NOT NULL,
    equipment TEXT NOT NULL,
    FOREIGN KEY(id) REFERENCES Players(id)
)`);

export function create(memberId: string): void {
    db.query("INSERT INTO Inventory (id, coins, items, equipment) VALUES ($id, 0, '{}', '{}')").run({ id: memberId });
}

export function get(memberId: string): InventoryStructure {
    return <InventoryStructure>db.query("SELECT coins, items FROM Inventory WHERE id = $id").get({ id: memberId });
}

export function getInAllGuilds(userId: string): Array<InventoryStructure> {
    const data = <Array<{ coins: number, items: string }>>db.query(`SELECT coins, items FROM Inventory WHERE id LIKE '%:${userId}'`).all();

    for (let i = 0, { length } = data; i < length; i++) data[i].items = <never>JSON.parse(data[i].items);

    return data as unknown as Array<InventoryStructure>;
}

export function getCoins(memberId: string): number {
    return (<{ coins: number }>db.query("SELECT coins FROM Inventory WHERE id = $id").get({ id: memberId })).coins;
}

export function addCoins(memberId: string, coins: number): void {
    db.query("UPDATE Inventory SET coins = coins + $coins WHERE id = $id").run({ id: memberId, coins });
}

export function removeCoins(memberId: string, coins: number): void {
    db.query("UPDATE Inventory SET coins = coins - $coins WHERE id = $id").run({ id: memberId, coins });
}

export function getCoinsInAllGuilds(userId: string): Array<number> {
    const data = <Array<{ coins: number }>>db.query(`SELECT coins FROM Inventory WHERE id LIKE '%:${userId}'`).all();

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>data[i].coins;

    return data as unknown as Array<number>;
}

export function getEquipment(memberId: string): InventoryStructure["equipment"] {
    const data = (<{ equipment: string }>db.query("SELECT equipment FROM Inventory WHERE id = $id").get({ id: memberId }));

    return <never>JSON.parse(data.equipment);
}

export function getContents(memberId: string): InventoryStructure["items"] {
    const data = (<{ items: string }>db.query("SELECT items FROM Inventory WHERE id = $id").get({ id: memberId }));

    return <never>JSON.parse(data.items);
}

export function updateContents(memberId: string, items: InventoryStructure["items"]): void {
    const currentContent = getContents(memberId);

    for (let i = 0, contents = Object.entries(items), { length } = contents; i < length; i++) {
        const [key, value] = contents[i];
        if (typeof currentContent[key] === "undefined") currentContent[key] = 0;
        currentContent[key] += value;
    }

    db.query("UPDATE Inventory SET items = $items WHERE id = $id").run({ id: memberId, items: JSON.stringify(currentContent) });
}

export function overrideContents(memberId: string, items: InventoryStructure["items"]): void {
    db.query("UPDATE Inventory SET items = $items WHERE id = $id").run({ id: memberId, items: JSON.stringify(items) });
}

export function getContentsInAllGuilds(userId: string): Array<InventoryStructure["items"]> {
    const data = <Array<{ items: string }>>db.query(`SELECT items FROM Inventory WHERE id LIKE '%:${userId}'`).all();

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>JSON.parse(data[i].items);

    return data as unknown as Array<InventoryStructure["items"]>;
}

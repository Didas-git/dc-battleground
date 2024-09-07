import { db } from "../db.js";

export interface InventoryStructure {
    coins: number;
    items: Array<{ id: string, amount: number }>;
}

db.run(`
CREATE TABLE IF NOT EXISTS Inventory (
    id TEXT PRIMARY KEY,
    coins INTEGER NOT NULL,
    items TEXT NOT NULL,
    FOREIGN KEY(id) REFERENCES Players(id)
)
`);

export function create(memberId: string): void {
    db.query("INSERT INTO Inventory (id, coins, items) VALUES ($id, 0, '[]')").run({ id: memberId });
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

export function getContents(memberId: string): InventoryStructure["items"] {
    const data = (<{ items: string }>db.query("SELECT items FROM Inventory WHERE id = $id").get({ id: memberId }));

    return <never>JSON.parse(data.items);
}

export function updateContents(memberId: string, items: InventoryStructure["items"]): void {
    //! TODO: Improve how contents get merged so they are actually merged instead of having duplicates
    const currentContent = getContents(memberId);
    db.query("UPDATE Inventory SET items = $items WHERE id = $id").run({ id: memberId, items: JSON.stringify([...currentContent, ...items]) });
}

export function getContentsInAllGuilds(userId: string): Array<InventoryStructure["items"]> {
    const data = <Array<{ items: string }>>db.query(`SELECT items FROM Inventory WHERE id LIKE '%:${userId}'`).all();

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>JSON.parse(data[i].items);

    return data as unknown as Array<InventoryStructure["items"]>;
}

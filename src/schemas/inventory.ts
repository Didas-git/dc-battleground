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

export function create(id: `${string}:${string}`): void {
    db.query("INSERT INTO Inventory (id, coins, items) VALUES ($id, 0, '[]')").run({ id });
}

export function get(id: `${string}:${string}`): InventoryStructure {
    return <InventoryStructure>db.query("SELECT coins, items FROM Inventory WHERE id = $id").get({ id });
}

export function getInAllGuilds(id: string): Array<InventoryStructure> {
    const data = <Array<{ coins: number, items: string }>>db.query(`SELECT coins, items FROM Inventory WHERE id LIKE '%:${id}'`).all();

    for (let i = 0, { length } = data; i < length; i++) data[i].items = <never>JSON.parse(data[i].items);

    return data as unknown as Array<InventoryStructure>;
}

export function getCoins(id: `${string}:${string}`): number {
    return (<{ coins: number }>db.query("SELECT coins FROM Inventory WHERE id = $id").get({ id })).coins;
}

export function addCoins(id: `${string}:${string}`, coins: number): void {
    db.query("UPDATE Inventory SET coins = coins + $coins WHERE id = $id").run({ id, coins });
}

export function removeCoins(id: `${string}:${string}`, coins: number): void {
    db.query("UPDATE Inventory SET coins = coins - $coins WHERE id = $id").run({ id, coins });
}

export function getCoinsInAllGuilds(id: string): Array<number> {
    const data = <Array<{ coins: number }>>db.query(`SELECT coins FROM Inventory WHERE id LIKE '%:${id}'`).all();

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>data[i].coins;

    return data as unknown as Array<number>;
}

export function getContents(id: `${string}:${string}`): InventoryStructure["items"] {
    const data = (<{ items: string }>db.query("SELECT items FROM Inventory WHERE id = $id").get({ id }));

    data.items = <never>JSON.parse(data.items);
    return <never>data;
}

export function updateContents(id: `${string}:${string}`, items: InventoryStructure["items"]): void {
    db.query("UPDATE Inventory SET items = $items WHERE id = $id").run({ id, items: JSON.stringify(items) });
}

export function getContentsInAllGuilds(id: string): Array<InventoryStructure["items"]> {
    const data = <Array<{ items: string }>>db.query(`SELECT items FROM Inventory WHERE id LIKE '%:${id}'`).all();

    for (let i = 0, { length } = data; i < length; i++) data[i] = <never>JSON.parse(data[i].items);

    return data as unknown as Array<InventoryStructure["items"]>;
}

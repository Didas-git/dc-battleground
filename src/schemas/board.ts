/* eslint-disable @typescript-eslint/naming-convention */
import { db } from "../db.js";
import assert from "node:assert";

export const BOARD_VIEW_SIZE = parseInt(process.env.BOARD_VIEW_SIZE);

export const BOARD_LIMITS = {
    POSITIVE: {
        x: parseInt(process.env.BOARD_SIZE),
        y: parseInt(process.env.BOARD_SIZE)
    },
    NEGATIVE: {
        x: parseInt(`-${process.env.BOARD_SIZE}`),
        y: parseInt(`-${process.env.BOARD_SIZE}`)
    }
};

export const BOARD_CALCULATED_SIZE = (BOARD_LIMITS.POSITIVE.x - BOARD_LIMITS.NEGATIVE.x) * (BOARD_LIMITS.POSITIVE.y - BOARD_LIMITS.NEGATIVE.y);

export interface ChestData {
    rarity: ChestRarity;
    contents: Array<ChestContent>;
}

export type ChestContent = GoldChestContent | ItemChestContent;

export interface ChestContentBase {
    type: ChestContentType;
}

export interface GoldChestContent extends ChestContentBase {
    type: ChestContentType.Gold;
    amount: number;
}

export interface ItemChestContent extends ChestContentBase {
    type: ChestContentType.Item;
    item: string;
}

export const enum ChestContentType {
    Gold,
    Item
}

export const enum ChestRarity {
    Cursed,
    Basic,
    Normal,
    Epic,
    Legendary
}

export const CHEST_RATIOS_MAP: Record<number, ChestRarity> = {
    0.015: ChestRarity.Cursed,
    0.3: ChestRarity.Basic,
    0.58: ChestRarity.Normal,
    0.1: ChestRarity.Epic,
    0.005: ChestRarity.Legendary
};

export const CHEST_RATIOS = Object.keys(CHEST_RATIOS_MAP).map((el) => +el);

try {
    assert(CHEST_RATIOS.reduce((a, b) => a + b, 0) === 1, "Chest ratios do not sum up to 100%");
} catch (err) {
    throw new Error(`Your chest ratios are off by ${1 - CHEST_RATIOS.reduce((a, b) => a + b, 0)}`, { cause: err });
}

export interface BoardData {
    x: number;
    y: number;
}

export const enum BoardEntityType {
    Empty,
    Player,
    Enemy,
    Chest
}

export const BOARD_MAPPINGS: Record<number, string> = {
    [BoardEntityType.Empty]: "⬛",
    [BoardEntityType.Player]: "🟩",
    [BoardEntityType.Enemy]: "🟥",
    [BoardEntityType.Chest]: "🟦",

    88: "🟨",
    99: "🟪"
};

export function generateRandomCoordinates(): BoardData {
    return {
        x: Math.floor(Math.random() * BOARD_LIMITS.POSITIVE.x) * (Math.round(Math.random()) ? 1 : -1),
        y: Math.floor(Math.random() * BOARD_LIMITS.POSITIVE.y) * (Math.round(Math.random()) ? 1 : -1)
    };
}

db.run("CREATE TABLE IF NOT EXISTS Board ( id TEXT PRIMARY KEY, type INTEGER NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL, data TEXT )");

export function spawnPlayer(id: `${string}:${string}`, x: number, y: number): void {
    db.query("INSERT INTO Board (id, type, x, y) VALUES ($id, $type, $x, $y)").run({ id, type: BoardEntityType.Player, x, y });
}

export function generateChest(id: `${string}:${string}`, x: number, y: number, data: ChestData): void {
    db.query("INSERT INTO Board (id, type, x, y, data) VALUES ($id, $type, $x, $y, $data)").run({ id, type: BoardEntityType.Chest, x, y, data: JSON.stringify(data) });
}

export function generateEnemy(id: `${string}:${string}`, x: number, y: number): void {
    db.query("INSERT INTO Board (id, type, x, y) VALUES ($id, $type, $x, $y)").run({ id, type: BoardEntityType.Enemy, x, y });
}

export function updatePlayerPosition(id: `${string}:${string}`, x: number, y: number): boolean {
    if (
        x > BOARD_LIMITS.POSITIVE.x
        || x < BOARD_LIMITS.NEGATIVE.x
        || y > BOARD_LIMITS.POSITIVE.y
        || y < BOARD_LIMITS.NEGATIVE.y
    ) return false;

    db.query("UPDATE Board SET x = $x, y = $y WHERE id = $id").run({ id, x, y });
    return true;
}

export function getPlayerPosition(id: `${string}:${string}`): BoardData | null {
    return <BoardData>db.query("SELECT x, y FROM Board WHERE id = $id").get({ id });
}

export function getEntityInPosition(x: number, y: number): { id: string, type: BoardEntityType, data: null | ChestData } | null {
    const data = <{ id: string, type: BoardEntityType, data: null | string } | null>db.query("SELECT id, type, data FROM Board WHERE x = $x AND y = $y").get({ x, y });
    if (data === null) return null;
    if (data.data !== null) data.data = <never>JSON.parse(data.data);
    return <never>data;
}

export function scanFromCenter(center: { x: number, y: number }, size: number, playerId?: string): Array<number> {
    const fullSize = size * size;
    const board: Array<number> = [];

    const initialX = center.x - Math.floor(size / 2);
    const initialY = center.y + Math.ceil(size / 2);

    for (let i = 0, x = initialX, y = initialY; i < fullSize; i += 1) {
        if (i % size === 0) {
            x = initialX;
            y -= 1;
        }

        const entity = getEntityInPosition(x, y);
        if (entity === null) board.push(0);
        else if (entity.type === BoardEntityType.Player && entity.id !== playerId) board.push(99);
        else if (entity.type === BoardEntityType.Chest && entity.data?.rarity === ChestRarity.Legendary) board.push(88);
        else board.push(entity.type);

        x += 1;
    }

    return board;
}

export function scanForEntities(center: { x: number, y: number }, size: number): Array<{ type: BoardEntityType } & BoardData> {
    const fullSize = size * size;
    const entities: ReturnType<typeof scanForEntities> = [];

    const initialX = center.x - Math.floor(size / 2);
    const initialY = center.y + Math.ceil(size / 2);

    for (let i = 0, x = initialX, y = initialY; i < fullSize; i += 1) {
        if (i % size === 0) {
            x = initialX;
            y -= 1;
        }

        const entity = getEntityInPosition(x, y);
        if (entity !== null)
            entities.push({ type: entity.type, x, y });

        x += 1;
    }

    return entities;
}

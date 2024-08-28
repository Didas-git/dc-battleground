import { db } from "../db.js";

export const BOARD_SIZE = 11;

export interface BoardData {
    x: number;
    y: number;
}

export interface ChestData {
    rarity: ChestRarity;
    contents: Array<ChestContent>;
}

export type ChestContent = GoldChestContent;

export interface ChestContentBase {
    type: ChestContentType;
    amount: number;
}

export interface GoldChestContent extends ChestContentBase {
    type: ChestContentType.Gold;
}

export const enum ChestContentType {
    Gold
}

export const enum ChestRarity {
    Basic,
    Legendary
}

export const BOARD_LIMITS = {
    POSITIVE: {
        x: 300,
        y: 300
    },
    NEGATIVE: {
        x: -300,
        y: -300
    }
};

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
    [BoardEntityType.Chest]: "🟦"
};

export function generateCoordinates(): BoardData {
    return {
        x: Math.floor(Math.random() * BOARD_LIMITS.POSITIVE.x) * (Math.round(Math.random()) ? 1 : -1),
        y: Math.floor(Math.random() * BOARD_LIMITS.POSITIVE.y) * (Math.round(Math.random()) ? 1 : -1)
    };
}

db.run("CREATE TABLE IF NOT EXISTS Board ( id TEXT PRIMARY KEY, type INTEGER NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL, data TEXT )");

export function spawnPlayer(type: BoardEntityType, id: `${string}:${string}`, x: number, y: number): void {
    db.query("INSERT INTO Board (id, type, x, y) VALUES ($id, $type, $x, $y)").run({ id, type, x, y });
}

export function generateChest(type: BoardEntityType, id: `${string}:${string}`, x: number, y: number, data: ChestData): void {
    db.query("INSERT INTO Board (id, type, x, y, data) VALUES ($id, $type, $x, $y, $data)").run({ id, type, x, y, data: JSON.stringify(data) });
}

export function getPlayerPosition(id: `${string}:${string}`): BoardData | null {
    return <BoardData>db.query("SELECT x, y FROM Board WHERE id = $id").get({ id });
}

export function getEntityInPosition(x: number, y: number): { id: string, type: BoardEntityType } | null {
    return <{ id: string, type: BoardEntityType } | null>db.query("SELECT id, type FROM Board WHERE x = $x AND y = $y").get({ x, y });
}

export function scanBoardFromCenter(center: { x: number, y: number }, size: number, playerId?: string): Array<number> {
    const fullSize = size * size;
    const board: Array<number> = [];

    const initialX = center.x - Math.floor(size / 2);
    const initialY = center.y - Math.ceil(size / 2);

    for (let i = 0, x = initialX, y = initialY; i < fullSize; i += 1) {
        if (i % size === 0) {
            x = initialX;
            y += 1;
        }

        const entity = getEntityInPosition(x, y);
        if (entity === null) board.push(0);
        else if (entity.type === BoardEntityType.Player && entity.id !== playerId) board.push(BoardEntityType.Enemy);
        else board.push(entity.type);

        x += 1;
    }

    return board;
}

export function scanForChests(center: { x: number, y: number }, size: number): Array<{ id: string } & BoardData> {
    const fullSize = size * size;
    const chests: Array<{ id: string } & BoardData> = [];

    const initialX = center.x - Math.floor(size / 2);
    const initialY = center.y - Math.ceil(size / 2);

    for (let i = 0, x = initialX, y = initialY; i < fullSize; i += 1) {
        if (i % size === 0) {
            x = initialX;
            y += 1;
        }

        const entity = getEntityInPosition(x, y);
        if (entity?.type === BoardEntityType.Chest) chests.push({ id: entity.id, x, y });
        x += 1;
    }

    return chests;
}

/* eslint-disable @typescript-eslint/naming-convention */
import { getRandomIntInclusive } from "../utils/random-generators.js";
import { makeBoardEmbed, MOVEMENT_ROW } from "../utils/board.js";
import { client } from "../index.js";
import { db } from "../db.js";

import assert from "node:assert";

import * as BoardCache from "./board-cache.js";

export const BOARD_VIEW_SIZE = parseInt(process.env.BOARD_VIEW_SIZE);

export interface ChestData {
    rarity: ChestRarity;
    contents: Array<ChestContent>;
}

export type ChestContent = CoinsChestContent | ItemChestContent;

export interface ChestContentBase {
    type: ChestContentType;
}

export interface CoinsChestContent extends ChestContentBase {
    type: ChestContentType.Coins;
    amount: number;
}

export interface ItemChestContent extends ChestContentBase {
    type: ChestContentType.Item;
    item: string;
}

export const enum ChestContentType {
    Coins,
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

export interface EnemyData {
    id: string;
}

export interface BoardData {
    layer: number;
    x: number;
    y: number;
}

export interface LayerData {
    to: 1 | -1;
}

export const enum BoardEntityType {
    Empty,
    Player,
    Enemy,
    Chest,
    LayerEntrance
}

export type BoardEntity = ChestEntity | LayerEntity | { type: BoardEntityType.Empty } | OtherEntities;

export interface BaseBoardEntity {
    id: string;
    type: BoardEntityType;
}

export interface ChestEntity extends BaseBoardEntity {
    type: BoardEntityType.Chest;
    data: ChestData;
}

export interface LayerEntity extends BaseBoardEntity {
    type: BoardEntityType.LayerEntrance;
    data: LayerData;
}

export interface EnemyEntity extends BaseBoardEntity {
    type: BoardEntityType.Enemy;
    data: EnemyData;
}

export interface OtherEntities extends BaseBoardEntity {
    type: BoardEntityType.Player | BoardEntityType.Enemy;
}

export const CHEST_RARITY_MAPPINGS: Record<ChestRarity, string> = {
    [ChestRarity.Cursed]: "Cursed",
    [ChestRarity.Basic]: "Basic",
    [ChestRarity.Normal]: "Normal",
    [ChestRarity.Epic]: "Epic",
    [ChestRarity.Legendary]: "Legendary"
};

export const BOARD_MAPPINGS: Record<number, string> = {
    [BoardEntityType.Empty]: "⬛",
    [BoardEntityType.Player]: "🟩",
    [BoardEntityType.Enemy]: "🟥",
    [BoardEntityType.Chest]: "🟦",
    [BoardEntityType.LayerEntrance]: "🔳",

    88: "🟨",
    99: "🟪"
};

export function generateRandomCoordinates(x: number, y: number): Omit<BoardData, "layer"> {
    return {
        x: getRandomIntInclusive(0, x) * (Math.round(Math.random()) ? 1 : -1),
        y: getRandomIntInclusive(0, y) * (Math.round(Math.random()) ? 1 : -1)
    };
}

db.run("CREATE TABLE IF NOT EXISTS Board ( id TEXT PRIMARY KEY, type INTEGER NOT NULL, layer INTEGER NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL, data TEXT )");

export function spawnPlayer(memberId: string, x: number, y: number): void {
    db.query("INSERT INTO Board (id, type, layer, x, y) VALUES ($id, $type, 1, $x, $y)").run({
        id: memberId,
        type: BoardEntityType.Player,
        x,
        y
    });
}

export function generateChest(chestId: string, layer: number, x: number, y: number, data: ChestData): void {
    db.query("INSERT INTO Board (id, type, layer, x, y, data) VALUES ($id, $type, $layer, $x, $y, $data)").run({
        id: chestId,
        type: BoardEntityType.Chest,
        layer,
        x,
        y,
        data: JSON.stringify(data)
    });
}

export function generateEnemy(enemyId: string, layer: number, x: number, y: number, id: string): void {
    db.query("INSERT INTO Board (id, type, layer, x, y, data) VALUES ($id, $type, $layer, $x, $y, $data)").run({
        id: enemyId,
        type: BoardEntityType.Enemy,
        layer,
        x,
        y,
        data: JSON.stringify({ id })
    });
}

export function insertLayerEntrance(layerId: string, layer: number, x: number, y: number, data: LayerData): void {
    db.query("INSERT INTO Board (id, type, layer, x, y, data) VALUES ($id, $type, $layer, $x, $y, $data)").run({
        id: layerId,
        type: BoardEntityType.LayerEntrance,
        layer,
        x,
        y,
        data: JSON.stringify(data)
    });
}

export function updatePlayerPosition(memberId: string, x: number, y: number): boolean {
    // if (
    //     x > BOARD_LIMITS.POSITIVE.x
    //     || x < BOARD_LIMITS.NEGATIVE.x
    //     || y > BOARD_LIMITS.POSITIVE.y
    //     || y < BOARD_LIMITS.NEGATIVE.y
    // ) return false;

    db.query("UPDATE Board SET x = $x, y = $y WHERE id = $id").run({ id: memberId, x, y });
    return true;
}

export function changePlayerLayer(memberId: string, layer: number): boolean {
    db.query("UPDATE Board SET layer = $layer WHERE id = $id").run({ id: memberId, layer });
    return true;
}

export function getPlayerPosition(memberId: string): BoardData | null {
    return <BoardData>db.query("SELECT layer, x, y FROM Board WHERE id = $id").get({ id: memberId });
}

export function getPortalPosition(guildId: string, layer: number, direction: "back" | "forward"): BoardData {
    return <BoardData>db.query(`SELECT layer, x, y FROM Board WHERE layer = $layer AND id LIKE '${guildId}:%' AND data = $to`).get({
        layer,
        to: JSON.stringify(direction === "back" ? { to: -1 } : { to: 1 })
    });
}

export function getEntityInPosition(layer: number, x: number, y: number): BoardEntity {
    const data = <{ data: string } | null>db.query("SELECT id, type, data FROM Board WHERE layer = $layer AND x = $x AND y = $y").get({
        layer,
        x,
        y
    });

    if (data === null) return { type: BoardEntityType.Empty };
    if (typeof data.data === "string") data.data = <never>JSON.parse(<never>data.data);
    return <never>data;
}

export function deleteEntityInPosition(layer: number, x: number, y: number): void {
    db.query("DELETE FROM Board WHERE layer = $layer AND x = $x AND y = $y").run({ layer, x, y });
}

export async function scanFromCenter(center: BoardData, size: number, playerId?: string, updateViews?: boolean): Promise<Array<number>> {
    const fullSize = size * size;
    const board: Array<number> = [];

    const initialX = center.x - Math.floor(size / 2);
    const initialY = center.y + Math.ceil(size / 2);

    const viewsToUpdate: Array<Promise<void>> = [];

    for (let i = 0, x = initialX, y = initialY; i < fullSize; i += 1) {
        if (i % size === 0) {
            x = initialX;
            y -= 1;
        }

        const entity = getEntityInPosition(center.layer, x, y);
        if (entity.type === BoardEntityType.Chest && entity.data.rarity === ChestRarity.Legendary) board.push(88);
        else if (entity.type === BoardEntityType.Player && entity.id !== playerId) {
            if (updateViews) {
                const cacheEntry = BoardCache.getMember(entity.id);
                if (cacheEntry === null) {
                    board.push(99);
                    continue;
                }

                if (Date.now() - cacheEntry.added_at < 300000 /* 5 min */) {
                    const [channelId, messageId] = cacheEntry.id.split(":", 2);

                    viewsToUpdate.push(updateView(entity.id, channelId, messageId, { layer: center.layer, x, y }));
                }
            }

            board.push(99);
        } else board.push(entity.type);

        x += 1;
    }

    if (updateViews) await Promise.all(viewsToUpdate);

    return board;
}

async function updateView(entityId: string, channelId: string, messageId: string, position: BoardData): Promise<void> {
    await client.rest.editMessage(channelId, messageId, {
        embeds: [await makeBoardEmbed({ layer: position.layer, x: position.x, y: position.y }, entityId)],
        components: [MOVEMENT_ROW]
    });
}

export function scanForEntities(center: BoardData, size: number): Array<{ type: BoardEntityType } & Omit<BoardData, "layer">> {
    const fullSize = size * size;
    const entities: ReturnType<typeof scanForEntities> = [];

    const initialX = center.x - Math.floor(size / 2);
    const initialY = center.y + Math.ceil(size / 2);

    for (let i = 0, x = initialX, y = initialY; i < fullSize; i += 1) {
        if (i % size === 0) {
            x = initialX;
            y -= 1;
        }

        const entity = getEntityInPosition(center.layer, x, y);
        if (entity.type !== BoardEntityType.Empty) entities.push({ type: entity.type, x, y });

        x += 1;
    }

    return entities;
}

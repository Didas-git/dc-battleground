import assert from "node:assert";
import { db } from "../db.js";

import { floors } from "../../config.json";
assert(floors.length >= 2, "At least 2 floors must exist (Base & layer 1).");

export interface BoardLayer {
    name: string;
    x: number;
    y: number;
    isLastLayer: boolean;
}

db.run("CREATE TABLE IF NOT EXISTS BoardLayer ( layer INTEGER PRIMARY KEY, name TEXT NOT NULL, x INTEGER NOT NULL, y INTEGER NOT NULL, is_last_layer BOOLEAN NOT NULL )");

const query = db.query("SELECT layer FROM BoardLayer WHERE layer = $layer");
for (let i = 0; ; i++) {
    const layer = floors[i];
    const storedLayer = <{ x: number, y: number } | null>query.get(i);
    if (typeof layer === "undefined" && storedLayer === null) break;

    db.query("DELETE FROM BoardLayer WHERE layer = $layer").run({ layer: i });
    if (typeof layer === "undefined" && storedLayer !== null) continue;

    const [cx, cy] = <[string, string | undefined]>layer.size.split("x", 2);
    const x = parseInt(cx);
    const y = parseInt(cy ?? cx);

    createBoardLayer(i, layer.name, x, y, typeof floors[i + 1] === "undefined");
}

export function getBoardLayerInfo(layer: number): BoardLayer {
    const l = <BoardLayer>db.query("SELECT name, x, y, is_last_layer as isLastLayer FROM BoardLayer WHERE layer = $layer").get({ layer });
    l.isLastLayer = !!l.isLastLayer;
    return l;
}

export function createBoardLayer(layer: number, name: string, x: number, y: number, isLastLayer: boolean): void {
    db.query("INSERT INTO BoardLayer (layer, name, x, y, is_last_layer) VALUES ($layer, $name, $x, $y, $isLastLayer)").run({ layer, name, x, y, isLastLayer });
}

export function calculateLayerSize(coordinates: BoardLayer): number {
    return (coordinates.x - (coordinates.x * -1)) * (coordinates.y - (coordinates.y * -1));
}

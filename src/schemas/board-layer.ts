import assert from "node:assert";
import { db } from "../db.js";

import { floors } from "../../config.json";
assert(floors.length >= 2, "At least 2 floors must exist (Base & layer 1).");

export interface BoardLayer {
    layer: number;
    name: string;
    x: number;
    y: number;
    previous: number | null;
    next: number | null;
}

db.run(`
CREATE TABLE IF NOT EXISTS BoardLayer (
    layer INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    previous INTEGER,
    next INTEGER,
    FOREIGN KEY(previous) REFERENCES BoardLayer(layer)
    FOREIGN KEY(next) REFERENCES BoardLayer(layer)
)`);

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

    const previousLayer = i - 1 <= 0 ? null : i - 1;
    const nextLayer = i + 1 === 1 ? null : typeof floors[i + 1] === "undefined" ? null : i + 1;

    createBoardLayer(i, layer.name, x, y, previousLayer, nextLayer);
}

export function getBoardLayerInfo(layer: number): BoardLayer | null {
    return <BoardLayer | null>db.query("SELECT layer, name, x, y, previous, next FROM BoardLayer WHERE layer = $layer").get({ layer });
}

export function createBoardLayer(layer: number, name: string, x: number, y: number, previousLayer: number | null, nextLayer: number | null): void {
    db.query("INSERT INTO BoardLayer (layer, name, x, y, previous, next) VALUES ($layer, $name, $x, $y, $previousLayer, $nextLayer)").run({
        layer,
        name,
        x,
        y,
        previousLayer,
        nextLayer
    });
}

export function calculateLayerSize(coordinates: BoardLayer): number {
    return (coordinates.x - (coordinates.x * -1)) * (coordinates.y - (coordinates.y * -1));
}

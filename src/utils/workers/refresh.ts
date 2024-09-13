import { generateRandomChestData } from "../../utils/board.js";
import { WorkerDataType } from "./index.js";
import { randomUUID } from "node:crypto";
import { db } from "../../db.js";

import * as BoardLayer from "../../schemas/board-layer.js";
import * as Board from "../../schemas/board.js";

import type { RefreshData, WorkerData } from "./index.js";

declare const self: Worker;

self.addEventListener("message", (event: MessageEvent<RefreshData>) => {
    const { layer, guildId } = event.data;

    db.query("DELETE FROM Board WHERE layer = $layer AND (type = $type1 OR type = $type2 OR type = $type3)").run({
        layer: layer.layer,
        type1: Board.BoardEntityType.Chest,
        type2: Board.BoardEntityType.Enemy,
        type3: Board.BoardEntityType.LayerEntrance
    });

    const layerSize = BoardLayer.calculateLayerSize(layer);
    const chestQuantity = Math.round(parseFloat(process.env.CHEST_REFRESH_PERCENTAGE) * layerSize);
    const mobQuantity = Math.round(parseFloat(process.env.MOB_REFRESH_PERCENTAGE) * layerSize);

    let x = 0;
    let y = 0;

    if (layer.previous !== null) {
        ({ x, y } = Board.generateRandomCoordinates(layer.x, layer.y));
        Board.insertLayerEntrance(`${guildId}:${randomUUID()}`, layer.layer, x, y, { to: -1 });
    }

    if (layer.next !== null) {
        ({ x, y } = Board.generateRandomCoordinates(layer.x, layer.y));
        Board.insertLayerEntrance(`${guildId}:${randomUUID()}`, layer.layer, x, y, { to: 1 });
    }

    let start = performance.now();

    for (let i = 0; i < chestQuantity; i++) {
        const entityId = `${guildId}:${randomUUID()}`;

        do ({ x, y } = Board.generateRandomCoordinates(layer.x, layer.y));
        while (Board.getEntityInPosition(layer.layer, x, y).type !== Board.BoardEntityType.Empty);

        Board.generateChest(entityId, layer.layer, x, y, generateRandomChestData());
    }

    const time1 = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));
    start = performance.now();

    for (let i = 0; i < mobQuantity; i++) {
        const entityId = `${guildId}:${randomUUID()}`;

        do ({ x, y } = Board.generateRandomCoordinates(layer.x, layer.y));
        while (Board.getEntityInPosition(layer.layer, x, y).type !== Board.BoardEntityType.Empty);

        Board.generateEnemy(entityId, layer.layer, x, y);
    }

    const time2 = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));

    self.postMessage({
        type: WorkerDataType.Done,
        quantity: {
            chests: chestQuantity,
            mobs: mobQuantity
        },
        time: {
            chests: `${time1.getUTCSeconds()}.${time1.getUTCMilliseconds()}`,
            mobs: `${time2.getUTCSeconds()}.${time2.getUTCMilliseconds()}`
        }
    } satisfies WorkerData);
});

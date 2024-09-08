import { generateRandomChestData } from "../../utils/board.js";
import { PermissionFlags } from "lilybird";
import { randomUUID } from "node:crypto";
import { db } from "../../db.js";

import * as BoardLayer from "../../schemas/board-layer.js";
import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function boardReset(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    if ((BigInt(interaction.member.permissions ?? 0) & PermissionFlags.ADMINISTRATOR) !== PermissionFlags.ADMINISTRATOR) {
        await interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
        return;
    }

    const layer = interaction.data.getInteger("layer") ?? -1;

    if (layer === -1)
        await interaction.reply({ content: "Resetting all layers at once is not yet implemented", ephemeral: true });
    else if (layer === 0) {
        await interaction.reply({ content: "Layer 0 cannot be reset!", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    db.query("DELETE FROM Board WHERE layer = $layer AND (type = $type1 OR type = $type2 OR type = $type3)").run({
        layer,
        type1: Board.BoardEntityType.Chest,
        type2: Board.BoardEntityType.Enemy,
        type3: Board.BoardEntityType.LayerEntrance
    });

    const layerInfo = BoardLayer.getBoardLayerInfo(layer);

    if (layerInfo === null) {
        await interaction.editReply({ content: `Layer ${layer} does not exist.` });
        return;
    }

    const layerSize = BoardLayer.calculateLayerSize(layerInfo);
    const chestQuantity = Math.round(parseFloat(process.env.CHEST_REFRESH_PERCENTAGE) * layerSize);
    const mobQuantity = Math.round(parseFloat(process.env.MOB_REFRESH_PERCENTAGE) * layerSize);

    let x = 0;
    let y = 0;

    if (layerInfo.previous !== null) {
        ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        Board.insertLayerEntrance(`${interaction.guildId}:${randomUUID()}`, layer, x, y, { to: -1 });
    }

    if (layerInfo.next !== null) {
        ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        Board.insertLayerEntrance(`${interaction.guildId}:${randomUUID()}`, layer, x, y, { to: 1 });
    }

    let start = performance.now();

    for (let i = 0; i < chestQuantity; i++) {
        const entityId = `${interaction.guildId}:${randomUUID()}`;

        do ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        while (Board.getEntityInPosition(layer, x, y).type !== Board.BoardEntityType.Empty);

        Board.generateChest(entityId, layer, x, y, generateRandomChestData());
    }

    const time1 = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));
    start = performance.now();

    for (let i = 0; i < mobQuantity; i++) {
        const entityId = `${interaction.guildId}:${randomUUID()}`;

        do ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        while (Board.getEntityInPosition(layer, x, y).type !== Board.BoardEntityType.Empty);

        Board.generateEnemy(entityId, layer, x, y);
    }

    const time2 = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));

    await interaction.editReply({
        embeds: [
            {
                color: 0xff00ef,
                title: `Layer ${layer} (${layerInfo.name}) reset!`,
                description: `There are ${chestQuantity} new chests!\nThere are ${mobQuantity} new enemies!`,
                footer: { text: `Chests Took ${time1.getUTCSeconds()}.${time1.getUTCMilliseconds()} seconds.\nMobs Took ${time2.getUTCSeconds()}.${time2.getUTCMilliseconds()} seconds.` }
            }
        ]
    });
}

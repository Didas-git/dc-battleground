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

    if (layer === 0) {
        await interaction.reply({ content: "Layer 0 cannot be reset!", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    if (layer === -1) {
        let totalChestQuantity = 0;
        let totalMobQuantity = 0;
        let totalChestTime = 0;
        let totalMobTime = 0;

        for (let i = 1; ;i++) {
            const layerInfo = BoardLayer.getBoardLayerInfo(i);
            if (layerInfo === null) break;
            const { chest, mob } = refreshLayer(interaction.guildId, layerInfo);

            totalChestQuantity += chest.quantity;
            totalChestTime += chest.time;
            totalMobQuantity += mob.quantity;
            totalMobTime += mob.time;
        }

        const chestTime = new Date(Date.UTC(0, 0, 0, 0, 0, 0, totalChestTime));
        const mobTime = new Date(Date.UTC(0, 0, 0, 0, 0, 0, totalMobTime));
        await interaction.editReply({
            embeds: [
                {
                    color: 0xff00ef,
                    title: "All layers were reset!",
                    description: `A total of ${totalChestQuantity} chests were spawned!\nA total of ${totalMobQuantity} enemies were spawned!`,
                    footer: {
                        text: `
Chests Took ${chestTime.getUTCMinutes()}:${chestTime.getUTCSeconds()}.${chestTime.getUTCMilliseconds()} minutes.
Mobs Took ${mobTime.getUTCMinutes()}:${mobTime.getUTCSeconds()}.${mobTime.getUTCMilliseconds()} minutes.`
                    }
                }
            ]
        });

        return;
    }

    const layerInfo = BoardLayer.getBoardLayerInfo(layer);

    if (layerInfo === null) {
        await interaction.editReply({ content: `Layer ${layer} does not exist.` });
        return;
    }

    const { chest, mob } = refreshLayer(interaction.guildId, layerInfo);
    const chestTime = new Date(Date.UTC(0, 0, 0, 0, 0, 0, chest.time));
    const mobTime = new Date(Date.UTC(0, 0, 0, 0, 0, 0, mob.time));

    await interaction.editReply({
        embeds: [
            {
                color: 0xff00ef,
                title: `Layer ${layer} (${layerInfo.name}) reset!`,
                description: `There are ${chest.quantity} new chests!\nThere are ${mob.quantity} new enemies!`,
                footer: {
                    text: `
Chests Took ${chestTime.getUTCMinutes()}:${chestTime.getUTCSeconds()}.${chestTime.getUTCMilliseconds()} minutes.
Mobs Took ${mobTime.getUTCMinutes()}:${mobTime.getUTCSeconds()}.${mobTime.getUTCMilliseconds()} minutes.`
                }
            }
        ]
    });
}

function refreshLayer(guildId: string, layerInfo: BoardLayer.BoardLayer): { chest: { quantity: number, time: number }, mob: { quantity: number, time: number } } {
    db.query("DELETE FROM Board WHERE layer = $layer AND (type = $type1 OR type = $type2 OR type = $type3)").run({
        layer: layerInfo.layer,
        type1: Board.BoardEntityType.Chest,
        type2: Board.BoardEntityType.Enemy,
        type3: Board.BoardEntityType.LayerEntrance
    });

    const layerSize = BoardLayer.calculateLayerSize(layerInfo);
    const chestQuantity = Math.round(parseFloat(process.env.CHEST_REFRESH_PERCENTAGE) * layerSize);
    const mobQuantity = Math.round(parseFloat(process.env.MOB_REFRESH_PERCENTAGE) * layerSize);

    let x = 0;
    let y = 0;

    if (layerInfo.previous !== null) {
        ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        Board.insertLayerEntrance(`${guildId}:${randomUUID()}`, layerInfo.layer, x, y, { to: -1 });
    }

    if (layerInfo.next !== null) {
        ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        Board.insertLayerEntrance(`${guildId}:${randomUUID()}`, layerInfo.layer, x, y, { to: 1 });
    }

    const startChest = performance.now();

    for (let i = 0; i < chestQuantity; i++) {
        const entityId = `${guildId}:${randomUUID()}`;

        do ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        while (Board.getEntityInPosition(layerInfo.layer, x, y).type !== Board.BoardEntityType.Empty);

        Board.generateChest(entityId, layerInfo.layer, x, y, generateRandomChestData());
    }

    const endChest = performance.now();

    for (let i = 0; i < mobQuantity; i++) {
        const entityId = `${guildId}:${randomUUID()}`;

        do ({ x, y } = Board.generateRandomCoordinates(layerInfo.x, layerInfo.y));
        while (Board.getEntityInPosition(layerInfo.layer, x, y).type !== Board.BoardEntityType.Empty);

        Board.generateEnemy(entityId, layerInfo.layer, x, y, "goblin");
    }

    const endMob = performance.now();

    return {
        chest: { quantity: chestQuantity, time: endChest - startChest },
        mob: { quantity: mobQuantity, time: endMob - endChest }
    };
}

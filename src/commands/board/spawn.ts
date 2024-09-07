import { generateRandomChestData } from "../../utils/board.js";
import { randomUUID } from "node:crypto";

import * as BoardLayer from "../../schemas/board-layer.js";
import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function boardSpawn(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    if ((BigInt(interaction.member.permissions ?? 0) & (1n << 3n)) !== (1n << 3n)) {
        await interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    const layer = interaction.data.getInteger("layer") ?? -1;
    if (layer <= 0) throw new Error("Not yet implemented");

    const layerLimits = BoardLayer.getBoardLayerInfo(layer);
    const quantity = interaction.data.getInteger("quantity", true);
    const locations: Array<Board.BoardData> = [];

    for (let i = 0; i < quantity; i++) {
        const entityId = `${interaction.guildId}:${randomUUID()}`;

        let x = 0;
        let y = 0;

        do ({ x, y } = Board.generateRandomCoordinates(layerLimits.x, layerLimits.y));
        while (Board.getEntityInPosition(layer, x, y) !== null);

        Board.generateChest(entityId, layer, x, y, generateRandomChestData());
        locations.push({ layer, x, y });
    }

    await interaction.editReply({
        content: `Successfully generated ${quantity} chests.`,
        embeds: [
            {
                color: 0x00ff00,
                title: "New chests generated",
                description: locations.map(({ x, y }) => `- X: ${x} | Y: ${y}`).join("\n")
            }
        ]
    });
}

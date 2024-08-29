import { generateRandomChestData } from "../../utils/board.js";
import { randomUUID } from "node:crypto";

import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function boardSpawn(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    if ((BigInt(interaction.member.permissions ?? 0) & (1n << 3n)) !== (1n << 3n)) {
        await interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    const quantity = interaction.data.getInteger("quantity", true);
    const locations: Array<Board.BoardData> = [];

    for (let i = 0; i < quantity; i++) {
        const entityId = `${interaction.guildId}:${randomUUID()}` as const;

        let x = 0;
        let y = 0;

        do ({ x, y } = Board.generateRandomCoordinates());
        while (Board.getEntityInPosition(x, y) !== null);

        Board.generateChest(entityId, x, y, generateRandomChestData());
        locations.push({ x, y });
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

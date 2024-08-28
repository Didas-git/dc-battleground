import { randomUUID } from "node:crypto";
import { db } from "../../db.js";

import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function boardReset(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    if ((BigInt(interaction.member.permissions ?? 0) & (1n << 3n)) !== (1n << 3n)) {
        await interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    db.query("DELETE FROM Board WHERE type = 3").run();

    const quantity = Math.round(0.0035 * ((Board.BOARD_LIMITS.POSITIVE.x - Board.BOARD_LIMITS.NEGATIVE.x) * (Board.BOARD_LIMITS.POSITIVE.y - Board.BOARD_LIMITS.NEGATIVE.y)));
    const start = performance.now();

    for (let i = 0; i < quantity; i++) {
        const entityId = `${interaction.guildId}:${randomUUID()}` as const;

        let x = 0;
        let y = 0;

        do ({ x, y } = Board.generateCoordinates());
        while (Board.getEntityInPosition(x, y) !== null);

        Board.generateChest(Board.BoardEntityType.Chest, entityId, x, y, { rarity: Board.ChestRarity.Basic, contents: [] });
    }

    const time = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));

    await interaction.editReply({
        embeds: [
            {
                color: 0xff00ef,
                title: "Board reset!",
                description: `All chests have been relocated.\nThere are ${quantity} new chests!`,
                footer: { text: `Took ${time.getUTCSeconds()}.${time.getUTCMilliseconds()} seconds` }
            }
        ]
    });
}

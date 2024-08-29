import { randomUUID } from "node:crypto";
import { db } from "../../db.js";

import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";
import { PermissionFlags } from "lilybird";

export async function boardReset(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    if ((BigInt(interaction.member.permissions ?? 0) & PermissionFlags.ADMINISTRATOR) !== PermissionFlags.ADMINISTRATOR) {
        await interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    db.query("DELETE FROM Board WHERE type = $type1 OR type = $type2 ").run({ type1: Board.BoardEntityType.Chest, type2: Board.BoardEntityType.Enemy });

    const chestQuantity = Math.round(parseFloat(process.env.CHEST_REFRESH_PERCENTAGE) * Board.BOARD_CALCULATED_SIZE);
    const mobQuantity = Math.round(parseFloat(process.env.MOB_REFRESH_PERCENTAGE) * Board.BOARD_CALCULATED_SIZE);

    let start = performance.now();

    for (let i = 0; i < chestQuantity; i++) {
        const entityId = `${interaction.guildId}:${randomUUID()}` as const;

        let x = 0;
        let y = 0;

        do ({ x, y } = Board.generateCoordinates());
        while (Board.getEntityInPosition(x, y) !== null);

        Board.generateChest(entityId, x, y, { rarity: Board.ChestRarity.Basic, contents: [] });
    }

    const time1 = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));
    start = performance.now();

    for (let i = 0; i < mobQuantity; i++) {
        const entityId = `${interaction.guildId}:${randomUUID()}` as const;

        let x = 0;
        let y = 0;

        do ({ x, y } = Board.generateCoordinates());
        while (Board.getEntityInPosition(x, y) !== null);

        Board.generateEnemy(entityId, x, y);
    }

    const time2 = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));

    await interaction.editReply({
        embeds: [
            {
                color: 0xff00ef,
                title: "Board reset!",
                description: `There are ${chestQuantity} new chests!\nThere are ${mobQuantity} new enemies!`,
                footer: { text: `Chests Took ${time1.getUTCSeconds()}.${time1.getUTCMilliseconds()} seconds.\nMobs Took ${time2.getUTCSeconds()}.${time2.getUTCMilliseconds()} seconds.` }
            }
        ]
    });
}

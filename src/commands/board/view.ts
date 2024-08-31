import { makeBoardEmbed, makeMovementRow } from "../../utils/board.js";

import * as BoardCache from "../../schemas/board-cache.js";
import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function viewBoard(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
    const position = Board.getPlayerPosition(memberId);
    if (position === null) {
        await interaction.reply({ content: "You don't have a profile yet.", ephemeral: true });
        return;
    }

    await interaction.reply({
        embeds: [await makeBoardEmbed(position, memberId)],
        components: [makeMovementRow(position.x, position.y)]
    });

    BoardCache.del(memberId);
    const message = await interaction.client.rest.getWebhookMessage(interaction.applicationId, interaction.token, "@original", {});
    const cacheId = `${interaction.channelId}:${message.id}`;
    BoardCache.set(cacheId, memberId);
}

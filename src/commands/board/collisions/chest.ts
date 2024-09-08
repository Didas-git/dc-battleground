import { DIRECTION_MAP, makeBoardEmbed, makeMovementRow } from "../../../utils/board.js";

import * as BoardCache from "../../../schemas/board-cache.js";
import * as Player from "../../../schemas/player.js";
import * as Board from "../../../schemas/board.js";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function handleChestCollision(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
    const [chests, coordinates] = interaction.data.id.split(":", 2);
    const [,messageId, direction] = chests.split("-", 3);
    const [l, cx, cy] = coordinates.split(",", 3);
    const layer = parseInt(l);
    const x = parseInt(cx);
    const y = parseInt(cy);

    const chest = Board.getEntityInPosition(layer, x, y);
    if (chest.type !== Board.BoardEntityType.Chest) {
        await interaction.reply({
            content: "Something went wrong",
            ephemeral: true
        });
        return;
    }

    const cacheId = `${interaction.channelId}:${messageId}`;
    const cacheEntry = BoardCache.get(cacheId);

    if (cacheEntry === null) {
        await interaction.reply({ content: "This table has been invalidated!", ephemeral: true });
        return;
    }

    if (cacheEntry.member_id !== memberId) {
        await interaction.reply({ content: "You cannot do that!", ephemeral: true });
        return;
    }

    const contents = chest.data.contents.map((el) => ({
        id: el.type === Board.ChestContentType.Gold ? "gold" : el.item,
        amount: el.type === Board.ChestContentType.Gold ? el.amount : 1
    }));

    await interaction.deferComponentReply();

    Player.Inventory.updateContents(memberId, contents);
    Board.deleteEntityInPosition(layer, x, y);
    Board.updatePlayerPosition(memberId, x, y);
    BoardCache.update(cacheId);

    await interaction.client.rest.editMessage(interaction.channelId, messageId, {
        embeds: [await makeBoardEmbed({ layer, x, y }, memberId, DIRECTION_MAP[direction])],
        components: [makeMovementRow(layer, x, y)]
    });

    await interaction.editReply({
        content: `Added ${JSON.stringify(contents)} to your inventory`,
        components: []
    });
}

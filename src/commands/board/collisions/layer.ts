import { makeBoardEmbed, makeMovementRow } from "../../../utils/board.js";

import * as BoardCache from "../../../schemas/board-cache.js";
import * as BoardLayer from "../../../schemas/board-layer.js";
import * as Board from "../../../schemas/board.js";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function handleLayerCollision(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
    const [chests, coordinates] = interaction.data.id.split(":", 2);
    const [,messageId] = chests.split("-", 2);
    const [l, cx, cy] = coordinates.split(",", 3);
    const layer = parseInt(l);
    const x = parseInt(cx);
    const y = parseInt(cy);

    const portal = Board.getEntityInPosition(layer, x, y);
    if (portal.type !== Board.BoardEntityType.LayerEntrance) {
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

    await interaction.deferComponentReply();

    const newLayer = layer + portal.data.to;
    const newLayerInfo = BoardLayer.getBoardLayerInfo(newLayer);

    if (newLayerInfo === null) {
        await interaction.editReply({
            content: "Something went wrong"
        });
        return;
    }

    Board.changePlayerLayer(memberId, newLayer);

    const portalDirection: "back" | "forward" = portal.data.to === 1 ? "back" : "forward";
    const newLayerPortal = Board.getPortalPosition(interaction.guildId, newLayer, portalDirection);

    // TODO: A better algorithm to randomize where the player exits
    const newX = newLayerPortal.x + 1;
    const newY = newLayerPortal.y + 1;
    Board.updatePlayerPosition(memberId, newX, newY);

    BoardCache.update(cacheId);
    await interaction.client.rest.editMessage(interaction.channelId, messageId, {
        embeds: [await makeBoardEmbed({ layer: newLayer, x: newX, y: newY }, memberId, "")],
        components: [makeMovementRow(newLayer, newX, newY)]
    });

    await interaction.editReply({
        content: `Entered [${newLayer}]${newLayerInfo.name} at ${newX},${newY}`,
        components: []
    });
}

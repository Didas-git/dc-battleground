import { ButtonStyle, ComponentType } from "lilybird";

import * as BoardCache from "../../../schemas/board-cache.js";
import * as Board from "../../../schemas/board.js";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function handleChestCollision(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
    const [chests, coordinates] = interaction.data.id.split(":", 2);
    const [, direction] = chests.split("-", 2);
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

    const cacheId = `${interaction.channelId}:${interaction.message.id}`;
    const cacheEntry = BoardCache.get(cacheId);

    if (cacheEntry === null) {
        await interaction.reply({ content: "This table has been invalidated!", ephemeral: true });
        return;
    }

    if (cacheEntry.member_id !== memberId) {
        await interaction.reply({ content: "You cannot do that!", ephemeral: true });
        return;
    }

    //! TODO: Chests should be generated when opened
    // const contents: Player.InventoryStructure["items"] = {};

    await interaction.deferComponentReply();

    Board.deleteEntityInPosition(layer, x, y);
    Board.updatePlayerPosition(memberId, x, y);
    BoardCache.update(cacheId);

    await interaction.editReply({
        // embeds: [updatePlayerInventoryAndGetEmbed(memberId, `Opened ${Board.CHEST_RARITY_MAPPINGS[chest.data.rarity]} chest!`, contents)],
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.Button,
                        custom_id: `con-${direction}`,
                        style: ButtonStyle.Primary,
                        label: "Continue"
                    }
                ]
            }
        ]
    });
}

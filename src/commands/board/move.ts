import { DIRECTION_MAP, makeBoardEmbed, makeMovementRow } from "../../utils/board.js";
import { ButtonStyle, ComponentType } from "lilybird";

import * as BoardCache from "../../schemas/board-cache.js";
import * as Board from "../../schemas/board.js";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function handleMoving(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
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

    const [arrow, coordinates] = interaction.data.id.split(":", 2);
    const [,direction] = arrow.split("-", 2);
    const [l, cx, cy] = coordinates.split(",", 3);
    const layer = parseInt(l);
    const x = parseInt(cx);
    const y = parseInt(cy);

    const entity = Board.getEntityInPosition(layer, x, y);

    switch (entity.type) {
        case Board.BoardEntityType.Empty: /* No Collision, can safely move */ {
            await interaction.deferComponentReply();

            const didUpdate = Board.updatePlayerPosition(memberId, x, y);

            if (!didUpdate) {
                await interaction.reply({ content: `You cannot move ${direction} as it is out of bounds.` });
                return;
            }

            BoardCache.update(cacheId);

            await interaction.editReply({
                embeds: [await makeBoardEmbed({ layer, x, y }, memberId, DIRECTION_MAP[direction])],
                components: [makeMovementRow(layer, x, y)]
            });

            break;
        }
        case Board.BoardEntityType.Player: {
            // TODO: Option to battle the player
            break;
        }
        case Board.BoardEntityType.Enemy: {
            // TODO: Handle enemy collision (battle,purification)
            break;
        }
        case Board.BoardEntityType.Chest: {
            await interaction.reply({
                content: "Do you want to open the chest?",
                ephemeral: true,
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                custom_id: `c-${interaction.message.id}-${direction}:${layer},${x},${y}`,
                                style: ButtonStyle.Success,
                                label: "Yes"
                            }
                        ]
                    }
                ]
            });
            break;
        }
        case Board.BoardEntityType.LayerEntrance: {
            // TODO: Handle entering a new layer
            break;
        }
    }
}


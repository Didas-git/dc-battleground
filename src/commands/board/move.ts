import { calculateCoordinates, DIRECTION_MAP, makeBoardEmbed, MOVEMENT_ROW } from "../../utils/board.js";
import { BACK_BUTTON } from "../../utils/components.js";
import { ButtonStyle, ComponentType } from "lilybird";

import * as BoardCache from "../../schemas/board-cache.js";
import * as BoardLayer from "../../schemas/board-layer.js";
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

    const [, direction] = interaction.data.id.split("-", 2);

    const player = Board.getPlayerPosition(memberId);

    if (player === null) {
        await interaction.reply({
            content: "Something went wrong",
            ephemeral: true
        });
        return;
    }

    const { x, y } = calculateCoordinates(player.x, player.y, direction);

    const entity = Board.getEntityInPosition(player.layer, x, y);

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
                embeds: [await makeBoardEmbed({ layer: player.layer, x, y }, memberId, DIRECTION_MAP[direction])],
                components: [MOVEMENT_ROW]
            });

            break;
        }
        case Board.BoardEntityType.Player: {
            // TODO: Option to battle the player
            await interaction.updateComponents({
                embeds: [
                    await makeBoardEmbed(player, memberId, DIRECTION_MAP[direction]),
                    { color: 0xff0000, description: "Player collisions are not yet implemented" }
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [BACK_BUTTON]
                    }
                ]
            });
            break;
        }
        case Board.BoardEntityType.Enemy: {
            // TODO: Handle enemy collision (battle,purification)
            await interaction.updateComponents({
                embeds: [
                    await makeBoardEmbed(player, memberId, DIRECTION_MAP[direction]),
                    { color: 0xf55742, description: "Do you want to battle or purify the enemy?" }
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            BACK_BUTTON,
                            {
                                type: ComponentType.Button,
                                custom_id: `btm:${player.layer},${x},${y}`,
                                style: ButtonStyle.Danger,
                                label: "Battle"
                            }
                            // {
                            //     type: ComponentType.Button,
                            //     custom_id: `pur-${direction}:${player.layer},${x},${y}`,
                            //     style: ButtonStyle.Primary,
                            //     disabled: true,
                            //     label: "Purify"
                            // }
                        ]
                    }
                ]
            });
            break;
        }
        case Board.BoardEntityType.Chest: {
            await interaction.updateComponents({
                embeds: [
                    await makeBoardEmbed(player, memberId, DIRECTION_MAP[direction]),
                    { color: 0x00f0ff, description: "Do you want to open the chest?" }
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                custom_id: `co-${direction}:${player.layer},${x},${y}`,
                                style: ButtonStyle.Success,
                                label: "Open"
                            },
                            BACK_BUTTON
                        ]
                    }
                ]
            });
            break;
        }
        case Board.BoardEntityType.LayerEntrance: {
            const nextLayer = player.layer + entity.data.to;
            const layerToMove = BoardLayer.getBoardLayerInfo(nextLayer);

            await interaction.updateComponents({
                embeds: [
                    await makeBoardEmbed(player, memberId, DIRECTION_MAP[direction]),
                    { color: 0xee7dff, description: `Do you want to move to [${nextLayer}]${layerToMove?.name}?` }
                ],
                components: [
                    {
                        type: ComponentType.ActionRow,
                        components: [
                            {
                                type: ComponentType.Button,
                                custom_id: `pot:${player.layer},${x},${y}`,
                                style: ButtonStyle.Success,
                                label: "Yes"
                            },
                            BACK_BUTTON
                        ]
                    }
                ]
            });
            break;
        }
    }
}


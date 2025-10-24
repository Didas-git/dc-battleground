import { DIRECTION_UNICODE_MAP, DIRECTION_MAP } from "#utils/board.js";
import { MOVEMENT_ROW, BACK_BUTTON } from "#utils/components.js";
import { ButtonStyle, ComponentType } from "lilybird";
import { makeBoardEmbed } from "#utils/embeds.js";

import * as Battleground from "#bt";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function handleMoving(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const [, directionString] = interaction.data.id.split("-", 2);
    const direction: Battleground.Direction = DIRECTION_MAP[directionString];

    const res = await Battleground.move(interaction.guildId, interaction.member.user.id, interaction.message.id, direction);

    switch (res[0]) {
        case Battleground.MoveStatus.Success: {
            const view = await Battleground.viewBoard(interaction.guildId, interaction.member.user.id, interaction.message.id);
            await interaction.updateComponents({
                embeds: [makeBoardEmbed(<never>view[1], DIRECTION_UNICODE_MAP[direction])],
                components: [MOVEMENT_ROW]
            });
            break;
        }
        case Battleground.MoveStatus.Collision: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const nextMove = res[1]!;

            switch (nextMove.entity) {
                case Battleground.Entity.Chest: {
                    await interaction.updateComponents({
                        embeds: [
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            interaction.message.embeds![0], // Avoid recalculating the same board
                            { color: 0x00f0ff, description: "Do you want to open the chest?" }
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        custom_id: `co-${direction}:${nextMove.layer},${nextMove.x},${nextMove.y}`,
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
                case Battleground.Entity.Mob: {
                    // TODO: Handle enemy collision (battle,purification)
                    await interaction.updateComponents({
                        embeds: [
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            interaction.message.embeds![0], // Avoid recalculating the same board
                            { color: 0xf55742, description: "Do you want to battle or purify the mob?" }
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    BACK_BUTTON,
                                    {
                                        type: ComponentType.Button,
                                        custom_id: `btm:${nextMove.layer},${nextMove.x},${nextMove.y}`,
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
                case Battleground.Entity.LayerPortal: {
                    if (!("to" in nextMove)) return; // just to make ts happy
                    await interaction.updateComponents({
                        embeds: [
                            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                            interaction.message.embeds![0], // Avoid recalculating the same board
                            { color: 0xee7dff, description: `Do you want to move to [${nextMove.to.layer}]${nextMove.to.name}?` }
                        ],
                        components: [
                            {
                                type: ComponentType.ActionRow,
                                components: [
                                    {
                                        type: ComponentType.Button,
                                        custom_id: `pot:${nextMove.layer},${nextMove.x},${nextMove.y}`,
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
                // Not implemented
                case Battleground.Entity.Player: { break; }
                // cant happen
                case Battleground.Entity.Empty: { break; }
            }
            break;
        }
        case Battleground.MoveStatus.NoCacheEntry: {
            await interaction.reply({ content: "This table has been invalidated!", ephemeral: true });
            break;
        }
        case Battleground.MoveStatus.NoPlayer: {
            await interaction.reply({
                content: "Something went wrong",
                ephemeral: true
            });
            break;
        }
        case Battleground.MoveStatus.WrongPlayer: {
            await interaction.reply({ content: "You cannot do that!", ephemeral: true });
            break;
        }
        case Battleground.MoveStatus.Error:
        case Battleground.MoveStatus.Failure: {
            await interaction.reply({ content: "Something is extremely fucked up", ephemeral: true });
            break;
        }
    }
}

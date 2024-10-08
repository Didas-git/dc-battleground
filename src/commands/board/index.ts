import { ApplicationCommandOptionType, ComponentType } from "lilybird";
import { handleChestCollision } from "./collisions/chest.js";
import { handleLayerCollision } from "./collisions/layer.js";
import { handleMobBattle } from "./collisions/mobs.js";
import { $applicationCommand } from "../../handler.js";
import { MOVEMENT_ROW } from "#utils/components.js";
import { makeBoardEmbed } from "#utils/embeds.js";
import { DIRECTION_MAP } from "#utils/board.js";
import { boardReset } from "./admin/refresh.js";
import { boardSpawn } from "./admin/spawn.js";
import { handleMoving } from "./move.js";
import { viewBoard } from "./view.js";
import { scanBoard } from "./scan.js";

import * as BoardCache from "#models/board-cache.js";
import * as Board from "#models/board.js";

$applicationCommand({
    name: "board",
    description: "Board actions",
    components: [
        {
            type: ComponentType.Button,
            id: "arrows",
            customMatcher: "custom_id.split(\"-\",2)[0] === \"arrow\"",
            handle: handleMoving
        },
        {
            type: ComponentType.Button,
            id: "chest-open",
            customMatcher: "custom_id.split(\"-\",2)[0] === \"co\"",
            handle: handleChestCollision
        },
        {
            type: ComponentType.Button,
            id: "portal",
            customMatcher: "custom_id.split(\":\",2)[0] === \"pot\"",
            handle: handleLayerCollision
        },
        {
            type: ComponentType.Button,
            id: "battle-mob",
            customMatcher: "custom_id.split(\":\",2)[0] === \"btm\"",
            handle: handleMobBattle
        },
        // {
        //     type: ComponentType.Button,
        //     id: "purify-mob",
        //     customMatcher: "custom_id.split(\"-\",2)[0] === \"pur\"",
        //     handle: handleLayerCollision
        // },
        {
            type: ComponentType.Button,
            id: "back",
            handle: async (interaction) => {
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

                const player = Board.getPlayerPosition(memberId);

                if (player === null) {
                    await interaction.reply({
                        content: "Something went wrong",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.updateComponents({
                    embeds: [await makeBoardEmbed(player, memberId)],
                    components: [MOVEMENT_ROW]
                });
            }
        },
        {
            type: ComponentType.Button,
            id: "continue",
            customMatcher: "custom_id.split(\"-\",2)[0] === \"con\"",
            handle: async (interaction) => {
                if (!interaction.inGuild()) return;

                const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
                const [, direction] = interaction.data.id.split("-", 2);

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

                const player = Board.getPlayerPosition(memberId);

                if (player === null) {
                    await interaction.reply({
                        content: "Something went wrong",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferComponentReply();

                await interaction.editReply({
                    embeds: [await makeBoardEmbed(player, memberId, DIRECTION_MAP[direction])],
                    components: [MOVEMENT_ROW]
                });
            }
        }
    ],
    options: [
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "refresh",
            description: "Refresh chest locations.",
            options: [
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "layer",
                    description: "The layer to reset. Pass -1 to reset all. Default: -1"
                }
            ],
            handle: boardReset
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "view",
            description: "Visualize current table in your position.",
            handle: viewBoard
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "scan",
            description: "Scan for nearby chests in a 60x60 area.",
            handle: scanBoard
        },
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "spawn",
            description: "Spawn chests in random locations.",
            options: [
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "quantity",
                    description: "The amount of chests to spawn",
                    min_value: 1,
                    max_value: 30,
                    required: true
                },
                {
                    type: ApplicationCommandOptionType.INTEGER,
                    name: "layer",
                    description: "The layer to reset. Pass -1 to reset all. Default: -1",
                    min_value: 1
                }
            ],
            handle: boardSpawn
        }
    ]
});

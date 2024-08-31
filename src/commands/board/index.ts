import { DIRECTION_MAP, makeBoardEmbed, makeMovementRow } from "../../utils/board.js";
import { ApplicationCommandOptionType, ComponentType } from "lilybird";
import { $applicationCommand } from "../../handler.js";
import { boardReset } from "./refresh.js";
import { boardSpawn } from "./spawn.js";
import { viewBoard } from "./view.js";
import { scanBoard } from "./scan.js";

import * as BoardCache from "../../schemas/board-cache.js";
import * as Board from "../../schemas/board.js";

$applicationCommand({
    name: "board",
    description: "Board actions",
    components: [
        {
            type: ComponentType.Button,
            id: "arrows",
            customMatcher: "custom_id.split(\"-\",2)[0] === \"arrow\"",
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

                const [arrow, coordinates] = interaction.data.id.split(":", 2);
                const [,direction] = arrow.split("-", 2);
                const [cx, cy] = coordinates.split(",", 2);
                const x = parseInt(cx);
                const y = parseInt(cy);

                const didUpdate = Board.updatePlayerPosition(memberId, x, y);

                if (!didUpdate) {
                    await interaction.reply({ content: `You cannot move ${direction} as it is out of bounds.` });
                    return;
                }

                await interaction.deferComponentReply();

                BoardCache.update(cacheId);

                await interaction.editReply({
                    embeds: [await makeBoardEmbed({ x, y }, memberId, DIRECTION_MAP[direction])],
                    components: [makeMovementRow(x, y)]
                });
            }
        }
    ],
    options: [
        {
            type: ApplicationCommandOptionType.SUB_COMMAND,
            name: "refresh",
            description: "Refresh chest locations.",
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
                }
            ],
            handle: boardSpawn
        }
    ]
});

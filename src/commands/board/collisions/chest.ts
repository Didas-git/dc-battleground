import { DIRECTION_MAP, makeBoardEmbed, makeMovementRow } from "../../../utils/board.js";

import * as BoardCache from "../../../schemas/board-cache.js";
import * as Player from "../../../schemas/player.js";
import * as Board from "../../../schemas/board.js";
import * as Item from "../../../schemas/item.js";

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

    let coins = 0;
    const contents: Player.InventoryStructure["items"] = {};
    for (let i = 0, data = chest.data.contents, { length } = data; i < length; i++) {
        const item = data[i];
        switch (item.type) {
            case Board.ChestContentType.Coins: {
                coins += item.amount;
                break;
            }
            case Board.ChestContentType.Item: {
                if (typeof contents[item.item] === "undefined") contents[item.item] = 1;
                else contents[item.item] += 1;
                break;
            }
        }
    }

    await interaction.deferComponentReply();

    Player.Inventory.addCoins(memberId, coins);
    Player.Inventory.updateContents(memberId, contents);
    Board.deleteEntityInPosition(layer, x, y);
    Board.updatePlayerPosition(memberId, x, y);
    BoardCache.update(cacheId);

    const contentsArray = Object.entries(contents);

    await Promise.all([
        interaction.client.rest.editMessage(interaction.channelId, messageId, {
            embeds: [await makeBoardEmbed({ layer, x, y }, memberId, DIRECTION_MAP[direction])],
            components: [makeMovementRow(layer, x, y)]
        }),
        interaction.editReply({
            content: null,
            embeds: [
                {
                    color: 0x00ff00,
                    title: `Opened ${Board.CHEST_RARITY_MAPPINGS[chest.data.rarity]} chest!`,
                    description: `- Coins: ${coins}\n- Items:\n${contentsArray.length > 0
                        ? contentsArray.map((i) => {
                            const [id, amount] = i;
                            const item = Item.getItemMeta(id);

                            return `  - ${item.name}: ${amount}`;
                        }).join("\n")
                        : "  - None"}`
                }
            ],
            components: []
        })
    ]);
}

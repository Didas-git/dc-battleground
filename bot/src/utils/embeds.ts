import { LootTableValueType } from "#loot-table/types.js";

import * as BoardLayer from "#models/board-layer.js";
import * as Player from "#models/player.js";
import * as Board from "#models/board.js";
import * as Item from "#models/item.js";

import type { LootTableContent } from "#loot-table/types.js";
import type { Embed } from "lilybird";

export async function makeBoardEmbed(position: Board.BoardData, memberId: string, moveDirection?: string): Promise<Embed.Structure> {
    const board = await Board.scanFromCenter(position, Board.BOARD_VIEW_SIZE, memberId, typeof moveDirection !== "undefined");
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { name } = BoardLayer.getBoardLayerInfo(position.layer)!;

    let str = "";
    for (let i = 0, { length } = board; i < length; i++) {
        if (i % Board.BOARD_VIEW_SIZE === 0 && i !== 0) str += "\n";
        str += Board.BOARD_MAPPINGS[board[i]];
    }

    return {
        title: "Board",
        color: 0x0000ff,
        description: str,
        footer: { text: `[${position.layer}]${name}: X: ${position.x} | Y: ${position.y} ${moveDirection ?? ""}` }
    };
}

export function updatePlayerInventoryAndGetEmbed(playerId: string, title: string, drops: Array<LootTableContent>): Embed.Structure {
    const contents: Player.InventoryStructure["items"] = Player.Inventory.getContents(playerId);
    const temp: Array<string> = [];
    const newItems = new Set<string>();

    let coins = 0;
    for (let i = 0, { length } = drops; i < length; i++) {
        const item = drops[i];
        switch (item.type) {
            case LootTableValueType.Item: {
                const itemMeta = Item.getItemMeta(item.value);

                switch (itemMeta.type) {
                    case Item.ItemType.Currency: {
                        switch (item.value) {
                            case "coins": { coins += item.amount; break; }
                            default: break;
                        }
                        break;
                    }
                    case Item.ItemType.Crafting:
                    case Item.ItemType.Equipment:
                    case Item.ItemType.Consumable: {
                        if (typeof contents[item.value] === "undefined") {
                            newItems.add(item.value);
                            contents[item.value] = 1;
                        } else contents[item.value] += 1;
                        break;
                    }
                }

                break;
            }
            case LootTableValueType.Table:
            case LootTableValueType.Enemy: { throw new Error("Unreachable!"); }
        }
    }

    for (let i = 0, entries = Object.entries(contents), { length } = entries; i < length; i++) {
        const [id, amount] = entries[i];
        const item = Item.getItemMeta(id);
        temp.push(`  - ${item.name}: ${amount}${newItems.has(id) ? " (New)" : ""}`);
    }

    if (temp.length === 0) temp.push("  - None");
    Player.Inventory.addCoins(playerId, coins);
    Player.Inventory.overrideContents(playerId, contents);

    return {
        color: 0x00ff00,
        title,
        description: `- Coins: ${coins}\n"- Items:\n"${temp.join("\n")}`
    };
}

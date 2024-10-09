import * as Player from "../schemas/player.js";
import * as Item from "../schemas/item.js";

import type { Embed } from "lilybird";
import { LootTableValueType, type LootTableContent } from "./loot-tables/types.js";

export function updatePlayerInventoryAndGetEmbed(playerId: string, title: string, drops: Array<LootTableContent>): Embed.Structure {
    const contents: Player.InventoryStructure["items"] = {};
    const temp: Array<string> = ["- Items:"];

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
                        if (typeof contents[item.value] === "undefined") contents[item.value] = 1;
                        else contents[item.value] += 1;
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
        temp.push(`  - ${item.name}: ${amount}`);
    }

    if (temp.length === 1) temp.push("  - None");
    Player.Inventory.addCoins(playerId, coins);
    Player.Inventory.updateContents(playerId, contents);

    return {
        color: 0x00ff00,
        title,
        description: `- Coins: ${coins}\n${temp.join("\n")}`
    };
}

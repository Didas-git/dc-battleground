import * as Item from "../schemas/item.js";

import type { Embed } from "lilybird";

export function makeDropEmbed(title: string, coins: number, contents: Array<[string, number]>): Embed.Structure {
    const temp: Array<string> = [
        `- Coins: ${coins}`,
        "- Items:"
    ];

    if (contents.length === 0) temp.push("  - None");
    else {
        for (let i = 0, { length } = contents; i < length; i++) {
            const [id, amount] = contents[i];
            const item = Item.getItemMeta(id);

            temp.push(`  - ${item.name}: ${amount}`);
        }
    }

    return {
        color: 0x00ff00,
        title,
        description: temp.join("\n")
    };
}

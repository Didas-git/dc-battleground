import * as Battleground from "#bt";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";
import type { Embed } from "lilybird";

export async function scanBoard(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const res = await Battleground.scanBoard(interaction.guildId, interaction.member.user.id, 130);

    if (res[0] !== Battleground.ViewBoardStatus.Success) {
        await interaction.reply({ content: "You don't have a profile yet.", ephemeral: true });
        return;
    }

    // if (!(Date.now() - profile.last_scan >= 43200000)) {
    //     await interaction.reply({ content: "You cant do this yet.", ephemeral: true });
    //     return;
    // }

    // TODO: Zig should return locations as well instead of just the count

    // for (let i = 0, { length } = entities; i < length; i++) {
    //     const entity = entities[i];

    //     switch (entity.type) {
    //         case Board.BoardEntityType.Chest: {
    //             chests.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
    //             break;
    //         }
    //         case Board.BoardEntityType.Enemy: {
    //             mobs.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
    //             break;
    //         }
    //         case Board.BoardEntityType.Player: {
    //             if (entity.x === position.x && entity.y === position.y) break;
    //             players.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
    //             break;
    //         }
    //         case Board.BoardEntityType.LayerEntrance: {
    //             moveSpots.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
    //             break;
    //         }
    //         default: break;
    //     }
    // }

    const [,str]: [number, string] = <never>res;
    const [chests, mobs] = str.split(",");

    const embed: Embed.Structure = {
        title: `Found ${(+chests) + (+mobs)} entities`,
        color: 0x0000ff
        // description: `- Chests:\n${
        //     chests.length > 0 ? chests.join("\n") : "  - None"}\n- Enemies:\n${
        //     mobs.length > 0 ? mobs.join("\n") : "  - None"}\n- Players:\n${
        //     players.length > 0 ? players.join("\n") : "  - None"}\n- Portals:\n${
        //     moveSpots.length > 0 ? moveSpots.join("\n") : "  - None"}`,
    };

    await interaction.reply({ embeds: [embed] });
}

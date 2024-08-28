import * as Player from "../../schemas/player.js";
import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";
import type { Embed } from "lilybird";

export async function scanBoard(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}` as const;
    const profile = Player.getData(memberId);
    if (profile === null) {
        await interaction.reply({ content: "You don't have a profile yet.", ephemeral: true });
        return;
    }

    // if (!(Date.now() - profile.last_scan >= 43200000)) {
    //     await interaction.reply({ content: "You cant do this yet.", ephemeral: true });
    //     return;
    // }

    const position = Board.getPlayerPosition(memberId);
    if (position === null) {
        await interaction.reply({ content: "You don't have a profile yet.", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    const start = performance.now();
    const chests = Board.scanForChests(position, 60);
    const foundChests = chests.map(({ x, y }) => `- X: ${x} | Y: ${y}`).join("\n");

    const end = performance.now() - start;

    profile.last_scan = Date.now();
    Player.update(memberId, profile);

    const time = new Date(Date.UTC(0, 0, 0, 0, 0, 0, end));

    const embed: Embed.Structure = {
        title: `Chests Found: ${chests.length}`,
        color: 0x0000ff,
        description: foundChests.length > 1 ? foundChests : "None",
        footer: { text: `Took ${time.getUTCSeconds()}.${time.getUTCMilliseconds()} seconds | Scanned ${60 * 60} tiles` }
    };

    await interaction.editReply({ embeds: [embed] });
}

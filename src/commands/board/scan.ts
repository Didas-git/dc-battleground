import * as Player from "../../schemas/player.js";
import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";
import type { Embed } from "lilybird";

export async function scanBoard(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
    const profile = Player.getProfile(memberId);
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

    const scanAmount = parseInt(process.env.BOARD_SCAN_SIZE);
    const start = performance.now();
    const entities = Board.scanForEntities(position, scanAmount);
    const chests: Array<string> = [];
    const mobs: Array<string> = [];
    const players: Array<string> = [];
    const moveSpots: Array<string> = [];

    for (let i = 0, { length } = entities; i < length; i++) {
        const entity = entities[i];

        switch (entity.type) {
            case Board.BoardEntityType.Chest: {
                chests.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
                break;
            }
            case Board.BoardEntityType.Enemy: {
                mobs.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
                break;
            }
            case Board.BoardEntityType.Player: {
                if (entity.x === position.x && entity.y === position.y) break;
                players.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
                break;
            }
            case Board.BoardEntityType.LayerEntrance: {
                moveSpots.push(`  - \`X ${entity.x}\` | \`Y ${entity.y}\``);
                break;
            }
            default: break;
        }
    }

    const time = new Date(Date.UTC(0, 0, 0, 0, 0, 0, performance.now() - start));

    profile.last_scan = Date.now();
    Player.updateProfile(memberId, profile);

    const embed: Embed.Structure = {
        title: `Found ${chests.length + mobs.length} entities`,
        color: 0x0000ff,
        description: `- Chests:\n${
            chests.length > 0 ? chests.join("\n") : "  - None"}\n- Enemies:\n${
            mobs.length > 0 ? mobs.join("\n") : "  - None"}\n- Players:\n${
            players.length > 0 ? players.join("\n") : "  - None"}\n- Portals:\n${
            moveSpots.length > 0 ? moveSpots.join("\n") : "  - None"}`,
        footer: { text: `Took ${time.getUTCSeconds()}.${time.getUTCMilliseconds()} seconds\nScanned ${scanAmount * scanAmount} tiles` }
    };

    await interaction.editReply({ embeds: [embed] });
}

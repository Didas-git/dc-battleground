import * as Board from "../../schemas/board.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";
import type { Embed } from "lilybird";

export async function viewBoard(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}` as const;
    const position = Board.getPlayerPosition(memberId);
    if (position === null) {
        await interaction.reply({ content: "You don't have a profile yet.", ephemeral: true });
        return;
    }

    const board = Board.scanBoardFromCenter(position, Board.BOARD_SIZE, memberId);

    let str = "";
    for (let i = 0, { length } = board; i < length; i++) {
        if (i % Board.BOARD_SIZE === 0 && i !== 0) str += "\n";
        str += Board.BOARD_MAPPINGS[board[i]];
    }

    const embed: Embed.Structure = {
        title: "Board",
        color: 0x0000ff,
        description: str,
        footer: { text: `X: ${position.x} | Y: ${position.y}` }
    };

    await interaction.reply({ embeds: [embed] });
}

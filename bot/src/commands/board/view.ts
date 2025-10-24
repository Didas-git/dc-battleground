import { MOVEMENT_ROW } from "#utils/components.js";
import { makeBoardEmbed } from "#utils/embeds.js";

import * as Battleground from "#bt";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function viewBoard(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;
    await interaction.deferReply();

    const message = await interaction.client.rest.getWebhookMessage(interaction.applicationId, interaction.token, "@original", {});
    const res = await Battleground.viewBoard(interaction.guildId, interaction.member.user.id, message.id);
    if (res[0] !== Battleground.ViewBoardStatus.Success) {
        await interaction.followUp({ content: "You don't have a profile yet.", ephemeral: true });
        return;
    }

    // TODO: Handle battles on the zig side

    // const ongoingBattle = Battle.findFlowAsAttacker(memberId);
    // if (ongoingBattle !== null) {
    //     await interaction.reply({ content: "You have an ongoing battle, finish it before going back to the board.", ephemeral: true });
    //     return;
    // }

    await interaction.followUp({
        embeds: [makeBoardEmbed(<never>res[1])],
        components: [MOVEMENT_ROW]
    });
}

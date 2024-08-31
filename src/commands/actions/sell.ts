import * as Player from "../../schemas/player.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function actionSell(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;

    // const player = Player.getData(memberId);

    Player.Inventory.addCoins(memberId, 5);

    await interaction.reply({
        content: "Added 5 coins to your account!"
    });
}

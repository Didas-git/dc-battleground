import * as Player from "../../../schemas/player.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function actionSelfHeal(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const extraHeal = interaction.data.getInteger("amount") ?? 0;
    const baseHealing = 5;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}` as const;
    const player = Player.getData(memberId);
    if (player === null) {
        await interaction.reply({ content: "You don't have a profile yet.", ephemeral: true });
        return;
    }

    const totalHealing = baseHealing + extraHeal;
    const manaCost = Math.ceil(totalHealing / 5) * 10;

    if (player.mana.current < manaCost) {
        await interaction.reply({ content: "You don't have enough mana.", ephemeral: true });
        return;
    }

    player.mana.current -= manaCost;
    player.hp.current += totalHealing;
    if (player.hp.current > player.hp.max) player.hp.current = player.hp.max;

    Player.update(memberId, player);

    await interaction.reply({
        content: `\`${
            interaction.member.user.globalName ?? interaction.member.user.username
        }\` healed for \`${totalHealing}\`.\nMana used: \`${manaCost}\`\nMana left: \`${player.mana.current}/${player.mana.max}\``
    });
}

import { getMember, getMemberName } from "../utils/get-member.js";
import { calculateDef } from "../utils/calculate-total-def.js";
import { ApplicationCommandOptionType } from "lilybird";
import { GuildMember } from "@lilybird/transformers";
import { $applicationCommand } from "../handler.js";

import * as Player from "../schemas/player.js";

$applicationCommand({
    name: "battle",
    description: "Battle a user",
    options: [
        {
            type: ApplicationCommandOptionType.USER,
            name: "user",
            description: "The user to battle",
            required: true
        }
    ],
    handle: async (interaction) => {
        if (!interaction.inGuild()) return;

        const targetId = interaction.data.getUser("user", true);
        if (targetId === interaction.member.user.id) {
            await interaction.reply({ content: "You cannot battle with yourself.", ephemeral: true });
            return;
        }
        const targetMember = new GuildMember(interaction.client, await getMember(interaction, targetId));

        const targetDbId = `${interaction.guildId}:${targetMember.user.id}` as const;

        const player1 = Player.getData(targetDbId);
        if (player1 === null) {
            await interaction.reply({ content: "You cannot battle without having a profile.", ephemeral: true });
            return;
        }

        const player2 = Player.getData(targetDbId);
        if (player2 === null) {
            await interaction.reply({ content: "This user does not yet have a profile.", ephemeral: true });
            return;
        }

        const shouldCrit = Math.random() >= 1 - player1.crit_rate;

        const calculatedDmg = player1.atk * (shouldCrit ? player1.crit_damage : 1);
        const finalDmg = calculatedDmg - (calculatedDmg * calculateDef(player2.def, player2.armor));

        player2.hp.current -= finalDmg;

        Player.update(targetDbId, player2);

        const p1Name = getMemberName(interaction.member);
        const p2Name = getMemberName(targetMember);

        await interaction.reply(`\`${p1Name}\` dealt \`${finalDmg}\` (pre def: \`${calculatedDmg}\`) damage to \`${p2Name}\`.`);
    }
});


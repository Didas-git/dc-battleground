import { PermissionFlags } from "lilybird";

import * as Battleground from "#bt";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function boardReset(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    if ((BigInt(interaction.member.permissions ?? 0) & PermissionFlags.ADMINISTRATOR) !== PermissionFlags.ADMINISTRATOR) {
        await interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
        return;
    }

    const layer = interaction.data.getInteger("layer") ?? 0;

    // TODO: Confirmation for full resets and partial ones as well
    // if (layer === 0) {
    //     await interaction.reply({ content: "Layer 0 cannot be reset!", ephemeral: true });
    //     return;
    // }

    await interaction.deferReply();

    const res = await Battleground.refreshBoard(interaction.guildId, layer);

    if (res[0] === Battleground.RefreshStatus.Success) {
        const [,stats]: [number, Battleground.RefreshStats] = <never>res;
        await interaction.editReply({
            embeds: [
                {
                    color: 0xff00ef,
                    title: layer === 0 ? "Refreshed all layers!" : "Individual layer info not supported yet!", // `Layer ${layer} (${layerInfo.name}) reset!`,
                    description: `There are ${stats.chests} new chests!\nThere are ${stats.mobs} new enemies!`,
                    footer: {
                        text: `Took ${stats.took}ns`
                    }
                }
            ]
        });
        return;
    }

    await interaction.editReply("Ah shit, it failed");
}


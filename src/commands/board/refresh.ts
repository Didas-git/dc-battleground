import { PermissionFlags } from "lilybird";

import * as BoardLayer from "../../schemas/board-layer.js";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";
import { offloadRefresh } from "../../utils/workers/index.js";

export async function boardReset(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    if ((BigInt(interaction.member.permissions ?? 0) & PermissionFlags.ADMINISTRATOR) !== PermissionFlags.ADMINISTRATOR) {
        await interaction.reply({ content: "You don't have permission to do this!", ephemeral: true });
        return;
    }

    const layer = interaction.data.getInteger("layer") ?? -1;

    if (layer === -1)
        await interaction.reply({ content: "Resetting all layers at once is not yet implemented", ephemeral: true });
    else if (layer === 0) {
        await interaction.reply({ content: "Layer 0 cannot be reset!", ephemeral: true });
        return;
    }

    const layerInfo = BoardLayer.getBoardLayerInfo(layer);

    if (layerInfo === null) {
        await interaction.editReply({ content: `Layer ${layer} does not exist.` });
        return;
    }

    await interaction.deferReply();

    offloadRefresh({ guildId: interaction.guildId, layer: layerInfo }, async (data) => {
        await interaction.editReply({
            embeds: [
                {
                    color: 0xff00ef,
                    title: `Layer ${layer} (${layerInfo.name}) reset!`,
                    description: `There are ${data.quantity.chests} new chests!\nThere are ${data.quantity.mobs} new enemies!`,
                    footer: { text: `Chests Took ${data.time.chests} seconds.\nMobs Took ${data.time.mobs} seconds.` }
                }
            ]
        });
    });
}

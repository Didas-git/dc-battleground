import { getMemberName } from "#utils/member.js";
import { ComponentType } from "lilybird";

import * as Player from "#models/player.js";
import * as Battleground from "#bt";

import type { ApplicationCommandData, Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function profileCreate(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const res = await Battleground.profileDisplay(interaction.guildId, interaction.member.user.id);
    console.log(res);
    if (res[0] === Battleground.ProfileStatus.Success) {
        await interaction.reply({ content: "You already have a profile.", ephemeral: true });
        return;
    }

    await interaction.reply({
        content: "Pick a class.",
        components: [
            {
                type: ComponentType.ActionRow,
                components: [
                    {
                        type: ComponentType.StringSelect,
                        custom_id: "class",
                        placeholder: "Choose a Class",
                        min_values: 1,
                        max_values: 1,
                        options: [
                            { label: "Mage", value: `${Player.ClassType.Mage.toString()}-${interaction.member.user.id}` },
                            { label: "Warrior", value: `${Player.ClassType.Warrior.toString()}-${interaction.member.user.id}` }
                        ]
                    }
                ]
            }
        ]
    });
}

export async function handleClassSelection(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;
    if (!interaction.data.isSelectMenu()) return;

    const [playerClassS, userId] = interaction.data.values[0].split("-", 2);
    const playerClass = <Player.ClassType>+playerClassS;
    if (interaction.member.user.id !== userId) {
        await interaction.reply({ content: "You cannot do that.", ephemeral: true });
        return;
    }

    const res = await Battleground.createProfile(interaction.guildId, interaction.member.user.id, getMemberName(interaction.member), playerClass);

    if (res !== Battleground.ProfileStatus.Success) {
        await interaction.updateComponents({
            content: "Some error occurred",
            components: []
        });
        return;
    }

    await interaction.updateComponents({
        content: `You choose the \`${Player.CLASS_MAPPINGS[playerClass]}\` class.`,
        components: []
    });
}

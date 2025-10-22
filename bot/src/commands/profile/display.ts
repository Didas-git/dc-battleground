import { getMember, getMemberName } from "#utils/member.js";
import { GuildMember } from "@lilybird/transformers";

import * as Player from "#models/player.js";
import * as Battleground from "#bt";

import type { ApplicationCommandData, Interaction } from "@lilybird/transformers";

export async function profileDisplay(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const targetId = interaction.data.getUser("target") ?? interaction.member.user.id;

    let member: Awaited<ReturnType<typeof getMember>>;

    try {
        member = await getMember(interaction, targetId);
    } catch (err) {
        if (err instanceof Error && err.message === "Unknown Member") {
            await interaction.reply({
                content: "The following member is not in the server.",
                ephemeral: true
            });
        }
        return;
    }

    const targetMember = new GuildMember(interaction.client, member);

    const res = await Battleground.profileDisplay(interaction.guildId, targetId);

    if (res[0] !== Battleground.ProfileStatus.Success) {
        await interaction.reply({ content: "You don't have a profile that can be displayed.", ephemeral: true });
        return;
    }

    const [, profile]: [number, Battleground.Profile] = <never>res;

    // TODO: All guild query

    // const allProfiles = Player.getProfileInAllGuilds(targetId);
    // if (allProfiles === null) {
    //     await interaction.reply({ content: "You don't have a profile that can be displayed.", ephemeral: true });
    //     return;
    // }

    // const classes: Record<string, number> & { total: number } = {
    //     [Player.CLASS_MAPPINGS[Player.ClassType.Mage]]: 0,
    //     [Player.CLASS_MAPPINGS[Player.ClassType.Warrior]]: 0,
    //     total: 0
    // };

    // for (let i = 0, { length } = allProfiles; i < length; i++) {
    //     classes[Player.CLASS_MAPPINGS[allProfiles[i].class]] += 1;
    //     classes.total += 1;
    // }

    await interaction.reply({
        embeds: [
            {
                title: `${getMemberName(targetMember)}'s Profile`,
                color: 0x2662ed,
                thumbnail: { url: targetMember.avatarURL({}) },
                fields: [
                    {
                        name: "Class",
                        inline: true,
                        value: [
                            `\`${Player.CLASS_MAPPINGS[profile.class]}\``
                            // "",
                            // "Usage:",
                            // `- Mage: \`${classes[Player.CLASS_MAPPINGS[Player.ClassType.Mage]] / classes.total * 100}%\``,
                            // `- Warrior: \`${classes[Player.CLASS_MAPPINGS[Player.ClassType.Warrior]] / classes.total * 100}%\``
                        ].join("\n")
                    }
                ]
            }
        ]
    });
}

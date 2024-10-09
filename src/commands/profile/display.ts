import { getMember, getMemberName } from "#utils/member.js";
import { GuildMember } from "@lilybird/transformers";
import { calculateDef } from "#utils/battle.js";

import * as Player from "#models/player.js";
import * as Item from "#models/item.js";

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

    const targetDbId = `${interaction.guildId}:${targetId}`;

    const targetMember = new GuildMember(interaction.client, member);
    const profile = Player.getProfile(targetDbId);
    if (profile === null) {
        await interaction.reply({ content: "You don't have a profile that can be displayed.", ephemeral: true });
        return;
    }

    const allProfiles = Player.getProfileInAllGuilds(targetId);
    if (allProfiles === null) {
        await interaction.reply({ content: "You don't have a profile that can be displayed.", ephemeral: true });
        return;
    }

    const classes: Record<string, number> & { total: number } = {
        [Player.CLASS_MAPPINGS[Player.ClassType.Mage]]: 0,
        [Player.CLASS_MAPPINGS[Player.ClassType.Warrior]]: 0,
        total: 0
    };

    for (let i = 0, { length } = allProfiles; i < length; i++) {
        classes[Player.CLASS_MAPPINGS[allProfiles[i].class]] += 1;
        classes.total += 1;
    }

    const stats = Player.Stats.get(targetDbId);
    const inventory = Object.entries(Player.Inventory.getContents(targetDbId));

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
                            `\`${Player.CLASS_MAPPINGS[profile.class]}\``,
                            "",
                            "Usage:",
                            `- Mage: \`${classes[Player.CLASS_MAPPINGS[Player.ClassType.Mage]] / classes.total * 100}%\``,
                            `- Warrior: \`${classes[Player.CLASS_MAPPINGS[Player.ClassType.Warrior]] / classes.total * 100}%\``
                        ].join("\n")
                    },
                    {
                        name: "Coins",
                        inline: true,
                        value: [
                            `- Server: \`${Player.Inventory.getCoins(targetDbId)}\``,
                            `- Global: \`${Player.Inventory.getCoinsInAllGuilds(targetId).reduce((a, b) => a + b, 0)}\``
                        ].join("\n")
                    },
                    {
                        name: "Items",
                        value: inventory.length > 0
                            ? inventory.map((i) => {
                                const [id, amount] = i;
                                const item = Item.getItemMeta(id);

                                return `- ${item.name}: ${amount}`;
                            }).join("\n")
                            : "None"
                    },
                    {
                        name: "Status",
                        inline: true,
                        value: [
                            `- HP: \`${stats.hp.current}/${stats.hp.max}\``,
                            `- ATK: \`${stats.atk}\``,
                            `- Mana: \`${stats.mana.current}/${stats.mana.max}\``,
                            `- Ward: \`${stats.ward}\``,
                            `- Armor: \`${stats.armor}\``,
                            `- Defense: \`${(stats.def - 1) * 100}%\` (\`${calculateDef(stats.def, stats.armor) * 100}%\`)`,
                            `- Crit. Rate: \`${stats.crit_rate * 100}%\``,
                            `- Crit. DMG: \`${stats.crit_damage * 100}%\``,
                            `- Intelligence: \`${profile.intelligence}\``,
                            `- Strength: \`${profile.strength}\``
                        ].join("\n")
                    },
                    {
                        name: "DMG Bonus",
                        inline: true,
                        value: [
                            `- Elemental: \`${stats.bonus.elemental * 100}%\``,
                            `- Ranged: \`${stats.bonus.ranged * 100}%\``,
                            `- Melee: \`${stats.bonus.melee * 100}%\``,
                            `- Physical: \`${stats.bonus.physical * 100}%\``,
                            `- Fire: \`${stats.bonus.fire * 100}%\``,
                            `- Water: \`${stats.bonus.water * 100}%\``,
                            `- Nature: \`${stats.bonus.nature * 100}%\``,
                            `- Electric: \`${stats.bonus.electric * 100}%\``,
                            `- Ice: \`${stats.bonus.ice * 100}%\``,
                            `- Wind: \`${stats.bonus.wind * 100}%\``,
                            `- Light: \`${stats.bonus.light * 100}%\``,
                            `- Cosmos: \`${stats.bonus.cosmos * 100}%\``,
                            `- Poison: \`${stats.bonus.poison * 100}%\``
                        ].join("\n")
                    },
                    {
                        name: "Resistances",
                        inline: true,
                        value: [
                            `- Elemental: \`${stats.resistances.elemental * 100}%\``,
                            `- Ranged: \`${stats.resistances.ranged * 100}%\``,
                            `- Melee: \`${stats.resistances.melee * 100}%\``,
                            `- Physical: \`${stats.resistances.physical * 100}%\``,
                            `- Fire: \`${stats.resistances.fire * 100}%\``,
                            `- Water: \`${stats.resistances.water * 100}%\``,
                            `- Nature: \`${stats.resistances.nature * 100}%\``,
                            `- Electric: \`${stats.resistances.electric * 100}%\``,
                            `- Ice: \`${stats.resistances.ice * 100}%\``,
                            `- Wind: \`${stats.resistances.wind * 100}%\``,
                            `- Light: \`${stats.resistances.light * 100}%\``,
                            `- Cosmos: \`${stats.resistances.cosmos * 100}%\``,
                            `- Poison: \`${stats.resistances.poison * 100}%\``
                        ].join("\n")
                    }
                ]
            }
        ]
    });
}

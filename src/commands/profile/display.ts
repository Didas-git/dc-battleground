import { getMember, getMemberName } from "../../utils/get-member.js";
import { calculateDef } from "../../utils/calculate-total-def.js";
import { GuildMember } from "@lilybird/transformers";

import * as Player from "../../schemas/player.js";
import * as Item from "../../schemas/item.js";

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
    const profile = Player.getData(targetDbId);
    if (profile === null) {
        await interaction.reply({ content: "You don't have a profile that can be displayed.", ephemeral: true });
        return;
    }

    const allProfiles = Player.getDataInAllGuilds(targetId);
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
                            `- HP: \`${profile.hp.current}/${profile.hp.max}\``,
                            `- ATK: \`${profile.atk}\``,
                            `- Mana: \`${profile.mana.current}/${profile.mana.max}\``,
                            `- Ward: \`${profile.ward}\``,
                            `- Armor: \`${profile.armor}\``,
                            `- Defense: \`${(profile.def - 1) * 100}%\` (\`${calculateDef(profile.def, profile.armor) * 100}%\`)`,
                            `- Crit. Rate: \`${profile.crit_rate * 100}%\``,
                            `- Crit. DMG: \`${profile.crit_damage * 100}%\``,
                            `- Intelligence: \`${profile.intelligence}\``,
                            `- Strength: \`${profile.strength}\``
                        ].join("\n")
                    },
                    {
                        name: "DMG Bonus",
                        inline: true,
                        value: [
                            `- Elemental: \`${profile.bonus.elemental * 100}%\``,
                            `- Ranged: \`${profile.bonus.ranged * 100}%\``,
                            `- Melee: \`${profile.bonus.melee * 100}%\``,
                            `- Physical: \`${profile.bonus.physical * 100}%\``,
                            `- Fire: \`${profile.bonus.fire * 100}%\``,
                            `- Water: \`${profile.bonus.water * 100}%\``,
                            `- Nature: \`${profile.bonus.nature * 100}%\``,
                            `- Electric: \`${profile.bonus.electric * 100}%\``,
                            `- Ice: \`${profile.bonus.ice * 100}%\``,
                            `- Wind: \`${profile.bonus.wind * 100}%\``,
                            `- Light: \`${profile.bonus.light * 100}%\``,
                            `- Cosmos: \`${profile.bonus.cosmos * 100}%\``,
                            `- Poison: \`${profile.bonus.poison * 100}%\``
                        ].join("\n")
                    },
                    {
                        name: "Resistances",
                        inline: true,
                        value: [
                            `- Elemental: \`${profile.resistances.elemental * 100}%\``,
                            `- Ranged: \`${profile.resistances.ranged * 100}%\``,
                            `- Melee: \`${profile.resistances.melee * 100}%\``,
                            `- Physical: \`${profile.resistances.physical * 100}%\``,
                            `- Fire: \`${profile.resistances.fire * 100}%\``,
                            `- Water: \`${profile.resistances.water * 100}%\``,
                            `- Nature: \`${profile.resistances.nature * 100}%\``,
                            `- Electric: \`${profile.resistances.electric * 100}%\``,
                            `- Ice: \`${profile.resistances.ice * 100}%\``,
                            `- Wind: \`${profile.resistances.wind * 100}%\``,
                            `- Light: \`${profile.resistances.light * 100}%\``,
                            `- Cosmos: \`${profile.resistances.cosmos * 100}%\``,
                            `- Poison: \`${profile.resistances.poison * 100}%\``
                        ].join("\n")
                    }
                ]
            }
        ]
    });
}

import { getMemberName } from "#utils/member.js";
import { ComponentType } from "lilybird";

import * as BoardLayer from "#models/board-layer.js";
import * as Player from "#models/player.js";
import * as Board from "#models/board.js";

import type { ApplicationCommandData, Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function profileCreate(interaction: Interaction<ApplicationCommandData>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;

    if (Player.getProfile(memberId) !== null) {
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

    const playerInfo: Player.PlayerData = {
        name: getMemberName(interaction.member),
        class: Player.ClassType.None,
        intelligence: 0,
        strength: 0,
        last_scan: 1000000000
    };

    const playerStats: Player.Stats.GenericStats = {
        hp: { current: 100, max: 100 },
        ward: 0,
        atk: 5,
        mana: { current: 50, max: 50 },
        // 5%
        crit_rate: 0.05,
        // 100%
        crit_damage: 1,
        // soft cap 1.85 (85%)
        def: 1,
        // soft cap 30000
        armor: 50,
        bonus: {
            atk: 0,
            elemental: 0,
            ranged: 0,
            melee: 0,
            physical: 0,
            fire: 0,
            water: 0,
            nature: 0,
            electric: 0,
            ice: 0,
            wind: 0,
            light: 0,
            cosmos: 0,
            poison: 0
        },
        resistances: {
            elemental: 0,
            ranged: 0,
            melee: 0,
            physical: 0,
            fire: 0,
            water: 0,
            nature: 0,
            electric: 0,
            ice: 0,
            wind: 0,
            light: 0,
            cosmos: 0,
            poison: 0
        }
    };

    switch (playerClass) {
        case Player.ClassType.None: break;
        case Player.ClassType.Mage: {
            playerInfo.class = playerClass;
            playerInfo.intelligence = 3;
            playerStats.mana = { current: 60, max: 60 };
            playerStats.bonus.elemental = 0.05;
            playerStats.bonus.ranged = 0.05;
            playerStats.resistances.elemental = 0.05;
            playerStats.resistances.ranged = 0.05;
            break;
        }
        case Player.ClassType.Warrior: {
            playerInfo.class = playerClass;
            playerInfo.strength = 3;
            playerStats.hp = { current: 120, max: 120 };
            playerStats.armor = 100;
            playerStats.bonus.melee = 0.05;
            playerStats.resistances.melee = 0.05;
            break;
        }
    }

    await interaction.updateComponents({
        content: `You choose the \`${Player.CLASS_MAPPINGS[playerClass]}\` class.`,
        components: []
    });

    try {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const layerLimits = BoardLayer.getBoardLayerInfo(1)!;

        let x = 0;
        let y = 0;

        do ({ x, y } = Board.generateRandomCoordinates(layerLimits.x, layerLimits.y));
        while (Board.getEntityInPosition(1, x, y).type !== Board.BoardEntityType.Empty);

        Player.createProfile(`${interaction.guildId}:${interaction.member.user.id}`, playerInfo);
        Player.Stats.create(`${interaction.guildId}:${interaction.member.user.id}`, playerStats);
        Board.spawnPlayer(`${interaction.guildId}:${interaction.member.user.id}`, x, y);
        await interaction.followUp({ content: `Profile created successfully!\nSpawned at: ${x},${y}` });
    } catch (error) {
        await interaction.followUp({ content: "You already have a profile.", ephemeral: true });
    }
}

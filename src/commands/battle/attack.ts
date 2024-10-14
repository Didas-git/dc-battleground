import { updatePlayerInventoryAndGetEmbed } from "#utils/embeds.js";
import { calculateFinalDamage } from "#utils/battle.js";

import * as BoardCache from "#models/board-cache.js";
import * as Battle from "#models/battle.js";
import * as Player from "#models/player.js";
import * as Board from "#models/board.js";
import * as Enemy from "#models/enemy.js";
import * as Stats from "#models/stats.js";

import { mapEnemyToLootTable } from "#loot-table/generated-tables.js";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function attack(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;

    const ongoingBattle = Battle.findFlowAsAttacker(memberId);
    if (ongoingBattle === null) {
        await interaction.reply({ content: "You don't have an ongoing battle.", ephemeral: true });
        return;
    }

    const playerStats = Stats.get(memberId);
    if (playerStats === null) {
        await interaction.reply({
            content: "It appears that you died.\nIf you are seeing this you are sending commands way to fast.",
            ephemeral: true
        });
        return;
    }

    const enemyStats = Stats.get(ongoingBattle.defender);
    if (enemyStats === null) {
        await interaction.reply({
            content: "It appears that your enemy has died.\nIf you are seeing this you are sending commands way to fast.",
            ephemeral: true
        });
        return;
    }

    await interaction.deferReply();

    const { final: finalDmg } = calculateFinalDamage(playerStats, enemyStats);

    enemyStats.hp.current -= finalDmg;
    Stats.update(ongoingBattle.defender, enemyStats);

    switch (ongoingBattle.type) {
        case Battle.BattleFlowType.Mob: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const enemyId = ongoingBattle.defender.split(":", 3).at(-1)!;
            const enemyMeta = Enemy.getEnemyMeta(enemyId);

            await interaction.editReply({
                content: `Dealt \`${finalDmg}\` damage to \`${enemyMeta.name}\``
            });

            if (enemyStats.hp.current <= 0) {
                const EnemyTable = mapEnemyToLootTable(enemyId);
                const drops = new EnemyTable().getResults(3);

                const { layer, x, y } = ongoingBattle.move_to;

                Board.deleteEntityInPosition(layer, x, y);
                Board.updatePlayerPosition(memberId, x, y);
                Stats.remove(ongoingBattle.defender);
                Battle.deleteBattleFlow(ongoingBattle.id);

                await interaction.followUp({
                    embeds: [updatePlayerInventoryAndGetEmbed(memberId, `Killed \`${enemyMeta.name}\`.`, drops)]
                });
                return;
            }

            const { final: mobDmg } = calculateFinalDamage(enemyStats, playerStats);

            playerStats.hp.current -= mobDmg;
            Stats.update(memberId, playerStats);

            await interaction.followUp({
                content: `Received \`${mobDmg}\` damage from \`${enemyMeta.name}\``
            });

            //! TODO: Introduce a mechanic that allows players to revive instead of deleting them
            if (playerStats.hp.current <= 0) {
                BoardCache.del(memberId);
                Board.deletePlayer(memberId);
                Stats.remove(memberId);
                Stats.remove(ongoingBattle.defender);
                Player.deleteProfile(memberId);
                Battle.deleteBattleFlow(ongoingBattle.id);

                await interaction.followUp({
                    embeds: [
                        {
                            color: 0x470500,
                            title: "You died!",
                            description: "As of now deaths are permanent, you need to create a new profile to start playing again."
                        }
                    ]
                });
            }

            break;
        }
        case Battle.BattleFlowType.Player: { throw new Error("Not implemented yet: BattleFlowType.Player case"); }
    }
}

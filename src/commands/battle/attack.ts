import { calculateFinalDamage } from "../../utils/battle.js";

import * as BoardCache from "../../schemas/board-cache.js";
import * as Battle from "../../schemas/battle.js";
import * as Player from "../../schemas/player.js";
import * as Board from "../../schemas/board.js";
import * as Enemy from "../../schemas/enemy.js";
import * as Stats from "../../schemas/stats.js";

import { mapEnemyToLootTable } from "../../utils/loot-tables/generated-tables.js";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";
import { updatePlayerInventoryAndGetEmbed } from "../../utils/embeds.js";

export async function attack(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;

    const ongoingBattle = Battle.findFlowAsAttacker(memberId);
    if (ongoingBattle === null) {
        await interaction.reply({ content: "You don't have an ongoing battle.", ephemeral: true });
        return;
    }

    await interaction.deferReply();

    const playerStats = Stats.get(memberId);
    const enemyStats = Stats.get(ongoingBattle.defender);

    const { final: finalDmg } = calculateFinalDamage(playerStats, enemyStats);

    enemyStats.hp.current -= finalDmg;

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

                const { layer, x, y } = ongoingBattle.to;

                Board.deleteEntityInPosition(layer, x, y);
                Board.updatePlayerPosition(memberId, x, y);
                Stats.remove(ongoingBattle.defender);
                Battle.deleteBattleFlow(ongoingBattle.id);

                await interaction.followUp({
                    embeds: [updatePlayerInventoryAndGetEmbed(memberId, `Killed \`${enemyMeta.name}\`.`, drops)]
                });
            } else {
                const { final: mobDmg } = calculateFinalDamage(enemyStats, playerStats);

                playerStats.hp.current -= mobDmg;
                await interaction.followUp({
                    content: `Received \`${mobDmg}\` damage from \`${enemyMeta.name}\``
                });

                if (playerStats.hp.current <= 0) {
                    BoardCache.del(memberId);
                    Board.deletePlayer(memberId);
                    Stats.remove(memberId);
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
            }

            break;
        }
        case Battle.BattleFlowType.Player: { throw new Error("Not implemented yet: BattleFlowType.Player case"); }
    }
}

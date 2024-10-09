import * as BoardCache from "#models/board-cache.js";
import * as Battle from "#models/battle.js";
import * as Enemy from "#models/enemy.js";
import * as Stats from "#models/stats.js";
import * as Board from "#models/board.js";

import type { Interaction, Message, MessageComponentData } from "@lilybird/transformers";

export async function handleMobBattle(interaction: Interaction<MessageComponentData, Message>): Promise<void> {
    if (!interaction.inGuild()) return;

    const memberId = `${interaction.guildId}:${interaction.member.user.id}`;
    const [, coordinates] = interaction.data.id.split(":", 2);
    const [l, cx, cy] = coordinates.split(",", 3);
    const layer = parseInt(l);
    const x = parseInt(cx);
    const y = parseInt(cy);

    const mob = Board.getEntityInPosition(layer, x, y);
    if (mob.type !== Board.BoardEntityType.Enemy) {
        await interaction.reply({
            content: "Something went wrong",
            ephemeral: true
        });
        return;
    }

    const cacheId = `${interaction.channelId}:${interaction.message.id}`;
    const cacheEntry = BoardCache.get(cacheId);

    if (cacheEntry === null) {
        await interaction.reply({ content: "This table has been invalidated!", ephemeral: true });
        return;
    }

    if (cacheEntry.member_id !== memberId) {
        await interaction.reply({ content: "You cannot do that!", ephemeral: true });
        return;
    }

    await interaction.deferComponentReply();

    const battleId = `${interaction.guildId}:${interaction.member.user.id}:${mob.data.id}`;
    const mobMeta = Enemy.getEnemyMeta(mob.data.id);
    const stats: Stats.GenericStats = {
        ...mobMeta.stats,
        hp: { current: mobMeta.stats.hp, max: mobMeta.stats.hp },
        mana: { current: mobMeta.stats.mana, max: mobMeta.stats.mana }
    };

    Stats.create(battleId, stats);
    Battle.createBattleFlow(battleId, Battle.BattleFlowType.Mob, interaction.member.user.id, battleId, { layer, x, y });

    await interaction.editReply({
        content: `Battle flow against \`${mobMeta.name}\` started!`
    });
}

import type { ApplicationCommandData, GuildInteraction, GuildMember } from "@lilybird/transformers";
import type { Guild, User } from "lilybird";

export async function getMember(interaction: GuildInteraction<ApplicationCommandData>, userId: string): Promise<Guild.MemberStructure & { user: User.Structure }> {
    const cachedGuild = <Guild.New> await interaction.client.cache.guilds.get(interaction.guildId);

    const maybeMember = cachedGuild.members.find((member) => member.user?.id === userId);
    if (typeof maybeMember === "undefined") {
        const fetchedMember = await interaction.client.rest.getGuildMember(interaction.guildId, userId);
        cachedGuild.members.push(fetchedMember);
        return <never>fetchedMember;
    }

    return <never>maybeMember;
}

export function getMemberName(member: GuildMember): string {
    return member.nick ?? member.user.globalName ?? member.user.username;
}

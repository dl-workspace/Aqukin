import { ChatInputApplicationCommandData, CommandInteraction, CommandInteractionOptionResolver, GuildMember, PermissionResolvable } from "discord.js";
import { ExtendedClient } from "../structures/Client";

export interface ExtendedInteraction extends CommandInteraction{
    member: GuildMember;
}

export interface ExecuteOptions {
    client: ExtendedClient,
    interaction: ExtendedInteraction,
    args: CommandInteractionOptionResolver,
}

type Execute = (options: ExecuteOptions) => any;

export type CommandType = {
    tag?: string,
    usage?: string,
    execute: Execute;
    userPermissions?: PermissionResolvable[];
} & ChatInputApplicationCommandData
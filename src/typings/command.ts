import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  PermissionResolvable,
} from "discord.js";
import { ExtendedClient } from "../structures/Client";
import { OpusPlayer } from "../structures/opus/Player";

export interface ExtendedInteraction extends CommandInteraction {
  member: GuildMember;
}

export interface ExecuteOptions {
  client: ExtendedClient;
  interaction: ExtendedInteraction;
  args: CommandInteractionOptionResolver;
  mPlayer?: OpusPlayer;
}

type Execute = (options: ExecuteOptions) => any;

export type CommandType = {
  tag?: string;
  execute: Execute;
  userPermissions?: PermissionResolvable[];
  ephemeral?: boolean;
} & ChatInputApplicationCommandData;

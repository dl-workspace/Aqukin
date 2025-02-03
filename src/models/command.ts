import {
  ChatInputApplicationCommandData,
  CommandInteraction,
  CommandInteractionOptionResolver,
  GuildMember,
  PermissionResolvable,
} from "discord.js";
import { ExtendedClient } from "./client";
import { OpusPlayer } from "./opus/player";

export enum COMMAND_TAGS {
  owner = "owner",
  music = "music",
  info = "info",
  utils = "utils",
}

export enum COMMANDS {
  // info commands
  info = "info",

  // utilities commands
  delete = "delete",
  emoji = "emoji",

  // music commands
  connect = "connect",
  disconnect = "disconnect",
  loop = "loop",
  play = "play",
  pause = "pause",
  queue = "queue",
  remove = "remove",
  resume = "resume",
  seek = "seek",
  shuffle = "shuffle",
  skip = "skip",
  volume = "volume",
}

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

export class Command {
  constructor(options: CommandType) {
    Object.assign(this, options);
  }
}

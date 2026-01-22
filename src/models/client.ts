import {
  ApplicationCommandDataResolvable,
  Client,
  ClientEvents,
  Collection,
  Guild,
  GuildMember,
  VoiceChannel,
} from "discord.js";
import { CommandType } from "./command";
import { glob } from "glob";
import { Event } from "./events";
import { OpusPlayer } from "./opus/player";
import { getUserNameMaster } from "../middlewares/utils";
import logger from "../middlewares/logger/logger";

export interface RegisterCommandsOptions {
  guildId?: string;
  commands: ApplicationCommandDataResolvable[];
}

export class ExtendedClient extends Client {
  commands: Collection<string, CommandType>;
  music: Collection<string, OpusPlayer>;

  media = {
    embedColour: [0xbc06c4, 0x1de2fe],
    slappingAqua: {
      files: [
        "https://media1.tenor.com/images/9d81ec7c2abd005d8da208d2f56e89df/tenor.gif?itemid=17267165",
      ],
    },
    ridingAqua: {
      files: [
        "https://media1.tenor.com/images/e6578328df71dbd6b44318553e06eda8/tenor.gif?itemid=17267168",
      ],
    },
    kaomoji: {
      error: [
        "(－‸ლ)",
        "(╯ ° □ °) ╯ ┻━━┻",
        "(oT-T) 尸",
        "(｡ • ́︿ • ̀｡)",
        "(＃ ￣ω￣)",
        "(っ ´ω`) ﾉ (╥ω╥)",
        "( •́ㅿ•̀ )",
      ],
      happy: [
        "(^)o(^)b",
        "₍ᵔ˶- ̫-˶ᵔ₎",
        "ᐡ ̳ᴗ  ̫ ᴗ ̳ᐡ♡",
        "߹ 𖥦 ߹",
        "(*ฅ•̀ω•́ฅ*)",
        "֊  ̫ ֊𓈒𓂂𓏸",
        "ฅ•̀ω•́ฅ",
        "ฅ^.  ̫ .^ฅ",
        "꒰ᐡ⸝⸝ᴗ ·̫ ฅ⸝⸝ᐡ꒱",
        "ヾ(⸝⸝ᐡ.  ̫ .ᐡ⸝⸝)",
        '(՞  ܸ. .ܸ՞)"',
        "(  ¯꒳​¯ )ᐝ",
        "(・ε・´  )",
      ],
    },
  };

  constructor() {
    super({ intents: 32767 });
    this.music = new Collection();
    this.commands = new Collection();
  }

  start() {
    this.registerEvents();
    this.registerCommands();
    this.login(process.env.BOT_TOKEN);
    this.alive(this);

    process.on("warning", (e) => console.warn(e.stack)); // debug
  }

  private async importFile(filePath: string) {
    return (await import(filePath))?.default;
  }

  private async registerEvents() {
    const eventFiles = await glob(`${__dirname}/../events/*{.ts,.js}`);

    eventFiles.forEach(async (filePath) => {
      const event: Event<keyof ClientEvents> = await this.importFile(filePath);
      this.on(event.event, event.execute);
    });
  }

  private async registerCommandsHelper({
    guildId,
    commands,
  }: RegisterCommandsOptions) {
    if (guildId) {
      this.guilds.cache.get(guildId)?.commands.set(commands);
      logger.info(`Registering commands to ${guildId}`);
    } else {
      this.application?.commands.set(commands);
      logger.info(`Registering commands globally`);
    }
  }

  private async registerCommands() {
    const slashCommands: ApplicationCommandDataResolvable[] = [];
    const commandFiles = await glob(`${__dirname}/../commands/*/*{.ts,.js}`);

    commandFiles.forEach(async (filePath) => {
      const command: CommandType = await this.importFile(filePath);
      if (!command.name) {
        return;
      }

      this.commands.set(command.name, command);
      slashCommands.push(command);
    });

    this.on("ready", () => {
      this.registerCommandsHelper({
        commands: slashCommands,
        guildId: process.env.GUILD_ID,
      });
    });
  }

  private async alive(client: ExtendedClient) {
    setInterval(async () => {
      client.music.forEach(async (mPlayer, guildId) => {
        const { connection } = mPlayer.subscription;
        const channelId = connection.joinConfig.channelId;
        
        client.channels
          .fetch(channelId)
          .then(async (voiceChannel: VoiceChannel) => {
            const memberList = voiceChannel.members.filter(
              (mem) => !mem.user.bot
            );

            if (memberList.size === 0) {
              clearTimeout(mPlayer.disconnectTimer);
              mPlayer.disconnect();
              mPlayer.textChannel.send({
                content: this.replyMsg(`Since there are no listeners left`),
              });
            }
          })
          .catch(async (err) => {
            logger.error(`Channel fetch failed for ${channelId} in guild ${guildId}: ${err}`);
            
            // Channel likely deleted, clean up the player
            clearTimeout(mPlayer.disconnectTimer);
            clearTimeout(mPlayer.destroyTimer);
            
            try {
              connection.destroy();
            } catch (destroyErr) {
              logger.error(`Error destroying connection: ${destroyErr}`);
              // Force cleanup
              try {
                mPlayer.subscription.player.stop();
                mPlayer.queue = [];
                mPlayer.loopQueue = [];
                mPlayer.currQueuePage.clear();
                await mPlayer.deleteStatusMsg();
                mPlayer.subscription.unsubscribe();
              } catch (cleanupErr) {
                logger.error(`Error during force cleanup: ${cleanupErr}`);
              } finally {
                client.music.delete(guildId);
              }
            }
          });
      });
    }, 560000);
  }

  replyMsg(content: string) {
    return `${content} ${this.media.kaomoji.happy.random()}`;
  }

  replyMsgError(content: string) {
    return `${content} ${this.media.kaomoji.error.random()}`;
  }

  replyMsgAuthor(author: GuildMember, content: string) {
    return `**${getUserNameMaster(author)}**, ${this.replyMsg(content)}`;
  }

  replyMsgErrorAuthor(author: GuildMember, content: string) {
    return `I'm sorry **${getUserNameMaster(
      author
    )}**, but ${this.replyMsgError(content)}`;
  }

  /**
   * Helper method to fetch a Guild by its ID.
   * @param guildId The ID of the guild.
   * @returns The Guild object if found, null otherwise.
   */
  async getGuild(guildId: string): Promise<Guild | null> {
    // Attempt to get the guild from the cache
    const guild = this.guilds.cache.get(guildId);
    if (!guild) {
      logger.error(`Guild with ID ${guildId} not found`);
      return null;
    }
    return guild;
  }

  /**
   * Fetch a specific GuildMember from the guild and user IDs.
   * @param guildId The ID of the guild
   * @param userId The ID of the user
   * @returns A promise that resolves to the GuildMember or null
   */
  async getGuildMember(
    guildId: string,
    userId: string
  ): Promise<GuildMember | null> {
    try {
      // Fetch the guild using the helper method
      const guild = await this.getGuild(guildId);
      if (!guild) {
        return null; // If the guild isn't found, return null
      }

      // Fetch the guild member by user ID
      const member = await guild.members.fetch(userId);
      return member;
    } catch (error) {
      console.error(`Error fetching member: ${error.message}`);
      return null;
    }
  }
}

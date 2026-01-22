import { VoiceState } from "discord.js";
import { client } from "..";
import { Event } from "../models/events";
import logger from "../middlewares/logger/logger";

export default new Event("voiceStateUpdate", async (oldState: VoiceState, newState: VoiceState) => {
  const mPlayer = client.music.get(oldState.guild.id);
  if (!mPlayer) return;

  const botId = client.user?.id;
  if (!botId) return;

  const connectionChannelId = mPlayer.subscription?.connection?.joinConfig?.channelId;
  if (!connectionChannelId) return;

  // Bot was moved or disconnected
  if (oldState.member?.id === botId) {
    // Bot left the voice channel (kicked or channel deleted)
    if (oldState.channelId && !newState.channelId) {
      logger.info(`Bot was disconnected from voice channel in guild ${oldState.guild.id}`);
      return;
    }

    // Bot was moved to a different channel
    if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
      mPlayer.subscription.connection.joinConfig.channelId = newState.channelId;
      logger.info(`Bot was moved to channel ${newState.channelId} in guild ${oldState.guild.id}`);
      return;
    }
  }

  // Check if the channel the bot is connected to still has listeners
  try {
    const channel = await client.channels.fetch(connectionChannelId).catch(() => null);
    
    // Channel was deleted or is inaccessible
    if (!channel) {
      logger.info(`Voice channel ${connectionChannelId} was deleted or inaccessible, cleaning up player in guild ${oldState.guild.id}`);
      clearTimeout(mPlayer.disconnectTimer);
      clearTimeout(mPlayer.destroyTimer);
      
      try {
        mPlayer.subscription.connection.destroy();
      } catch (err) {
        logger.error(`Error destroying connection: ${err}`);
        client.music.delete(oldState.guild.id);
      }
      return;
    }

    // Check if someone left the bot's channel
    if (oldState.channelId === connectionChannelId && oldState.channelId !== newState.channelId) {
      const voiceChannel = channel as any;
      if (voiceChannel.members) {
        const memberList = voiceChannel.members.filter((mem: any) => !mem.user.bot);
        
        if (memberList.size === 0) {
          clearTimeout(mPlayer.disconnectTimer);
          mPlayer.disconnect();
          mPlayer.textChannel.send({
            content: client.replyMsg(`Since there are no listeners left`),
          });
        }
      }
    }
  } catch (err) {
    logger.error(`Error in voiceStateUpdate: ${err}`);
  }
});

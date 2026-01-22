import { DMChannel, GuildChannel } from "discord.js";
import { client } from "..";
import { Event } from "../models/events";
import logger from "../middlewares/logger/logger";

export default new Event("channelDelete", async (channel: DMChannel | GuildChannel) => {
  // Only handle guild channels (voice channels)
  if (channel.isDMBased()) return;
  
  const guildChannel = channel as GuildChannel;
  const mPlayer = client.music.get(guildChannel.guild.id);
  if (!mPlayer) return;

  const connectionChannelId = mPlayer.subscription?.connection?.joinConfig?.channelId;
  if (!connectionChannelId) return;

  // Check if the deleted channel is the one the bot is connected to
  if (connectionChannelId === channel.id) {
    logger.info(`Voice channel ${channel.id} was deleted, cleaning up player in guild ${guildChannel.guild.id}`);
    
    clearTimeout(mPlayer.disconnectTimer);
    clearTimeout(mPlayer.destroyTimer);

    try {
      mPlayer.subscription.connection.destroy();
    } catch (err) {
      logger.error(`Error destroying connection after channel delete: ${err}`);
      // Force cleanup if destroy fails
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
        client.music.delete(guildChannel.guild.id);
      }
    }

    mPlayer.textChannel.send({
      content: client.replyMsg(`The voice channel was deleted, so the music session has ended`),
    }).catch(() => {});
  }
});

import {
  AudioPlayer,
  CreateAudioPlayerOptions,
  joinVoiceChannel,
  PlayerSubscription,
  VoiceConnectionStatus,
  entersState,
  AudioPlayerStatus,
  getVoiceConnection,
} from "@discordjs/voice";
import { Collection, GuildTextBasedChannel, Message } from "discord.js";
import { ExecuteOptions } from "../command";
import { ExtendedClient } from "../client";
import { IGuildPlayer, ITrackData } from "../../cache/schema";
import { findPlayer, createPlayer, savePlayer } from "../../cache/repository";
import { Track } from "./track";
import { baseEmbed, formatBool } from "../../middlewares/utils";
import logger from "../../middlewares/logger/logger";

const enum TIMERS {
  reconnect = 10_000,
  destroy = 30_000,
  disconnect = 300_000,
}

const MAX_RETRIES = 3;

export class OpusPlayer implements IGuildPlayer {
  guildId: string;
  queue: Track[];
  loopQueue: Track[];
  trackLoopTimes: number;
  queueLoopTimes: number;
  volume: number;

  textChannel: GuildTextBasedChannel;
  subscription: PlayerSubscription;
  currQueuePage: Collection<string, number>;
  statusMsg?: Message;
  disconnectTimer?: NodeJS.Timeout;
  destroyTimer?: NodeJS.Timeout;

  constructor(
    { client, interaction, args }: ExecuteOptions,
    playerOptions?: CreateAudioPlayerOptions
  ) {
    this.guildId = interaction.guildId;
    this.textChannel = interaction.channel;
    this.queue = [];
    this.loopQueue = [];
    this.trackLoopTimes = 0;
    this.queueLoopTimes = 0;
    this.volume = 1;
    this.currQueuePage = new Collection();

    // Load existing player doc from Redis or create a new one
    this.loadFromCache().then(() => {
      this.initialize(client, interaction, playerOptions);
    });
  }

  private async loadFromCache() {
    let doc = await findPlayer(this.guildId);
    if (!doc) {
      doc = await createPlayer(this.guildId);
    }
    this.assignFromDoc(doc);
  }

  /**
   * Save current state to Redis
   */
  async saveToCache() {
    const mappedQueue: ITrackData[] = this.queue.map((track) => ({
      id: track.id,
      url: track.url,
      title: track.title,
      duration: track.duration,
      requester: { id: track.requester.id, guildId: track.requester.guildId },
      seek: track.seek,
      retries: track.retries,
    }));

    const mappedLoopQueue: ITrackData[] = this.loopQueue.map((track) => ({
      id: track.id,
      url: track.url,
      title: track.title,
      duration: track.duration,
      requester: { id: track.requester.id, guildId: track.requester.guildId },
      seek: track.seek,
      retries: track.retries,
    }));

    const data: IGuildPlayer = {
      guildId: this.guildId,
      queue: mappedQueue,
      loopQueue: mappedLoopQueue,
      trackLoopTimes: this.trackLoopTimes,
      queueLoopTimes: this.queueLoopTimes,
      volume: this.volume,
    };

    await savePlayer(data);
  }

  private assignFromDoc(doc: IGuildPlayer) {
    this.trackLoopTimes = doc.trackLoopTimes;
    this.queueLoopTimes = doc.queueLoopTimes;
    this.volume = doc.volume;
    this.queue = doc.queue.map(
      (t) => new Track(t.id, t.url, t.title, t.duration, t.requester)
    );
    this.loopQueue = doc.loopQueue.map(
      (t) => new Track(t.id, t.url, t.title, t.duration, t.requester)
    );
  }

  private async initialize(
    client: ExtendedClient,
    interaction: any,
    playerOptions?: CreateAudioPlayerOptions
  ) {
    try {
      const { member } = interaction;
      const connection = joinVoiceChannel({
        channelId: member.voice.channelId,
        guildId: member.guild.id,
        adapterCreator: interaction.guild.voiceAdapterCreator,
      })
        .on("error", (err) => {
          logger.error(err);
          this.textChannel.send({ content: String(err) });
        })
        .on(VoiceConnectionStatus.Disconnected, async () => {
          try {
            await Promise.race([
              entersState(
                connection,
                VoiceConnectionStatus.Signalling,
                TIMERS.reconnect
              ),
              entersState(
                connection,
                VoiceConnectionStatus.Connecting,
                TIMERS.reconnect
              ),
            ]);
          } catch {
            clearTimeout(this.disconnectTimer);

            const embed = baseEmbed()
              .setTitle(`Matta ne~ ヾ(＾ ∇ ＾)`)
              .setDescription(
                `To re-establish this music session, within \`30 seconds\`, use the \`connect\` command while you are in a \`voice chat\``
              )
              .setThumbnail(
                "https://media1.tenor.com/images/2acd2355ad05655cb2a536f44660fd23/tenor.gif?itemid=17267169"
              );
            this.textChannel.send({ embeds: [embed] });

            this.destroyTimer = setTimeout(() => {
              if (
                connection.state.status === VoiceConnectionStatus.Disconnected
              ) {
                connection.destroy();
              }
            }, TIMERS.destroy);
          }
        })
        .on(VoiceConnectionStatus.Destroyed, async () => {
          try {
            this.subscription.player.stop();
            this.queue = [];
            this.loopQueue = [];
            this.currQueuePage.clear();
            await this.deleteStatusMsg();
          } finally {
            this.subscription.unsubscribe();
            client.music.delete(this.guildId);
          }
        });

      const player = new AudioPlayer(playerOptions)
        .on("error", async (err) => {
          logger.error(err);

          const currentTrack = this.queue[0];
          if (currentTrack && currentTrack.isNotLiveStream()) {
            currentTrack.retries = (currentTrack.retries || 0) + 1;

            if (currentTrack.retries <= MAX_RETRIES) {
              currentTrack.seek = currentTrack.resource?.playbackDuration || 0;
              this.queue.splice(1, 0, currentTrack);
              await this.saveToCache();

              this.textChannel.send({
                content:
                  String(err) +
                  `. ${client.user.username} will restart the current track (attempt ${currentTrack.retries}/${MAX_RETRIES})`,
              });
            } else {
              this.textChannel.send({
                content: `Failed to play "${currentTrack.title}" after ${MAX_RETRIES} attempts. Skipping track.`,
              });
            }
          } else {
            this.textChannel.send({
              content: String(err),
            });
          }
        })
        .on(AudioPlayerStatus.Playing, async (oldState, newState) => {
          if (!this.queue[0]) return;
          clearTimeout(this.disconnectTimer);
          if (oldState.status === AudioPlayerStatus.Buffering) {
            if (this.queue[0].seek !== undefined) {
              this.queue[0].seek = undefined;
            } else {
              this.statusMsg = await this.textChannel.send({
                content: `${client.user.username} is now playing`,
                embeds: [await this.playingStatusEmbed()],
              });
            }
          }
        })
        .on(AudioPlayerStatus.Idle, async (oldState, newState) => {
          try {
            if (this.isLoopingTrack()) {
              if (this.trackLoopTimes > 0) this.trackLoopTimes--;
              this.queue.splice(1, 0, this.queue[0]);
            } else {
              if (this.isLoopingQueue()) {
                this.loopQueue.push(this.queue[0]);
              }
              this.textChannel.send({
                embeds: [this.queue[0].creatEmbedFinished()],
              });
            }
            await this.deleteStatusMsg();
          } finally {
            this.queue.shift();
            await this.saveToCache();
            await this.processQueue(client);
          }
        });

      this.subscription = connection.subscribe(player);
      client.music.set(this.guildId, this);
    } catch (error) {
      logger.error(`Error during initialization: ${error}`);
    }
  }

  getConnection() {
    return getVoiceConnection(this.guildId);
  }

  async disconnect() {
    const { channelId } = this.subscription.connection.joinConfig;
    if (this.subscription.connection.disconnect()) {
      this.subscription.connection.joinConfig.channelId = channelId;
      return true;
    }
    return false;
  }

  async reconnect(channelId?: string) {
    if (
      this.subscription.connection.state.status !==
      VoiceConnectionStatus.Disconnected
    )
      return false;

    clearTimeout(this.destroyTimer);
    if (channelId) {
      this.subscription.connection.joinConfig.channelId = channelId;
    }
    const result = this.subscription.connection.rejoin();
    this.subscription = this.subscription.connection.subscribe(
      this.subscription.player
    );
    return result;
  }

  async timeOut(client: ExtendedClient) {
    clearTimeout(this.disconnectTimer);
    this.disconnectTimer = setTimeout(() => {
      if (this.subscription.player.state.status === AudioPlayerStatus.Idle) {
        this.textChannel.send({
          content: `Since no track has been played for the past 5 minutes, ${client.user.username} will now leave`,
        });
        this.disconnect();
      }
    }, TIMERS.disconnect);
  }

  async processQueue(client: ExtendedClient) {
    let track = this.queue[0];
    if (!track) {
      if (this.isLoopingQueue()) {
        if (this.queueLoopTimes > 0) this.queueLoopTimes--;
        this.queue.push(...this.loopQueue);
        this.loopQueue = [];
        await this.saveToCache();
        track = this.queue[0];
      } else {
        this.timeOut(client);
        this.textChannel.send({
          content: client.replyMsg("The queue has ended~"),
        });
        return;
      }
    }
    this.playIfIdling(client);
  }

  async playIfIdling(client: ExtendedClient) {
    if (
      this.subscription.player.state.status !== AudioPlayerStatus.Paused &&
      this.subscription.player.state.status !== AudioPlayerStatus.Playing &&
      this.queue.length > 0
    ) {
      await this.playFromQueue(client);
    }
  }

  async playFromQueue(client: ExtendedClient) {
    try {
      const newVolume = this.queue[0].resource
        ? this.queue[0].resource.volume.volume
        : this.volume;
      this.queue[0].resource = await this.queue[0].createAudioResource();
      this.queue[0].resource.volume.setVolume(newVolume);
      this.subscription.player.play(this.queue[0].resource);
    } catch (err) {
      logger.error(err);
      this.textChannel.send({ content: String(err) });
    }
  }

  async disableQueueRepeat() {
    this.queueLoopTimes = 0;
    this.loopQueue.splice(0);
    await this.saveToCache();
  }

  async enableQueueRepeat(times = -1) {
    this.trackLoopTimes = 0;
    this.queueLoopTimes = times;
    await this.saveToCache();
  }

  async disableTrackRepeat() {
    this.trackLoopTimes = 0;
    await this.saveToCache();
  }

  async enableTrackRepeat(times = -1) {
    this.queueLoopTimes = 0;
    this.trackLoopTimes = times;
    await this.saveToCache();
  }

  isLoopingTrack() {
    return this.trackLoopTimes !== 0;
  }

  isLoopingQueue() {
    return this.queueLoopTimes !== 0;
  }

  async playingStatusEmbed() {
    if (!this.queue[0]) return null;
    const embed = await this.queue[0].createEmbedImage();
    return embed.addFields(
      { name: "Queue", value: String(this.queue.length), inline: true },
      {
        name: "Paused",
        value: formatBool(
          this.subscription.player.state.status === AudioPlayerStatus.Paused
        ),
        inline: true,
      },
      {
        name: "Track Loop",
        value: `${formatBool(this.isLoopingTrack())} (${
          this.trackLoopTimes === -1 ? "∞" : this.trackLoopTimes
        })`,
        inline: true,
      },
      {
        name: "Queue Loop",
        value: `${formatBool(this.isLoopingQueue())} (${
          this.queueLoopTimes === -1 ? "∞" : this.queueLoopTimes
        })`,
        inline: true,
      },
      { name: "Volume", value: String(this.queue[0].getVolume()), inline: true }
    );
  }

  async updatePlayingStatusMsg() {
    const embed = await this.playingStatusEmbed();
    if (embed) {
      await this.statusMsg?.edit({ embeds: [embed] }).catch(() => {});
    }
  }

  async deleteStatusMsg() {
    await this.statusMsg?.delete().catch(() => {});
  }
}

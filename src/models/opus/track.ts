import {
  baseEmbed,
  formatDuration,
  getUserNameMaster,
} from "../../middlewares/utils";
import { client } from "../..";
import {
  createAudioResource,
  AudioResource,
  StreamType,
} from "@discordjs/voice";
import { TrackRequester } from "./trackRequester";
import { ITrackData } from "../../cache/schema";
import { youtubeService } from "../../services/youtube";
import logger from "../../middlewares/logger/logger";

export class Track implements ITrackData {
  id: string;
  url: string;
  title: string;
  duration: number;
  requester: TrackRequester;
  seek?: number;
  resource?: AudioResource;
  retries?: number = 0;

  constructor(
    id: string,
    url: string,
    title: string,
    duration: number,
    requester: TrackRequester
  ) {
    this.id = id;
    this.url = url;
    this.title = title;
    this.duration = duration;
    this.requester = requester;
    this.retries = 0;
  }

  async createAudioResource(): Promise<AudioResource> {
    try {
      const seekSeconds =
        this.seek !== undefined ? Math.floor(this.seek / 1000) : 0;

      logger.info(
        `Creating audio stream for ${this.title}${
          seekSeconds > 0 ? ` (seeking to ${seekSeconds}s)` : ""
        }`
      );

      const stream = await youtubeService.createAudioStream(
        this.url,
        seekSeconds
      );

      if (!stream) {
        throw new Error("No audio stream returned from YouTube service");
      }

      return createAudioResource(stream, {
        metadata: this,
        inlineVolume: true,
        inputType: StreamType.Arbitrary,
      });
    } catch (error) {
      logger.error(`Failed to create audio resource: ${error}`);
      throw error;
    }
  }

  isNotLiveStream() {
    return this.duration > 0;
  }

  private baseEmbedMusic() {
    return baseEmbed().setDescription(`[${this.title}](${this.url})`);
  }

  private async createEmbed() {
    return this.baseEmbedMusic()
      .setTitle(`Track`)
      .addFields(
        {
          name: "Requested By",
          value: await this.getRequester(),
          inline: true,
        },
        {
          name: "Lenght",
          value: `${
            this.isNotLiveStream() ? formatDuration(this.duration) : `Live`
          }`,
          inline: true,
        }
      );
  }

  async createEmbedThumbnail() {
    let embed = await this.createEmbed();
    return embed.setThumbnail(
      `https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`
    );
  }

  async createEmbedImage() {
    let embed = await this.createEmbed();
    return embed.setImage(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`);
  }

  creatEmbedFinished() {
    return this.baseEmbedMusic().setTitle("Previous Track");
  }

  async getRequester() {
    const member = await client.getGuildMember(
      this.requester.guildId,
      this.requester.id
    );
    return getUserNameMaster(member);
  }

  remainingTime() {
    return this.resource.playbackDuration - this.resource.silenceRemaining;
  }

  getVolume() {
    return this.resource?.volume.volume;
  }

  setVolume(value: number) {
    this.resource?.volume.setVolume(value);
  }
}

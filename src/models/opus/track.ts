import ytdl from "@distube/ytdl-core";
import {
  baseEmbed,
  formatDuration,
  getUserNameMaster,
} from "../../middlewares/utils";
import { client } from "../..";
import { createAudioResource, AudioResource } from "@discordjs/voice";
import { TrackRequester } from "./trackRequester";
import { ITrackData } from "../../cache/schema";

export class Track implements ITrackData {
  id: string;
  url: string;
  title: string;
  duration: number;
  requester: TrackRequester;
  seek?: number;
  resource?: AudioResource;

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
  }

  async createAudioResource(): Promise<AudioResource> {
    return new Promise((resolve, reject) => {
      const ytdlOptions: ytdl.downloadOptions = {
        filter: "audio",
        quality: "highestaudio",
        highWaterMark: 1 << 62,
        liveBuffer: 1 << 25,
        dlChunkSize: 0,
        begin: this.seek || 0,
        // range: { start: Math.round(this.seek / 1000 || 0 },
      };

      const stream = ytdl(this.url, ytdlOptions);

      if (!stream) {
        reject(new Error("No stdout"));
        return;
      }

      resolve(
        createAudioResource(stream, { metadata: this, inlineVolume: true })
      );
    });
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

require('dotenv').config();
import { AudioResource, createAudioResource } from "@discordjs/voice";
import { GuildMember } from "discord.js";
import { Model, InferAttributes, InferCreationAttributes, ForeignKey } from "sequelize";
import ytdl from "ytdl-core";
import { baseEmbed, formatDuration } from "../../structures/Utils";
import { MQueueData } from "./MQueueData";

export interface ITrackInfo{
    track_id: string;
    url: string;
    title: string;
    duration: number;
    requester: GuildMember;
    seek?: number;
}

export class TrackInfo extends Model<
InferAttributes<TrackInfo>,
InferCreationAttributes<TrackInfo>> implements ITrackInfo {
    declare guild_id: ForeignKey<MQueueData['guild_id']>;
    declare track_id: string;
    declare index: number;
    declare url: string;
    declare title: string;
    declare duration: number;
    declare requester: GuildMember;
    declare seek?: number;
    declare resource?: AudioResource;

    static buildTrack({ track_id, url, title, duration, requester, seek } : ITrackInfo, index?: number){
        return TrackInfo.build({ index, track_id, url, title, duration, requester, seek });
    }


    static async createTrack({ track_id, url, title, duration, requester, seek } : ITrackInfo, index?: number){
        return await TrackInfo.create({ index, track_id, url, title, duration, requester, seek });
    }
        
    static async removeTrack(index: number) {
        await TrackInfo.destroy({ where: { index } });
    }

    async createAudioResource(): Promise<AudioResource> {
        return new Promise((resolve, reject) => {
            // const ytdlOptions: ytdl.downloadOptions | ytdl.videoFormat = { 
            const ytdlOptions: ytdl.downloadOptions = { 
                filter: 'audio', 
                quality: 'highestaudio', 
                highWaterMark: 1 << 62,
                liveBuffer: 1 << 62,
                // bitrate: 128,
                dlChunkSize: 0,
                begin: this.seek || 0,
                // range: { start: this.seek/1000 },
            };

            const stream = ytdl( this.url, ytdlOptions );

            if (!stream) {
				reject(new Error('No stdout'));
				return;
			}

            resolve(createAudioResource(stream, { metadata: this, inlineVolume: true }));
        });
    }

    private baseEmbedMusic(){
        return baseEmbed().setDescription(`[${this.title}](${this.url})`);
    }

    private createEmbed(){
        return this.baseEmbedMusic()
            .setTitle(`Track`)
            .addFields(
                { name: 'Requested By', value: this.getRequesterName(), inline: true },
                { name: 'Lenght', value: `${this.duration > 0 ? formatDuration(this.duration) : `Live`}`, inline: true },
            )
    }

    createEmbedThumbnail(){
        return this.createEmbed().setThumbnail(`https://i.ytimg.com/vi/${this.track_id}/hqdefault.jpg`);
    }

    createEmbedImage(){
        return this.createEmbed().setImage(`https://i.ytimg.com/vi/${this.track_id}/hqdefault.jpg`);
    }

    creatEmbedFinished(){
        return this.baseEmbedMusic().setTitle('Previous Track');
    }

    getRequesterName(){
        return `${this.requester.nickname || this.requester.user.username}-sama`;
    }

    getVolume(){
        return this.resource?.volume.volume;
    }

    setVolume(value: number){
        this.resource?.volume.setVolume(value);
        this.save();
    }

    setIndex(index: number){
        this.index = index;
        this.save();
    }
};
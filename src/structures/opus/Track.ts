import { GuildMember } from "discord.js";
import ytdl from "ytdl-core";
import { baseEmbed, formatDuration, getUserNameMaster } from "../Utils";
import { createAudioResource, AudioResource } from "@discordjs/voice";

export class Track {
    id: string;
    url: string;
    title: string;
    duration: number;
    requester: GuildMember;
    seek?: number;
    resource?: AudioResource;

	constructor (id: string, url: string, title: string, duration: number, requester: GuildMember){
        this.id = id;
        this.url = url;
        this.title = title;
        this.duration = duration;
        this.requester = requester;
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
                { name: 'Requested By', value: this.getRequester(), inline: true },
                { name: 'Lenght', value: `${this.duration > 0 ? formatDuration(this.duration) : `Live`}`, inline: true },
            )
    }

    createEmbedThumbnail(){
        return this.createEmbed().setThumbnail(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`);
    }

    createEmbedImage(){
        return this.createEmbed().setImage(`https://i.ytimg.com/vi/${this.id}/hqdefault.jpg`);
    }

    creatEmbedFinished(){
        return this.baseEmbedMusic().setTitle('Previous Track');
    }

    getRequester(){
        return getUserNameMaster(this.requester);
    }

    remainingTime(){
        return this.resource.playbackDuration - this.resource.silenceRemaining;
    }

    getVolume(){
        return this.resource?.volume.volume;
    }

    setVolume(value: number){
        this.resource?.volume.setVolume(value);
    }
}
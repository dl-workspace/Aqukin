import { User } from "discord.js";
import ytdl from "ytdl-core";
import { BaseEmbed, formatDuration } from "../Utils";
import { createAudioResource, AudioResource } from "@discordjs/voice";

export class Track {
    id: string;
    url: string;
    title: string;
    duration: number;
    requester: User;
    seek?: string | number;
    resource?: AudioResource;

	constructor (id: string, url: string, title: string, duration: number, requester: User){
        this.id = id;
        this.url = url;
        this.title = title;
        this.duration = duration;
        this.requester = requester;
    }

    async createAudioResource(): Promise<AudioResource> {
        return new Promise((resolve, reject) => {
            const ytdlOptions: ytdl.downloadOptions = { 
                filter: 'audio', 
                quality: 'highestaudio', 
                highWaterMark: 1 << 62,
                liveBuffer: 1 << 62,
                dlChunkSize: 0,
                begin: this.seek,
            };

            const stream = ytdl( this.url, ytdlOptions );

            if (!stream) {
				reject(new Error('No stdout'));
				return;
			}

            // console.log(this.url, stream);

            resolve(createAudioResource(stream, { metadata: this, inlineVolume: true }));
        });
    }

    private createEmbed(){
        return BaseEmbed()
            .setTitle(`Track`)
            .setDescription(`[${this.title}](${this.url})`)
            .addFields(
                { name: 'Requested By', value: `${this.requester.username}-sama`, inline: true },
                { name: 'Lenght', value: `${this.duration > 0 ? formatDuration(this.duration) : `Live`}`, inline: true },
            )
    }

    createEmbedThumbnail(){
        return this.createEmbed().setThumbnail(`https://i.ytimg.com/vi/${this.id}/maxresdefault.jpg`);
    }

    createEmbedImage(){
        return this.createEmbed().setImage(`https://i.ytimg.com/vi/${this.id}/maxresdefault.jpg`);
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
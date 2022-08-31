import { GuildMember } from "discord.js";
import ytdl from "ytdl-core";
import { BaseEmbed, formatDuration } from "../Utils";
import { createAudioResource, AudioResource } from "@discordjs/voice";

export class Track {
    id: string;
    url: string;
    title: string;
    duration: number;
    requester: GuildMember;
    seek?: string | number;
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
            const ytdlOptions: ytdl.downloadOptions = { 
                filter: 'audio', 
                quality: 'highestaudio', 
                highWaterMark: 1 << 25,
                liveBuffer: 1 << 25,
                dlChunkSize: 0,
                begin: this.seek,
                // range: { start: this.seek as number },
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

    private BaseEmbedMusic(){
        return BaseEmbed().setDescription(`[${this.title}](${this.url})`);
    }

    private createEmbed(){
        return this.BaseEmbedMusic()
            .setTitle(`Track`)
            .addFields(
                { name: 'Requested By', value: this.getRequester(), inline: true },
                { name: 'Lenght', value: `${this.duration > 0 ? formatDuration(this.duration) : `Live`}`, inline: true },
            )
    }

    getRequester(){
        return `${this.requester.nickname || this.requester.user.username}-sama`;
    }

    createEmbedThumbnail(){
        return this.createEmbed().setThumbnail(`https://i.ytimg.com/vi/${this.id}/sddefault.jpg`);
    }

    createEmbedImage(){
        return this.createEmbed().setImage(`https://i.ytimg.com/vi/${this.id}/sddefault.jpg`);
    }

    creatEmbedFinished(){
        return this.BaseEmbedMusic().setTitle('Previous Track');
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
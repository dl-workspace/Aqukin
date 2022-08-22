import { AudioPlayer, CreateAudioPlayerOptions, joinVoiceChannel, PlayerSubscription, VoiceConnection, VoiceConnectionStatus, entersState, AudioPlayerStatus, AudioResource } from "@discordjs/voice";
import { Collection, GuildTextBasedChannel, Message } from "discord.js";
import { ExecuteOptions } from "../../typings/command";
import { ExtendedClient } from "../Client";
import { formatBool } from "../Utils";
import { Track } from "./Track";

export enum OPUS_PLAYER_EVENTS{
    track_start = 'track_start',
    track_end = 'track_end',
    queue_end = 'queue_end',
}

class ExtendedAudioPlayer extends AudioPlayer{
    resource: AudioResource;

    constructor(options?: CreateAudioPlayerOptions){
        super(options);
        
        this.on('error', (err) => {
            console.error(err);
        });

        // this.once(OPUS_PLAYER_EVENTS.track_start, async (opusPlayer: OpusPlayer, client: ExtendedClient) => {
        //     opusPlayer.statusMsg = await opusPlayer.textChannel.send({ content: `${client.user.username} is now playing`, embeds: [opusPlayer.queue[0].createEmbed()] });
        // });
    }

    play(resource: AudioResource){
        this.resource = resource;
        super.play(resource);
    }
}

export class OpusPlayer{
    id: string;
    textChannel: GuildTextBasedChannel;
    subscription: PlayerSubscription;
    trackRepeat: boolean;
    queueRepeat: boolean;
    queue: Track[];
    loopQueue: Track[];
    statusMsg?: Message;
    currQueuePage: Collection<String, number>;

    constructor({ client, interaction, args }: ExecuteOptions, playerOptions?: CreateAudioPlayerOptions){
        this.id = interaction.guildId;
        this.textChannel = interaction.channel;

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: this.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        })
            .on('error', (err) =>{
                console.log(err);
            })
            .on(VoiceConnectionStatus.Signalling, async (oldState, newState) => {
                console.log('connection signalling');
            })
            .on(VoiceConnectionStatus.Connecting, async (oldState, newState) => {
                console.log('connection Connecting');
            })
            .on(VoiceConnectionStatus.Ready, async (oldState, newState) => {
                // const player = new ExtendedAudioPlayer(playerOptions);
                // this.subscription = connection.subscribe(player);

                // client.music.set(this.id, this);
                console.log('connection Ready');
            })
            .on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                try {
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                    // Seems to be reconnecting to a new channel - ignore disconnect
                } catch (err) {
                    // Seems to be a real disconnect which SHOULDN'T be recovered from
                    connection.destroy();
                }
            })
            .on(VoiceConnectionStatus.Destroyed, async (oldState, newState) => {
                this.subscription.player.stop();
                this.subscription.unsubscribe();

                this.queue.splice(0);
                this.loopQueue.splice(0);
                this.currQueuePage.clear();

                client.music.delete(this.id);
            });

        const player = new ExtendedAudioPlayer(playerOptions)
            .once(AudioPlayerStatus.Playing, async () => {
                const nowPlaying = this.queue[0].createEmbed()
                    .addFields(
                        { name: 'Volume', value: `${this.queue[0].resource?.volume.volume}`, inline: true },
                        { name: 'Track Loop', value: `${formatBool(this.trackRepeat)}`, inline: true },
                        { name: 'Queue Loop', value: `${formatBool(this.queueRepeat)}`, inline: true },
                    );
                this.statusMsg = await this.textChannel.send({ content: `${client.user.username} is now playing`, embeds: [nowPlaying] });
            })
            .once(AudioPlayerStatus.Idle, async () => { 
                if(this.trackRepeat) { this.queue.splice(1, 0, this.queue[0]); }
                else if(this.queueRepeat) { this.loopQueue.push(this.queue[0]); }

                if(this.statusMsg.deletable){ this.statusMsg.delete(); }

                this.queue.shift();
                await this.processQueue(client);
            })
            
        this.subscription = connection.subscribe(player);

        client.music.set(this.id, this);

        this.trackRepeat = false;
        this.queueRepeat = false;
        this.queue = [];
        this.loopQueue = [];
        this.currQueuePage = new Collection();
    }

    async processQueue(client: ExtendedClient){
        let track = this.queue[0];

        if(!track){
            if(this.queueRepeat){
                this.queue.push(...this.loopQueue);
                this.loopQueue.splice(0);
                track = this.queue[0];
            }
            else{
                try{
                    this.subscription.connection.destroy();
                    this.textChannel.send({ content: "The queue has ended, arigatou gozaimatshita ☆ ⌒ ヽ (* '､ ^ *) chu~", files: ["https://media1.tenor.com/images/2acd2355ad05655cb2a536f44660fd23/tenor.gif?itemid=17267169"] })
                        .then(msg => setTimeout( () => msg.delete().catch(console.error), 5200 ));
                } catch (err) { console.log(err); }
                return;
            }
        }

        this.playCurrTrack(client);
        // this.processQueue(client);
    }

    async playCurrTrack(client: ExtendedClient){
        if(this.subscription.player.state.status != AudioPlayerStatus.Playing && this.queue.length > 0){
            this.queue[0].resource = await this.queue[0].createAudioResource();
            this.subscription.player.play(this.queue[0].resource);
            // client.emit(OPUS_PLAYER_EVENTS.track_start, [this, client]);
        }
    }

    async disableQueueRepeat(){
        this.queueRepeat = false;
        this.loopQueue.splice(0);
    }

    async enableQueueRepeat(){
        this.trackRepeat = false;
        this.queueRepeat = true;
    }

    async disableTrackRepeat(){
        this.trackRepeat = false;
    }

    async enableTrackRepeat(){
        this.disableQueueRepeat();
        this.trackRepeat = true;
    }
}

// export interface ExtendedJoinConfig extends JoinConfig{
//     textChannel?: GuildTextBasedChannel;
// }

// export class ExtendedVoiceConnection extends VoiceConnection {
//     audioPlayer: ExtendedAudioPlayer;
//     textChannel: GuildTextBasedChannel;

//     constructor(joinConfigExtra: ExtendedJoinConfig & CreateVoiceConnectionOptions){
//         super(joinConfigExtra, joinConfigExtra);
//         this.textChannel = joinConfigExtra.textChannel;
//     }
// }
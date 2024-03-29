import { AudioPlayer, CreateAudioPlayerOptions, joinVoiceChannel, PlayerSubscription, VoiceConnectionStatus, entersState, AudioPlayerStatus, getVoiceConnection } from "@discordjs/voice";
import { Collection, GuildTextBasedChannel, Message } from "discord.js";
import { ExecuteOptions } from "../../typings/command";
import { ExtendedClient } from "../Client";
import { baseEmbed, formatBool } from "../Utils";
import { Track } from "./Track";

const enum TIMERS{
    reconnect = 5_000,
    destroy = 20_000,
    disconnect = 300_000,
}

export class OpusPlayer{
    id: string;
    textChannel: GuildTextBasedChannel;
    subscription: PlayerSubscription;
    trackLoopTimes: number;
    queueLoopTimes: number;
    queue: Track[];
    loopQueue: Track[];
    volume: number;
    currQueuePage: Collection<String, number>;
    statusMsg?: Message;
    disconnectTimer?: NodeJS.Timeout;
    destroyTimer?: NodeJS.Timeout;

    constructor({ client, interaction, args }: ExecuteOptions, playerOptions?: CreateAudioPlayerOptions){
        this.id = interaction.guildId;
        this.textChannel = interaction.channel;

        // temporary fix for connection bug, no longer needed
        // const networkStateChangeHandler = (oldNetworkState: any, newNetworkState: any) => {
        //     const newUdp = Reflect.get(newNetworkState, 'udp');
        //     clearInterval(newUdp?.keepAliveInterval);
        // }

        const connection = joinVoiceChannel({
            channelId: interaction.member.voice.channelId,
            guildId: this.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        })
        // temporary fix for connection bug, no longer needed
            // .on('stateChange', (oldState, newState) => {
            //     if(oldState.status !== VoiceConnectionStatus.Disconnected){
            //         Reflect.get(oldState, 'networking')?.off('stateChange', networkStateChangeHandler);
            //         Reflect.get(newState, 'networking')?.on('stateChange', networkStateChangeHandler);
                    
            //         if (oldState.status === VoiceConnectionStatus.Ready && newState.status === VoiceConnectionStatus.Connecting) {
            //             connection.configureNetworking();
            //         }
            //     }
            // })
            .on('error', (err) =>{
                console.log(err);
                this.textChannel.send({ content: `${err}` });
            })
            .on(VoiceConnectionStatus.Signalling, async (oldState, newState) => {
                console.log('connection signalling');
            })
            .on(VoiceConnectionStatus.Connecting, async (oldState, newState) => {
                console.log('connection Connecting');
            })
            .on(VoiceConnectionStatus.Ready, async (oldState, newState) => {
                console.log('connection Ready');
            })
            .on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
                try{
                    await Promise.race([
                        entersState(connection, VoiceConnectionStatus.Signalling, TIMERS.reconnect),
                        entersState(connection, VoiceConnectionStatus.Connecting, TIMERS.reconnect),
                    ]);
                    // Seems to be reconnecting to a new channel - ignore disconnect
                } catch (err) {
                    clearTimeout(this.disconnectTimer);

                    const embed = baseEmbed()
                        .setTitle(`${client.user.username} will now leave, matta ne~ ヾ(＾ ∇ ＾)`)
                        .setDescription(`To re-establish this music session, within \`20 seconds\`, use the \`connect\` command while you are in a \`voice chat\``)
                        .setThumbnail('https://media1.tenor.com/images/2acd2355ad05655cb2a536f44660fd23/tenor.gif?itemid=17267169')
                    this.textChannel.send({ embeds: [embed] });

                    // Seems to be a real disconnect which SHOULDN'T be recovered from
                    this.destroyTimer = setTimeout( () => {
                        if(connection.state.status === VoiceConnectionStatus.Disconnected){
                            try{
                                connection.destroy();
                            } catch(err) { console.log(err); }
                        }
                    }, TIMERS.destroy );
                }
            })
            .on(VoiceConnectionStatus.Destroyed, async (oldState, newState) => {
                try{
                    this.subscription.player.stop();
                    this.queue.splice(0);
                    this.loopQueue.splice(0);
                    this.currQueuePage.clear();
                    
                    await this.deleteStatusMsg();
                }
                catch(err) { console.log(err); }
                finally{
                    this.subscription.unsubscribe();
                    client.music.delete(this.id);
                }
            });

        const player = new AudioPlayer(playerOptions)
            .on('error', (err) => {
                console.error(err);
                this.textChannel.send({ content: `${err}` });
            })
            .on(AudioPlayerStatus.Playing, async (oldState, newState) => {
                try{
                    if(!this.queue[0]) { return; }

                    clearTimeout(this.disconnectTimer);

                    if(oldState.status === AudioPlayerStatus.Buffering){                        
                        if(this.queue[0].seek != undefined){
                            this.queue[0].seek = undefined;
                        }
                        else{
                            this.statusMsg = await this.textChannel.send({ content: `${client.user.username} is now playing`, embeds: [await this.playingStatusEmbed()] });
                        }
                    }
                }
                catch(err) { console.log(err); }
            })
            .on(AudioPlayerStatus.Idle, async (oldState, newState) => {
                try{
                    if(this.isLoopingTrack()) {
                        if(this.trackLoopTimes > 0){
                            this.trackLoopTimes--;
                        }
                        this.queue.splice(1, 0, this.queue[0]); 
                    }
                    else{
                        if(this.isLoopingQueue()) {
                            this.loopQueue.push(this.queue[0]); 
                        }
                        this.textChannel.send({ embeds: [this.queue[0].creatEmbedFinished()] });
                    }

                    await this.deleteStatusMsg();
                   
                } catch(err) { console.log(err); }
                finally{
                    this.queue.shift();
                    await this.processQueue(client);
                }
            })
            
        this.subscription = connection.subscribe(player);
        this.trackLoopTimes = 0;
        this.queueLoopTimes = 0;
        this.queue = [];
        this.loopQueue = [];
        this.volume = 1;
        this.currQueuePage = new Collection();

        client.music.set(this.id, this);
    }

    getConnection(){
        return getVoiceConnection(this.id);
    }

    async disconnect(){
        const { channelId } = this.subscription.connection.joinConfig;

        if(this.subscription.connection.disconnect()){
            this.subscription.connection.joinConfig.channelId = channelId;
            return true;
        }
        else{
            return false;
        }
    }

    async reconnect(channelId?: string){
        let result = false;

        if(this.subscription.connection.state.status === VoiceConnectionStatus.Disconnected){
            clearTimeout(this.destroyTimer);

            if(channelId){
                this.subscription.connection.joinConfig.channelId = channelId;
            }
            
            result = this.subscription.connection.rejoin();
            this.subscription = this.subscription.connection.subscribe(this.subscription.player);
        }

        return result;
    }

    async timeOut(){
        clearTimeout(this.disconnectTimer);

        this.disconnectTimer = setTimeout( () => {
            if(this.subscription.player.state.status === AudioPlayerStatus.Idle){
                try{
                    this.textChannel.send({ content: `Since no track has been played for the past 5 minutes` });
                    this.disconnect();
                } catch(err) { }
            }
        }, TIMERS.disconnect );
    }

    async processQueue(client: ExtendedClient){
        let track = this.queue[0];

        if(!track){
            if(this.isLoopingQueue()){
                if(this.queueLoopTimes > 0){
                    this.queueLoopTimes--;
                }
                this.queue.push(...this.loopQueue);
                this.loopQueue.splice(0);
                track = this.queue[0];
            }
            else{
                try{
                    this.timeOut();
                    this.textChannel.send({ content: client.replyMsg('The queue has ended~') });
                } catch (err) { console.log(err); }
                return;
            }
        }

        this.playIfIdling(client);
    }

    async playIfIdling(client: ExtendedClient){
        if(this.subscription.player.state.status != AudioPlayerStatus.Paused && this.subscription.player.state.status != AudioPlayerStatus.Playing && this.queue.length > 0){
            this.playFromQueue(client);
        }
    }

    async playFromQueue(client: ExtendedClient){
        try{
            let newVolume = this.queue[0].resource ? this.queue[0].resource.volume.volume : this.volume;

            this.queue[0].resource = await this.queue[0].createAudioResource();
            this.queue[0].resource.volume.setVolume(newVolume);    

            this.subscription.player.play(this.queue[0].resource);
        }
        catch(err){
            console.log(err);
            this.textChannel.send({ content: `${err}` });
        }
    }

    async disableQueueRepeat(){
        this.queueLoopTimes = 0;
        this.loopQueue.splice(0);
    }

    async enableQueueRepeat(times = -1){
        this.trackLoopTimes = 0;
        this.queueLoopTimes = times;
    }

    async disableTrackRepeat(){
        this.trackLoopTimes = 0;
    }

    async enableTrackRepeat(times = -1){
        this.disableQueueRepeat();
        this.trackLoopTimes = times;
    }

    isLoopingTrack(){
        return this.trackLoopTimes != 0;
    }

    isLoopingQueue(){
        return this.queueLoopTimes != 0;
    }

    async playingStatusEmbed(){
        return this.queue[0]?.createEmbedImage()
            .addFields(
                { name: 'Queue', value: `${this.queue.length}`, inline: true },
                { name: 'Paused', value: `${formatBool(this.subscription.player.state.status == AudioPlayerStatus.Paused)}`, inline: true },
                { name: 'Track Loop', value: `${formatBool(this.isLoopingTrack())} (${ this.trackLoopTimes == -1 ? `∞` : this.trackLoopTimes })`, inline: true },
                { name: 'Queue Loop', value: `${formatBool(this.isLoopingQueue())} (${ this.queueLoopTimes == -1 ? `∞` : this.queueLoopTimes })`, inline: true },
                { name: 'Volume', value: `${this.queue[0].getVolume()}`, inline: true },
        );
    }

    async updatePlayingStatusMsg(){
        const embed = await this.playingStatusEmbed();

        if(embed){
            await this.statusMsg?.edit({ embeds: [embed] }).catch(err => {});
        }
    }

    async deleteStatusMsg(){
        await this.statusMsg?.delete().catch(err => {});
    }
}
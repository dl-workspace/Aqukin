import { ActionRowBuilder, ApplicationCommandOptionType, GuildMember, MessageActionRowComponentBuilder, PermissionFlagsBits, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder } from "discord.js";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";
import { MQueueData } from "../../database/models/MQueueData";
import { TrackInfo } from "../../database/models/TrackInfo";
import { ExtendedClient } from "../../structures/Client";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import { OpusPlayer } from "../../structures/opus/Player";
import { baseEmbed, formatDuration, generateInteractionComponentId, getUserNameMaster } from "../../structures/Utils";
import { ExecuteOptions } from "../../typings/command";

export enum PLAY_OPTIONS{
    // commands
    query = 'query',
    insert = 'insert',

    // options
    index = 'index',
    queue = 'queue',
    track_select = 'track_select'
}

export default new Command({
    name: COMMANDS.play,
    tag: COMMAND_TAGS.music,
    description: 'Enqueue/Insert a Youtube track/playlist/search result from the given url or query',
    userPermissions: [PermissionFlagsBits.SendMessages],

    options: [
    {
        type: ApplicationCommandOptionType.Subcommand,
        name: PLAY_OPTIONS.queue,
        description: 'Enqueue a Youtube track/playlist/search result from the given url or query',
        options: [{
            type: ApplicationCommandOptionType.String,
            name: PLAY_OPTIONS.query,
            description: 'Please provide an url or query for playback',
            required: true,
        }],
    },
    {
        type: ApplicationCommandOptionType.Subcommand,
        name: PLAY_OPTIONS.insert,
        description: 'Insert to a specified position (default to next position) a YT track/playlist/search result',
        options: [
        {
            type: ApplicationCommandOptionType.String,
            name: PLAY_OPTIONS.query,
            description: 'Please provide an url or query for playback',
            required: true,
        },
        {
            type: ApplicationCommandOptionType.Number,
            name: PLAY_OPTIONS.index,
            description: 'Index position to insert into, default 1 aka next position',
            min_value: 1,
            required: false,
        }
        ],
    },
    ],
    
    execute: async({ client, interaction, args, mPlayer }) => {
        if(!mPlayer){
            mPlayer = new OpusPlayer({ client, interaction, args });
            await mPlayer.initQueueData();
        }

        const queueData = await mPlayer.getQueueData();
        let result: TrackInfo[];

        switch(args.getSubcommand()){
            case PLAY_OPTIONS.queue:
                result = await processQuery({ client, interaction, args }, queueData.size);

                if(result.length > 0){
                    // queueData.queue.push(...result);
                    for(let trackInfo of result){
                        await queueData.queueTrack(trackInfo);
                    }
                    mPlayer.updatePlayingStatusMsg();
                    mPlayer.playIfIdling(client, queueData);
                }
                break;

            case PLAY_OPTIONS.insert:{
                const index: number = await insertIndex(args.get(PLAY_OPTIONS.index)?.value as number, queueData);

                result = await processQuery({ client, interaction, args }, index);

                if(result.length > 0){
                    for(let trackInfo of result){
                        await queueData.addTrack(index, trackInfo);
                    }
                    mPlayer.updatePlayingStatusMsg();
                    mPlayer.playIfIdling(client, queueData);
                }
                break;
            }
        }
    }
});

async function processQuery({ client, interaction, args }: ExecuteOptions, index: number){
    const { member } = interaction;
    const query = args.get(PLAY_OPTIONS.query).value as string;
    let result: TrackInfo[] = [];

    // if the queury is a youtube video link
    if(ytdl.validateURL(query)) {  
        await ytdl.getBasicInfo(query).then(async trackInfo => {
            //console.log(trackInfo);
            const track = infoTrack(trackInfo, member);
            result.push(track);

            interaction.followUp({ content: statusReply(client, member, index), embeds: [track.createEmbedThumbnail()] });
        }).catch(err => { interaction.followUp({ content: `${err}` }) });
    }
    // if the queury is a youtube playlist link
    else if (ytpl.validateID(query)){
        // limit can be Infinity
        await ytpl(query, { limit: 1000 }).then(async playlist =>{
            // console.log(playlist);

            let playListDuration = 0;
    
            playlist.items.forEach(async trackInfo => {
                //console.log(trackInfo);
                if(trackInfo.durationSec){
                    const { id, url, title } = trackInfo;
                    const duration = trackInfo.durationSec * 1000;
                    result.push(TrackInfo.buildTrack({ track_id: id, url, title, duration, requester : member }));
                    playListDuration += duration;
                }
            });

            const embed = baseEmbed()
                .setTitle(`Playlist`)
                .setDescription(`[${playlist.title}](${playlist.url})`)
                .setImage(playlist.bestThumbnail.url)
                .addFields(
                    { name: 'Requested By', value: `${getUserNameMaster(member)}`, inline: true },
                    { name: 'Lenght', value: `${formatDuration(playListDuration)}`, inline: true },
                    { name: 'Size', value: `${result.length}`, inline: true },
                );

            interaction.followUp({ content: statusReply(client, member, index), embeds: [embed] });
        }).catch(err => { interaction.followUp({ content: `${err}` }) });
    }
    // else try searching youtube with the given query
    else{
        await ytsr(query, { limit:7 }).then(async results => {
            const tracks = results.items.filter(i => i.type == "video") as ytsr.Video[];

            if(tracks.length === 0) {
                interaction.followUp({ content: client.replyMsgErrorAuthor(member, `${client.user.username} couldn't find any tracks with the given keywords`) });
                return; 
            }

            // embed the result(s)
            let i = 0;
            let tracksInfo = '';
            let menuOptBuilder: StringSelectMenuOptionBuilder[] = [new StringSelectMenuOptionBuilder({ label: 'Dismiss', description: 'Dismiss the current results', value: '0' })];

            tracks.forEach( async (track) => {
                tracksInfo += `${++i}) [${track.title}](${track.url}) | length \`${track.duration}\` \n\n`;
                menuOptBuilder.push(new StringSelectMenuOptionBuilder({ label: `Track ${i}`, description: `${track.title}`, value: `${track.url}` }));
            })

            const embed = baseEmbed()
                .setTitle(`Search results ヽ (o´∀\`) ﾉ ♪ ♬`)
                .setDescription(tracksInfo)
                .setImage("https://c.tenor.com/pnXpZl3VRiwAAAAC/minato-aqua-akutan.gif");

            const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId(generateInteractionComponentId(member.id, PLAY_OPTIONS.track_select, index))
                        .setPlaceholder(`${getUserNameMaster(member)}, please select an option`)
                        .addOptions(menuOptBuilder)
                );

            handleSelectTrackInteraction = args.getSubcommand() == PLAY_OPTIONS.insert ? selectTrackInsert :  selectTrackPush;

            interaction.followUp({ content: `**${getUserNameMaster(member)}**`, embeds: [embed], components: [actionRow] });
        }).catch(err => { interaction.followUp({ content: `${err}` }) });
    } // end of else the given is keyword

    return result;
}

function infoTrack(info : ytdl.videoInfo, requester: GuildMember, index?: number){
    const { videoId, title, lengthSeconds } = info.player_response.videoDetails;
    return TrackInfo.buildTrack({ track_id: videoId, url: info.videoDetails.video_url, title, duration: Number(lengthSeconds)*1000, requester }, index);
}

async function createTrack(url: string, requester: GuildMember){
    return infoTrack(await ytdl.getBasicInfo(url), requester, 0);    
}

interface IHandlingSelectTrackInteractionDelegate{
    (client: ExtendedClient, mPlayer: OpusPlayer, member: GuildMember, interaction: StringSelectMenuInteraction, index: number) : void;
}

export let handleSelectTrackInteraction : IHandlingSelectTrackInteractionDelegate;

async function selectTrackPush(client: ExtendedClient, mPlayer: OpusPlayer, member: GuildMember, interaction: StringSelectMenuInteraction, index: number) {
    const track = await createTrack(interaction.values[0], member);
    const queueData = await mPlayer.getQueueData();

    queueData.queueTrack(track);
    interaction.editReply({ content: statusReply(client, member, index), embeds: [track.createEmbedThumbnail()], components: [] });

    mPlayer.updatePlayingStatusMsg();
    mPlayer.playIfIdling(client, queueData);
}

async function selectTrackInsert(client: ExtendedClient, mPlayer: OpusPlayer, member: GuildMember, interaction: StringSelectMenuInteraction, index: number) {
    const track = await createTrack(interaction.values[0], member);
    const queueData = await mPlayer.getQueueData();
    index = await insertIndex(index, queueData);

    queueData.addTrack(index, track);
    interaction.editReply({ content: statusReply(client, member, index), embeds: [track.createEmbedThumbnail()], components: [] });

    mPlayer.updatePlayingStatusMsg();
    mPlayer.playIfIdling(client, queueData);
}

function statusReply(client: ExtendedClient, member: GuildMember, index: number){
    return client.replyMsgAuthor(member, `${client.user.username} has inserted to position \`${index}\``);
}

async function insertIndex(args: number, queueData: MQueueData) {
    let index: number = args || queueData.currIndex + 1;

    if(index+1 > queueData.size){
        index = queueData.size;
    }

    return index;
}
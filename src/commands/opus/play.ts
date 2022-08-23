import { ActionRowBuilder, ApplicationCommandOptionType, MessageActionRowComponentBuilder, PermissionFlagsBits, SelectMenuBuilder, SelectMenuInteraction, SelectMenuOptionBuilder } from "discord.js";
import ytdl from "ytdl-core";
import ytpl from "ytpl";
import ytsr from "ytsr";
import { ExtendedClient } from "../../structures/Client";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { OpusPlayer } from "../../structures/opus/Player";
import { Track } from "../../structures/opus/Track";
import { BaseEmbed, errorReplyTemplate, formatDuration, replyTemplate } from "../../structures/Utils";
import { ExecuteOptions } from "../../typings/command";

export enum PLAY_OPTIONS{
    query = 'query',
    track_select = 'track_select'
}

export default new Command({
    name: 'play',
    tag: COMMAND_TAGS.music,
    description: 'Enqueue Youtube Video/Playlist/Track from given URL search results',
    usage: 'https://youtu.be/6bnaBnd4kyU -- will enqueue the song \`#Aqua Iro Palette - Minato Aqua\`',
    userPermissions: [PermissionFlagsBits.SendMessages],

    options: [{
        type: ApplicationCommandOptionType.String,
        name: PLAY_OPTIONS.query,
        description: 'Please provide an url or query for playback',
        required: true,
    }],
    
    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId) || new OpusPlayer({ client, interaction, args });
    
        mPlayer.queue.push(...await processQuery({ client, interaction, args }));
    
        mPlayer.playCurrTrack(client);
    }
});

async function processQuery({ client, interaction, args }: ExecuteOptions){
    const { user } = interaction;
    const query = args.get(PLAY_OPTIONS.query).value as string;
    let result: Track[] = [];

    // if the given queuery is a url
    if(query.startsWith("https://")){
        // if the queury is a youtube video link
        if(ytdl.validateURL(query)) {  
            // Get the song info
            await ytdl.getBasicInfo(query).then(async trackInfo => {
                //console.log(trackInfo);
                const { videoId, title, lengthSeconds } = trackInfo.player_response.videoDetails;
                const track = new Track(videoId, trackInfo.videoDetails.video_url, title, Number(lengthSeconds)*1000, user);
                result.push(track);

                interaction.followUp(replyTemplate(user, `has enqueued`, { embeds: [track.createEmbed()] }));
            }).catch(err => {});
        } // video link
                
        // if the queury is a youtube playlist link
        else if (ytpl.validateID(query)){
            await ytpl(query, { limit: Infinity }).then(async playlist =>{
                // console.log(playlist);

                let playListDuration = 0;
        
                playlist.items.forEach(async track => {
                    //console.log(trackInfo);
                    if(track.durationSec){
                        const trackDuration = track.durationSec * 1000;
                        result.push(new Track(track.id, track.url, track.title, trackDuration, user));
                        playListDuration += trackDuration;
                    }
                });

                const embed = BaseEmbed()
                    .setTitle(`Playlist`)
                    .setDescription(`[${playlist.title}](${playlist.url})`)
                    .setImage(playlist.bestThumbnail.url)
                    .addFields(
                        { name: 'Lenght', value: `${formatDuration(playListDuration)}`, inline: true },
                        { name: 'Size', value: `${result.length}`, inline: true },
                        { name: 'Requested By', value: `${interaction.user.username}-sama`, inline: true },
                    );
                    interaction.followUp(replyTemplate(user, `has enqueued`, { embeds: [embed] }));
            }).catch(err => {});
        } // playlist link
    }
    // else try searching youtube with the given argument
    else{
        await ytsr(query, { limit:7 }).then(async results => {
            const tracks = results.items.filter(i => i.type == "video") as ytsr.Video[];

            if(tracks.length === 0) {
                interaction.followUp(errorReplyTemplate(user, `can't find any tracks with the given keywords (｡T ω T｡)`, { ephemeral : true }));
                return; 
            }

            // embed the result(s)
            let i = 0;
            let tracksInfo = '';
            let menuOptBuilder: SelectMenuOptionBuilder[] = [new SelectMenuOptionBuilder({ label: 'Dismiss', description: 'Dismiss the current results', value: '0' })];

            tracks.forEach( async (track) => {
                tracksInfo += `${++i}) [${track.title}](${track.url}) | length \`${track.duration}\` \n\n`;
                menuOptBuilder.push(new SelectMenuOptionBuilder({ label: `Track ${i}`, description: `${track.title}`, value: `${track.url}` }));
            })

            const embed = BaseEmbed()
            .setTitle(`Search results ヽ (o´∀\`) ﾉ ♪ ♬`)
            .setDescription(tracksInfo)
            .setImage("https://c.tenor.com/pnXpZl3VRiwAAAAC/minato-aqua-akutan.gif");

            const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents(
                    new SelectMenuBuilder()
                        .setCustomId(PLAY_OPTIONS.track_select)
                        .setPlaceholder(`${user.username}-sama, please select an option`)
                        .addOptions(menuOptBuilder)
                );

            await interaction.followUp(replyTemplate(user, 'found some results', {embeds: [embed], components: [actionRow]}));

        }).catch(err => {});
    } // end of else the given is keyword

    return result;
}

export async function handleSelectTrackInteraction(client: ExtendedClient, interaction: SelectMenuInteraction) {
    await ytdl.getBasicInfo(interaction.values[0]).then(async trackInfo => {
        const { videoId, title, lengthSeconds } = trackInfo.player_response.videoDetails;
        const track = new Track(videoId, trackInfo.videoDetails.video_url, title, Number(lengthSeconds)*1000, interaction.user);

        const mPlayer = client.music.get(interaction.guildId);
        mPlayer.queue.push(track);

        interaction.message.delete();
        interaction.followUp(replyTemplate(interaction.user, 'has enqueued', {}));

        mPlayer.playCurrTrack(client);
    }).catch(err => {
        interaction.message.delete();
        interaction.deleteReply();
    });
}
import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import { Track } from "../../structures/opus/Track";

export enum REMOVE_OPTIONS{
    track = 'track',
    duplicate = 'duplicate',
}

export default new Command({
    name: COMMANDS.remove,
    tag: COMMAND_TAGS.music,
    description: 'Remove duplicates/the specified track from the queue, default to the last enqueued track if leave blank',
    userPermissions: [PermissionFlagsBits.SendMessages],

    options: [
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: REMOVE_OPTIONS.track,
            description: 'Remove the specified track from the queue, default to the last enqueued track if leave blank',

            options: [{
                type: ApplicationCommandOptionType.Number,
                name: 'index',
                description: 'index value (default `queue size`)',
                min_value: 1,
                required: false,
            }],
        },
        {
            type: ApplicationCommandOptionType.Subcommand,
            name: REMOVE_OPTIONS.duplicate,
            description: 'Remove duplicated tracks, if any , from the queue',
        },
    ],

    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);

        switch(args.getSubcommand()){
            case REMOVE_OPTIONS.track:{
                if(mPlayer.queue.length < 2){
                    interaction.followUp({ content: `**${interaction.user.username}**-sama, there is no track/song next in queue ╮ (︶︿︶) ╭` });
                    return;
                }
        
                const value = args.get('index')?.value as number || mPlayer.queue.length-1;
        
                if(mPlayer.queue.length < value + 1){
                    interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} could not find track indexed at \`${value}\`
                    Please try something between \`1\` and \`${mPlayer.queue.length-1}\`` });
                }
                else{
                    const trackName = mPlayer.queue[value].title;
                    mPlayer.queue.splice(value, 1);
                    mPlayer.updatePlayingStatusMsg();
                    interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} has has removed removed track \`${trackName}\` from the queue (っ ˘ω˘ς)` });
                }
            }

            case REMOVE_OPTIONS.duplicate:{
                mPlayer.queue = await removeDuplicate(mPlayer.queue);

                mPlayer.updatePlayingStatusMsg();
                interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} has has removed duplicated tracks from the queue 乁 (• ω • 乁)` });        
            }
        }
    }
});

async function removeDuplicate(queue: Track[]){
    return [...new Map(queue.map(track => [track.id, track])).values()];
} // end of removeDuplicate(...) helper function
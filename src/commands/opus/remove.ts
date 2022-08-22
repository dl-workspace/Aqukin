import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { Track } from "../../structures/opus/Track";

export default new Command({
    name: 'remove',
    tag: COMMAND_TAGS.music,
    description: 'Remove the specified track from the queue, default to the last enqueued track if leave blank',
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [{
        type: ApplicationCommandOptionType.Number,
        name: 'index',
        description: 'index value (default `queue size`)',
        min_value: 1,
        required: false,
    }],

    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);

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
});

async function removeDuplicate(queue: Track[]){
    return [...new Map(queue.map(track => [track.id, track])).values()];
} // end of removeDuplicate(...) helper function
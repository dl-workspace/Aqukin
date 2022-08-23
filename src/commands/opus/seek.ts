import { ApplicationCommandOptionType, PermissionFlagsBits, time } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { convertInput, formatDuration, replyTemplate } from "../../structures/Utils";

export default new Command({
    name: 'seek',
    tag: COMMAND_TAGS.music,
    description: `Seek to a specified timestamp (hh:mm:ss) of the current track`,
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [{
        type: ApplicationCommandOptionType.String,
        name: 'timestamp',
        description: 'timestamp (hh:mm:ss)',
        minValue: 0,
        required: true,
    }],

    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);
        // const timestamp = args.get('timestamp')?.value as number;
        const input = args.get('timestamp')?.value;
        
        // const timestamp = isNaN(Number(input)) ? convertInput(input as string) : input as number;

        const timestamp = convertInput(input as string);

        if(timestamp >= mPlayer.queue[0].duration){ 
            interaction.followUp({ content: `**${interaction.user.username}**-sama, the timestamp should be less than the track length \`${formatDuration(mPlayer.queue[0].duration)}\` ლ (¯ ロ ¯ "ლ)` }); 
        }
        else{
            // mPlayer.queue[0].seek = timestamp;
            // mPlayer.playCurrTrack(client);

            mPlayer.queue.splice(1, 0, mPlayer.queue[0]);
            mPlayer.queue[1].seek = timestamp;
            mPlayer.subscription.player.stop();

            interaction.followUp(replyTemplate(interaction.user, `will now move the current track to position \`${formatDuration(timestamp)}\``, {})); 
        }
    }
});
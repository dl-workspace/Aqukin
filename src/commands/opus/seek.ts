import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import { convertInput, formatDuration } from "../../structures/Utils";

export default new Command({
    name: COMMANDS.seek,
    tag: COMMAND_TAGS.music,
    description: `Move the current track to a specified timestamp (hh:mm:ss) location`,
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [{
        type: ApplicationCommandOptionType.String,
        name: 'timestamp',
        description: 'timestamp (hh:mm:ss)',
        minValue: 0,
        required: true,
    }],

    execute: async({ client, interaction, args, mPlayer }) => {
        const queueData = await mPlayer.getQueueData();

        if(queueData.currTrack() == undefined){
            return interaction.followUp({ content: client.replyMsgErrorAuthor(interaction.member, `no track is currently being played`) });
        }

        const timestamp = convertInput(args.get('timestamp')?.value as string);

        if(timestamp >= queueData.currTrack().duration){
            interaction.followUp({ content: client.replyMsgErrorAuthor(interaction.member, `the timestamp should be less than the track length \`${formatDuration(queueData.currTrack().duration)}\``) });
        }
        else{
            queueData.currTrack().seek = timestamp;
            queueData.save();
            mPlayer.playFromQueue(client, queueData);
            interaction.followUp({ content: client.replyMsgAuthor(interaction.member, `will now move the current track to position \`${formatDuration(timestamp)}\``) });
        }
    }
});
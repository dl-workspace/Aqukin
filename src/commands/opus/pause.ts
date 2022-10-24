import { PermissionFlagsBits } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import { formatDuration } from "../../structures/Utils";
import { assert } from "console";

export default new Command({
    name: COMMANDS.pause,
    tag: COMMAND_TAGS.music,
    description: 'Pause the current playing track if any',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args, mPlayer }) => {
        if(mPlayer.subscription.player.state.status === AudioPlayerStatus.Paused){
            interaction.followUp({ content: client.replyMsgAuthor(interaction.member, `the player is already paused`) });
        }
        else if(mPlayer.subscription.player.state.status === AudioPlayerStatus.Playing){
            mPlayer.subscription.player.pause();
            interaction.followUp({ content: client.replyMsgAuthor(interaction.member, `${client.user.username} has paused audio streaming`) }); // at \`${formatDuration(mPlayer.queue[0].remainingTime())}\`
            mPlayer.updatePlayingStatusMsg();
        }        
    }
});
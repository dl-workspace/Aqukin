import { PermissionFlagsBits } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { formatDuration } from "../../structures/Utils";

export default new Command({
    name: 'pause',
    tag: COMMAND_TAGS.music,
    description: 'Pause the current playing track if any',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        let reply = `**${interaction.user.username}**-sama, `;
        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer.subscription.player.state.status === AudioPlayerStatus.Paused){
            reply += `the player is already paused`;
        }
        else if(mPlayer.subscription.player.state.status === AudioPlayerStatus.Playing){
            mPlayer.subscription.player.pause();
            reply += `${client.user.username} has paused audio streaming o (> ω <) o`; // at \`${formatDuration(mPlayer.queue[0].remainingTime())}\`
            mPlayer.updatePlayingStatusMsg();
        }
        
        interaction.followUp({ content: reply }); 
    }
});
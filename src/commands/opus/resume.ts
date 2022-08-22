import { PermissionFlagsBits } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import { Command, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: 'resume',
    tag: COMMAND_TAGS.music,
    description: 'Resume the current paused track if any',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        let reply = `**${interaction.user.username}**-sama, `;
        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer.subscription.player.state.status === AudioPlayerStatus.Paused){
            mPlayer.subscription.player.unpause();
            mPlayer.updatePlayingStatusMsg();
            reply += `${client.user.username} has resume has resumed audio streaming \\ (★ ω ★) /`;
        }
        else{
            reply += `the player is not currently paused`;
        }
        
        interaction.followUp({ content: reply });
    }
});
import { PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: 'clear_queue',
    tag: COMMAND_TAGS.music,
    description: 'Clear the current queue with the exception of the currently playing track',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        let reply = `**${interaction.user.username}**-sama, `;
        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer.queue.length > 1) {
            mPlayer.queue.splice(1);
            reply += `${client.user.username} has cleared the queue (っ ˘ω˘ς)`;
        }
        else{
            reply += `no need to clear the queue as there is no track upcoming ╮ (︶︿︶) ╭`;
        }

        interaction.followUp({ content: reply });
    }
});
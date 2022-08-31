import { PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: COMMANDS.clear,
    tag: COMMAND_TAGS.music,
    description: 'Clear the current queue with the exception of the currently playing track',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        let reply = client.replyMsgAuthor(interaction.member, `the queue is already cleared`);
        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer.queue.length > 1) {
            mPlayer.queue.splice(1);
            reply = client.replyMsgAuthor(interaction.member, `${client.user.username} has cleared the queue`);
            mPlayer.updatePlayingStatusMsg();
        }

        interaction.followUp({ content: reply });
    }
});
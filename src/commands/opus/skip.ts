import { PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: COMMANDS.skip,
    tag: COMMAND_TAGS.music,
    description: 'Skip the current playing track if any',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args, mPlayer }) => {
        // mPlayer.disableQueueRepeat();
        mPlayer.disableTrackRepeat();
        mPlayer.subscription.player.unpause();
        mPlayer.subscription.player.stop();

        interaction.followUp({ content: client.replyMsgAuthor(interaction.member, `${client.user.username} has skipped track \`${mPlayer.queue[0].title}\``) });
    }
});
import { PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: 'skip',
    tag: COMMAND_TAGS.music,
    description: 'Skip the current playing track if any',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);

        mPlayer.disableQueueRepeat();
        mPlayer.disableTrackRepeat();
        mPlayer.subscription.player.unpause();
        mPlayer.subscription.player.stop();

        interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} has skipped track ヾ (⌐ ■ _ ■) ノ ♪ \`${mPlayer.queue[0].title}\`` });
    }
});
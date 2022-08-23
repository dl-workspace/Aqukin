import { PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { replyTemplate } from "../../structures/Utils";

export default new Command({
    name: 'disconnect',
    tag: COMMAND_TAGS.music,
    description: 'Disconnect from the current voice chat if any',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);

        mPlayer.subscription.connection.disconnect();

        interaction.followUp(replyTemplate(interaction.user, `have disconnected per your request~`, {})); 
    }
});
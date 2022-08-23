import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { replyTemplate } from "../../structures/Utils";

export default new Command({
    name: 'volume',
    tag: COMMAND_TAGS.music,
    description: `Change the current player's volume (default 1, min .1, max 10)`,
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [{
        type: ApplicationCommandOptionType.Number,
        name: 'value',
        description: 'volume value (default 1, min .1, max 10)',
        min_value: .1,
        max_value: 10,
        required: false,
    }],

    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);

        const value = args.get('value')?.value as number || 1;

        mPlayer.queue[0].setVolume(value);

        mPlayer.updatePlayingStatusMsg();
        interaction.followUp(replyTemplate(interaction.user, `has set the volume to \`${mPlayer.queue[0].getVolume()}\``, {})); 
    }
});
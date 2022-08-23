import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: 'volume',
    tag: COMMAND_TAGS.music,
    description: `Change the currently playing track or the player's volume (default 1, min .1, max 10)`,
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [
    {
        type: ApplicationCommandOptionType.Number,
        name: 'value',
        description: 'volume value (default 1, min .1, max 10)',
        min_value: .1,
        max_value: 10,
        required: false,
    },
    {
        type: ApplicationCommandOptionType.Number,
        name: 'volume_type',
        description: 'change the volume of only the current track (default) or the player (all tracks)',
        choices: [
            { name: 'track', value: 1 },
            { name: 'player', value: 2 },
        ],
        required: false,
    }
    ],

    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);

        const value = args.get('value')?.value as number || 1;
        const type = args.get('volume_type')?.value as number || 1;

        if(type == 2) { 
            mPlayer.volume = value; 
        }
        mPlayer.queue[0].setVolume(value);

        mPlayer.updatePlayingStatusMsg();
        interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} has set the volume to \`${mPlayer.queue[0].getVolume()}\`` });
    }
});
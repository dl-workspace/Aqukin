import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: 'clean_message',
    tag: COMMAND_TAGS.info,
    description: 'Remove a specified number or 10 (max 100) of messages in the current text channel',
    userPermissions: [PermissionFlagsBits.Administrator],
    options: [{
        type: ApplicationCommandOptionType.Number,
        name: 'num',
        description: 'number of messages to remove (default 10, max 100)',
        min_value: 1,
        max_value: 100,
        required: false,
    }],

    execute: async({ client, interaction, args }) => {
        const { user, channel } = interaction;
        const num = args.get('num')?.value as number || 1;

        await channel.bulkDelete(num).then(async () => {
            // interaction.followUp({ content: `Cleaned \`${num}\` messages`, ephemeral: true, });
            // files: ["https://media1.tenor.com/images/f7b00948fa084c6de0e461ebfb12a90d/tenor.gif?itemid=17086199"
        }).catch(err => channel.send({ content: `**${user.username}**-sama, \`${err}\`` }));
    }
});
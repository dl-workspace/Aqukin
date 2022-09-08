import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";

enum EMOJI_OPTIONS{
    name = 'name',
}

export default new Command({
    name: COMMANDS.emoji,
    tag: COMMAND_TAGS.utils,
    description: 'Send a specified guild emoji on the user behalf',
    userPermissions: [PermissionFlagsBits.SendMessages],
    options: [{
        type: ApplicationCommandOptionType.String,
        name: EMOJI_OPTIONS.name,
        description: 'exact identifier of the emoji (not case sensitive)',
        required: true,
    }],

    execute: async({ client, interaction, args }) => {
        const input = args.get(EMOJI_OPTIONS.name)?.value as string;

        const emoji = interaction.guild.emojis.cache.find(emoji => emoji.name.toLowerCase() === input.toLowerCase());
        
        if(!emoji){
            return interaction.followUp({ content: client.replyMsgErrorAuthor(interaction.member, `${client.user.username} coudln't find any emoji named \`${input}\``), ephemeral : true });
        }

        interaction.followUp({ content: emoji.animated ? `<a:${emoji.name}:${emoji.id}>` : `<:${emoji.identifier}>` });
    }
});
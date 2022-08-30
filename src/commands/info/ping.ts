import { PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: COMMANDS.ping,
    tag: COMMAND_TAGS.info,
    description: 'replies with pong',
    userPermissions: [PermissionFlagsBits.SendMessages],

    execute: async({ interaction }) => {
        interaction.followUp('pong');
    }
});
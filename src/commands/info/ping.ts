import { PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
    name: 'ping',
    tag: COMMAND_TAGS.info,
    description: 'replies with pong',
    userPermissions: [PermissionFlagsBits.SendMessages],

    execute: async({ interaction }) => {
        interaction.followUp('pong');
    }
});
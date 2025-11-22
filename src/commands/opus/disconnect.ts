import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../models/command";

export default new Command({
  name: COMMANDS.disconnect,
  tag: COMMAND_TAGS.music,
  description: "Disconnect from the current voice chat if any",
  userPermissions: [PermissionFlagsBits.SendMessages],
  options: [
    {
      name: "force",
      description: "Force disconnect even if bot is stuck in deleted channel (admin only)",
      type: ApplicationCommandOptionType.Boolean,
      required: false,
    },
  ],

  execute: async ({ client, interaction, args, mPlayer }) => {
    const force = args.getBoolean("force") ?? false;

    if (force && !interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.followUp({
        content: client.replyMsgErrorAuthor(
          interaction.member,
          `only administrators can use the force option`
        ),
      });
    }
    if (await mPlayer.disconnect()) {
      interaction.followUp({
        content: client.replyMsgAuthor(interaction.member, `as requested`),
      });
    } else {
      interaction.deleteReply();
    }
  },
});

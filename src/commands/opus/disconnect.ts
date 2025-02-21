import { PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../models/command";

export default new Command({
  name: COMMANDS.disconnect,
  tag: COMMAND_TAGS.music,
  description: "Disconnect from the current voice chat if any",
  userPermissions: [PermissionFlagsBits.SendMessages],

  execute: async ({ client, interaction, args, mPlayer }) => {
    if (await mPlayer.disconnect()) {
      interaction.followUp({
        content: client.replyMsgAuthor(interaction.member, `as requested`),
      });
    } else {
      interaction.deleteReply();
    }
  },
});

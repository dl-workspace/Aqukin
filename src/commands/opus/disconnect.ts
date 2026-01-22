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

    if (force) {
      if (!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.followUp({
          content: client.replyMsgErrorAuthor(
            interaction.member,
            `only administrators can use the force option`
          ),
        });
      }

      // Force destroy the connection to clean up stuck state
      try {
        mPlayer.subscription.connection.destroy();
        interaction.followUp({
          content: client.replyMsgAuthor(interaction.member, `force disconnected as requested`),
        });
      } catch (err) {
        // If destroy fails, manually clean up
        try {
          mPlayer.subscription.player.stop();
          mPlayer.queue = [];
          mPlayer.loopQueue = [];
          mPlayer.currQueuePage.clear();
          await mPlayer.deleteStatusMsg();
          mPlayer.subscription.unsubscribe();
        } finally {
          client.music.delete(interaction.guildId);
        }
        interaction.followUp({
          content: client.replyMsgAuthor(interaction.member, `force cleaned up the stuck session`),
        });
      }
      return;
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

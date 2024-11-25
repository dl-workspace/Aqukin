import { PermissionFlagsBits } from "discord.js";
import { AudioPlayerStatus } from "@discordjs/voice";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";

export default new Command({
  name: COMMANDS.resume,
  tag: COMMAND_TAGS.music,
  description: "Resume the current paused track if any",
  userPermissions: [PermissionFlagsBits.SendMessages],

  execute: async ({ client, interaction, args, mPlayer }) => {
    if (mPlayer.subscription.player.state.status === AudioPlayerStatus.Paused) {
      mPlayer.subscription.player.unpause();
      mPlayer.updatePlayingStatusMsg();
      interaction.followUp({
        content: client.replyMsgAuthor(
          interaction.member,
          `${client.user.username} has resume has resumed audio streaming`
        ),
      });
    } else {
      interaction.followUp({
        content: client.replyMsgAuthor(
          interaction.member,
          `the player is not currently paused`
        ),
      });
    }
  },
});

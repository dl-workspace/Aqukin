import { VoiceConnectionStatus } from "@discordjs/voice";
import { PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import { OpusPlayer } from "../../structures/opus/Player";

export default new Command({
  name: COMMANDS.connect,
  tag: COMMAND_TAGS.music,
  description:
    "Establish/re-establish voice connection to the current voice chat",
  userPermissions: [PermissionFlagsBits.SendMessages],

  execute: async ({ client, interaction, args, mPlayer }) => {
    if (mPlayer) {
      if (
        mPlayer.subscription.connection.state.status !==
        VoiceConnectionStatus.Disconnected
      ) {
        interaction.followUp({
          content: client.replyMsgErrorAuthor(
            interaction.member,
            `${client.user.username} is already connected to a different voice channel`
          ),
        });
      } else {
        if (await mPlayer.reconnect(interaction.member.voice.channelId)) {
          interaction.followUp({
            content: client.replyMsgAuthor(
              interaction.member,
              `${client.user.username} has re-established voice connection`
            ),
          });
        } else {
          interaction.deleteReply();
        }
      }
    } else {
      mPlayer = new OpusPlayer({ client, interaction, args });
      mPlayer.timeOut();
      interaction.followUp({
        content: client.replyMsgAuthor(
          interaction.member,
          `${client.user.username} has established voice connection`
        ),
      });
    }
  },
});
``;

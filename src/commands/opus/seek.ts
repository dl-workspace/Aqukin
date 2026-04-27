import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../models/command";
import { convertInput, formatDuration } from "../../middlewares/utils";

export default new Command({
  name: COMMANDS.seek,
  tag: COMMAND_TAGS.music,
  description: `Seek to a specified timestamp (hh:mm:ss) of the current track`,
  userPermissions: [PermissionFlagsBits.SendMessages],
  options: [
    {
      type: ApplicationCommandOptionType.String,
      name: "timestamp",
      description: "timestamp (hh:mm:ss)",
      // minValue: 0,
      required: true,
    },
  ],

  execute: async ({ client, interaction, args, mPlayer }) => {
    if (!mPlayer) {
      return interaction.followUp({
        content: client.replyMsgErrorAuthor(
          interaction.member,
          `no active player session was found`
        ),
      });
    }

    if (mPlayer.queue[0] == undefined) {
      return interaction.followUp({
        content: client.replyMsgErrorAuthor(
          interaction.member,
          `no track is currently being played`
        ),
      });
    }

    const rawTimestamp = args.get("timestamp")?.value as string;
    const timestamp = convertInput(rawTimestamp);

    if (timestamp === null) {
      return interaction.followUp({
        content: client.replyMsgErrorAuthor(
          interaction.member,
          `please provide a valid timestamp in \`hh:mm:ss\`, \`mm:ss\`, or \`ss\` format`
        ),
      });
    }

    if (timestamp >= mPlayer.queue[0].duration) {
      interaction.followUp({
        content: client.replyMsgErrorAuthor(
          interaction.member,
          `the timestamp should be less than the track length \`${formatDuration(
            mPlayer.queue[0].duration
          )}\``
        ),
      });
    } else {
      mPlayer.queue[0].seek = timestamp;
      await mPlayer.saveToCache();
      await mPlayer.playFromQueue(client);
      interaction.followUp({
        content: client.replyMsgAuthor(
          interaction.member,
          `will now move the current track to position \`${formatDuration(
            timestamp
          )}\``
        ),
      });
    }
  },
});

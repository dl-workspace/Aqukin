import { ApplicationCommandOptionType, PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../models/command";
import { Track } from "../../models/opus/track";

enum REMOVE_OPTIONS {
  // subcomands
  track = "track",
  all = "all",
  range = "range",
  duplicate = "duplicate",

  // options
  index = "index",
  start = "start",
  end = "end",
}

export default new Command({
  name: COMMANDS.remove,
  tag: COMMAND_TAGS.music,
  description: "Remove commands",
  userPermissions: [PermissionFlagsBits.SendMessages],

  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: REMOVE_OPTIONS.track,
      description:
        "Remove the specified track from the queue, default to the last enqueued track if leave blank",

      options: [
        {
          type: ApplicationCommandOptionType.Number,
          name: REMOVE_OPTIONS.index,
          description: "index value (default is last enqueued track)",
          min_value: 1,
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: REMOVE_OPTIONS.range,
      description:
        "Remove a specified range, from and including start to end, of upcoming track(s) from the queue",

      options: [
        {
          type: ApplicationCommandOptionType.Number,
          name: REMOVE_OPTIONS.start,
          description: "starting index of the range, default is 1",
          min_value: 1,
          required: false,
        },
        {
          type: ApplicationCommandOptionType.Number,
          name: REMOVE_OPTIONS.end,
          description: "ending index of the range, default is end of queue",
          min_value: 1,
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: REMOVE_OPTIONS.all,
      description:
        "Remove all upcoming track(s) from the queue, if any, excluding the currently playing track",
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: REMOVE_OPTIONS.duplicate,
      description: "Remove duplicated tracks from the queue, if any",
    },
  ],

  execute: async ({ client, interaction, args, mPlayer }) => {
    switch (args.getSubcommand()) {
      case REMOVE_OPTIONS.track: {
        if (mPlayer.queue.length < 2) {
          return interaction.followUp({
            content: client.replyMsgErrorAuthor(
              interaction.member,
              `${client.user.username} there is no track/song next in queue`
            ),
          });
        }

        const value =
          (args.get(REMOVE_OPTIONS.index)?.value as number) ||
          mPlayer.queue.length - 1;

        if (mPlayer.queue.length < value + 1) {
          interaction.followUp({
            content: client.replyMsgErrorAuthor(
              interaction.member,
              `${
                client.user.username
              } could not find track indexed at \`${value}\`
                    Please try something between \`1\` and \`${
                      mPlayer.queue.length - 1
                    }\``
            ),
          });
        } else {
          const trackName = mPlayer.queue[value].title;
          mPlayer.queue.splice(value, 1);
          mPlayer.updatePlayingStatusMsg();
          interaction.followUp({
            content: client.replyMsgAuthor(
              interaction.member,
              `${client.user.username} has removed track \`${trackName}\` from the queue`
            ),
          });
        }
        break;
      }

      case REMOVE_OPTIONS.range: {
        if (mPlayer.queue.length < 2) {
          return interaction.followUp({
            content: client.replyMsgErrorAuthor(
              interaction.member,
              `${client.user.username} there is no track/song next in queue`
            ),
          });
        }

        const start = (args.get(REMOVE_OPTIONS.start)?.value as number) || 1;
        const end = (args.get(REMOVE_OPTIONS.end)?.value as number) || start;

        if (
          mPlayer.queue.length < start + 1 ||
          mPlayer.queue.length < end + 1 ||
          end < start
        ) {
          interaction.followUp({
            content: client.replyMsgErrorAuthor(
              interaction.member,
              `you have given an invalid range! Please try something between \`1\` and \`${
                mPlayer.queue.length - 1
              }\``
            ),
          });
        } else {
          const { length } = mPlayer.queue.splice(start, end - start + 1);
          mPlayer.updatePlayingStatusMsg();
          interaction.followUp({
            content: client.replyMsgAuthor(
              interaction.member,
              `${client.user.username} has removed \`${length}\` tracks from the queue, starting from \`${start}\` and ending at \`${end}\``
            ),
          });
        }
        break;
      }

      case REMOVE_OPTIONS.all: {
        let reply = client.replyMsgAuthor(
          interaction.member,
          `the upcoming queue is already empty`
        );

        if (mPlayer.queue.length > 1) {
          mPlayer.queue.splice(1);
          reply = client.replyMsgAuthor(
            interaction.member,
            `${client.user.username} has cleared the queue`
          );
          mPlayer.updatePlayingStatusMsg();
        }

        interaction.followUp({ content: reply });
        break;
      }

      case REMOVE_OPTIONS.duplicate: {
        mPlayer.queue = await removeDuplicate(mPlayer.queue);

        mPlayer.updatePlayingStatusMsg();
        interaction.followUp({
          content: client.replyMsgAuthor(
            interaction.member,
            `${client.user.username} has removed duplicated tracks from the queue`
          ),
        });
        break;
      }
    }
  },
});

async function removeDuplicate(queue: Track[]) {
  return [...new Map(queue.map((track) => [track.id, track])).values()];
} // end of removeDuplicate(...) helper function

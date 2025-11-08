import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  GuildMember,
  MessageActionRowComponentBuilder,
  PermissionFlagsBits,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  StringSelectMenuOptionBuilder,
} from "discord.js";
import { youtubeService } from "../../services/youtube";
import logger from "../../middlewares/logger/logger";
import {
  Command,
  COMMANDS,
  COMMAND_TAGS,
  ExecuteOptions,
} from "../../models/command";
import { ExtendedClient } from "../../models/client";
import { OpusPlayer } from "../../models/opus/player";
import { Track } from "../../models/opus/track";
import { TrackRequester } from "../../models/opus/trackRequester";
import {
  baseEmbed,
  formatDuration,
  generateInteractionComponentId,
  getUserNameMaster,
} from "../../middlewares/utils";

export enum PLAY_OPTIONS {
  // commands
  query = "query",
  insert = "insert",

  // options
  index = "index",
  queue = "queue",
  track_select = "track_select",
}

export default new Command({
  name: COMMANDS.play,
  tag: COMMAND_TAGS.music,
  description:
    "Enqueue/Insert a Youtube track/playlist/search result from the given url or query",
  userPermissions: [PermissionFlagsBits.SendMessages],

  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: PLAY_OPTIONS.queue,
      description:
        "Enqueue a Youtube track/playlist/search result from the given url or query",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: PLAY_OPTIONS.query,
          description: "Please provide an url or query for playback",
          required: true,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: PLAY_OPTIONS.insert,
      description:
        "Insert to a specified position (default to next position) a YT track/playlist/search result",
      options: [
        {
          type: ApplicationCommandOptionType.String,
          name: PLAY_OPTIONS.query,
          description: "Please provide an url or query for playback",
          required: true,
        },
        {
          type: ApplicationCommandOptionType.Number,
          name: PLAY_OPTIONS.index,
          description:
            "Index position to insert into, default 1 aka next position",
          min_value: 1,
          required: false,
        },
      ],
    },
  ],

  execute: async ({ client, interaction, args, mPlayer }) => {
    if (!mPlayer) {
      mPlayer = new OpusPlayer({ client, interaction, args });
    }

    let result: Track[];

    switch (args.getSubcommand()) {
      case PLAY_OPTIONS.queue:
        result = await processQuery(
          { client, interaction, args },
          mPlayer.queue.length
        );

        if (result.length > 0) {
          mPlayer.queue.push(...result);
          await mPlayer.saveToCache();
          mPlayer.updatePlayingStatusMsg();
          mPlayer.playIfIdling(client);
        }
        break;

      case PLAY_OPTIONS.insert: {
        const index: number = await insertIndex(
          args.get(PLAY_OPTIONS.index)?.value as number,
          mPlayer.queue.length
        );

        result = await processQuery({ client, interaction, args }, index);

        if (result.length > 0) {
          mPlayer.queue.splice(index, 0, ...result);
          await mPlayer.saveToCache();
          mPlayer.updatePlayingStatusMsg();
          mPlayer.playIfIdling(client);
        }
        break;
      }
    }
  },
});

async function processQuery(
  { client, interaction, args }: ExecuteOptions,
  index: number
) {
  const { member } = interaction;
  const requester = new TrackRequester(member.id, member.guild.id);
  const query = args.get(PLAY_OPTIONS.query).value as string;
  let result: Track[] = [];

  // Check for playlist FIRST (before single video check)
  // URLs like youtube.com/watch?v=ID&list=PLAYLIST contain both video and playlist
  if (youtubeService.validatePlaylistURL(query)) {
    await youtubeService
      .getPlaylistInfo(query, 1000)
      .then(async (playlistInfo) => {
        let playListDuration = 0;

        playlistInfo.videos.forEach((video) => {
          const trackDuration = video.duration * 1000; // Convert to milliseconds
          result.push(
            new Track(
              video.id,
              video.url,
              video.title,
              trackDuration,
              requester
            )
          );
          playListDuration += trackDuration;
        });

        const playlistTitle = playlistInfo.title.length > 200 
          ? playlistInfo.title.substring(0, 197) + "..." 
          : playlistInfo.title;

        const embed = baseEmbed()
          .setTitle(`Playlist`)
          .setDescription(`[${playlistTitle}](${playlistInfo.url})`)
          .addFields(
            {
              name: "Requested By",
              value: `${getUserNameMaster(member)}`,
              inline: true,
            },
            {
              name: "Length",
              value: `${formatDuration(playListDuration)}`,
              inline: true,
            },
            { name: "Size", value: `${result.length}`, inline: true }
          );

        if (playlistInfo.videos[0]?.thumbnail) {
          embed.setImage(playlistInfo.videos[0].thumbnail);
        }

        await interaction.followUp({
          content: statusReply(client, member, index),
          embeds: [embed],
        }).catch((error) => {
          logger.error(`Failed to send playlist embed: ${error}`);
        });
      })
      .catch((err) => {
        logger.error(`Failed to get playlist info: ${err}`);
        interaction.followUp({ content: `Error loading playlist: ${err.message || err}` }).catch(() => {});
      });
  }
  // if the query is a youtube video link
  else if (youtubeService.validateURL(query)) {
    await youtubeService
      .getBasicInfo(query)
      .then(async (videoInfo) => {
        const track = new Track(
          videoInfo.id,
          videoInfo.url,
          videoInfo.title,
          videoInfo.duration * 1000, // Convert seconds to milliseconds
          requester
        );
        result.push(track);

        await interaction.followUp({
          content: statusReply(client, member, index),
          embeds: [await track.createEmbedThumbnail()],
        }).catch((error) => {
          logger.error(`Failed to send video embed: ${error}`);
        });
      })
      .catch((err) => {
        logger.error(`Failed to get video info: ${err}`);
        interaction.followUp({ content: `Error loading video: ${err.message || err}` }).catch(() => {});
      });
  }
  // else try searching youtube with the given query
  else {
    await youtubeService
      .search(query, 7)
      .then(async (videos) => {
        if (videos.length === 0) {
          interaction.followUp({
            content: client.replyMsgErrorAuthor(
              member,
              `${client.user.username} couldn't find any tracks with the given keywords`
            ),
          });
          return;
        }

        // embed the result(s)
        let i = 0;
        let tracksInfo = "";
        let menuOptBuilder: StringSelectMenuOptionBuilder[] = [
          new StringSelectMenuOptionBuilder({
            label: "Dismiss",
            description: "Dismiss the current results",
            value: "0",
          }),
        ];

        videos.forEach((video) => {
          const durationStr = video.duration > 0 
            ? formatDuration(video.duration * 1000) 
            : "Live";
          tracksInfo += `${++i}) [${video.title}](${video.url}) | length \`${durationStr}\` \n\n`;
          menuOptBuilder.push(
            new StringSelectMenuOptionBuilder({
              label: `Track ${i}`,
              description: video.title.length > 100 ? video.title.substring(0, 97) + "..." : video.title,
              value: `${video.url}`,
            })
          );
        });

        const embed = baseEmbed()
          .setTitle(`Search results ヽ (o´∀\`) ﾉ ♪ ♬`)
          .setDescription(tracksInfo)
          .setImage(
            "https://c.tenor.com/pnXpZl3VRiwAAAAC/minato-aqua-akutan.gif"
          );

        const actionRow =
          new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(
                generateInteractionComponentId(
                  requester.id,
                  PLAY_OPTIONS.track_select,
                  index
                )
              )
              .setPlaceholder(
                `${getUserNameMaster(member)}, please select an option`
              )
              .addOptions(menuOptBuilder)
          );

        handleSelectTrackInteraction =
          args.getSubcommand() == PLAY_OPTIONS.insert
            ? selectTrackInsert
            : selectTrackPush;

        interaction.followUp({
          content: `**${getUserNameMaster(member)}**`,
          embeds: [embed],
          components: [actionRow],
        });
      })
      .catch((err) => {
        interaction.followUp({ content: `${err}` });
      });
  } // end of else the given is keyword

  return result;
}

async function createTrack(url: string, author: TrackRequester) {
  const videoInfo = await youtubeService.getBasicInfo(url);
  return new Track(
    videoInfo.id,
    videoInfo.url,
    videoInfo.title,
    videoInfo.duration * 1000, // Convert seconds to milliseconds
    author
  );
}

interface IHandlingSelectTrackInteractionDelegate {
  (
    client: ExtendedClient,
    mPlayer: OpusPlayer,
    member: GuildMember,
    requester: TrackRequester,
    interaction: StringSelectMenuInteraction,
    index: number
  ): void;
}

export let handleSelectTrackInteraction: IHandlingSelectTrackInteractionDelegate;

async function selectTrackPush(
  client: ExtendedClient,
  mPlayer: OpusPlayer,
  member: GuildMember,
  requester: TrackRequester,
  interaction: StringSelectMenuInteraction,
  index: number
) {
  const track = await createTrack(interaction.values[0], requester);

  mPlayer.queue.push(track);
  interaction.editReply({
    content: statusReply(client, member, index),
    embeds: [await track.createEmbedThumbnail()],
    components: [],
  });

  mPlayer.updatePlayingStatusMsg();
  mPlayer.playIfIdling(client);
}

async function selectTrackInsert(
  client: ExtendedClient,
  mPlayer: OpusPlayer,
  member: GuildMember,
  requester: TrackRequester,
  interaction: StringSelectMenuInteraction,
  index: number
) {
  const track = await createTrack(interaction.values[0], requester);
  index = await insertIndex(index, mPlayer.queue.length);

  mPlayer.queue.splice(index, 0, track);
  interaction.editReply({
    content: statusReply(client, member, index),
    embeds: [await track.createEmbedThumbnail()],
    components: [],
  });

  mPlayer.updatePlayingStatusMsg();
  mPlayer.playIfIdling(client);
}

function statusReply(
  client: ExtendedClient,
  requester: GuildMember,
  index: number
) {
  return client.replyMsgAuthor(
    requester,
    `${client.user.username} has inserted to position \`${index + 1}\``
  );
}

async function insertIndex(queueLength: number = 1, args: number) {
  let index: number = args;

  if (index + 1 > queueLength) {
    index = queueLength;
  }

  return index;
}

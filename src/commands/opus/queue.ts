import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageActionRowComponentBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { ExtendedClient } from "../../models/client";
import { Command, COMMANDS, COMMAND_TAGS } from "../../models/command";
import { Track } from "../../models/opus/track";
import {
  baseEmbed,
  formatDuration,
  generateInteractionComponentId,
} from "../../middlewares/utils";
import logger from "../../middlewares/logger/logger";

export enum BUTTON_QUEUE_EMBED {
  start = "queueEmbed_start",
  back = "queueEmbed_back",
  next = "queueEmbed_next",
  end = "queueEmbed_end",
  done = "queueEmbed_done",
}

export const QUEUE_EMBED_PAGE_STEP = 10;

export default new Command({
  name: COMMANDS.queue,
  tag: COMMAND_TAGS.music,
  description: "Display the current queue",
  userPermissions: [PermissionFlagsBits.SendMessages],

  execute: async ({ client, interaction, args, mPlayer }) => {
    if (mPlayer.queue.length > 0) {
      let currPage = 0;
      mPlayer.currQueuePage.set(interaction.user.id, currPage);

      const queueEmbed = await generateQueueEmbed(
        currPage,
        mPlayer.queue,
        client
      );

      const actionRow =
        new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents([
          new ButtonBuilder()
            .setCustomId(
              generateInteractionComponentId(
                interaction.user.id,
                BUTTON_QUEUE_EMBED.start
              )
            )
            .setLabel("<<")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(
              generateInteractionComponentId(
                interaction.user.id,
                BUTTON_QUEUE_EMBED.back
              )
            )
            .setLabel("<")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(
              generateInteractionComponentId(
                interaction.user.id,
                BUTTON_QUEUE_EMBED.next
              )
            )
            .setLabel(">")
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId(
              generateInteractionComponentId(
                interaction.user.id,
                BUTTON_QUEUE_EMBED.end
              )
            )
            .setLabel(">>")
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId(
              generateInteractionComponentId(
                interaction.user.id,
                BUTTON_QUEUE_EMBED.done
              )
            )
            .setLabel("Done")
            .setStyle(ButtonStyle.Danger),
        ]);

      await interaction.followUp({
        embeds: [queueEmbed],
        components: [actionRow],
      });
    } else {
      await interaction.followUp({
        content: client.replyMsgAuthor(
          interaction.member,
          `the queue is empty`
        ),
      });
    }
  },
});

/* This function is for generating an embed with the queue information */
export async function generateQueueEmbed(
  i: number,
  queue: Track[],
  client: ExtendedClient
) {
  try {
    let info: String;
    let start = QUEUE_EMBED_PAGE_STEP * i + 1;
    let end = start + QUEUE_EMBED_PAGE_STEP;
    end = end > queue.length ? queue.length : end;

    const next = queue.slice(start, end);
    // checks if there's anything next in queue
    if (next.length !== 0) {
      let j = start;

      const nextTracksPromise = next.map(async (track) => {
        const requester = await track.getRequester();
        return `${j++}) [${track.title}](${track.url}) | \`${formatDuration(
          track.duration
        )}\` | requested by ${requester}`;
      });

      const nextTracks = await Promise.all(nextTracksPromise);
      info = nextTracks.join("\n\n");
    } else {
      info = "Currently no track is next in queueヾ (= `ω´ =) ノ”";
    }

    // construct the embed(s)
    if (i == 0 || !info.startsWith("Currently")) {
      const embed = baseEmbed()
        .setTitle(
          `Page ${i + 1}/${Math.ceil(
            (queue.length - 1) / QUEUE_EMBED_PAGE_STEP
          )}`
        )
        .setDescription(
          `⚓ Currently playing ▶️\n [${queue[0].title}](${
            queue[0].url
          }) | \`${formatDuration(
            queue[0].duration
          )}\` | requested by ${await queue[0].getRequester()}\n\n⚓ Next in queue ⏭️\n${info}`
        );
      return embed;
    }
  } catch (err) {
    logger.error(err);
  }
}

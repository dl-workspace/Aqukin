import {
  ActionRowBuilder,
  ApplicationCommandOptionType,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  GuildMember,
  MessageActionRowComponentBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import {
  baseEmbed,
  generateInteractionComponentId,
} from "../../structures/Utils";
import { ExtendedInteraction } from "../../typings/command";
import { OpusPlayer } from "../../structures/opus/Player";
import { getUserName } from "../../structures/Utils";

export enum LOOP_OPTIONS {
  // commands
  track = "track",
  queue = "queue",

  // options
  times = "times",

  // buttons
  loop_no = "loop_no",
  disableLoopQueue_yes = "disableLoopQueue_yes",
  disableLoopTrack_yes = "disableLoopTrack_yes",
}

export default new Command({
  name: COMMANDS.loop,
  tag: COMMAND_TAGS.music,
  description: "Toggle looping the current track/queue",
  userPermissions: [PermissionFlagsBits.SendMessages],

  options: [
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: LOOP_OPTIONS.track,
      description: "Toggle looping the current track",
      options: [
        {
          type: ApplicationCommandOptionType.Number,
          name: LOOP_OPTIONS.times,
          description: "Number of times to loop, default loop until turned off",
          min_value: 1,
          required: false,
        },
      ],
    },
    {
      type: ApplicationCommandOptionType.Subcommand,
      name: LOOP_OPTIONS.queue,
      description: "Toggle looping the current queue",
      options: [
        {
          type: ApplicationCommandOptionType.Number,
          name: LOOP_OPTIONS.times,
          description: "Number of times to loop, default loop until turned off",
          min_value: 1,
          required: false,
        },
      ],
    },
  ],

  execute: async ({ client, interaction, args, mPlayer }) => {
    let reply = `**${getUserName(interaction.member)}**-sama, `;
    const times = (args.get(LOOP_OPTIONS.times)?.value as number) || -1;

    switch (args.getSubcommand()) {
      case LOOP_OPTIONS.track:
        if (mPlayer.isLoopingQueue()) {
          const embed = baseEmbed().setTitle(`Stop looping the current queue?`);

          const actionRow =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
              [
                new ButtonBuilder()
                  .setCustomId(
                    generateInteractionComponentId(
                      interaction.user.id,
                      LOOP_OPTIONS.disableLoopQueue_yes,
                      times
                    )
                  )
                  .setLabel("Yes")
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId(
                    generateInteractionComponentId(
                      interaction.user.id,
                      LOOP_OPTIONS.loop_no
                    )
                  )
                  .setLabel("No")
                  .setStyle(ButtonStyle.Danger),
              ]
            );

          await interaction.followUp({
            content: `${reply} \`to loop the current track\`, ${client.user.username} would need your permission on \`stop looping the current queue\``,
            embeds: [embed],
            components: [actionRow],
          });
        } else {
          if (times == -1) {
            if (mPlayer.isLoopingTrack()) {
              stopLoopTrack(client, mPlayer, interaction);
            } else {
              loopTrack(client, mPlayer, interaction, times);
            }
          } else {
            loopTrack(client, mPlayer, interaction, times);
          }
        }
        break;

      case LOOP_OPTIONS.queue:
        if (mPlayer.isLoopingTrack()) {
          const embed = baseEmbed().setTitle(`Stop looping the current track?`);

          const actionRow =
            new ActionRowBuilder<MessageActionRowComponentBuilder>().addComponents(
              [
                new ButtonBuilder()
                  .setCustomId(
                    generateInteractionComponentId(
                      interaction.user.id,
                      LOOP_OPTIONS.disableLoopTrack_yes,
                      times
                    )
                  )
                  .setLabel("Yes")
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId(
                    generateInteractionComponentId(
                      interaction.user.id,
                      LOOP_OPTIONS.loop_no
                    )
                  )
                  .setLabel("No")
                  .setStyle(ButtonStyle.Danger),
              ]
            );

          await interaction.followUp({
            content: `${reply} \`to loop the current queue\`, ${client.user.username} would need your permission on \`stop looping the current track\``,
            embeds: [embed],
            components: [actionRow],
          });
        } else {
          if (times == -1) {
            if (mPlayer.isLoopingQueue()) {
              stopLoopQueue(client, mPlayer, interaction);
            } else {
              loopQueue(client, mPlayer, interaction, times);
            }
          } else {
            loopQueue(client, mPlayer, interaction, times);
          }
        }
        break;
    }
  },
});

export async function stopLoopTrack(
  client: ExtendedClient,
  mPlayer: OpusPlayer,
  interaction: ButtonInteraction | ExtendedInteraction
) {
  mPlayer.disableTrackRepeat();
  mPlayer.updatePlayingStatusMsg();
  await interaction.editReply({
    content: client.replyMsgAuthor(
      interaction.member as GuildMember,
      `${client.user.username} will now \`stop looping\` the current \`track\``
    ),
    embeds: [],
    components: [],
  });
}

export async function loopTrack(
  client: ExtendedClient,
  mPlayer: OpusPlayer,
  interaction: ButtonInteraction | ExtendedInteraction,
  times: number
) {
  mPlayer.enableTrackRepeat(times);
  mPlayer.updatePlayingStatusMsg();
  await interaction.editReply({
    content: client.replyMsgAuthor(
      interaction.member as GuildMember,
      `${client.user.username} will now \`loop\` the current \`track\` ${
        times == -1 ? "`indefinitely`" : `\`${times} time(s)\``
      }`
    ),
    embeds: [],
    components: [],
  });
}

export async function stopLoopQueue(
  client: ExtendedClient,
  mPlayer: OpusPlayer,
  interaction: ButtonInteraction | ExtendedInteraction
) {
  mPlayer.disableQueueRepeat();
  mPlayer.updatePlayingStatusMsg();
  await interaction.editReply({
    content: client.replyMsgAuthor(
      interaction.member as GuildMember,
      `${client.user.username} will now \`stop looping\` the current \`queue\``
    ),
    embeds: [],
    components: [],
  });
}

export async function loopQueue(
  client: ExtendedClient,
  mPlayer: OpusPlayer,
  interaction: ButtonInteraction | ExtendedInteraction,
  times: number
) {
  mPlayer.enableQueueRepeat(times);
  mPlayer.updatePlayingStatusMsg();
  await interaction.editReply({
    content: client.replyMsgAuthor(
      interaction.member as GuildMember,
      `${client.user.username} will now \`loop\` the current \`queue\` ${
        times == -1 ? "`indefinitely`" : `\`${times} time(s)\``
      }`
    ),
    embeds: [],
    components: [],
  });
}

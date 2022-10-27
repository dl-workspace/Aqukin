import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonInteraction, ButtonStyle, GuildMember, MessageActionRowComponentBuilder, PermissionFlagsBits } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import { baseEmbed, generateInteractionComponentId } from "../../structures/Utils";
import { ExtendedInteraction } from "../../typings/command";
import { OpusPlayer } from "../../structures/opus/Player";

export enum LOOP_OPTIONS{
    track = 'track',
    queue = 'queue',
    loop_no = 'loop_no',
    disableLoopQueue_yes = 'disableLoopQueue_yes',
    disableLoopTrack_yes = 'disableLoopTrack_yes',
}

export default new Command({
    name: COMMANDS.loop,
    tag: COMMAND_TAGS.music,
    description: 'Toggle looping the current track/queue',
    userPermissions: [PermissionFlagsBits.SendMessages],

    options: [
    {
        type: ApplicationCommandOptionType.Subcommand,
        name: LOOP_OPTIONS.track,
        description: 'Toggle looping the current track',
    },
    {
        type: ApplicationCommandOptionType.Subcommand,
        name: LOOP_OPTIONS.queue,
        description: 'Toggle looping the current queue',
    },
    ],
    
    execute: async({ client, interaction, args, mPlayer }) => {
        let reply = `**${interaction.member.nickname || interaction.user.username}**-sama, `;

        switch(args.getSubcommand()){
            case LOOP_OPTIONS.track:
                if(mPlayer.queueRepeat){
                    const embed = baseEmbed()
                    .setTitle(`Stop looping the current queue?`)
        
                    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                        .addComponents([
                            new ButtonBuilder()
                                .setCustomId(generateInteractionComponentId(LOOP_OPTIONS.disableLoopQueue_yes, interaction.user.id))
                                .setLabel('Yes')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(generateInteractionComponentId(LOOP_OPTIONS.loop_no, interaction.user.id))
                                .setLabel('No')
                                .setStyle(ButtonStyle.Danger),
                        ]);
        
                    await interaction.followUp({ content: `${reply} \`to loop the current track\`, ${client.user.username} would need your permission on \`stop looping the current queue\``, embeds: [embed], components: [actionRow] });
                }
                else
                {
                    if(mPlayer.trackRepeat){
                        stopLoopTrack(client, mPlayer, interaction);
                    }
                    else{
                        loopTrack(client, mPlayer, interaction);
                    }
                }
                break;

            case LOOP_OPTIONS.queue:
                if(mPlayer.trackRepeat){
                    const embed = baseEmbed()
                    .setTitle(`Stop looping the current track?`)
        
                    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                        .addComponents([
                            new ButtonBuilder()
                                .setCustomId(generateInteractionComponentId(LOOP_OPTIONS.disableLoopTrack_yes, interaction.user.id))
                                .setLabel('Yes')
                                .setStyle(ButtonStyle.Success),
                            new ButtonBuilder()
                                .setCustomId(generateInteractionComponentId(LOOP_OPTIONS.loop_no, interaction.user.id))
                                .setLabel('No')
                                .setStyle(ButtonStyle.Danger),
                        ]);
        
                    await interaction.followUp({ content: `${reply} \`to loop the current queue\`, ${client.user.username} would need your permission on \`stop looping the current track\``, embeds: [embed], components: [actionRow] });
                }
                else
                {
                    if(mPlayer.queueRepeat){
                        stopLoopQueue(client, mPlayer, interaction);
                    }
                    else{
                        loopQueue(client, mPlayer, interaction);
                    }
                }
                break;
        }
    }
});

export async function stopLoopTrack(client: ExtendedClient, mPlayer: OpusPlayer, interaction: ButtonInteraction | ExtendedInteraction){
    mPlayer.disableTrackRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.editReply({ content: client.replyMsgAuthor((interaction.member as GuildMember), `${client.user.username} will now \`stop looping\` the current \`track\``), embeds: [], components: [] });
}

export async function loopTrack(client: ExtendedClient, mPlayer: OpusPlayer, interaction: ButtonInteraction | ExtendedInteraction){
    mPlayer.enableTrackRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.editReply({ content: client.replyMsgAuthor((interaction.member as GuildMember), `${client.user.username} will now \`loop\` the current \`track\``), embeds: [], components: [] });
}

export async function stopLoopQueue(client: ExtendedClient, mPlayer: OpusPlayer, interaction: ButtonInteraction | ExtendedInteraction){
    mPlayer.disableQueueRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.editReply({ content:  client.replyMsgAuthor((interaction.member as GuildMember), `${client.user.username} will now \`stop looping\` the current \`queue\``), embeds: [], components: [] });
}

export async function loopQueue(client: ExtendedClient, mPlayer: OpusPlayer, interaction: ButtonInteraction | ExtendedInteraction){
    mPlayer.enableQueueRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.editReply({ content: client.replyMsgAuthor((interaction.member as GuildMember), `${client.user.username} will now \`loop\` the current \`queue\``), embeds: [], components: [] });
}
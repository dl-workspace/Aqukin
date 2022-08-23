import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, MessageActionRowComponentBuilder, PermissionFlagsBits } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { BaseEmbed, generateInteractionComponentId } from "../../structures/Utils";
import { ExtendedInteraction } from "../../typings/command";

export enum BUTTON_DISABLE_LOOP_QUEUE{
    yes = 'yes_disableLoopQueue',
    no = 'no_disableLoopQueue'
}

export default new Command({
    name: 'loop_track',
    tag: COMMAND_TAGS.music,
    description: 'Toggle looping the currently playing track',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        let reply = `**${interaction.user.username}**-sama, `;
        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer.queueRepeat){
            const embed = BaseEmbed()
            .setTitle(`Stop looping the current queue?`)

            const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents([
                    new ButtonBuilder()
                        .setCustomId(generateInteractionComponentId(BUTTON_DISABLE_LOOP_QUEUE.yes, interaction.user.id))
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(generateInteractionComponentId(BUTTON_DISABLE_LOOP_QUEUE.no, interaction.user.id))
                        .setLabel('No')
                        .setStyle(ButtonStyle.Danger),
                ]);

            await interaction.followUp({ content: `${reply} \`to loop the current track\`, ${client.user.username} would need your permission on \`stop looping the current queue\``, embeds: [embed], components: [actionRow] });
        }
        else
        {
            if(mPlayer.trackRepeat){
                stopLoopTrack(client, interaction);
            }
            else{
                loopTrack(client, interaction);
            }
        }
    }
});

export async function stopLoopTrack(client: ExtendedClient, interaction: ButtonInteraction | ExtendedInteraction){
    const mPlayer = client.music.get(interaction.guildId);
    mPlayer.disableTrackRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} will now \`stop looping\` the current \`track\`` });
}

export async function loopTrack(client: ExtendedClient, interaction: ButtonInteraction | ExtendedInteraction){
    const mPlayer = client.music.get(interaction.guildId);
    mPlayer.enableTrackRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} will now \`loop\` the current \`track\`` });
}
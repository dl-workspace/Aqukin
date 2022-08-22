import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, MessageActionRowComponentBuilder, PermissionFlagsBits } from "discord.js";
import { ExtendedClient } from "../../structures/Client";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { BaseEmbed } from "../../structures/Utils";
import { ExtendedInteraction } from "../../typings/command";

export enum BUTTON_DISABLE_LOOP_TRACK{
    yes = 'yes_disableLoopTrack',
    no = 'no_disableLoopTrack'
}

export default new Command({
    name: 'loop_queue',
    tag: COMMAND_TAGS.music,
    description: 'Toggle looping the current queue',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        let reply = `**${interaction.user.username}**-sama, `;
        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer.trackRepeat){
            const embed = BaseEmbed()
            .setTitle(`Stop looping the current track?`)

            const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
                .addComponents([
                    new ButtonBuilder()
                        .setCustomId(BUTTON_DISABLE_LOOP_TRACK.yes)
                        .setLabel('Yes')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId(BUTTON_DISABLE_LOOP_TRACK.no)
                        .setLabel('No')
                        .setStyle(ButtonStyle.Danger),
                ]);

            await interaction.followUp({ content: `${reply} \`to loop the current queue\`, ${client.user.username} would need your permission on \`stop looping the current track\``, embeds: [embed], components: [actionRow] });
        }
        else
        {
            if(mPlayer.queueRepeat){
                stopLoopQueue(client, interaction);
            }
            else{
                loopQueue(client, interaction);
            }
        }
    }
});

export async function stopLoopQueue(client: ExtendedClient, interaction: ButtonInteraction | ExtendedInteraction){
    const mPlayer = client.music.get(interaction.guildId);
    mPlayer.disableQueueRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} will now \`stop looping\` the current \`queue\`` });
}

export async function loopQueue(client: ExtendedClient, interaction: ButtonInteraction | ExtendedInteraction){
    const mPlayer = client.music.get(interaction.guildId);
    mPlayer.enableQueueRepeat();
    mPlayer.updatePlayingStatusMsg();
    await interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} will now \`loop\` the current \`queue\`` });
}
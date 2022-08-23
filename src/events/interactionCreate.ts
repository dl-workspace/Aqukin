import { CommandInteractionOptionResolver, GuildMember, Interaction, PermissionFlagsBits } from "discord.js";
import { client } from "..";
import { getVoiceConnection } from "@discordjs/voice";
import { COMMAND_TAGS } from "../structures/Command";
import { Event } from "../structures/Events";
import { ExtendedInteraction } from "../typings/command";
import { handleSelectTrackInteraction, PLAY_OPTIONS } from "../commands/opus/play";
import { ExtendedClient } from "../structures/Client";
import { LOOP_OPTIONS, loopTrack, loopQueue } from "../commands/opus/loop";
import { BUTTON_QUEUE_EMBED, generateQueueEmbed, QUEUE_EMBED_PAGE_STEP } from "../commands/opus/queue";

export default new Event('interactionCreate', async (interaction) => {
    if(interaction.isChatInputCommand()){
        const command = client.commands.get(interaction.commandName);
        if(!command) { return; }

        // if(COMMAND_TAGS.owner && isAppOwner(interaction)) { return; }

        // user permission check
        if(!interaction.memberPermissions.has(command.userPermissions) && !isAppOwner(interaction)){
            return interaction.reply({ content: `**${interaction.user.username}**-sama, sees that you don't have the permission to process this command`, ephemeral: true });
        }

        // command type check
        switch(command.tag){
            case COMMAND_TAGS.music:
                const mPlayer = client.music.get(interaction.guildId);
                const { channel } = (interaction.member as GuildMember).voice;

                if(!channel){
                    return interaction.reply({ content: `I'm sorry **${interaction.user.username}**-sama, but you need to be in a voice channel to use this command`, ephemeral: true });
                }

                if(mPlayer){
                    if(mPlayer.subscription.connection.joinConfig.channelId !== channel.id){
                        return interaction.reply({ content: `I'm sorry **${interaction.user.username}**-sama, but you need to be in the same voice channel with ${client.user.username} to use this command`, ephemeral: true });
                    }
                    else if(command.name != "play"){
                        if(channel.members.size > 2){
                            if(!interaction.memberPermissions.has(PermissionFlagsBits.Administrator) && mPlayer.queue[0]?.requester.id != interaction.user.id){
                                return interaction.reply({ content: `I'm sorry **${interaction.user.username}**-sama, but you can only use this command on your own requested track`, ephemeral: true });
                            }
                        }
                    }
                }
                else if(command.name != "play"){
                    return interaction.reply({content: `I'm sorry **${interaction.user.username}**-sama, but ${client.user.username} is not currently streaming any audio`, ephemeral: true });
                }
                break;
        }

        try{
            await interaction.deferReply();

            command.execute({
                client,
                interaction: interaction as ExtendedInteraction,
                args: interaction.options as CommandInteractionOptionResolver,
            });    
        }
        catch(err){
            console.log(err);
            interaction.reply({content: `I'm sorry **${interaction.user.username}**-sama, ${client.user.username} has encounted an error\n${err}` });
        }
    }

    else if(interaction.isSelectMenu()){
        // check for userId
        if (!interaction.customId.endsWith(interaction.user.id)) {
            return interaction.reply({content: `I'm sorry **${interaction.user.username}**-sama, but this select menu is not for you (⁎˃ᆺ˂)`, ephemeral: true });
        }
        
        await interaction.deferReply();

        switch(true){
            case interaction.customId.startsWith(PLAY_OPTIONS.track_select):
                handleSelectTrackInteraction(client as ExtendedClient, interaction);
                break;
        }
    }

    else if(interaction.isButton()){
        // check for userId
        if (!interaction.customId.endsWith(interaction.user.id)) {
            return interaction.reply({content: `I'm sorry **${interaction.user.username}**-sama, but this button is not for you (⁎˃ᆺ˂)`, ephemeral: true });
        }

        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer){
            switch(true){
                case interaction.customId.startsWith(LOOP_OPTIONS.disableLoopQueue_yes):
                    await interaction.deferReply();
                    interaction.message.delete();
                    loopTrack(client, interaction);
                    break;
    
                case interaction.customId.startsWith(LOOP_OPTIONS.disableLoopTrack_yes):
                    await interaction.deferReply();
                    interaction.message.delete();
                    loopQueue(client, interaction);
                    break;
    
                case interaction.customId.startsWith(LOOP_OPTIONS.loop_no):
                    await interaction.deferUpdate();
                    interaction.message.delete();
                    break;
    
                case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.start):{
                    await interaction.deferUpdate();

                    let currPage = mPlayer.currQueuePage.get(interaction.user.id);

                    if(currPage > 0){
                        mPlayer.currQueuePage.set(interaction.user.id, 0);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(mPlayer.currQueuePage.get(interaction.user.id), mPlayer.queue, client)] });    
                    }

                    break;
                }
    
                case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.next):{
                    await interaction.deferUpdate();

                    let currPage = mPlayer.currQueuePage.get(interaction.user.id);
                    const ceil = Math.ceil(mPlayer.queue.length/QUEUE_EMBED_PAGE_STEP)-1;

                    if(currPage < ceil) { 
                        currPage++; 
                        mPlayer.currQueuePage.set(interaction.user.id, currPage);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(currPage, mPlayer.queue, client)] });
                    }

                    break;
                }

                case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.back):{
                    await interaction.deferUpdate();

                    let currPage = mPlayer.currQueuePage.get(interaction.user.id);

                    if(currPage > 0) { 
                        currPage--; 
                        mPlayer.currQueuePage.set(interaction.user.id, currPage);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(currPage, mPlayer.queue, client)] });
                    }

                    break;
                }

                case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.end):{
                    await interaction.deferUpdate();

                    let currPage = mPlayer.currQueuePage.get(interaction.user.id);
                    const ceil = Math.ceil(mPlayer.queue.length/QUEUE_EMBED_PAGE_STEP)-1;

                    if(currPage < ceil){
                        mPlayer.currQueuePage.set(interaction.user.id, ceil);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(ceil, mPlayer.queue, client)] });
                    }

                    break;
                }

                case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.done):
                    await interaction.deferUpdate();
                    interaction.message.delete();
                    mPlayer.currQueuePage.delete(interaction.user.id);
                    break;
            }
        }
    }
});

function isAppOwner(interaction: Interaction) : boolean {
    return interaction.user.id == interaction.client.application.owner.id
}
import { CommandInteractionOptionResolver, GuildMember, Interaction } from "discord.js";
import { client } from "..";
import { getVoiceConnection } from "@discordjs/voice";
import { COMMAND_TAGS } from "../structures/Command";
import { Event } from "../structures/Events";
import { ExtendedInteraction } from "../typings/command";
import { handleSelectTrackInteraction, PLAY_OPTIONS } from "../commands/opus/play";
import { ExtendedClient } from "../structures/Client";
import { BUTTON_DISABLE_LOOP_QUEUE, loopTrack, stopLoopTrack } from "../commands/opus/loop_track";
import { BUTTON_DISABLE_LOOP_TRACK, loopQueue, stopLoopQueue } from "../commands/opus/loop_queue";
import { BUTTON_QUEUE_EMBED, generateQueueEmbed, QUEUE_EMBED_PAGE_STEP } from "../commands/opus/queue";
import { errorReplyTemplate } from "../structures/Utils";

export default new Event('interactionCreate', async (interaction) => {
    if(interaction.isChatInputCommand()){
        const command = client.commands.get(interaction.commandName);
        if(!command) { return; }

        // if(COMMAND_TAGS.owner && isAppOwner(interaction)) { return; }

        // user permission check
        if(!interaction.memberPermissions.has(command.userPermissions) && !isAppOwner(interaction)){
            return interaction.editReply(errorReplyTemplate(interaction.user, `sees that you don't have the permission to execute this command`, { ephemeral: true }));
        }

        // command type check
        switch(command.tag){
            case COMMAND_TAGS.music:
                const connection = getVoiceConnection(interaction.guildId);
                const { channel } = (interaction.member as GuildMember).voice;

                if(!channel){
                    return interaction.reply(errorReplyTemplate(interaction.user, `need you to be in a voice channel to execute this command`, {}));
                }

                if(connection){
                    if(connection.joinConfig.channelId !== channel.id){
                        return interaction.reply(errorReplyTemplate(interaction.user, `need you to be in the \`same\` voice channel to execute this command`, {}));
                    }
                }
                else if(command.name != "play"){
                    return interaction.reply(errorReplyTemplate(interaction.user, `is not currently streaming any audio`, {}));
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
            interaction.editReply(errorReplyTemplate(interaction.user, `has encounted an error\n${err}`, {}));
        }
    }

    else if(interaction.isSelectMenu()){
        // check for userId
        if (!interaction.customId.endsWith(interaction.user.id)) {
            return interaction.reply(errorReplyTemplate(interaction.user, `but this selection menu is not for you (⁎˃ᆺ˂)`, { ephemeral: true }));
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
            return interaction.reply(errorReplyTemplate(interaction.user, `but this button is not for you (⁎˃ᆺ˂)`, { ephemeral: true }));
        }

        const mPlayer = client.music.get(interaction.guildId);

        if(mPlayer){
            switch(true){
                case interaction.customId.startsWith(BUTTON_DISABLE_LOOP_QUEUE.yes):
                    await interaction.deferReply();
                    interaction.message.delete();
                    loopTrack(client, interaction);
                    break;
    
                case interaction.customId.startsWith(BUTTON_DISABLE_LOOP_TRACK.yes):
                    await interaction.deferReply();
                    interaction.message.delete();
                    loopQueue(client, interaction);
                    break;
    
                case interaction.customId.startsWith(BUTTON_DISABLE_LOOP_QUEUE.no) 
                  || interaction.customId.startsWith(BUTTON_DISABLE_LOOP_TRACK.no):
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
import { CommandInteractionOptionResolver, GuildMember, PermissionFlagsBits } from "discord.js";
import { client } from "..";
import { COMMANDS, COMMAND_TAGS } from "../structures/Command";
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

        const member = interaction.member as GuildMember

        // if(COMMAND_TAGS.owner && interaction.user.id !== process.env.OWNER_ID) { return; }

        // user permission check
        if(!interaction.memberPermissions.has(command.userPermissions)){
            // app owner check
            if(member.id !== process.env.OWNER_ID){
                return interaction.reply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} sees that you don't have the permission to use this command`), ephemeral : true });
            }
        }

        // command type check
        switch(command.tag){
            case COMMAND_TAGS.music:
                const mPlayer = client.music.get(interaction.guildId);
                const { channel } = member.voice;

                if(!channel){
                    return interaction.reply({ content: client.replyMsgErrorAuthor(member, `you need to be in a voice channel to use this command`), ephemeral : true });
                }

                if(mPlayer){
                    console.log(mPlayer.subscription.connection);

                    if(mPlayer.subscription.connection.joinConfig.channelId !== channel.id){
                        return interaction.reply({ content: client.replyMsgErrorAuthor(member, `you need to be in the same voice channel with ${client.user.username} to use this command`), ephemeral : true });
                    }
                    else {
                        mPlayer.reconnect();

                        if(command.name != COMMANDS.play && command.name != COMMANDS.connect){
                            if(channel.members.size > 2){
                                if(!interaction.memberPermissions.has(PermissionFlagsBits.Administrator)){
                                    if(command.name === COMMANDS.disconnect || command.name === COMMANDS.remove){
                                        // implement a voting system here
                                        return interaction.reply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} would require others permission to execute this command`), ephemeral : true });
                                    }
                                    else if(mPlayer.queue[0]?.requester.id != member.id){
                                        return interaction.reply({ content: client.replyMsgErrorAuthor(member, `you can only use this command on your own requested track`), ephemeral : true });
                                    }
                                }
                            }
                        }
                    }
                }
                else if(command.name != COMMANDS.play && command.name != COMMANDS.connect){
                    return interaction.reply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} is not currently streaming any audio`), ephemeral : true });
                }
                break;
        }

        try{
            await interaction.deferReply({ ephemeral: command.ephemeral });
            
            await command.execute({
                client,
                interaction: interaction as ExtendedInteraction,
                args: interaction.options as CommandInteractionOptionResolver,
            });
        }
        catch(err){
            console.log(err);
            interaction.editReply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} has encounted an error\n${err}`) }).catch(err => console.log(err));
        }
    }

    else if(interaction.isSelectMenu()){
        const member = interaction.member as GuildMember
        // check for user id
        if (!interaction.customId.endsWith(member.id)){
            return interaction.reply({ content: client.replyMsgErrorAuthor(member, `this select menu is not for you`), ephemeral : true });
        }
        
        await interaction.deferReply();

        switch(true){
            case interaction.customId.startsWith(PLAY_OPTIONS.track_select):
                handleSelectTrackInteraction(client as ExtendedClient, interaction);
                break;
        }
    }

    else if(interaction.isButton()){
        const member = interaction.member as GuildMember
        // check for user id
        if (!interaction.customId.endsWith(member.id)){
            return interaction.reply({ content: client.replyMsgErrorAuthor(member, `this button is not for you`), ephemeral : true });
        }

        const mPlayer = client.music.get(interaction.guildId);

        if(!mPlayer) {
            interaction.message.delete();
            return;
        }

        switch(true){
            case interaction.customId.startsWith(LOOP_OPTIONS.disableLoopQueue_yes):
                await interaction.deferReply();
                await interaction.message.delete();
                loopTrack(client, interaction);
                break;

            case interaction.customId.startsWith(LOOP_OPTIONS.disableLoopTrack_yes):
                await interaction.deferReply();
                await interaction.message.delete();
                loopQueue(client, interaction);
                break;

            case interaction.customId.startsWith(LOOP_OPTIONS.loop_no):
                await interaction.deferUpdate();
                await interaction.message.delete();
                break;

            case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.start):{
                await interaction.deferUpdate();

                let currPage = mPlayer.currQueuePage.get(member.id);

                if(currPage > 0){
                    mPlayer.currQueuePage.set(member.id, 0);
                    interaction.message.edit({ embeds: [await generateQueueEmbed(mPlayer.currQueuePage.get(member.id), mPlayer.queue, client)] });    
                }

                break;
            }

            case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.next):{
                await interaction.deferUpdate();

                let currPage = mPlayer.currQueuePage.get(member.id);
                const ceil = Math.ceil((mPlayer.queue.length-1)/QUEUE_EMBED_PAGE_STEP)-1;

                if(currPage < ceil) { 
                    currPage++; 
                    mPlayer.currQueuePage.set(member.id, currPage);
                    interaction.message.edit({ embeds: [await generateQueueEmbed(currPage, mPlayer.queue, client)] });
                }

                break;
            }

            case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.back):{
                await interaction.deferUpdate();

                let currPage = mPlayer.currQueuePage.get(member.id);

                if(currPage > 0) { 
                    currPage--; 
                    mPlayer.currQueuePage.set(member.id, currPage);
                    interaction.message.edit({ embeds: [await generateQueueEmbed(currPage, mPlayer.queue, client)] });
                }

                break;
            }

            case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.end):{
                await interaction.deferUpdate();

                let currPage = mPlayer.currQueuePage.get(member.id);
                const ceil = Math.ceil((mPlayer.queue.length-1)/QUEUE_EMBED_PAGE_STEP)-1;

                if(currPage < ceil){
                    mPlayer.currQueuePage.set(member.id, ceil);
                    interaction.message.edit({ embeds: [await generateQueueEmbed(ceil, mPlayer.queue, client)] });
                }

                break;
            }

            case interaction.customId.startsWith(BUTTON_QUEUE_EMBED.done):
                await interaction.deferUpdate();
                interaction.message.delete();
                mPlayer.currQueuePage.delete(member.id);
                break;
        }
    }
});
import { CommandInteractionOptionResolver, GuildMember, PermissionFlagsBits } from "discord.js";
import { client } from "..";
import { COMMANDS, COMMAND_TAGS } from "../structures/Command";
import { Event } from "../structures/Events";
import { ExtendedInteraction } from "../typings/command";
import { handleSelectTrackInteraction, PLAY_OPTIONS } from "../commands/opus/play";
import { ExtendedClient } from "../structures/Client";
import { LOOP_OPTIONS, loopTrack, loopQueue } from "../commands/opus/loop";
import { BUTTON_QUEUE_EMBED, generateQueueEmbed, QUEUE_EMBED_PAGE_STEP } from "../commands/opus/queue";
import { VoiceConnectionStatus } from "@discordjs/voice";
import { OpusPlayer } from "../structures/opus/Player";

export default new Event('interactionCreate', async (interaction) => {
    const member = interaction.member as GuildMember
    let mPlayer: OpusPlayer

    if(interaction.isChatInputCommand()){
        const command = client.commands.get(interaction.commandName);
        if(!command) { return; }

        try{
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
                    mPlayer = client.music.get(interaction.guildId);
                    const { channel } = member.voice;

                    if(!channel){
                        return interaction.reply({ content: client.replyMsgErrorAuthor(member, `you need to be in a voice channel to use this command`), ephemeral : true });
                    }

                    if(command.name != COMMANDS.connect){
                        if(mPlayer){
                            if(mPlayer.subscription.connection.state.status === VoiceConnectionStatus.Disconnected){
                                if(command.name == COMMANDS.play && mPlayer.subscription.connection.joinConfig.channelId === channel.id){
                                    await mPlayer.reconnect();
                                }
                                else{
                                    return interaction.reply({ content: client.replyMsgErrorAuthor(member, `but the previous music session are just disconnected recently\nPlease wait a bit or use the \`connect\` command to restore it`) });
                                }
                            }
                            else{
                                if(mPlayer.subscription.connection.joinConfig.channelId !== channel.id){
                                    return interaction.reply({ content: client.replyMsgErrorAuthor(member, `you need to be in the same voice channel with ${client.user.username} to use this command`), ephemeral : true });
                                }
                                else {
                                    if(command.name != COMMANDS.play){
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
                        }
                        else if(command.name != COMMANDS.play){
                            return interaction.reply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} is not currently streaming any audio`), ephemeral : true });
                        }
                    }
                    break;
            }

            await interaction.deferReply({ ephemeral: command.ephemeral });
            
            await command.execute({
                client,
                interaction: interaction as ExtendedInteraction,
                args: interaction.options as CommandInteractionOptionResolver,
                mPlayer
            });
        }
        catch(err){
            console.log(err);
            interaction.editReply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} has encounted an error\n${err}`), embeds:[], components: [] })
        }
    }

    else if(interaction.isSelectMenu()){
        try{
            const interactionData = interaction.customId.split(',');

            // check for user id
            if(interactionData[0].localeCompare(member.id) != 0){
                return interaction.reply({ content: client.replyMsgErrorAuthor(member, `this select menu is not for you`), ephemeral : true });
            }

            await interaction.deferUpdate();

            mPlayer = client.music.get(interaction.guildId);
            if(!mPlayer){
                return interaction.message.edit({ content: `${client.replyMsgAuthor(member, `This music session is already over`)}`, embeds: [], components: [] });
            }

            switch(true){
                case interactionData[1].localeCompare(PLAY_OPTIONS.track_select) == 0:
                    if(interaction.values[0].localeCompare('0') == 0){
                        return await interaction.deleteReply().catch(err => {});
                    }
                    handleSelectTrackInteraction(client as ExtendedClient, mPlayer, member, interaction, Number(interactionData[2]));
                    break;
            }
        }
        catch(err){
            console.log(err);
            interaction.editReply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} has encounted an error\n${err}`), embeds:[], components: [] })
        }
    }

    else if(interaction.isButton()){
        try{
            const interactionData = interaction.customId.split(',');
            
            // check for user id
            if (interactionData[0].localeCompare(member.id) != 0){
                return interaction.reply({ content: client.replyMsgErrorAuthor(member, `this button is not for you`), ephemeral : true });
            }

            mPlayer = client.music.get(interaction.guildId);
            if(!mPlayer) {
                return await interaction.message.delete().catch(err => {});
            }

            await interaction.deferUpdate();

            switch(true){
                case interactionData[1].localeCompare(LOOP_OPTIONS.disableLoopQueue_yes) == 0:
                    loopTrack(client, mPlayer , interaction, Number(interactionData[2]));
                    break;

                case interactionData[1].localeCompare(LOOP_OPTIONS.disableLoopTrack_yes) == 0:
                    loopQueue(client, mPlayer, interaction, Number(interactionData[2]));
                    break;

                case interactionData[1].localeCompare(LOOP_OPTIONS.loop_no) == 0:
                    await interaction.message.delete().catch(err => {});
                    break;

                case interactionData[1].localeCompare(BUTTON_QUEUE_EMBED.start) == 0:{
                    let currPage = mPlayer.currQueuePage.get(member.id);

                    if(currPage > 0){
                        mPlayer.currQueuePage.set(member.id, 0);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(mPlayer.currQueuePage.get(member.id), mPlayer.queue, client)] });    
                    }

                    break;
                }

                case interactionData[1].localeCompare(BUTTON_QUEUE_EMBED.next) == 0:{
                    let currPage = mPlayer.currQueuePage.get(member.id);
                    const ceil = Math.ceil((mPlayer.queue.length-1)/QUEUE_EMBED_PAGE_STEP)-1;

                    if(currPage < ceil) { 
                        currPage++; 
                        mPlayer.currQueuePage.set(member.id, currPage);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(currPage, mPlayer.queue, client)] });
                    }

                    break;
                }

                case interactionData[1].localeCompare(BUTTON_QUEUE_EMBED.back) == 0:{
                    let currPage = mPlayer.currQueuePage.get(member.id);

                    if(currPage > 0) { 
                        currPage--; 
                        mPlayer.currQueuePage.set(member.id, currPage);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(currPage, mPlayer.queue, client)] });
                    }

                    break;
                }

                case interactionData[1].localeCompare(BUTTON_QUEUE_EMBED.end) == 0:{
                    let currPage = mPlayer.currQueuePage.get(member.id);
                    const ceil = Math.ceil((mPlayer.queue.length-1)/QUEUE_EMBED_PAGE_STEP)-1;

                    if(currPage < ceil){
                        mPlayer.currQueuePage.set(member.id, ceil);
                        interaction.message.edit({ embeds: [await generateQueueEmbed(ceil, mPlayer.queue, client)] });
                    }

                    break;
                }

                case interactionData[1].localeCompare(BUTTON_QUEUE_EMBED.done) == 0:
                    await interaction.message.delete().catch(err => {});
                    mPlayer.currQueuePage.delete(member.id);
                    break;
            }
        }
        catch(err){
            console.log(err);
            interaction.editReply({ content: client.replyMsgErrorAuthor(member, `${client.user.username} has encounted an error\n${err}`), embeds:[], components: [] })
        }
    }
});
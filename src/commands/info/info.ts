import { ActionRowBuilder, ApplicationCommandOptionType, ButtonBuilder, ButtonStyle, Guild, GuildMember, MessageActionRowComponentBuilder, PermissionFlagsBits, User } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../structures/Command";
import { baseEmbed } from "../../structures/Utils";
import { ExecuteOptions } from "../../typings/command";

export enum INFO_OPTIONS{
    user = 'user',
    server = 'server',
    mentioned_user = 'mentioned_user',
}

export default new Command({
    name: COMMANDS.info,
    tag: COMMAND_TAGS.info,
    description: 'Get info of a specified user/yourself or the server info',
    userPermissions: [PermissionFlagsBits.SendMessages],

    options: [
    {
        type: ApplicationCommandOptionType.Subcommand,
        name: INFO_OPTIONS.user,
        description: 'Get info of a specified user/yourself',
        options: [{
            type: ApplicationCommandOptionType.User,
            name: INFO_OPTIONS.mentioned_user,
            description: 'the user to get info',
        }]
    },
    {
        type: ApplicationCommandOptionType.Subcommand,
        name: INFO_OPTIONS.server,
        description: 'Get the server info',
    },
    ],
    
    execute: async({ client, interaction, args }) => {
        switch(args.getSubcommand()){
            case INFO_OPTIONS.user:{
                let user = args.get(INFO_OPTIONS.mentioned_user);

                if(user){
                    if(user.user.id === client.user.id){
                        handleBotInfo({ client, interaction, args });
                    }
                    else{
                        interaction.followUp({ embeds: [await createUserInfoEmbed(user.user, user.member as GuildMember)] });
                    }
                }
                else{
                    interaction.followUp({ embeds: [await createUserInfoEmbed(interaction.user, interaction.member)] });
                }
            
                break;
            }

            case INFO_OPTIONS.server:{
                interaction.followUp({ embeds: [await createGuildinfoEmbed(interaction.guild)] });
                break;
            }
        }
    }
});

async function handleBotInfo({client, interaction, args} : ExecuteOptions){
    const embed = baseEmbed()
        .setThumbnail('https://c.tenor.com/3D0ZX5vK_K4AAAAd/minato-aqua-caps.gif')
        .setTitle(`⚓ ${client.user.username} information (⁄ ⁄> ⁄ ▽ ⁄ <⁄ ⁄) ⚓`)
        .addFields({ name: "Nickname", value: "Aku-tan\nBaqua\nOnion\nIQ-3", inline: true },
               { name: "Aliases (`･ω･´)", value: "Go-sai\nDai Tenshi\nSeigi no Mikata\nIdol Combat Master Gamer Maid\nLeader of the Hololive Resistance" },
               { name: "Description", value: `Your (un)reliable Super Idol Gamer Maid♥, a bot that was created based on a Virtual Youtuber known as **Minato Aqua**` },
               { name: "Version", value: `${process.env.npm_package_version}`, inline: true },
               { name: "Date Created", value: client.user.createdAt.toLocaleDateString(), inline: true }, )
        .setImage('https://c.tenor.com/NicUoz75sNwAAAAd/minato-aqua-aqua.gif')

    const actionRow = new ActionRowBuilder<MessageActionRowComponentBuilder>()
        .addComponents([
            new ButtonBuilder()
            .setLabel(`Invite ${client.user.username}`)
            .setURL(process.env.INVITE_LINK)
            .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('Aqua Ch. 湊あくあ')
                .setURL('https://www.youtube.com/channel/UC1opHUrw8rvnsadT-iGp7Cg?view_as=subscriber?sub_confirmation=1')
                .setStyle(ButtonStyle.Link),
            new ButtonBuilder()
                .setLabel('@minatoaqua')
                .setURL('https://twitter.com/minatoaqua')
                .setStyle(ButtonStyle.Link),
        ]);

    interaction.followUp({ embeds: [embed], components: [actionRow] });
}

async function createUserInfoEmbed(user: User, member: GuildMember){
    const memberRoles = member.roles.cache.filter(role => role.name !== "@everyone").map(role => `\`${role.name}\``).join("\n") || `No role`; 

    return baseEmbed()
        .setTitle(`${user.username}-sama information`)
        .setThumbnail(user.displayAvatarURL())
        .addFields({ name: "Tag", value: user.tag, inline: true },
        { name: "Nickname", value: member.nickname || 'None', inline: true },
        { name: "Date Joined", value: member.joinedAt.toLocaleDateString() },
        { name: "Role(s)", value: memberRoles });
}

async function createGuildinfoEmbed(guild: Guild){
    return baseEmbed()
        .setTitle(`${guild.name} information`)
        .setThumbnail(guild.iconURL())
        .setImage(guild.bannerURL())
        .addFields(
        { name: "Members Count", value: guild.memberCount.toLocaleString(), inline: true },
        { name: "Boosting Level", value: guild.premiumTier.toLocaleString(), inline: true }, 
        { name: "Boosting Count", value: guild.premiumSubscriptionCount.toLocaleString(), inline: true },
        { name: "Verification Level", value: guild.verificationLevel.toLocaleString(), inline: true },
        { name: "NSFW Level", value: guild.nsfwLevel.toLocaleString(), inline: true },
        { name: "Primary Lanague", value: guild.preferredLocale.toLocaleString(), inline: true },
        { name: "Joined At", value: guild.joinedAt.toLocaleDateString(), inline: true },
        { name: "Create At", value: guild.createdAt.toLocaleDateString(), inline: true },
        { name: "Owner", value: `${(await guild.fetchOwner()).user.username}-sama`, inline: true },
        // { name: "Invite Link", value: `[guild.vanityURLCode](${guild.vanityURLCode})`, inline: true },
        );
}
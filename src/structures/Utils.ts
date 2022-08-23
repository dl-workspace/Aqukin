import { EmbedBuilder, InteractionReplyOptions, User } from "discord.js";
import { client } from "..";

export function BaseEmbed(){
    return new EmbedBuilder()
        .setColor(client.media.embedColour[0])
        // .setAuthor({ name: client.user.username, iconURL: client.user.displayAvatarURL() })
        // .setTimestamp()
        .setFooter({ text: "FREEDOM SMILE (^)o(^)b", iconURL: client.user.displayAvatarURL() });
}

export function formatBool(value: boolean){
    return value ? 'Yse' : 'Nyo';
}

export function formatDuration(value: number){
    const d = new Date(Date.UTC(0,0,0,0,0,0,value));

    // Pull out parts of interest
    let parts = [];
    if(d.getUTCHours() > 0){
        parts.push(d.getUTCHours());
    }

    if(d.getUTCMinutes() > 0){
        parts.push(d.getUTCMinutes());
    }

    parts.push(d.getUTCSeconds());
    
    // Zero-pad
    return parts.map(s => String(s).padStart(2,'0')).join(':');
}

export function replyTemplate(author: User, replyContent: string, { embeds, components, files, ephemeral }: InteractionReplyOptions) : InteractionReplyOptions{
    return { 
        content: `**${author.username}**-sama, ${client.user.username} ${replyContent}`,
        embeds, components, files, ephemeral
    }
}

export function errorReplyTemplate(author: User, replyContent: string, { embeds, components, ephemeral }: InteractionReplyOptions) : InteractionReplyOptions{
    const temp = replyTemplate(author, replyContent, { embeds, components, ephemeral, files: client.media.ridingAqua.files });
    temp.content = `I'm sorry ` + temp.content;
    return temp;
}

/**
 * Convert given string date input (hh:mm:ss) to milliseconds
 * @param value string input format hh:mm:ss
 * @returns converted number in millisecs or 0
 */
export function convertInput(value: string){
    let total: number;
    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    if(value){
        let token = value.trim().split(":");
        
        switch(token.length){
            case 3:
                hours = Number(token[0])*3600;
                minutes = Number(token[1])*60;
                seconds = Number(token[2]);
                break;
            case 2:
                minutes = Number(token[0])*60;
                seconds = Number(token[1]);
                break;
            case 1:
                seconds = Number(token[0]);
                break;
        }
    }
    
    total = (hours + minutes + seconds)*1000;
    total = (total < 0 || isNaN(total)) ? 0 : total;
    console.log(total);
    return total;
}

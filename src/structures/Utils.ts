import { EmbedBuilder } from "discord.js";
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
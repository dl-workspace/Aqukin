import { PermissionFlagsBits } from "discord.js";
import { Command, COMMAND_TAGS } from "../../structures/Command";
import { Track } from "../../structures/opus/Track";

export default new Command({
    name: 'remove_duplicate',
    tag: COMMAND_TAGS.music,
    description: 'Remove duplicated tracks from the queue',
    userPermissions: [PermissionFlagsBits.SendMessages],
    
    execute: async({ client, interaction, args }) => {
        const mPlayer = client.music.get(interaction.guildId);

        mPlayer.queue = await removeDuplicate(mPlayer.queue);

        interaction.followUp({ content: `**${interaction.user.username}**-sama, ${client.user.username} has has removed duplicated tracks from the queue 乁 (• ω • 乁)` });
    }
});

async function removeDuplicate(queue: Track[]){
    return [...new Map(queue.map(track => [track.id, track])).values()];
} // end of removeDuplicate(...) helper function
import { PermissionFlagsBits } from "discord.js";
import { Command, COMMANDS, COMMAND_TAGS } from "../../models/command";

export default new Command({
  name: COMMANDS.shuffle,
  tag: COMMAND_TAGS.music,
  description: "Shuffle the current queue",
  userPermissions: [PermissionFlagsBits.SendMessages],

  execute: async ({ client, interaction, args, mPlayer }) => {
    await shuffle(mPlayer.queue);
    interaction.followUp({
      content: client.replyMsgAuthor(
        interaction.member,
        `${client.user.username} has has shuffled the queue`
      ),
    });
  },
});

// Shuffle(...) helper function
async function shuffle(queue) {
  for (let i = Math.round(queue.length / 5); i >= 0; i--) {
    await Durstenfield(queue);
  }
}

// Durstenfield shuffle algorithm
async function Durstenfield(queue) {
  for (let i = queue.length - 1; i > 0; i--) {
    let j = 0;
    while (j === 0) {
      j = Math.floor(Math.random() * (i + 1));
    }
    [queue[i], queue[j]] = [queue[j], queue[i]];
  }
}

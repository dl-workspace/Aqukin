import { Event } from "../structures/Events";

export default new Event('ready', (interaction) => {
    console.log(`${interaction.application.client.user.username}, your master ninja combat gamer maid is now ready at your service, master!`);
});
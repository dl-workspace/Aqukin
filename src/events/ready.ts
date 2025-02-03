import { Event } from "../models/events";
import logger from "../middlewares/logger";

export default new Event("ready", (interaction) => {
  const msg = `${interaction.application.client.user.username}, your master ninja combat gamer maid is now ready at your service, master!`;

  console.log(msg);
  logger.info(msg);
});

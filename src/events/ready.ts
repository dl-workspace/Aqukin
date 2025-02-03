import { Event } from "../models/events";
import logger from "../middlewares/logger/logger";

export default new Event("ready", (interaction) => {
  logger.info(
    `${interaction.application.client.user.username}, your master ninja combat gamer maid is now ready at your service, master!`
  );
});

/* This module exports buffer memories property functions */
import { ExtendedClient } from "../structures/Client";
import { sequelize } from "../database/dbObjects";

export async function initProperties(bot: ExtendedClient) {
    sequelize.sync({ force: true }).then(async () => {    
        console.log("Database synced");
        // sequelize.close();
    }).catch(console.error);
}
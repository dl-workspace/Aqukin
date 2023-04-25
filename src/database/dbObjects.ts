require('dotenv').config();
import { PlayerSubscription } from "@discordjs/voice";
import { GuildTextBasedChannel, GuildMember, Message } from "discord.js";
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from "sequelize";
import { Track } from "../structures/opus/Track";

export enum DB_OBJECTS {
    MPlayerData = 'MPlayerData',
    MQueueData = 'MQueueData',
    MQueuePage = 'MQueuePage',
    MVotingData = 'MVotingData',
}

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: "localhost",
    dialect: "postgres",
    logging: false,
});

// models initialization
export class MPlayerData extends Model<
InferAttributes<MPlayerData>,
InferCreationAttributes<MPlayerData>> {
    declare guild_id: string;
    declare volume: number;
    declare trackLoop: number;
    declare queueLoop: number;

    declare textChannel: GuildTextBasedChannel;
    declare subscription: PlayerSubscription;
    declare statusMsg?: Message;
    declare disconnectTimer?: NodeJS.Timeout;
    declare destroyTimer?: NodeJS.Timeout;
};
MPlayerData.init({
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    volume:{
        type: DataTypes.NUMBER,
    },
    trackLoop:{
        type: DataTypes.NUMBER,
    },
    queueLoop:{
        type: DataTypes.NUMBER,
    },

    textChannel:{
        type: DataTypes.JSON,
    },
    subscription:{
        type: DataTypes.JSON,
    },
    statusMsg:{
        type: DataTypes.JSON,
    },
    disconnectTimer:{
        type: DataTypes.JSON,
    },
    destroyTimer:{
        type: DataTypes.JSON,
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MPlayerData,
});

export class MQueueData extends Model<
InferAttributes<MQueueData>,
InferCreationAttributes<MQueueData>> {
    declare queueIndex: number;
    declare queue: Array<Track>;
};
MQueueData.init({
    queueIndex:{
        type: DataTypes.NUMBER,
    },
    queue:{
        type: DataTypes.ARRAY(DataTypes.JSON)
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MQueueData,
});

export class MQueuePage extends Model<
InferAttributes<MQueuePage>,
InferCreationAttributes<MQueuePage>> {
    declare author_id: string;
    declare page: number;
};
MQueuePage.init({
    author_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    page:{
        type: DataTypes.NUMBER
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MQueuePage,
});


export class MVotingData extends Model<
InferAttributes<MVotingData>,
InferCreationAttributes<MVotingData>> {
    declare command: string;
    declare count: number;
    declare required: number;
    declare voters: Array<GuildMember>;
};
MVotingData.init({
    command: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    count:{
        type: DataTypes.NUMBER
    },
    required:{
        type: DataTypes.NUMBER
    },
    voters:{
        type: DataTypes.ARRAY(DataTypes.JSON)
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MVotingData,
});

// associations
MPlayerData.hasMany(MQueueData, { foreignKey: 'guild_id' });
MQueueData.belongsTo(MPlayerData);

MPlayerData.hasMany(MQueuePage, { foreignKey: 'guild_id' });
MQueuePage.belongsTo(MPlayerData);

MPlayerData.hasMany(MVotingData, { foreignKey: 'guild_id' });
MVotingData.belongsTo(MPlayerData);
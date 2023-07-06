require('dotenv').config();
import { DataTypes, Sequelize } from "sequelize";
import { MQueueData } from "./models/MQueueData";
import { TrackInfo } from "./models/TrackInfo";

export enum DB_OBJECTS {
    TrackInfo = 'TrackInfo',
    MQueueData = 'MQueueData',
}

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_DOMAIN,
    port: Number(process.env.DB_PORT),
    dialect: "postgres",
    logging: false,
});

TrackInfo.init({
    track_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    index: {
        type: DataTypes.NUMBER,
    },
    url:{
        type: DataTypes.STRING,
    },
    title:{
        type: DataTypes.STRING,
    },
    duration:{
        type: DataTypes.NUMBER,
    },
    requester:{
        type: DataTypes.JSON,
    },
    seek:{
        type: DataTypes.NUMBER,
        defaultValue: 0.
    },

}, {
    sequelize,
    tableName: DB_OBJECTS.TrackInfo,
});

MQueueData.init({
    id: {
        type: DataTypes.STRING,
    },
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    currIndex: {
        type: DataTypes.NUMBER,
        defaultValue: 0,
    },
    size: {
        type: DataTypes.NUMBER,
        defaultValue: 0,
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MQueueData,
});

// TrackInfo.belongsTo(MQueueData, { foreignKey: "guild_id" });
MQueueData.hasMany(TrackInfo, {
    sourceKey: 'id',
    foreignKey: 'guild_id',
    as: 'queue',
});
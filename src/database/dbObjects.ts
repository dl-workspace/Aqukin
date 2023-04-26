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
    host: process.env.DB_DOMAIN,
    port: Number(process.env.DB_PORT),
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

    async getData(guildId: string){
        return await MPlayerData.findByPk(guildId);
    }
};
MPlayerData.init({
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    volume:{
        type: DataTypes.FLOAT,
        defaultValue: 0,
    },
    trackLoop:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    queueLoop:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
    declare guild_id: string;
    declare index: number;
    declare queue: Array<Track>;

    async getQueueData(guildId: string) {
        let queueData: MQueueData = await MQueueData.findByPk(guildId);
    
        if (!queueData) {
            queueData = await MQueueData.create({ guild_id: guildId, queue: new Array<Track> });
        }
        return queueData;
    };

    async getCurrTrack(guildId: string){
        let queueData: MQueueData = await MQueueData.findByPk(guildId);

        if (queueData) { 
            return queueData.queue[queueData.index];
        }
    }
};
MQueueData.init({
    guild_id: {
        type: DataTypes.STRING,
        references: {
            model: MPlayerData,
            key: 'guild_id',
        }
    },
    index:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
        type: DataTypes.INTEGER,
        defaultValue: 0,
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
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    required:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    voters:{
        type: DataTypes.ARRAY(DataTypes.JSON),
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MVotingData,
});

// associations
MPlayerData.hasOne(MQueueData);
// MPlayerData.hasOne(MQueueData, { foreignKey: 'guild_id', as: 'MPlayer' });
MQueueData.belongsTo(MPlayerData);
// MQueueData.belongsTo(MPlayerData, { foreignKey: 'guild_id' });
// MQueueData.belongsTo(MPlayerData, { foreignKey: 'guild_id', as: 'queueData' });

MPlayerData.hasMany(MQueuePage, { foreignKey: 'author_id' });
MQueuePage.belongsTo(MPlayerData);

MPlayerData.hasMany(MQueuePage, { foreignKey: 'command' });
MVotingData.belongsTo(MPlayerData);
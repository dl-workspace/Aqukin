require('dotenv').config();
import { PlayerSubscription } from "@discordjs/voice";
import { GuildTextBasedChannel, GuildMember, Message } from "discord.js";
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes, NonAttribute } from "sequelize";
import type { OpusPlayer } from "../structures/opus/Player";
import type { Track } from "../structures/opus/Track";

export enum DB_OBJECTS {
    MPlayerList = 'MPlayerList',
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

export class MPlayerList extends Model<
InferAttributes<MPlayerList>,
InferCreationAttributes<MPlayerList>> {
    declare guild_id: string;
    declare mPlayer: OpusPlayer;

    static async getPlayerData(guildId: string){
        return await MPlayerList.findByPk(guildId);
    }

    static async getPlayer(guildId: string){
        let mPlayer: OpusPlayer;
        const playerData = await MPlayerList.getPlayerData(guildId);
        
        if(playerData){
            mPlayer = playerData.mPlayer;
        }
        
        return mPlayer;
    }

    // get Player(): NonAttribute<OpusPlayer>{
    //     return this.mPlayer;
    // }

    static async addPlayer(mPlayer: OpusPlayer){
        let dPlayer = await MPlayerList.getPlayerData(mPlayer.id);

        if(!dPlayer){
            dPlayer = await MPlayerList.create({ guild_id: mPlayer.id });
        }

        dPlayer.mPlayer = mPlayer;
        dPlayer.save();
    }

    static async removePlayerData(guildId: string){
        let dPlayer = await MPlayerList.getPlayerData(guildId);

        if(dPlayer){
            await MPlayerList.destroy({ where: {guild_id: guildId} });
            dPlayer.save();
        }
    }
};
MPlayerList.init({
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false,
    },
    mPlayer: {
        type: DataTypes.JSON,
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MPlayerList,
});


export class MPlayerData extends Model<
InferAttributes<MPlayerData>,
InferCreationAttributes<MPlayerData>> {
    declare guild_id: string;
    declare volume: number;
    declare trackLoop: number;
    declare queueLoop: number;
    
    declare queue: Array<Track>;

    declare textChannel: GuildTextBasedChannel;
    declare subscription: PlayerSubscription;
    declare statusMsg?: Message;
    declare disconnectTimer?: NodeJS.Timeout;
    declare destroyTimer?: NodeJS.Timeout;

    static async getPlayerData(guildId: string){
        return await MPlayerData.findByPk(guildId);
    }

    static async addPlayer(mPlayer: OpusPlayer){
        const dPlayer = await MPlayerData.create({ 
            guild_id: mPlayer.id, 
            volume: mPlayer.volume, 
            trackLoop: mPlayer.trackLoopTimes, 
            queueLoop: mPlayer.queueLoopTimes,
            queue: mPlayer.queue,
            textChannel: mPlayer.textChannel,
            subscription: mPlayer.subscription,
            statusMsg: mPlayer.statusMsg,
            disconnectTimer: mPlayer.disconnectTimer,
            destroyTimer: mPlayer.destroyTimer,
        });
        dPlayer.save();
    }

    static async removePlayerData(guildId: string){
        let dPlayer = await MPlayerData.getPlayerData(guildId);

        if(dPlayer){
            await MPlayerData.destroy({ where: {guild_id: guildId} });
            dPlayer.save();
        }
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

    queue: {
        type: DataTypes.ARRAY(DataTypes.JSON),
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
    // declare guild_id: string;
    declare index: number;
    declare queue: Array<Track>;

    async getQueueData(guildId: string) {
        let queueData: MQueueData = await MQueueData.findByPk(guildId);
    
        if (!queueData) {
            queueData = await MQueueData.create({ queue: new Array<Track> });
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
    // guild_id: {
    //     type: DataTypes.STRING,
    //     references: {
    //         model: MPlayerList,
    //         key: 'guild_id',
    //     }
    // },
    index:{
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    queue:{
        type: DataTypes.ARRAY(DataTypes.JSON),
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
// MPlayerList.hasOne(MQueueData);
// // MPlayerData.hasOne(MQueueData, { foreignKey: 'guild_id', as: 'MPlayer' });
// MQueueData.belongsTo(MPlayerList, { as: 'MPlayer' });
// MQueueData.belongsTo(MPlayerData, { foreignKey: 'guild_id' });
// MQueueData.belongsTo(MPlayerData, { foreignKey: 'guild_id', as: 'queueData' });

// MPlayerList.hasMany(MQueuePage, { foreignKey: 'author_id' });
// MQueuePage.belongsTo(MPlayerList);

// MPlayerList.hasMany(MQueuePage, { foreignKey: 'command' });
// MVotingData.belongsTo(MPlayerList);
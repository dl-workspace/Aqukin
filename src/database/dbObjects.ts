require('dotenv').config();
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from "sequelize";

export enum DB_OBJECTS {
    MPlayerData = 'MPlayerData',
    MQueuePage = 'MQueuePage',
    MVotingData = 'MVotingData',
}

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: "localhost",
    dialect: "postgres",
    logging: false,
});

// models
export class MPlayerData extends Model<
InferAttributes<MPlayerData>,
InferCreationAttributes<MPlayerData>> {
    declare guild_id: string;
    declare queue: Array<string>;
    declare loopQueue: Array<string>;
};

export class MQueuePage extends Model<
InferAttributes<MQueuePage>,
InferCreationAttributes<MQueuePage>> {
    declare author_id: string;
    declare page: number;
};

export class MVotingData extends Model<
InferAttributes<MVotingData>,
InferCreationAttributes<MVotingData>> {
    declare command: string;
    declare count: number;
    declare required: number;
    declare voters: Array<string>;
};

// associations
MPlayerData.hasMany(MQueuePage, { foreignKey: 'guild_id' });
MQueuePage.belongsTo(MPlayerData);

MPlayerData.hasMany(MVotingData, { foreignKey: 'guild_id' });
MVotingData.belongsTo(MPlayerData);

// inits
MPlayerData.init({
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    queue:{
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
    loopQueue:{
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MPlayerData,
});

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
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
}, {
    sequelize,
    tableName: DB_OBJECTS.MVotingData,
});
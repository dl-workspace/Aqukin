require('dotenv').config();
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from "sequelize";

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: "localhost",
    dialect: "postgres",
    logging: false,
});

// models
export class MPlayerData extends Model<
InferAttributes<MPlayerData>,
InferCreationAttributes<MPlayerData>> {
    declare id: string;
    declare queue: Array<string>;
    declare loopQueue: Array<string>;
    declare queuePage: Array<number>;
};

MPlayerData.init({
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },
    queue:{
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
    loopQueue:{
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
    queuePage:{
        type: DataTypes.ARRAY(DataTypes.NUMBER)
    },
}, {
    sequelize,
    tableName: 'MPlayerData',
});
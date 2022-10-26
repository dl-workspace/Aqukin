require('dotenv').config();
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from "sequelize";

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: "localhost",
    dialect: "postgres",
    logging: false,
});

// models
export class mPlayer extends Model<
InferAttributes<mPlayer>,
InferCreationAttributes<mPlayer>> {
    declare guild_id: string;
    declare data: JSON;
};

mPlayer.init({
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },

    data:{
        type: DataTypes.JSON
    }
}, {
    sequelize,
    tableName: 'mPlayers',
});
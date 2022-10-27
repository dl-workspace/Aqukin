require('dotenv').config();
import { Sequelize, DataTypes, Model, InferAttributes, InferCreationAttributes } from "sequelize";

export const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: "localhost",
    dialect: "postgres",
    logging: false,
});

// models
export class MusicQueue extends Model<
InferAttributes<MusicQueue>,
InferCreationAttributes<MusicQueue>> {
    declare guild_id: string;
    declare main: Array<string>;
    declare loop: Array<string>;
};

MusicQueue.init({
    guild_id: {
        type: DataTypes.STRING,
        primaryKey: true,
    },

    main:{
        type: DataTypes.ARRAY(DataTypes.STRING)
    },

    loop:{
        type: DataTypes.ARRAY(DataTypes.STRING)
    },
}, {
    sequelize,
    tableName: 'mQueue',
});
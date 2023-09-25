require('dotenv').config();
import { Model, InferAttributes, InferCreationAttributes, BelongsToGetAssociationMixin, NonAttribute, Association } from "sequelize";
import { ITrackInfo, TrackInfo } from "./TrackInfo";

export class MQueueData extends Model<
InferAttributes<MQueueData>,
InferCreationAttributes<MQueueData>> {
    declare guild_id: string;
    declare currIndex: number;
    declare size: number;

    declare getTrackInfos: BelongsToGetAssociationMixin<TrackInfo>;
    declare queue?: NonAttribute<TrackInfo[]>;
    
    // declare static associations: {
    //     queue: Association<MQueueData, TrackInfo>;
    // };

    static async createQueueData(guild_id: string){
        MQueueData.create({ guild_id });
    }

    static async getQueueData(guild_id: string){
        const data = await MQueueData.findByPk(
            guild_id, {
                include: [MQueueData.associations.queue],
                rejectOnEmpty: true,
            }
        );

        // const data = await MQueueData.findOne({
        //     where: { guild_id: `${guild_id}` }
        // });

        console.log(guild_id, data);
        return data;
    }

    static async removeQueueData(guild_id: string){
        MQueueData.destroy({ where: { guild_id } });
    }

    static async getCurrTrack(guild_id: string){
        const queue = await MQueueData.getQueueData(guild_id);
        return await queue.getTrackInfos({ where: { index: queue.currIndex }});
    }

    async currTrack(){
        return await this.getTrackInfos({ where: { index: this.currIndex }});
    }

    async increaseIndex(){
        await this.increment('currIndex');
    }

    async resetIndex(){
        this.currIndex = 0;
        await this.save();
    }

    async queueTrack(track : TrackInfo){
        track.setIndex(this.size++);
        await track.save();
        await this.save();
    }

    async addTrack(index: number, track : TrackInfo){
        // this.queue.splice(index, 1, track);
        track.setIndex(index);
        this.size++;
        await track.save();
        await this.save();
    }

    async removeTrack(index: number){
        await TrackInfo.removeTrack(index);
        this.size--;
        await this.save();
    }

    async removeTrackRange(start: number, end: number){
        // this.queue.splice(start, end);
        this.size -= end-start;
        await this.save();
    }

    async removeTrackAll(){
        // this.addTrack(0, this.currTrack());
        this.size = 0;
        await this.resetIndex();
    }
};
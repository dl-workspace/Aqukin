import { CommandType } from "../typings/command";

export enum COMMAND_TAGS {
    owner = 'owner',
    music = 'music',
    info = 'info',
    utils = 'utils',
}

export class Command{
    constructor(options: CommandType){
        Object.assign(this, options);
    }
}
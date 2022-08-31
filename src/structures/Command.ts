import { CommandType } from "../typings/command";

export enum COMMAND_TAGS {
    owner = 'owner',
    music = 'music',
    info = 'info',
    utils = 'utils',
}

export enum COMMANDS {
    // info commands
    info = 'info',

    // utilities commands
    delete = 'delete',
    emoji = 'emoji',

    // music commands
    clear = 'clear',
    disconnect = 'disconnect',
    loop = 'loop',
    play = 'play',
    pause = 'pause',
    queue = 'queue',
    remove = 'remove',
    resume = 'resume',
    seek = 'seek',
    shuffle = 'shuffle',
    skip = 'skip',
    volume = 'volume',
}

export class Command{
    constructor(options: CommandType){
        Object.assign(this, options);
    }
}
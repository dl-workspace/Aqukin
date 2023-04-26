import { ApplicationCommandDataResolvable, Client, ClientEvents, Collection, GuildMember, VoiceChannel } from "discord.js";
import { CommandType } from "../typings/command";
import { glob } from "glob";
import { RegisterCommandsOptions } from "../typings/client";
import { Event } from "./Events";
import { OpusPlayer } from "./opus/Player";
import { MPlayerData, MPlayerList } from "../database/dbObjects";

export class ExtendedClient extends Client{
    commands: Collection<string, CommandType>;
    music: Collection<string, OpusPlayer>;

    media = { 
        embedColour: [ 0xBC06C4, 0x1DE2FE ],
        slappingAqua : { files: ["https://media1.tenor.com/images/9d81ec7c2abd005d8da208d2f56e89df/tenor.gif?itemid=17267165"] },
        ridingAqua : { files: ["https://media1.tenor.com/images/e6578328df71dbd6b44318553e06eda8/tenor.gif?itemid=17267168"] },
        kaomoji: {
            error: ['(－‸ლ)', '(╯ ° □ °) ╯ ┻━━┻', '(oT-T) 尸', '(｡ • ́︿ • ̀｡)', '(＃ ￣ω￣)', '(っ ´ω\`) ﾉ (╥ω╥)', '( •́ㅿ•̀ )'],
            happy: ['(^)o(^)b', '₍ᵔ˶- ̫-˶ᵔ₎', 'ᐡ ̳ᴗ  ̫ ᴗ ̳ᐡ♡', '߹ 𖥦 ߹', '(*ฅ•̀ω•́ฅ*)', '֊  ̫ ֊𓈒𓂂𓏸',  'ฅ•̀ω•́ฅ', 'ฅ^.  ̫ .^ฅ', '꒰ᐡ⸝⸝ᴗ ·̫ ฅ⸝⸝ᐡ꒱', 
            'ヾ(⸝⸝ᐡ.  ̫ .ᐡ⸝⸝)', '(՞  ܸ. .ܸ՞)"', '(  ¯꒳​¯ )ᐝ', '(・ε・´  )']
        }
    };
    
    constructor(){
        super({ intents: 32767 });
        this.music = new Collection();
        this.commands = new Collection();
    }

    start(){
        this.registerEvents();
        this.registerCommands();
        this.login(process.env.BOT_TOKEN);
        this.alive(this);

        process.on("warning", e => console.warn(e.stack)) // debug
    }

    private async importFile(filePath: string){
        return (await import(filePath))?.default;
    }

    private async registerEvents(){
        const eventFiles = await glob(`${__dirname}/../events/*{.ts,.js}`);
        
        eventFiles.forEach(async filePath => {
            const event: Event<keyof ClientEvents> = await this.importFile(filePath);
            this.on(event.event, event.execute);
        });
    }

    private async registerCommandsHelper({ guildId, commands }: RegisterCommandsOptions){
        if(guildId){
            this.guilds.cache.get(guildId)?.commands.set(commands);
            console.log(`Registering commands to ${guildId}`);
        }
        else{
            this.application?.commands.set(commands);
            console.log(`Registering global commands`);
        }
    }

    private async registerCommands(){
        const slashCommands: ApplicationCommandDataResolvable[] = [];
        const commandFiles = await glob(`${__dirname}/../commands/*/*{.ts,.js}`);

        // console.log({ commandFiles });

        commandFiles.forEach(async filePath => {
            const command: CommandType = await this.importFile(filePath);
            if(!command.name) { return; }

            this.commands.set(command.name, command);
            slashCommands.push(command);
        });

        this.on('ready', () => {
            this.registerCommandsHelper({
                commands: slashCommands,
                // guildId: process.env.GUILD_ID
            });
        });
    }

    private async alive(client: ExtendedClient){
        setInterval(async () => {
            // (await MPlayerList.findAll()).forEach(async instance => {
            //     const { mPlayer } = instance;
            //     const { connection } = mPlayer.subscription;
            //     client.channels.fetch(connection.joinConfig.channelId).then(async (voiceChannel : VoiceChannel) => {
            //         const memberList = voiceChannel.members.filter(mem => !mem.user.bot);

            //         if(memberList.size === 0){
            //             clearTimeout(mPlayer.disconnectTimer);
            //             mPlayer.disconnect();
            //             mPlayer.textChannel.send({ content: this.replyMsg(`Since there are no listener left`) });
            //         }
            //     }).catch(err => console.log(err));
            // })

            client.music.forEach(async mPlayer => {
                const { connection } = mPlayer.subscription;
                client.channels.fetch(connection.joinConfig.channelId).then(async (voiceChannel : VoiceChannel) => {
                    const memberList = voiceChannel.members.filter(mem => !mem.user.bot);

                    if(memberList.size === 0){
                        clearTimeout(mPlayer.disconnectTimer);
                        mPlayer.disconnect();
                        mPlayer.textChannel.send({ content: this.replyMsg(`Since there are no listener left`) });
                    }
                }).catch(err => console.log(err));
            });
        }, 560000);
    }

    replyMsg(content: string){
        return `${content} ${this.media.kaomoji.happy.random()}`
    }

    replyMsgError(content: string){
        return `${content} ${this.media.kaomoji.error.random()}`
    }

    replyMsgAuthor(author: GuildMember, content: string){
        return `**${author.nickname || author.user.username}**-sama, ${this.replyMsg(content)}`;
    }

    replyMsgErrorAuthor(author: GuildMember, content: string){
        return `I'm sorry **${author.nickname || author.user.username}**-sama, but ${this.replyMsgError(content)}`;
    }
}
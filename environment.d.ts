declare global{
    namespace NodeJS{
        interface ProcessEnv{
            GUILD_ID: string;
            BOT_TOKEN: string;
            PUBLIC_KEY: string;
            APP_ID: string;
            OWNER_ID: string;
            INVITE_LINK: string;
            environment: "dev" | "prod" | "debug";
        }
    }
}

export {};
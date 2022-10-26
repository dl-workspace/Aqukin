declare global{
    namespace NodeJS{
        interface ProcessEnv{
            GUILD_ID: string;
            BOT_TOKEN: string;
            PUBLIC_KEY: string;
            APP_ID: string;

            DB_NAME: string;
            DB_USERNAME: string;
            DB_PASSWORD: string;

            OWNER_ID: string;
            INVITE_LINK: string;
            environment: "dev" | "prod" | "debug";
        }
    }
}

export {};
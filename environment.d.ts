declare global {
  namespace NodeJS {
    interface ProcessEnv {
      BOT_TOKEN: string;
      PUBLIC_KEY: string;
      APP_ID: string;

      GUILD_ID: string;
      OWNER_ID: string;
      INVITE_LINK: string;
      ENVIRONMENT: "dev" | "prod" | "debug";

      LOGGER_IP: string;
      LOGGER_LEVEL: "debug" | "info" | "warn" | "error";
    }
  }
}

export {};

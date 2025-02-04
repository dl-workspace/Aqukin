import { createClient } from "redis";
import logger from "../middlewares/logger/logger";

export const redis = createClient({
  url: process.env.REDIS_URI,
});

export async function connectRedis() {
  try {
    await redis.connect();
    logger.info("Connected to Redis");
  } catch (err) {
    logger.error("Failed to connect to Redis:", err);
  }
}

redis.on("error", (err) => {
  logger.error("Redis error:", err);
});

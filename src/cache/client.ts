import { createClient } from "redis";
import logger from "../middlewares/logger/logger";

export const redis = createClient({
  url: process.env.REDIS_URI,
});

export let redisAvailable = false;

export async function connectRedis() {
  try {
    await redis.connect();
    redisAvailable = true;
    logger.info("Connected to Redis");
  } catch (err) {
    redisAvailable = false;
    logger.error("Failed to connect to Redis:", err);
  }

  redis.on("error", (error) => {
    logger.error("Redis error:", error);
    redisAvailable = false;
  });
}

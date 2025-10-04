import { createClient } from "redis";
import logger from "../middlewares/logger/logger";

const redisUri = process.env.REDIS_URI;

export const redis = redisUri
  ? createClient({
      url: redisUri,
    })
  : createClient();

export let redisAvailable = false;

export async function connectRedis() {
  if (!redisUri) {
    logger.warn(
      "REDIS_URI is not configured; Redis-backed caching has been disabled for this session."
    );
    redisAvailable = false;
    return;
  }

  try {
    await redis.connect();
    redisAvailable = true;
    logger.info("Connected to Redis");
  } catch (err) {
    redisAvailable = false;
    const errorCode =
      typeof err === "object" && err && "code" in err
        ? (err as { code?: string }).code
        : undefined;

    if (errorCode === "ECONNREFUSED") {
      logger.warn(
        "Redis is unreachable; falling back to in-memory state. Start Redis or remove REDIS_URI to silence this warning.",
        err
      );
    } else {
      logger.error(
        "Failed to connect to Redis. Ensure the Redis service is running and REDIS_URI is correct.",
        err
      );
    }
    return;
  }

  redis.on("error", (error) => {
    logger.error("Redis error:", error);
    redisAvailable = false;
  });
}

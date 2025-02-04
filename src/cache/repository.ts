// ./database/repository.ts

import { redis } from "./client";
import { IGuildPlayer, ITrackData } from "./schema";

/**
 * This function generates the Redis key (namespace) for storing the guild's player.
 */
function redisKey(guildId: string) {
  return `guild:${guildId}:player`;
}

/**
 * Attempts to find an existing guild player in Redis.
 * @param guildId
 * @returns IGuildPlayer or null if not found
 */
export async function findPlayer(
  guildId: string
): Promise<IGuildPlayer | null> {
  const data = await redis.get(redisKey(guildId));
  if (!data) return null;
  return JSON.parse(data) as IGuildPlayer;
}

/**
 * Creates a default empty IGuildPlayer entry in Redis for a given guild.
 * @param guildId
 * @returns the newly created IGuildPlayer
 */
export async function createPlayer(guildId: string): Promise<IGuildPlayer> {
  const defaultDoc: IGuildPlayer = {
    guildId,
    queue: [],
    loopQueue: [],
    trackLoopTimes: 0,
    queueLoopTimes: 0,
    volume: 1,
  };
  await redis.set(redisKey(guildId), JSON.stringify(defaultDoc));
  return defaultDoc;
}

/**
 * Overwrites the entire IGuildPlayer document in Redis.
 * @param data
 */
export async function savePlayer(data: IGuildPlayer): Promise<void> {
  await redis.set(redisKey(data.guildId), JSON.stringify(data));
}

/**
 * Replaces the `queue` array in the IGuildPlayer document.
 * @param guildId
 * @param newQueue
 */
export async function updateQueue(guildId: string, newQueue: ITrackData[]) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.queue = newQueue;
  await savePlayer(player);
}

/**
 * Replaces the `loopQueue` array in the IGuildPlayer document.
 * @param guildId
 * @param newLoopQueue
 */
export async function updateLoopQueue(
  guildId: string,
  newLoopQueue: ITrackData[]
) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.loopQueue = newLoopQueue;
  await savePlayer(player);
}

/**
 * Sets `trackLoopTimes`.
 * @param guildId
 * @param times
 */
export async function updateTrackLoopTimes(guildId: string, times: number) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.trackLoopTimes = times;
  await savePlayer(player);
}

/**
 * Sets `queueLoopTimes`.
 * @param guildId
 * @param times
 */
export async function updateQueueLoopTimes(guildId: string, times: number) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.queueLoopTimes = times;
  await savePlayer(player);
}

/**
 * Sets `volume`.
 * @param guildId
 * @param volume
 */
export async function updateVolume(guildId: string, volume: number) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.volume = volume;
  await savePlayer(player);
}

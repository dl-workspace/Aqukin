import { redis, redisAvailable } from "./client";
import { IGuildPlayer, ITrackData } from "./schema";

function redisKey(guildId: string) {
  return `guild:${guildId}:player`;
}

/**
 * Attempts to find an existing guild player in Redis.
 * If redisAvailable = false, returns null (no storage).
 */
export async function findPlayer(
  guildId: string
): Promise<IGuildPlayer | null> {
  if (!redisAvailable) {
    return null; // no fallback store, just return null
  }
  const data = await redis.get(redisKey(guildId));
  if (!data) return null;
  return JSON.parse(data) as IGuildPlayer;
}

/**
 * Creates a default empty IGuildPlayer entry in Redis if redis is available;
 * otherwise just returns the defaultDoc and does not persist anywhere.
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

  if (!redisAvailable) {
    return defaultDoc; // no store, just return
  }
  await redis.set(redisKey(guildId), JSON.stringify(defaultDoc));
  return defaultDoc;
}

/**
 * Overwrites the entire IGuildPlayer document in Redis if available,
 * else does nothing.
 */
export async function savePlayer(data: IGuildPlayer): Promise<void> {
  if (!redisAvailable) {
    return; // no store, do nothing
  }
  await redis.set(redisKey(data.guildId), JSON.stringify(data));
}

/**
 * Replaces the `queue` array in the IGuildPlayer document. Does nothing if Redis down.
 */
export async function updateQueue(guildId: string, newQueue: ITrackData[]) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.queue = newQueue;
  await savePlayer(player);
}

/**
 * Replaces the `loopQueue`.
 */
export async function updateLoopQueue(
  guildId: string,
  newLoopQueue: ITrackData[]
) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.loopQueue = newLoopQueue;
  await savePlayer(player);
}

/**
 * Sets `trackLoopTimes`.
 */
export async function updateTrackLoopTimes(guildId: string, times: number) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.trackLoopTimes = times;
  await savePlayer(player);
}

/**
 * Sets `queueLoopTimes`.
 */
export async function updateQueueLoopTimes(guildId: string, times: number) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.queueLoopTimes = times;
  await savePlayer(player);
}

/**
 * Sets `volume`.
 */
export async function updateVolume(guildId: string, volume: number) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.volume = volume;
  await savePlayer(player);
}

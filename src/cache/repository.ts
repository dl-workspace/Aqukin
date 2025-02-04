// ./database/repository.ts

import { redis, redisAvailable } from "./client";
import { findFallback, saveFallback } from "./fallbackClient";
import { IGuildPlayer, ITrackData } from "./schema";

function redisKey(guildId: string) {
  return `guild:${guildId}:player`;
}

/** Retrieves IGuildPlayer from either Redis or fallback store. */
export async function findPlayer(
  guildId: string
): Promise<IGuildPlayer | null> {
  if (!redisAvailable) {
    const fallbackDoc = findFallback(guildId);
    return fallbackDoc || null;
  }
  const data = await redis.get(redisKey(guildId));
  if (!data) return null;
  return JSON.parse(data) as IGuildPlayer;
}

/** Creates default IGuildPlayer in either Redis or fallback store. */
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
    saveFallback(defaultDoc);
    return defaultDoc;
  }
  await redis.set(redisKey(guildId), JSON.stringify(defaultDoc));
  return defaultDoc;
}

/** Overwrites IGuildPlayer in either Redis or fallback store. */
export async function savePlayer(data: IGuildPlayer): Promise<void> {
  if (!redisAvailable) {
    saveFallback(data);
    return;
  }
  await redis.set(redisKey(data.guildId), JSON.stringify(data));
}

/** Helper to replace the entire queue array. */
export async function updateQueue(guildId: string, newQueue: ITrackData[]) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.queue = newQueue;
  await savePlayer(player);
}

/** Helper to replace the entire loopQueue array. */
export async function updateLoopQueue(
  guildId: string,
  newLoopQueue: ITrackData[]
) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.loopQueue = newLoopQueue;
  await savePlayer(player);
}

/** Helper to update trackLoopTimes. */
export async function updateTrackLoopTimes(guildId: string, times: number) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.trackLoopTimes = times;
  await savePlayer(player);
}

/** Helper to update queueLoopTimes. */
export async function updateQueueLoopTimes(guildId: string, times: number) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.queueLoopTimes = times;
  await savePlayer(player);
}

/** Helper to update volume. */
export async function updateVolume(guildId: string, volume: number) {
  const player = (await findPlayer(guildId)) || (await createPlayer(guildId));
  player.volume = volume;
  await savePlayer(player);
}

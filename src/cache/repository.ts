import { redis, redisAvailable } from "./client";
import { IGuildPlayer, ITrackData } from "./schema";

function redisKey(guildId: string) {
  return `guild:${guildId}:player`;
}

export async function findPlayer(
  guildId: string
): Promise<IGuildPlayer | null> {
  if (!redisAvailable) {
    return null;
  }
  const data = await redis.get(redisKey(guildId));
  if (!data) return null;
  const serialized = typeof data === "string" ? data : data.toString("utf8");
  return JSON.parse(serialized) as IGuildPlayer;
}

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
    return defaultDoc;
  }
  await redis.set(redisKey(guildId), JSON.stringify(defaultDoc));
  return defaultDoc;
}

export async function savePlayer(data: IGuildPlayer): Promise<void> {
  if (!redisAvailable) {
    return;
  }
  await redis.set(redisKey(data.guildId), JSON.stringify(data));
}

export async function updateQueue(guildId: string, newQueue: ITrackData[]) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.queue = newQueue;
  await savePlayer(player);
}

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

export async function updateTrackLoopTimes(guildId: string, times: number) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.trackLoopTimes = times;
  await savePlayer(player);
}

export async function updateQueueLoopTimes(guildId: string, times: number) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.queueLoopTimes = times;
  await savePlayer(player);
}

export async function updateVolume(guildId: string, volume: number) {
  let player = await findPlayer(guildId);
  if (!player) {
    player = await createPlayer(guildId);
  }
  player.volume = volume;
  await savePlayer(player);
}

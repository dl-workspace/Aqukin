import { IGuildPlayer } from "./schema";

/**
 * A simple in-memory store keyed by guildId.
 * This only lives until the bot restarts.
 */
const fallbackDB = new Map<string, IGuildPlayer>();

export function findFallback(guildId: string): IGuildPlayer | null {
  return fallbackDB.get(guildId) || null;
}

export function saveFallback(doc: IGuildPlayer): void {
  fallbackDB.set(doc.guildId, doc);
}

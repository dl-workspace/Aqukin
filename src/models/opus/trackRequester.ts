import { ITrackRequester } from "../../cache/schema";

export class TrackRequester implements ITrackRequester {
  id: string;
  guildId: string;

  constructor(id: string, guildId: string) {
    this.id = id;
    this.guildId = guildId;
  }
}

export interface ITrackRequester {
  id: string;
  guildId: string;
}

export interface ITrackData {
  id: string;
  url: string;
  title: string;
  duration: number;
  requester: ITrackRequester;
  seek?: number;
}

export interface IGuildPlayer {
  guildId: string;
  queue: ITrackData[];
  loopQueue: ITrackData[];
  trackLoopTimes: number;
  queueLoopTimes: number;
  volume: number;
}

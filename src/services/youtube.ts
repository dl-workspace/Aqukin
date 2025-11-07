import { YtDlp, type VideoInfo } from "ytdlp-nodejs";
import { Readable } from "stream";
import logger from "../middlewares/logger/logger";

/**
 * YouTube video information interface
 */
export interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: number;
  url: string;
  isLive: boolean;
  thumbnail?: string;
}

/**
 * YouTube service for reliable video information extraction and streaming
 * Uses yt-dlp under the hood for maximum reliability against YouTube changes
 */
class YouTubeService {
  private ytDlp: YtDlp;
  private static instance: YouTubeService;

  private constructor() {
    // Initialize ytdlp-nodejs with default options
    this.ytDlp = new YtDlp();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): YouTubeService {
    if (!YouTubeService.instance) {
      YouTubeService.instance = new YouTubeService();
    }
    return YouTubeService.instance;
  }

  /**
   * Validate if a string is a valid YouTube URL
   * @param url The URL to validate
   * @returns true if valid YouTube URL
   */
  validateURL(url: string): boolean {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
    return youtubeRegex.test(url);
  }

  /**
   * Get basic video information from YouTube
   * @param url YouTube video URL
   * @returns Video information
   */
  async getBasicInfo(url: string): Promise<YouTubeVideoInfo> {
    try {
      // Use yt-dlp to get video info in JSON format
      const info = await this.ytDlp.getInfoAsync(url);

      // Handle playlist vs single video
      if (info._type === "playlist") {
        throw new Error("Playlists should be handled separately");
      }

      return {
        id: info.id,
        title: info.title,
        duration: info.duration || 0,
        url: info.webpage_url || url,
        isLive: info.is_live || false,
        thumbnail: info.thumbnail,
      };
    } catch (error) {
      logger.error(`Failed to get YouTube video info: ${error}`);
      throw new Error(`Could not extract video information: ${error.message}`);
    }
  }

  /**
   * Create an audio stream from a YouTube video
   * @param url YouTube video URL
   * @param seekSeconds Optional seek position in seconds
   * @returns Readable stream of audio data
   */
  async createAudioStream(
    url: string,
    seekSeconds?: number
  ): Promise<Readable> {
    try {
      const options: any = {
        format: "bestaudio[ext=webm]/bestaudio/best",

        output: "-",

        quiet: true,
        noWarnings: true,
        noPlaylist: true,

        bufferSize: "16K",
        httpChunkSize: "10M",

        noPostOverwrites: true,

        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        referer: "https://www.youtube.com/",
        noCheckCertificates: true,
        
        extractorArgs: {
          youtube: ["player_client=android"]
        },
      };

      if (seekSeconds !== undefined && seekSeconds > 0) {
        options.downloadSections = `*${seekSeconds}-inf`;
      }

      logger.info(
        `Creating audio stream for: ${url}${
          seekSeconds ? ` (seek: ${seekSeconds}s)` : ""
        }`
      );

      const childProcess = this.ytDlp.download(url, options);

      childProcess.on("error", (error) => {
        logger.error(`yt-dlp process error: ${error}`);
      });

      childProcess.stderr.on("data", (data) => {
        logger.error(`yt-dlp stderr: ${data.toString()}`);
      });

      return childProcess.stdout as Readable;
    } catch (error) {
      logger.error(`Failed to create audio stream: ${error}`);
      throw new Error(`Could not create audio stream: ${error.message}`);
    }
  }

  /**
   * Search YouTube for videos
   * @param query Search query
   * @param limit Maximum number of results (default: 7)
   * @returns Array of video information
   */
  async search(query: string, limit: number = 7): Promise<YouTubeVideoInfo[]> {
    try {
      logger.info(`Searching YouTube for: ${query}`);

      // Use yt-dlp's search functionality with ytsearch prefix
      const searchQuery = `ytsearch${limit}:${query}`;
      
      const info = await this.ytDlp.getInfoAsync(searchQuery, {
        flatPlaylist: true,
      } as any);

      // Handle playlist response from search
      if (info._type === "playlist" && info.entries) {
        return info.entries
          .filter((entry: any) => entry && entry.id)
          .slice(0, limit)
          .map((entry: any) => ({
            id: entry.id,
            title: entry.title || "Unknown Title",
            duration: entry.duration || 0,
            url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
            isLive: entry.is_live || false,
            thumbnail: entry.thumbnail,
          }));
      }

      return [];
    } catch (error) {
      logger.error(`Failed to search YouTube: ${error}`);
      throw new Error(`Could not search YouTube: ${error.message}`);
    }
  }

  /**
   * Get playlist information and all videos
   * @param playlistUrl YouTube playlist URL
   * @param limit Maximum number of videos to fetch (default: 1000)
   * @returns Playlist information with videos
   */
  async getPlaylistInfo(playlistUrl: string, limit: number = 1000): Promise<{
    title: string;
    url: string;
    videos: YouTubeVideoInfo[];
  }> {
    try {
      logger.info(`Getting playlist info for: ${playlistUrl}`);

      const info = await this.ytDlp.getInfoAsync(playlistUrl, {
        flatPlaylist: true,
      } as any);

      if (info._type !== "playlist") {
        throw new Error("URL is not a playlist");
      }

      const videos = (info.entries || [])
        .filter((entry: any) => entry && entry.id)
        .slice(0, limit)
        .map((entry: any) => ({
          id: entry.id,
          title: entry.title || "Unknown Title",
          duration: entry.duration || 0,
          url: entry.url || `https://www.youtube.com/watch?v=${entry.id}`,
          isLive: entry.is_live || false,
          thumbnail: entry.thumbnail,
        }));

      return {
        title: info.title || "Unknown Playlist",
        url: playlistUrl,
        videos,
      };
    } catch (error) {
      logger.error(`Failed to get playlist info: ${error}`);
      throw new Error(`Could not get playlist information: ${error.message}`);
    }
  }

  /**
   * Validate if a URL is a YouTube playlist
   * @param url URL to validate
   * @returns true if valid playlist URL
   */
  validatePlaylistURL(url: string): boolean {
    const playlistRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/(playlist|watch).*(list=[\w-]+)/;
    return playlistRegex.test(url);
  }

  async getVersion(): Promise<string> {
    try {
      // Execute yt-dlp with --version flag
      const result = await this.ytDlp.execAsync("--version", {
        printVersion: true,
      });
      return result.trim();
    } catch (error) {
      return "unknown";
    }
  }
}

export const youtubeService = YouTubeService.getInstance();

import { YtDlp, type VideoInfo } from "ytdlp-nodejs";
import { Readable } from "stream";
import logger from "../middlewares/logger/logger";

/**
 * YouTube video information interface
 */
export interface YouTubeVideoInfo {
  id: string;
  title: string;
  duration: number; // in seconds
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
        duration: info.duration || 0, // 0 for live streams
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
        // Get best audio, preferring opus in webm container for Discord.js
        // This format works best with Discord's voice system
        format: "bestaudio[ext=webm]/bestaudio/best",

        // Output to stdout for streaming
        output: "-",

        // Quiet mode
        quiet: true,
        noWarnings: true,
        noPlaylist: true,

        // Better buffering for streaming
        bufferSize: "16K",
        httpChunkSize: "10M",

        // Don't re-encode, just copy the stream
        // This prevents double processing and timing issues
        noPostOverwrites: true,
      };

      // Add seek if specified
      if (seekSeconds !== undefined && seekSeconds > 0) {
        options.downloadSections = `*${seekSeconds}-inf`;
      }

      logger.info(
        `Creating audio stream for: ${url}${
          seekSeconds ? ` (seek: ${seekSeconds}s)` : ""
        }`
      );

      // Use download() method which returns ChildProcessWithoutNullStreams
      // We can read from its stdout
      const childProcess = this.ytDlp.download(url, options);

      // Handle errors from the child process
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
   * Get the yt-dlp version (useful for debugging)
   */
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

// Export singleton instance
export const youtubeService = YouTubeService.getInstance();

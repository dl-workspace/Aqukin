import TransportStream from "winston-transport";
import axios, { AxiosInstance } from "axios";

interface GraylogTransportOptions
  extends TransportStream.TransportStreamOptions {
  graylogUrl: string;
  hostName?: string;
}

class GraylogHTTPTransport extends TransportStream {
  private graylogUrl: string;
  private hostName: string;
  private axiosInstance: AxiosInstance;
  private lastErrorTimestamp: number | null = null;
  private suppressedErrorCount = 0;
  private readonly errorCooldownMs = 60_000;
  private consecutiveFailures = 0;
  private pauseUntil: number | null = null;
  private readonly failureThreshold = 3;
  private readonly pauseDurationMs = 5 * 60_000;

  constructor(options: GraylogTransportOptions) {
    super(options);
    this.graylogUrl = options.graylogUrl;
    this.hostName = options.hostName || "aqukin";
    this.axiosInstance = axios.create({
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });
  }

  async log(info: any, callback: () => void): Promise<void> {
    const clonedInfo = { ...info };

    setImmediate(callback);

    if (this.pauseUntil && Date.now() < this.pauseUntil) {
      this.suppressedErrorCount += 1;
      return;
    }

    try {
      const logMessage = {
        version: "1.1",
        host: this.hostName,
        short_message: clonedInfo.message || "No message",
        full_message: JSON.stringify(clonedInfo),
        level: this.mapLogLevel(clonedInfo.level),
        _timestamp: new Date().toISOString(),
        _extra_field: "additional_info",
      };

      await this.axiosInstance.post(this.graylogUrl, logMessage);
      this.consecutiveFailures = 0;
      this.pauseUntil = null;
      this.suppressedErrorCount = 0;
    } catch (error) {
      this.consecutiveFailures += 1;
      const now = Date.now();
      const withinCooldown =
        this.lastErrorTimestamp !== null &&
        now - this.lastErrorTimestamp < this.errorCooldownMs;

      if (this.consecutiveFailures >= this.failureThreshold) {
        this.pauseUntil = now + this.pauseDurationMs;
        const suppressedNote = this.suppressedErrorCount
          ? ` (suppressed ${this.suppressedErrorCount} additional errors)`
          : "";

        console.error(
          `Failed to send log to Graylog${suppressedNote}; pausing transport for ${
            this.pauseDurationMs / 60_000
          } minutes after ${this.consecutiveFailures} consecutive failures.`,
          error
        );

        this.lastErrorTimestamp = now;
        this.suppressedErrorCount = 0;
        return;
      }

      if (withinCooldown) {
        this.suppressedErrorCount += 1;
        return;
      }

      const suppressedNote = this.suppressedErrorCount
        ? ` (suppressed ${this.suppressedErrorCount} additional errors)`
        : "";

      console.error(`Failed to send log to Graylog${suppressedNote}:`, error);

      this.lastErrorTimestamp = now;
      this.suppressedErrorCount = 0;
    }
  }

  private mapLogLevel(level: string): number {
    const levelMap: { [key: string]: number } = {
      error: 3,
      warn: 4,
      info: 6,
      debug: 7,
    };
    return levelMap[level] || 6;
  }
}

export default GraylogHTTPTransport;

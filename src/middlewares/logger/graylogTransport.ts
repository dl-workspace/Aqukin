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
    } catch (error) {
      console.error("Failed to send log to Graylog:", error);
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

import winston from "winston";
import TransportStream from "winston-transport";
import WinstonGraylog from "winston-graylog2";

class GraylogTransport extends TransportStream {
  private graylogTransport: any;

  constructor(options: any) {
    super(options);
    this.graylogTransport = new WinstonGraylog(options);
  }

  log(info: any, callback: () => void) {
    this.graylogTransport.log(info, callback);
  }
}

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOGGER_LEVEL || "info",
    }),
    new GraylogTransport({
      name: "Graylog",
      level: process.env.LOGGER_LEVEL || "info",
      silent: false,
      handleExceptions: true,
      graylog: {
        servers: [{ host: process.env.LOGGER_IP, port: 12201 }],
        hostname: "aqukin",
        facility: "dealoux-workspace",
      },
    }),
  ],
  exitOnError: false,
});

export default logger;

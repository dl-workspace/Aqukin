import winston from "winston";
import TransportStream from "winston-transport";
import GraylogHTTPTransport from "./graylogTransport";

const transports: TransportStream[] = [
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || "info",
  }),
];

const graylogUrl = process.env.LOGGER_URL;

if (graylogUrl) {
  transports.push(
    new GraylogHTTPTransport({
      graylogUrl,
      hostName: "aqukin",
    })
  );
} else {
  console.warn(
    "LOGGER_URL is not configured; Graylog transport will be skipped."
  );
}

const logger = winston.createLogger({
  transports,
  exitOnError: false,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
});

export default logger;

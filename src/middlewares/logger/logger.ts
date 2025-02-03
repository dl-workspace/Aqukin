import winston from "winston";
import GraylogHTTPTransport from "./graylogTransport"; // Import the custom transport

const logger = winston.createLogger({
  transports: [
    new winston.transports.Console({
      level: process.env.LOG_LEVEL || "info",
    }),
    new GraylogHTTPTransport({
      graylogUrl: process.env.LOGGER_URL,
      hostName: "aqukin",
    }),
  ],
  exitOnError: false,
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.json()
  ),
});

export default logger;

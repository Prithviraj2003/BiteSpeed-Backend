import winston from "winston";
import { config } from "./config";
import { Logger } from "../types/common.types";

/**
 * Configure Winston logger with appropriate format and transports
 */
const loggerInstance = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "bitespeed-identity-service" },
  transports: [
    // Write logs to console in development, to files in production
    ...(config.nodeEnv === "development"
      ? [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.simple()
            ),
          }),
        ]
      : [
          new winston.transports.File({
            filename: "logs/error.log",
            level: "error",
          }),
          new winston.transports.File({
            filename: "logs/combined.log",
          }),
          new winston.transports.Console({
            format: winston.format.simple(),
          }),
        ]),
  ],
});

/**
 * Logger implementation that conforms to our Logger interface
 */
export const logger: Logger = {
  info: (message: string, meta?: any) => loggerInstance.info(message, meta),
  error: (message: string, meta?: any) => loggerInstance.error(message, meta),
  warn: (message: string, meta?: any) => loggerInstance.warn(message, meta),
  debug: (message: string, meta?: any) => loggerInstance.debug(message, meta),
};

// Create logs directory if it doesn't exist (for production)
if (config.nodeEnv !== "development") {
  import("fs").then((fs) => {
    if (!fs.existsSync("logs")) {
      fs.mkdirSync("logs");
    }
  });
}

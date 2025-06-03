import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { config, validateConfig } from "./utils/config";
import { logger } from "./utils/logger";
import { testConnection } from "./database/dynamodb";
import { ContactController } from "./controllers/contact.controller";
import { validateIdentifyRequest } from "./middleware/validation.middleware";
import {
  errorHandler,
  notFoundHandler,
  asyncHandler,
} from "./middleware/error.middleware";

/**
 * Initialize and configure Express application
 */
async function createApp(): Promise<express.Application> {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
    })
  );

  // Request parsing middleware
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));

  // Logging middleware
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(limiter);

  // Initialize controller
  const contactController = new ContactController();

  // Routes
  app.get(
    "/health",
    asyncHandler(contactController.health.bind(contactController))
  );

  app.post(
    "/identify",
    validateIdentifyRequest,
    asyncHandler(contactController.identify.bind(contactController))
  );

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      success: true,
      message: "BiteSpeed Identity Reconciliation API",
      version: "1.0.0",
      endpoints: {
        identify: "POST /identify",
        health: "GET /health",
      },
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info("Configuration validated successfully");

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      throw new Error("Failed to connect to DynamoDB");
    }

    // Create and start the Express app
    const app = await createApp();

    const server = app.listen(config.port, () => {
      logger.info("Server started successfully", {
        port: config.port,
        environment: config.nodeEnv,
        dynamodbLocal: config.dynamodb.useLocal,
      });
    });

    // Graceful shutdown handling
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });

    process.on("SIGINT", () => {
      logger.info("SIGINT received, shutting down gracefully");
      server.close(() => {
        logger.info("Server closed");
        process.exit(0);
      });
    });
  } catch (error) {
    logger.error("Failed to start server", { error });
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

export { createApp, startServer };

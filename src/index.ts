import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { Server } from "socket.io";

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

// WebSocket service for real-time log broadcasting
class WebSocketService {
  private io: Server;

  constructor(io: Server) {
    this.io = io;
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.io.on("connection", (socket) => {
      logger.info("Client connected to WebSocket", {
        socketId: socket.id,
        address: socket.handshake.address,
      });

      socket.on("disconnect", (reason) => {
        logger.info("Client disconnected from WebSocket", {
          socketId: socket.id,
          reason,
        });
      });
    });
  }

  broadcastLogEntry(logEntry: any): void {
    this.io.emit("log-entry", logEntry);
  }

  broadcastDatabaseUpdate(data: any): void {
    this.io.emit("database-update", data);
  }

  broadcastContactChange(data: any): void {
    this.io.emit("contact-change", data);
  }
}

/**
 * Initialize and configure Express application
 */
async function createApp(): Promise<{ app: Application; server: any }> {
  const app = express();
  const server = createServer(app);

  // Initialize Socket.IO
  const io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Initialize WebSocket service
  const wsService = new WebSocketService(io);

  // Make websocket service available globally
  (global as any).wsService = wsService;

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

  // Enhanced logging middleware with WebSocket broadcasting
  app.use(
    morgan("combined", {
      stream: {
        write: (message: string) => {
          const logMessage = message.trim();
          logger.info(logMessage);

          // Broadcast log entry via WebSocket
          const logEntry = {
            id: `${Date.now()}-${Math.random()}`,
            timestamp: new Date().toISOString(),
            level: "info" as const,
            message: logMessage,
            source: "server" as const,
          };
          wsService.broadcastLogEntry(logEntry);
        },
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

  // API Routes with /api prefix
  const apiRouter = express.Router();

  apiRouter.get(
    "/health",
    asyncHandler(contactController.health.bind(contactController))
  );

  apiRouter.post(
    "/identify",
    validateIdentifyRequest,
    asyncHandler(contactController.identify.bind(contactController))
  );

  // New endpoint for getting all contacts (expected by frontend)
  apiRouter.get(
    "/contacts",
    asyncHandler(contactController.getAllContacts.bind(contactController))
  );

  // Test endpoint for WebSocket broadcasting
  apiRouter.get("/test-websocket", (_req: Request, res: Response) => {
    const testLogEntry = {
      id: `test-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      level: "info" as const,
      message: "Test WebSocket message from backend",
      source: "test" as const,
      data: { test: true },
    };

    if ((global as any).wsService) {
      (global as any).wsService.broadcastLogEntry(testLogEntry);
      res.json({
        success: true,
        message: "Test WebSocket message sent",
        logEntry: testLogEntry,
      });
    } else {
      res.json({
        success: false,
        message: "WebSocket service not available",
      });
    }
  });

  // Mount API routes
  app.use("/api", apiRouter);

  // Backward compatibility routes (without /api prefix)
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
  app.get("/", (_req: Request, res: Response) => {
    res.json({
      success: true,
      message: "BiteSpeed Identity Reconciliation API",
      version: "1.0.0",
      endpoints: {
        identify: "POST /api/identify",
        health: "GET /api/health",
        contacts: "GET /api/contacts",
      },
      websocket: "Socket.IO enabled for real-time updates",
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return { app, server };
}

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Validate configuration
    validateConfig();
    logger.info("Configuration validated successfully");

    // Test database connection (optional for demo)
    const dbConnected = await testConnection();
    if (!dbConnected) {
      logger.warn(
        "DynamoDB connection failed - continuing in demo mode without database"
      );
      // Don't throw error, continue without database for demo
    } else {
      logger.info("DynamoDB connection successful");
    }

    // Create and start the Express app with Socket.IO
    const { server } = await createApp();

    server.listen(config.port, () => {
      logger.info("Server started successfully", {
        port: config.port,
        environment: config.nodeEnv,
        dynamodbLocal: config.dynamodb.useLocal,
        websocket: "Socket.IO enabled",
        databaseStatus: dbConnected ? "connected" : "demo mode (no database)",
      });

      // Broadcast server start event
      if ((global as any).wsService) {
        const startLogEntry = {
          id: `${Date.now()}-${Math.random()}`,
          timestamp: new Date().toISOString(),
          level: "info" as const,
          message: `Server started on port ${config.port} ${dbConnected ? "with database" : "in demo mode"}`,
          source: "server" as const,
          data: {
            port: config.port,
            environment: config.nodeEnv,
            databaseConnected: dbConnected,
          },
        };
        (global as any).wsService.broadcastLogEntry(startLogEntry);
      }
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

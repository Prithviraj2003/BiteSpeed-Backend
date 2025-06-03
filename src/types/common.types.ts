/**
 * Standard API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
}

/**
 * Application configuration interface
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  aws: {
    region: string;
    accessKeyId?: string;
    secretAccessKey?: string;
  };
  dynamodb: {
    tableName: string;
    endpoint?: string;
    useLocal: boolean;
  };
  logging: {
    level: string;
  };
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  cors: {
    origin: string;
  };
}

/**
 * Database operation result
 */
export interface DbOperationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Logger interface
 */
export interface Logger {
  info(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
} 
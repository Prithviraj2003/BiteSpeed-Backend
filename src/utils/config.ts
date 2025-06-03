import dotenv from 'dotenv';
import { AppConfig } from '../types/common.types';

// Load environment variables
dotenv.config();

/**
 * Validates and returns application configuration
 */
export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  dynamodb: {
    tableName: process.env.DYNAMODB_TABLE_NAME || 'contacts',
    endpoint: process.env.DYNAMODB_ENDPOINT,
    useLocal: process.env.USE_LOCAL_DYNAMODB === 'true',
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
  },
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
  },
};

/**
 * Validates required environment variables
 */
export function validateConfig(): void {
  const requiredVars = ['DYNAMODB_TABLE_NAME'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      throw new Error(`Required environment variable ${varName} is not set`);
    }
  }

  // Additional validation for AWS credentials when not using local DynamoDB
  if (!config.dynamodb.useLocal) {
    if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
      throw new Error('AWS credentials are required when not using local DynamoDB');
    }
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error('Port must be between 1 and 65535');
  }
} 
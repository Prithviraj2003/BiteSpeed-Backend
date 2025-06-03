import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { config } from "../utils/config";
import { logger } from "../utils/logger";

/**
 * Create DynamoDB client with appropriate configuration
 */
const createDynamoDBClient = (): DynamoDBClient => {
  const clientConfig: any = {
    region: config.aws.region,
  };

  // Configure for local DynamoDB if specified
  if (config.dynamodb.useLocal && config.dynamodb.endpoint) {
    clientConfig.endpoint = config.dynamodb.endpoint;
    clientConfig.credentials = {
      accessKeyId: "dummy",
      secretAccessKey: "dummy",
    };
    logger.info("Using local DynamoDB", { endpoint: config.dynamodb.endpoint });
  } else {
    // Use AWS credentials for production
    if (config.aws.accessKeyId && config.aws.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      };
    }
    logger.info("Using AWS DynamoDB", { region: config.aws.region });
  }

  return new DynamoDBClient(clientConfig);
};

/**
 * DynamoDB client instance
 */
export const dynamoDBClient = createDynamoDBClient();

/**
 * DynamoDB Document Client for easier JavaScript object handling
 */
export const docClient = DynamoDBDocumentClient.from(dynamoDBClient);

/**
 * Test DynamoDB connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    // Simple test by attempting to describe the table
    const { DescribeTableCommand } = await import("@aws-sdk/client-dynamodb");
    await dynamoDBClient.send(
      new DescribeTableCommand({
        TableName: config.dynamodb.tableName,
      })
    );
    logger.info("DynamoDB connection successful");
    return true;
  } catch (error) {
    logger.error("DynamoDB connection failed", { error });
    return false;
  }
}

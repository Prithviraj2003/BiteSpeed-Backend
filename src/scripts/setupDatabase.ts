import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
} from "@aws-sdk/client-dynamodb";
import { config } from "../utils/config";
import { logger } from "../utils/logger";

/**
 * Create DynamoDB table for contacts if it doesn't exist
 */
async function setupDatabase(): Promise<void> {
  const client = new DynamoDBClient({
    region: config.aws.region,
    ...(config.dynamodb.useLocal && config.dynamodb.endpoint
      ? {
          endpoint: config.dynamodb.endpoint,
          credentials: {
            accessKeyId: "dummy",
            secretAccessKey: "dummy",
          },
        }
      : {}),
  });

  try {
    // Check if table already exists
    try {
      await client.send(
        new DescribeTableCommand({
          TableName: config.dynamodb.tableName,
        })
      );
      logger.info("Table already exists", {
        tableName: config.dynamodb.tableName,
      });
      return;
    } catch (error: any) {
      if (error.name !== "ResourceNotFoundException") {
        throw error;
      }
      // Table doesn't exist, create it
    }

    logger.info("Creating DynamoDB table", {
      tableName: config.dynamodb.tableName,
    });

    const createTableParams = {
      TableName: config.dynamodb.tableName,
      KeySchema: [
        {
          AttributeName: "id",
          KeyType: "HASH" as const,
        },
      ],
      AttributeDefinitions: [
        {
          AttributeName: "id",
          AttributeType: "S" as const,
        },
        {
          AttributeName: "email",
          AttributeType: "S" as const,
        },
        {
          AttributeName: "phoneNumber",
          AttributeType: "S" as const,
        },
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: "EmailIndex",
          KeySchema: [
            {
              AttributeName: "email",
              KeyType: "HASH" as const,
            },
          ],
          Projection: {
            ProjectionType: "ALL" as const,
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
        {
          IndexName: "PhoneIndex",
          KeySchema: [
            {
              AttributeName: "phoneNumber",
              KeyType: "HASH" as const,
            },
          ],
          Projection: {
            ProjectionType: "ALL" as const,
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };

    await client.send(new CreateTableCommand(createTableParams));

    logger.info("Table created successfully", {
      tableName: config.dynamodb.tableName,
      indexes: ["EmailIndex", "PhoneIndex"],
    });
  } catch (error) {
    logger.error("Failed to setup database", { error });
    throw error;
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => {
      logger.info("Database setup completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Database setup failed", { error });
      process.exit(1);
    });
}

export { setupDatabase };

import {
  PutCommand,
  GetCommand,
  UpdateCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import { docClient } from "../database/dynamodb";
import { config } from "../utils/config";
import { logger } from "../utils/logger";
import {
  Contact,
  CreateContactParams,
  UpdateContactParams,
  ContactQueryParams,
  DbOperationResult,
} from "../types/contact.types";

export class ContactModel {
  private tableName: string;

  constructor() {
    this.tableName = config.dynamodb.tableName;
  }

  /**
   * Create a new contact
   */
  async create(
    params: CreateContactParams
  ): Promise<DbOperationResult<Contact>> {
    try {
      const now = new Date().toISOString();
      const contact: Contact = {
        id: uuidv4(),
        linkPrecedence: params.linkPrecedence,
        createdAt: now,
        updatedAt: now,
      };

      // Only add optional properties if they are defined
      if (params.phoneNumber !== undefined) {
        contact.phoneNumber = params.phoneNumber;
      }
      if (params.email !== undefined) {
        contact.email = params.email;
      }
      if (params.linkedId !== undefined) {
        contact.linkedId = params.linkedId;
      }

      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: contact,
        })
      );

      logger.info("Contact created successfully", { contactId: contact.id });
      return { success: true, data: contact };
    } catch (error) {
      logger.error("Failed to create contact", { error, params });
      return { success: false, error: "Failed to create contact" };
    }
  }

  /**
   * Get contact by ID
   */
  async getById(id: string): Promise<DbOperationResult<Contact>> {
    try {
      const result = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );

      if (!result.Item) {
        return { success: false, error: "Contact not found" };
      }

      return { success: true, data: result.Item as Contact };
    } catch (error) {
      logger.error("Failed to get contact by ID", { error, id });
      return { success: false, error: "Failed to get contact" };
    }
  }

  /**
   * Update contact
   */
  async update(
    params: UpdateContactParams
  ): Promise<DbOperationResult<Contact>> {
    try {
      const updateExpression = [];
      const expressionAttributeValues: any = {};
      const expressionAttributeNames: any = {};

      if (params.linkedId !== undefined) {
        updateExpression.push("#linkedId = :linkedId");
        expressionAttributeNames["#linkedId"] = "linkedId";
        expressionAttributeValues[":linkedId"] = params.linkedId;
      }

      if (params.linkPrecedence !== undefined) {
        updateExpression.push("#linkPrecedence = :linkPrecedence");
        expressionAttributeNames["#linkPrecedence"] = "linkPrecedence";
        expressionAttributeValues[":linkPrecedence"] = params.linkPrecedence;
      }

      updateExpression.push("#updatedAt = :updatedAt");
      expressionAttributeNames["#updatedAt"] = "updatedAt";
      expressionAttributeValues[":updatedAt"] = params.updatedAt;

      const result = await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id: params.id },
          UpdateExpression: `SET ${updateExpression.join(", ")}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ReturnValues: "ALL_NEW",
        })
      );

      logger.info("Contact updated successfully", { contactId: params.id });
      return { success: true, data: result.Attributes as Contact };
    } catch (error) {
      logger.error("Failed to update contact", { error, params });
      return { success: false, error: "Failed to update contact" };
    }
  }

  /**
   * Find contacts by email or phone number
   */
  async findByEmailOrPhone(
    params: ContactQueryParams
  ): Promise<DbOperationResult<Contact[]>> {
    try {
      const contacts: Contact[] = [];

      // Note: In a production environment, you would want to use GSI (Global Secondary Index)
      // for efficient querying by email and phoneNumber. For this implementation,
      // we'll use Scan with filters (less efficient but works for the assignment)

      const scanParams: any = {
        TableName: this.tableName,
        FilterExpression: "",
        ExpressionAttributeValues: {},
      };

      const conditions: string[] = [];

      if (params.email) {
        conditions.push("email = :email");
        scanParams.ExpressionAttributeValues[":email"] = params.email;
      }

      if (params.phoneNumber) {
        conditions.push("phoneNumber = :phoneNumber");
        scanParams.ExpressionAttributeValues[":phoneNumber"] =
          params.phoneNumber;
      }

      if (conditions.length > 0) {
        scanParams.FilterExpression = conditions.join(" OR ");

        const result = await docClient.send(new ScanCommand(scanParams));
        if (result.Items) {
          contacts.push(...(result.Items as Contact[]));
        }
      }

      return { success: true, data: contacts };
    } catch (error) {
      logger.error("Failed to find contacts", { error, params });
      return { success: false, error: "Failed to find contacts" };
    }
  }

  /**
   * Get all linked contacts for a primary contact
   */
  async getLinkedContacts(
    primaryContactId: string
  ): Promise<DbOperationResult<Contact[]>> {
    try {
      // First get the primary contact
      const primaryResult = await this.getById(primaryContactId);
      if (!primaryResult.success || !primaryResult.data) {
        return { success: false, error: "Primary contact not found" };
      }

      const contacts = [primaryResult.data];

      // Find all secondary contacts linked to this primary contact
      const scanResult = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          FilterExpression: "linkedId = :linkedId",
          ExpressionAttributeValues: {
            ":linkedId": primaryContactId,
          },
        })
      );

      if (scanResult.Items) {
        contacts.push(...(scanResult.Items as Contact[]));
      }

      return { success: true, data: contacts };
    } catch (error) {
      logger.error("Failed to get linked contacts", {
        error,
        primaryContactId,
      });
      return { success: false, error: "Failed to get linked contacts" };
    }
  }
}

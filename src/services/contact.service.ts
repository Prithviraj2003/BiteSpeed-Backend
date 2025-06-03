import { ContactModel } from "../models/contact.model";
import { logger } from "../utils/logger";
import {
  Contact,
  IdentifyRequest,
  ConsolidatedContact,
  LinkPrecedence,
  DbOperationResult,
} from "../types/contact.types";

export class ContactService {
  private contactModel: ContactModel;

  constructor() {
    this.contactModel = new ContactModel();
  }

  /**
   * Main identity reconciliation logic
   * Handles all the complex scenarios described in the PRD
   */
  async identifyContact(
    request: IdentifyRequest
  ): Promise<DbOperationResult<ConsolidatedContact>> {
    try {
      logger.info("Starting contact identification", { request });

      // Validate input - at least one of email or phoneNumber must be provided
      if (!request.email && !request.phoneNumber) {
        return {
          success: false,
          error: "At least one of email or phoneNumber must be provided",
        };
      }

      // Find existing contacts that match the email or phone number
      const queryParams: { email?: string; phoneNumber?: string } = {};
      if (request.email) queryParams.email = request.email;
      if (request.phoneNumber) queryParams.phoneNumber = request.phoneNumber;

      const existingContactsResult =
        await this.contactModel.findByEmailOrPhone(queryParams);

      if (!existingContactsResult.success) {
        return {
          success: false,
          error: "Failed to search for existing contacts",
        };
      }

      const existingContacts = existingContactsResult.data || [];

      if (existingContacts.length === 0) {
        // No existing contacts found - create a new primary contact
        return await this.createNewPrimaryContact(request);
      }

      // Group contacts by their primary contact ID
      const contactGroups = await this.groupContactsByPrimary(existingContacts);

      if (contactGroups.length === 1) {
        // All existing contacts belong to the same primary contact
        const primaryContactId = contactGroups[0]!.primaryId;
        const shouldCreateSecondary = await this.shouldCreateSecondaryContact(
          request,
          contactGroups[0]!.contacts
        );

        if (shouldCreateSecondary) {
          await this.createSecondaryContact(request, primaryContactId);
        }

        return await this.buildConsolidatedResponse(primaryContactId);
      } else if (contactGroups.length === 2) {
        // Two different primary contacts need to be linked
        return await this.linkTwoPrimaryContacts(contactGroups, request);
      } else {
        // This shouldn't happen in normal scenarios, but handle gracefully
        logger.warn("Multiple contact groups found", {
          groupCount: contactGroups.length,
          request,
        });

        // Use the oldest primary contact
        const oldestGroup = contactGroups.reduce((oldest, current) =>
          new Date(oldest.createdAt) < new Date(current.createdAt)
            ? oldest
            : current
        );

        return await this.buildConsolidatedResponse(oldestGroup.primaryId);
      }
    } catch (error) {
      logger.error("Error in contact identification", { error, request });
      return {
        success: false,
        error: "Internal server error during contact identification",
      };
    }
  }

  /**
   * Create a new primary contact when no existing contacts are found
   */
  private async createNewPrimaryContact(
    request: IdentifyRequest
  ): Promise<DbOperationResult<ConsolidatedContact>> {
    const createParams: {
      email?: string;
      phoneNumber?: string;
      linkPrecedence: "primary";
    } = {
      linkPrecedence: "primary",
    };

    if (request.email) createParams.email = request.email;
    if (request.phoneNumber) createParams.phoneNumber = request.phoneNumber;

    const createResult = await this.contactModel.create(createParams);

    if (!createResult.success || !createResult.data) {
      return {
        success: false,
        error: "Failed to create new primary contact",
      };
    }

    logger.info("Created new primary contact", {
      contactId: createResult.data.id,
    });

    return {
      success: true,
      data: {
        primaryContactId: createResult.data.id,
        emails: createResult.data.email ? [createResult.data.email] : [],
        phoneNumbers: createResult.data.phoneNumber
          ? [createResult.data.phoneNumber]
          : [],
        secondaryContactIds: [],
      },
    };
  }

  /**
   * Group contacts by their primary contact ID
   */
  private async groupContactsByPrimary(
    contacts: Contact[]
  ): Promise<ContactGroup[]> {
    const groups: Map<string, ContactGroup> = new Map();

    for (const contact of contacts) {
      const primaryId =
        contact.linkPrecedence === "primary" ? contact.id : contact.linkedId!;

      if (!groups.has(primaryId)) {
        // Get the primary contact details
        const primaryContact =
          contact.linkPrecedence === "primary"
            ? contact
            : (await this.contactModel.getById(primaryId)).data!;

        groups.set(primaryId, {
          primaryId,
          createdAt: primaryContact.createdAt,
          contacts: [],
        });
      }

      groups.get(primaryId)!.contacts.push(contact);
    }

    return Array.from(groups.values());
  }

  /**
   * Check if a secondary contact should be created
   */
  private async shouldCreateSecondaryContact(
    request: IdentifyRequest,
    existingContacts: Contact[]
  ): Promise<boolean> {
    // Check if the exact combination already exists
    const exactMatch = existingContacts.find(
      (contact) =>
        contact.email === request.email &&
        contact.phoneNumber === request.phoneNumber
    );

    if (exactMatch) {
      return false; // Exact match exists, no need to create secondary
    }

    // Check if we have new information
    const hasNewEmail = Boolean(
      request.email &&
        !existingContacts.some((contact) => contact.email === request.email)
    );
    const hasNewPhone = Boolean(
      request.phoneNumber &&
        !existingContacts.some(
          (contact) => contact.phoneNumber === request.phoneNumber
        )
    );

    return hasNewEmail || hasNewPhone;
  }

  /**
   * Create a secondary contact linked to a primary contact
   */
  private async createSecondaryContact(
    request: IdentifyRequest,
    primaryContactId: string
  ): Promise<void> {
    const createParams: {
      email?: string;
      phoneNumber?: string;
      linkedId: string;
      linkPrecedence: "secondary";
    } = {
      linkedId: primaryContactId,
      linkPrecedence: "secondary",
    };

    if (request.email) createParams.email = request.email;
    if (request.phoneNumber) createParams.phoneNumber = request.phoneNumber;

    const createResult = await this.contactModel.create(createParams);

    if (createResult.success) {
      logger.info("Created secondary contact", {
        contactId: createResult.data?.id,
        linkedTo: primaryContactId,
      });
    }
  }

  /**
   * Link two primary contacts by converting the newer one to secondary
   */
  private async linkTwoPrimaryContacts(
    contactGroups: ContactGroup[],
    request: IdentifyRequest
  ): Promise<DbOperationResult<ConsolidatedContact>> {
    if (contactGroups.length !== 2) {
      return {
        success: false,
        error: "Expected exactly 2 contact groups for linking",
      };
    }

    // Determine which contact is older (should remain primary)
    const group1 = contactGroups[0]!;
    const group2 = contactGroups[1]!;
    const isGroup1Older =
      new Date(group1.createdAt) < new Date(group2.createdAt);

    const olderGroup = isGroup1Older ? group1 : group2;
    const newerGroup = isGroup1Older ? group2 : group1;

    logger.info("Linking two primary contacts", {
      olderPrimary: olderGroup.primaryId,
      newerPrimary: newerGroup.primaryId,
    });

    // Convert the newer primary contact to secondary
    const updateResult = await this.contactModel.update({
      id: newerGroup.primaryId,
      linkedId: olderGroup.primaryId,
      linkPrecedence: "secondary",
      updatedAt: new Date().toISOString(),
    });

    if (!updateResult.success) {
      return {
        success: false,
        error: "Failed to link primary contacts",
      };
    }

    // Update all contacts that were linked to the newer primary
    for (const contact of newerGroup.contacts) {
      if (contact.linkPrecedence === "secondary") {
        await this.contactModel.update({
          id: contact.id,
          linkedId: olderGroup.primaryId,
          linkPrecedence: "secondary",
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Create a new secondary contact for this request if needed
    const allContacts = [...olderGroup.contacts, ...newerGroup.contacts];
    const shouldCreateSecondary = await this.shouldCreateSecondaryContact(
      request,
      allContacts
    );

    if (shouldCreateSecondary) {
      await this.createSecondaryContact(request, olderGroup.primaryId);
    }

    return await this.buildConsolidatedResponse(olderGroup.primaryId);
  }

  /**
   * Build the consolidated contact response
   */
  private async buildConsolidatedResponse(
    primaryContactId: string
  ): Promise<DbOperationResult<ConsolidatedContact>> {
    const linkedContactsResult =
      await this.contactModel.getLinkedContacts(primaryContactId);

    if (!linkedContactsResult.success || !linkedContactsResult.data) {
      return {
        success: false,
        error: "Failed to retrieve linked contacts",
      };
    }

    const allContacts = linkedContactsResult.data;
    const primaryContact = allContacts.find(
      (c) => c.linkPrecedence === "primary"
    )!;
    const secondaryContacts = allContacts.filter(
      (c) => c.linkPrecedence === "secondary"
    );

    // Collect unique emails and phone numbers, with primary contact's info first
    const emails: string[] = [];
    const phoneNumbers: string[] = [];

    // Add primary contact's info first
    if (primaryContact.email) {
      emails.push(primaryContact.email);
    }
    if (primaryContact.phoneNumber) {
      phoneNumbers.push(primaryContact.phoneNumber);
    }

    // Add secondary contacts' info
    for (const contact of secondaryContacts) {
      if (contact.email && !emails.includes(contact.email)) {
        emails.push(contact.email);
      }
      if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
        phoneNumbers.push(contact.phoneNumber);
      }
    }

    const consolidatedContact: ConsolidatedContact = {
      primaryContactId: primaryContact.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryContacts.map((c) => c.id),
    };

    logger.info("Built consolidated contact response", {
      primaryContactId,
      emailCount: emails.length,
      phoneCount: phoneNumbers.length,
      secondaryCount: secondaryContacts.length,
    });

    return {
      success: true,
      data: consolidatedContact,
    };
  }
}

/**
 * Helper interface for grouping contacts
 */
interface ContactGroup {
  primaryId: string;
  createdAt: string;
  contacts: Contact[];
}

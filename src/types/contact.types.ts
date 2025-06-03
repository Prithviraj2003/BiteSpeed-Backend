export type LinkPrecedence = 'primary' | 'secondary';

/**
 * Contact model representing a customer contact in DynamoDB
 */
export interface Contact {
  id: string;
  phoneNumber?: string;
  email?: string;
  linkedId?: string; // Points to the primary contact ID
  linkPrecedence: LinkPrecedence;
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  deletedAt?: string; // ISO timestamp for soft delete
}

/**
 * Request payload for the /identify endpoint
 */
export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

/**
 * Consolidated contact response for the /identify endpoint
 */
export interface ConsolidatedContact {
  primaryContactId: string;
  emails: string[];
  phoneNumbers: string[];
  secondaryContactIds: string[];
}

/**
 * Response format for the /identify endpoint
 */
export interface IdentifyResponse {
  contact: ConsolidatedContact;
}

/**
 * Database query parameters for finding contacts
 */
export interface ContactQueryParams {
  email?: string;
  phoneNumber?: string;
}

/**
 * Contact creation parameters
 */
export interface CreateContactParams {
  phoneNumber?: string;
  email?: string;
  linkedId?: string;
  linkPrecedence: LinkPrecedence;
}

/**
 * Contact update parameters
 */
export interface UpdateContactParams {
  id: string;
  linkedId?: string;
  linkPrecedence?: LinkPrecedence;
  updatedAt: string;
} 
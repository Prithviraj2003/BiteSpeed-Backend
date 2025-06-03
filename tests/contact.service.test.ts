import { ContactService } from "../src/services/contact.service";
import { ContactModel } from "../src/models/contact.model";
import { IdentifyRequest } from "../src/types/contact.types";

// Mock the ContactModel
jest.mock("../src/models/contact.model");

describe("ContactService", () => {
  let contactService: ContactService;
  let mockContactModel: jest.Mocked<ContactModel>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new instance for each test
    contactService = new ContactService();
    mockContactModel = (contactService as any).contactModel;
  });

  describe("identifyContact", () => {
    it("should return error when neither email nor phoneNumber is provided", async () => {
      const request: IdentifyRequest = {};

      const result = await contactService.identifyContact(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe(
        "At least one of email or phoneNumber must be provided"
      );
    });

    it("should create new primary contact when no existing contacts found", async () => {
      const request: IdentifyRequest = {
        email: "test@example.com",
        phoneNumber: "123456789",
      };

      // Mock no existing contacts
      mockContactModel.findByEmailOrPhone.mockResolvedValue({
        success: true,
        data: [],
      });

      // Mock successful contact creation
      const newContact = {
        id: "contact-1",
        email: "test@example.com",
        phoneNumber: "123456789",
        linkPrecedence: "primary" as const,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      mockContactModel.create.mockResolvedValue({
        success: true,
        data: newContact,
      });

      const result = await contactService.identifyContact(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        primaryContactId: "contact-1",
        emails: ["test@example.com"],
        phoneNumbers: ["123456789"],
        secondaryContactIds: [],
      });

      expect(mockContactModel.create).toHaveBeenCalledWith({
        email: "test@example.com",
        phoneNumber: "123456789",
        linkPrecedence: "primary",
      });
    });

    it("should return existing contact when exact match found", async () => {
      const request: IdentifyRequest = {
        email: "existing@example.com",
        phoneNumber: "123456789",
      };

      const existingContact = {
        id: "contact-1",
        email: "existing@example.com",
        phoneNumber: "123456789",
        linkPrecedence: "primary" as const,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      // Mock existing contact found
      mockContactModel.findByEmailOrPhone.mockResolvedValue({
        success: true,
        data: [existingContact],
      });

      // Mock getting linked contacts
      mockContactModel.getLinkedContacts.mockResolvedValue({
        success: true,
        data: [existingContact],
      });

      const result = await contactService.identifyContact(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        primaryContactId: "contact-1",
        emails: ["existing@example.com"],
        phoneNumbers: ["123456789"],
        secondaryContactIds: [],
      });
    });

    it("should create secondary contact when partial match with new information", async () => {
      const request: IdentifyRequest = {
        email: "new@example.com",
        phoneNumber: "123456789", // Same phone, different email
      };

      const existingContact = {
        id: "contact-1",
        email: "existing@example.com",
        phoneNumber: "123456789",
        linkPrecedence: "primary" as const,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      const newSecondaryContact = {
        id: "contact-2",
        email: "new@example.com",
        phoneNumber: "123456789",
        linkedId: "contact-1",
        linkPrecedence: "secondary" as const,
        createdAt: "2023-01-02T00:00:00.000Z",
        updatedAt: "2023-01-02T00:00:00.000Z",
      };

      // Mock existing contact found
      mockContactModel.findByEmailOrPhone.mockResolvedValue({
        success: true,
        data: [existingContact],
      });

      // Mock secondary contact creation
      mockContactModel.create.mockResolvedValue({
        success: true,
        data: newSecondaryContact,
      });

      // Mock getting all linked contacts
      mockContactModel.getLinkedContacts.mockResolvedValue({
        success: true,
        data: [existingContact, newSecondaryContact],
      });

      const result = await contactService.identifyContact(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        primaryContactId: "contact-1",
        emails: ["existing@example.com", "new@example.com"],
        phoneNumbers: ["123456789"],
        secondaryContactIds: ["contact-2"],
      });

      expect(mockContactModel.create).toHaveBeenCalledWith({
        email: "new@example.com",
        phoneNumber: "123456789",
        linkedId: "contact-1",
        linkPrecedence: "secondary",
      });
    });

    it("should handle linking two primary contacts (older wins)", async () => {
      const request: IdentifyRequest = {
        email: "george@hillvalley.edu",
        phoneNumber: "717171",
      };

      // Two separate primary contacts that need to be linked
      const olderPrimary = {
        id: "contact-1",
        email: "george@hillvalley.edu",
        phoneNumber: "919191",
        linkPrecedence: "primary" as const,
        createdAt: "2023-01-01T00:00:00.000Z",
        updatedAt: "2023-01-01T00:00:00.000Z",
      };

      const newerPrimary = {
        id: "contact-2",
        email: "biffsucks@hillvalley.edu",
        phoneNumber: "717171",
        linkPrecedence: "primary" as const,
        createdAt: "2023-01-02T00:00:00.000Z",
        updatedAt: "2023-01-02T00:00:00.000Z",
      };

      // Mock finding both contacts
      mockContactModel.findByEmailOrPhone.mockResolvedValue({
        success: true,
        data: [olderPrimary, newerPrimary],
      });

      // Mock getting individual contacts for grouping
      mockContactModel.getById
        .mockResolvedValueOnce({ success: true, data: olderPrimary })
        .mockResolvedValueOnce({ success: true, data: newerPrimary });

      // Mock updating newer primary to secondary
      const updatedNewerContact = {
        ...newerPrimary,
        linkedId: "contact-1",
        linkPrecedence: "secondary" as const,
        updatedAt: "2023-01-03T00:00:00.000Z",
      };

      mockContactModel.update.mockResolvedValue({
        success: true,
        data: updatedNewerContact,
      });

      // Mock getting final linked contacts
      mockContactModel.getLinkedContacts.mockResolvedValue({
        success: true,
        data: [olderPrimary, updatedNewerContact],
      });

      const result = await contactService.identifyContact(request);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        primaryContactId: "contact-1",
        emails: ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
        phoneNumbers: ["919191", "717171"],
        secondaryContactIds: ["contact-2"],
      });

      // Verify the newer primary was converted to secondary
      expect(mockContactModel.update).toHaveBeenCalledWith({
        id: "contact-2",
        linkedId: "contact-1",
        linkPrecedence: "secondary",
        updatedAt: expect.any(String),
      });
    });

    it("should handle database errors gracefully", async () => {
      const request: IdentifyRequest = {
        email: "test@example.com",
      };

      // Mock database error
      mockContactModel.findByEmailOrPhone.mockResolvedValue({
        success: false,
        error: "Database connection failed",
      });

      const result = await contactService.identifyContact(request);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to search for existing contacts");
    });
  });
});

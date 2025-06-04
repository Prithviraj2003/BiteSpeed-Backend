import { Request, Response } from "express";
import { ContactService } from "../services/contact.service";
import { logger } from "../utils/logger";
import { IdentifyRequest, IdentifyResponse } from "../types/contact.types";
import { ApiResponse } from "../types/common.types";

export class ContactController {
  private contactService: ContactService;

  constructor() {
    this.contactService = new ContactService();
  }

  /**
   * Handle POST /identify requests
   * Main endpoint for contact identity reconciliation
   */
  async identify(req: Request, res: Response): Promise<void> {
    try {
      const identifyRequest: IdentifyRequest = req.body;

      logger.info("Received identify request", {
        email: identifyRequest.email,
        phoneNumber: identifyRequest.phoneNumber,
        ip: req.ip,
        userAgent: req.get("User-Agent"),
      });

      const result = await this.contactService.identifyContact(identifyRequest);

      if (!result.success) {
        logger.warn("Contact identification failed", {
          error: result.error,
          request: identifyRequest,
        });

        res.status(400).json({
          success: false,
          error: result.error,
          message: "Failed to identify contact",
        } as ApiResponse);
        return;
      }

      const response: IdentifyResponse = {
        contact: result.data!,
      };

      logger.info("Contact identification successful", {
        primaryContactId: result.data!.primaryContactId,
        emailCount: result.data!.emails.length,
        phoneCount: result.data!.phoneNumbers.length,
        secondaryCount: result.data!.secondaryContactIds.length,
      });

      res.status(200).json(response);
    } catch (error) {
      logger.error("Unexpected error in identify controller", {
        error,
        body: req.body,
      });

      res.status(500).json({
        success: false,
        error: "Internal server error",
        message: "An unexpected error occurred while processing your request",
      } as ApiResponse);
    }
  }

  /**
   * Health check endpoint
   */
  async health(_req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Service is healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }
}

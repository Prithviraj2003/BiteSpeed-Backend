import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { logger } from "../utils/logger";

/**
 * Validation schema for the /identify endpoint
 */
const identifySchema = Joi.object({
  email: Joi.string().email().optional(),
  phoneNumber: Joi.string().optional(),
})
  .or("email", "phoneNumber")
  .messages({
    "object.missing": "At least one of email or phoneNumber must be provided",
  });

/**
 * Middleware to validate request body against a Joi schema
 */
export function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      logger.warn("Request validation failed", {
        error: errorMessage,
        body: req.body,
        path: req.path,
      });

      return res.status(400).json({
        success: false,
        error: "Validation failed",
        message: errorMessage,
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
}

/**
 * Validation middleware specifically for the /identify endpoint
 */
export const validateIdentifyRequest = validateRequest(identifySchema);

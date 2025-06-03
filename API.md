# BiteSpeed Identity Reconciliation API

## Overview

The BiteSpeed Identity Reconciliation API helps e-commerce platforms link customer contacts across multiple purchases. When customers use different email addresses and phone numbers for different orders, this service intelligently identifies and consolidates their contact information.

## Base URL

```
http://localhost:3000
```

## Authentication

Currently, no authentication is required for this API.

## Endpoints

### POST /identify

Identifies and links customer contacts based on email and/or phone number.

#### Request

**URL:** `POST /identify`

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "string (optional)",
  "phoneNumber": "string (optional)"
}
```

**Validation Rules:**

- At least one of `email` or `phoneNumber` must be provided
- `email` must be a valid email format if provided
- Both fields are optional but cannot both be empty

#### Response

**Success Response (200 OK):**

```json
{
  "contact": {
    "primaryContactId": "string",
    "emails": ["string"],
    "phoneNumbers": ["string"],
    "secondaryContactIds": ["string"]
  }
}
```

**Error Response (400 Bad Request):**

```json
{
  "success": false,
  "error": "Validation failed",
  "message": "At least one of email or phoneNumber must be provided"
}
```

**Error Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "Internal server error",
  "message": "An unexpected error occurred while processing your request"
}
```

#### Examples

**Example 1: New Customer**

Request:

```json
{
  "email": "lorraine@hillvalley.edu",
  "phoneNumber": "123456"
}
```

Response:

```json
{
  "contact": {
    "primaryContactId": "550e8400-e29b-41d4-a716-446655440000",
    "emails": ["lorraine@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": []
  }
}
```

**Example 2: Existing Customer with New Email**

Request:

```json
{
  "email": "mcfly@hillvalley.edu",
  "phoneNumber": "123456"
}
```

Response:

```json
{
  "contact": {
    "primaryContactId": "550e8400-e29b-41d4-a716-446655440000",
    "emails": ["lorraine@hillvalley.edu", "mcfly@hillvalley.edu"],
    "phoneNumbers": ["123456"],
    "secondaryContactIds": ["550e8400-e29b-41d4-a716-446655440001"]
  }
}
```

**Example 3: Linking Two Primary Contacts**

Request:

```json
{
  "email": "george@hillvalley.edu",
  "phoneNumber": "717171"
}
```

Response:

```json
{
  "contact": {
    "primaryContactId": "550e8400-e29b-41d4-a716-446655440000",
    "emails": ["george@hillvalley.edu", "biffsucks@hillvalley.edu"],
    "phoneNumbers": ["919191", "717171"],
    "secondaryContactIds": ["550e8400-e29b-41d4-a716-446655440002"]
  }
}
```

### GET /health

Health check endpoint to verify service status.

#### Request

**URL:** `GET /health`

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Service is healthy",
  "timestamp": "2023-12-01T10:00:00.000Z",
  "version": "1.0.0"
}
```

### GET /

Root endpoint providing API information.

#### Request

**URL:** `GET /`

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "BiteSpeed Identity Reconciliation API",
  "version": "1.0.0",
  "endpoints": {
    "identify": "POST /identify",
    "health": "GET /health"
  }
}
```

## Business Logic

### Contact Linking Rules

1. **New Contact**: If no existing contacts match the provided email or phone number, a new primary contact is created.

2. **Secondary Contact Creation**: If an existing contact shares either email or phone number but the request contains new information, a secondary contact is created and linked to the primary.

3. **Primary Contact Linking**: If two separate primary contacts are found (one matching email, another matching phone), the older contact remains primary and the newer one becomes secondary.

4. **Precedence Rules**:
   - The oldest contact always becomes/remains the primary contact
   - All other contacts become secondary and link to the primary
   - Primary contact information appears first in response arrays

### Data Model

```typescript
interface Contact {
  id: string;
  phoneNumber?: string;
  email?: string;
  linkedId?: string; // Points to primary contact ID
  linkPrecedence: "primary" | "secondary";
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
  deletedAt?: string; // ISO timestamp for soft delete
}
```

## Rate Limiting

- **Window**: 15 minutes (900,000 ms)
- **Max Requests**: 100 requests per window per IP
- **Response**: 429 Too Many Requests when limit exceeded

## Error Handling

The API uses standard HTTP status codes:

- **200**: Success
- **400**: Bad Request (validation errors)
- **404**: Not Found (invalid endpoint)
- **429**: Too Many Requests (rate limit exceeded)
- **500**: Internal Server Error

All error responses include:

- `success`: false
- `error`: Error type
- `message`: Human-readable error description

## CORS

The API supports Cross-Origin Resource Sharing (CORS) and accepts requests from all origins in development mode.

## Logging

All requests and responses are logged with appropriate detail levels:

- Request details (email/phone, IP, user agent)
- Response summaries (contact counts, primary ID)
- Error details for debugging

## Performance Considerations

- Database queries are optimized for the expected access patterns
- Contact linking operations are atomic to prevent race conditions
- Response times are typically under 100ms for simple operations
- Complex linking scenarios may take up to 500ms

# BiteSpeed Identity Reconciliation Backend

A robust backend service for identity reconciliation that helps e-commerce platforms link customer contacts across multiple purchases.

## Problem Statement

FluxKart.com customers like Dr. Emmett Brown use different email addresses and phone numbers for each purchase to maintain privacy. This backend service identifies and links these different contact entries to the same customer for personalized experience.

## Features

- **Smart Contact Linking**: Links contacts based on shared email or phone numbers
- **Primary/Secondary Precedence**: Maintains data hierarchy with oldest contact as primary
- **RESTful API**: Clean `/identify` endpoint for contact reconciliation
- **Scalable Architecture**: Built with Node.js, TypeScript, and DynamoDB

## Tech Stack

- **Backend**: Node.js with TypeScript
- **Database**: DynamoDB
- **Framework**: Express.js
- **Testing**: Jest
- **Deployment**: Ready for cloud hosting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- AWS CLI configured or DynamoDB Local
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bitespeed-identity-reconciliation

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the development server
npm run dev
```

## API Documentation

### POST /identify

Identifies and links customer contacts based on email and/or phone number.

**Request Body:**

```json
{
  "email": "customer@example.com",
  "phoneNumber": "123456789"
}
```

**Response:**

```json
{
  "contact": {
    "primaryContactId": 1,
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["123456789"],
    "secondaryContactIds": [2, 3]
  }
}
```

## Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## License

This project is part of the BiteSpeed Backend Assignment.

---

Built with ❤️ for BiteSpeed Interview Process

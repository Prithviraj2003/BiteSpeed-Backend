# BiteSpeed Identity Reconciliation Backend

A robust backend service for identity reconciliation that helps e-commerce platforms link customer contacts across multiple purchases.

## Problem Statement

FluxKart.com customers like Dr. Emmett Brown use different email addresses and phone numbers for each purchase to maintain privacy. This backend service identifies and links these different contact entries to the same customer for personalized experience.

## Features

- **Smart Contact Linking**: Links contacts based on shared email or phone numbers
- **Primary/Secondary Precedence**: Maintains data hierarchy with oldest contact as primary
- **RESTful API**: Clean `/identify` endpoint for contact reconciliation
- **Scalable Architecture**: Built with Node.js, TypeScript, and DynamoDB
- **Comprehensive Testing**: Full test suite covering all business scenarios
- **Production Ready**: Proper logging, error handling, and security middleware

## Tech Stack

- **Backend**: Node.js with TypeScript
- **Database**: DynamoDB (AWS or Local)
- **Framework**: Express.js
- **Testing**: Jest
- **Validation**: Joi
- **Logging**: Winston
- **Security**: Helmet, CORS, Rate Limiting

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- DynamoDB Local (for development) or AWS account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd bitespeed-identity-reconciliation

# Install dependencies
npm install

# Set up environment variables
cp env.example .env
# Edit .env with your configuration

# Set up DynamoDB table
npm run setup:db

# Start the development server
npm run dev
```

### Environment Configuration

Create a `.env` file based on `env.example`:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# AWS DynamoDB Configuration
AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=your-access-key-id (for production)
# AWS_SECRET_ACCESS_KEY=your-secret-access-key (for production)

# DynamoDB Configuration
DYNAMODB_TABLE_NAME=contacts
DYNAMODB_ENDPOINT=http://localhost:8000
USE_LOCAL_DYNAMODB=true

# Logging
LOG_LEVEL=info

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=*
```

### Local Development with DynamoDB Local

1. **Install DynamoDB Local:**

   ```bash
   # Using Docker (recommended)
   docker run -p 8000:8000 amazon/dynamodb-local

   # Or download and run locally
   # Follow AWS DynamoDB Local documentation
   ```

2. **Create the table:**

   ```bash
   npm run setup:db
   ```

3. **Start the server:**
   ```bash
   npm run dev
   ```

## API Documentation

### POST /identify

Main endpoint for contact identity reconciliation.

**Request:**

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
    "primaryContactId": "uuid",
    "emails": ["primary@example.com", "secondary@example.com"],
    "phoneNumbers": ["123456789"],
    "secondaryContactIds": ["uuid1", "uuid2"]
  }
}
```

For detailed API documentation, see [API.md](./API.md).

## Development

### Project Structure

```
src/
├── controllers/     # HTTP request handlers
├── services/        # Business logic
├── models/          # Data access layer
├── database/        # Database configuration
├── middleware/      # Express middleware
├── utils/           # Utility functions
├── types/           # TypeScript type definitions
└── scripts/         # Database setup scripts

tests/               # Test files
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm start           # Start production server

# Testing
npm test            # Run all tests
npm run test:watch  # Run tests in watch mode
npm run test:coverage # Run tests with coverage report

# Database
npm run setup:db    # Create DynamoDB table

# Code Quality
npm run lint        # Run ESLint
npm run lint:fix    # Fix ESLint issues
npm run format      # Format code with Prettier
```

### Testing

The project includes comprehensive tests covering all business scenarios:

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode (for development)
npm run test:watch
```

Test coverage includes:

- All PRD scenarios (new contacts, secondary creation, primary linking)
- Edge cases and error handling
- Input validation
- Database error scenarios

## Deployment

### Production Environment Variables

For production deployment, set these environment variables:

```env
NODE_ENV=production
PORT=3000
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-production-access-key
AWS_SECRET_ACCESS_KEY=your-production-secret-key
DYNAMODB_TABLE_NAME=contacts-prod
USE_LOCAL_DYNAMODB=false
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com
```

### Deployment Options

#### 1. Render.com (Recommended for Demo)

1. Connect your GitHub repository to Render
2. Set environment variables in Render dashboard
3. Deploy with build command: `npm run build`
4. Start command: `npm start`

#### 2. AWS Lambda + API Gateway

1. Use AWS SAM or Serverless Framework
2. Configure DynamoDB permissions
3. Deploy with appropriate IAM roles

#### 3. Traditional VPS/Container

1. Build the application: `npm run build`
2. Set production environment variables
3. Start with PM2 or similar process manager
4. Configure reverse proxy (nginx)

### Database Setup in Production

The application will automatically create the DynamoDB table if it doesn't exist. Ensure your AWS credentials have the necessary permissions:

- `dynamodb:CreateTable`
- `dynamodb:DescribeTable`
- `dynamodb:PutItem`
- `dynamodb:GetItem`
- `dynamodb:UpdateItem`
- `dynamodb:Scan`
- `dynamodb:Query`

## Performance Considerations

- **Database Indexing**: Uses Global Secondary Indexes for efficient email/phone lookups
- **Connection Pooling**: Optimized DynamoDB client configuration
- **Rate Limiting**: Prevents abuse with configurable limits
- **Logging**: Structured logging for monitoring and debugging
- **Error Handling**: Graceful error handling with proper HTTP status codes

## Monitoring and Logging

The application provides comprehensive logging:

- **Request/Response Logging**: All API calls with timing
- **Business Logic Logging**: Contact creation and linking events
- **Error Logging**: Detailed error information for debugging
- **Health Checks**: `/health` endpoint for monitoring

## Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin resource sharing
- **Rate Limiting**: Protection against abuse
- **Input Validation**: Joi schema validation
- **Error Sanitization**: No sensitive data in error responses

## Contributing

1. Make small, focused commits with clear messages
2. Follow TypeScript best practices
3. Add tests for new functionality
4. Update documentation as needed
5. Ensure all tests pass before submitting

## Assignment Compliance

This implementation fulfills all requirements from the BiteSpeed Backend Task:

✅ **POST /identify endpoint** with exact response format  
✅ **Contact linking logic** as specified in PRD  
✅ **Primary/Secondary precedence** with oldest-contact-wins  
✅ **All PRD scenarios** implemented and tested  
✅ **TypeScript + Node.js** as requested  
✅ **DynamoDB** for data persistence  
✅ **Small, insightful commits** throughout development  
✅ **Production-ready** with proper error handling  
✅ **Hosted deployment** ready configuration

## Live Demo

🚀 **API Endpoint**: [Will be updated with deployment URL]

**Test the API:**

```bash
curl -X POST https://your-deployment-url/identify \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","phoneNumber":"123456789"}'
```

## License

This project is part of the BiteSpeed Backend Assignment.

---

Built with ❤️ for BiteSpeed Interview Process

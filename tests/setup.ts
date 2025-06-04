// Test setup file for Jest
// This file is executed before each test file

// Set test environment variables
process.env["NODE_ENV"] = "test";
process.env["DYNAMODB_TABLE_NAME"] = "contacts-test";
process.env["USE_LOCAL_DYNAMODB"] = "true";
process.env["DYNAMODB_ENDPOINT"] = "http://localhost:8000";
process.env["LOG_LEVEL"] = "error"; // Reduce log noise during tests

// Mock console methods to reduce test output noise
const originalConsole = { ...console };

beforeAll(() => {
  // You can mock console methods here if needed for cleaner test output
});

afterAll(() => {
  // Restore console methods
  Object.assign(console, originalConsole);
});

// Global test timeout
jest.setTimeout(30000);

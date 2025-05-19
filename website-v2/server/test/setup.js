/**
 * Global test setup
 */
const Lab = require('@hapi/lab');
const Code = require('@hapi/code');
const jwt = require('jsonwebtoken');
const { setupTestDb, teardownTestDb, createMockData } = require('./helpers/db-setup');

exports.lab = Lab.script();
const { expect } = Code;
const { before, after, beforeEach, afterEach, describe, it } = exports.lab;

// Set test environment
process.env.NODE_ENV = 'test';
process.env.PORT = 5001; // Use a different port for tests
process.env.JWT_SECRET = 'test-jwt-secret';

// Test data container
const testData = {
  users: null,
  agents: null,
  papers: null,
  categories: null,
  matches: null,
  tokens: {}
};

// Server instance
let serverInstance = null;

// Setup before all tests
before(async () => {
  // Initialize test database
  await setupTestDb();
  
  // Load the server
  const server = require('../server');
  serverInstance = await server.init();
  
  // Create and store test data
  const data = await createMockData();
  Object.assign(testData, data);
  
  // Create JWT tokens for test users
  testData.users.forEach(user => {
    testData.tokens[user.id] = jwt.sign(
      { id: user.id, username: user.username, github_id: user.github_id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });
});

// Cleanup after all tests
after(async () => {
  // Close server
  if (serverInstance) {
    await serverInstance.stop();
  }
  
  // Cleanup database
  await teardownTestDb();
});

// Reset database between test suites if needed
const resetDatabase = async () => {
  await teardownTestDb();
  const data = await createMockData();
  Object.assign(testData, data);
};

// Export test utilities and data
module.exports = {
  expect,
  before,
  after,
  beforeEach,
  afterEach, 
  describe,
  it,
  testData,
  serverInstance,
  resetDatabase
}; 
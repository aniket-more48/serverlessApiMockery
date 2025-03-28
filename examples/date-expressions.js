// File: examples/date-expressions.js
/**
 * Example demonstrating the use of date expressions in ServerlessApiMockery
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that use date expressions
const initialData = {
  routes: [
    {
      id: 'getCurrentTime',
      method: 'GET',
      path: '/time',
      statusCode: 200,
      response: {
        currentTimestamp: '{date:currentDate}',
        message: 'Current server time in epoch seconds'
      }
    },
    {
      id: 'getExpiryTime',
      method: 'GET',
      path: '/expiry',
      statusCode: 200,
      response: {
        currentTimestamp: '{date:currentDate}',
        expiryTimestamp: '{date:currentDate+3600}', // 1 hour from now
        message: 'Token expires in 1 hour'
      }
    },
    {
      id: 'getSessionTimes',
      method: 'GET',
      path: '/session',
      statusCode: 200,
      response: {
        createdAt: '{date:currentDate-600}', // 10 minutes ago
        currentTime: '{date:currentDate}',
        expiresAt: '{date:currentDate+1800}', // 30 minutes from now
        message: 'Session information'
      }
    },
    {
      id: 'createAuthToken',
      method: 'POST',
      path: '/auth/token',
      statusCode: 201,
      response: {
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        issuedAt: '{date:currentDate}',
        expiresAt: '{date:currentDate+86400}', // 24 hours from now
        refreshExpiresAt: '{date:currentDate+604800}', // 7 days from now
        username: '{body.username}'
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with date expressions');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Date expressions example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('  GET http://localhost:3000/time');
  console.log('  GET http://localhost:3000/expiry');
  console.log('  GET http://localhost:3000/session');
  console.log('  POST http://localhost:3000/auth/token (with username in body)');
});
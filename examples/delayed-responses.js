// File: examples/delayed-responses.js
/**
 * Example demonstrating the use of delayed responses in ServerlessApiMockery
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that use different delay times
const initialData = {
  routes: [
    {
      id: 'noDelay',
      method: 'GET',
      path: '/no-delay',
      statusCode: 200,
      // No delay specified - will respond immediately
      response: {
        message: 'Immediate response',
        description: 'This response has no delay',
        delay: '0ms'
      }
    },
    {
      id: 'shortDelay',
      method: 'GET',
      path: '/short-delay',
      statusCode: 200,
      delay: 500, // 500ms delay
      response: {
        message: 'Short delay response',
        description: 'This response has a 500ms delay',
        delay: '500ms'
      }
    },
    {
      id: 'mediumDelay',
      method: 'GET',
      path: '/medium-delay',
      statusCode: 200,
      delay: 2000, // 2 second delay
      response: {
        message: 'Medium delay response',
        description: 'This response has a 2 second delay',
        delay: '2000ms'
      }
    },
    {
      id: 'longDelay',
      method: 'GET',
      path: '/long-delay',
      statusCode: 200,
      delay: 5000, // 5 second delay
      response: {
        message: 'Long delay response',
        description: 'This response has a 5 second delay',
        delay: '5000ms'
      }
    },
    {
      id: 'simulateSlowDatabase',
      method: 'GET',
      path: '/users/:id',
      statusCode: 200,
      delay: 1500, // 1.5 second delay to simulate database query
      response: {
        id: '{params.id}',
        name: 'User {params.id}',
        email: 'user{params.id}@example.com',
        description: 'This response simulates a slow database query (1.5s delay)'
      }
    },
    {
      id: 'simulateNetworkLatency',
      method: 'POST',
      path: '/api/data',
      statusCode: 201,
      delay: 800, // 800ms delay to simulate network latency
      response: {
        success: true,
        message: 'Data created successfully',
        id: '12345',
        description: 'This response simulates network latency (800ms delay)'
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with delayed response examples');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Delayed responses example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('  GET http://localhost:3000/no-delay');
  console.log('  GET http://localhost:3000/short-delay');
  console.log('  GET http://localhost:3000/medium-delay');
  console.log('  GET http://localhost:3000/long-delay');
  console.log('  GET http://localhost:3000/users/123');
  console.log('  POST http://localhost:3000/api/data');
});
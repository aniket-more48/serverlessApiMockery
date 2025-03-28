// File: examples/basic-usage.js
/**
 * Basic example demonstrating the minimal setup for ServerlessApiMockery
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with some basic routes
const initialData = {
  routes: [
    {
      id: 'helloWorld',
      method: 'GET',
      path: '/hello',
      statusCode: 200,
      response: {
        message: 'Hello, World!',
        timestamp: new Date().toISOString()
      }
    },
    {
      id: 'getStatus',
      method: 'GET',
      path: '/status',
      statusCode: 200,
      response: {
        status: 'OK',
        version: '1.0.0',
        serverTime: new Date().toISOString()
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with basic routes');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Basic example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('  GET http://localhost:3000/hello');
  console.log('  GET http://localhost:3000/status');
  console.log('  GET http://localhost:3000/mock-data (to view the API configuration)');
});
// File: examples/lambda-handler.js
/**
 * AWS Lambda handler for ServerlessApiMockery
 * 
 * This file demonstrates how to create a Lambda handler that uses
 * ServerlessApiMockery to provide mock API responses.
 */
const serverless = require('serverless-http');
const express = require('express');
const ServerlessApiMockery = require('../index');
const { StorageAdapter } = require('../lib/storage');

// Create Express app
const app = express();
app.use(express.json());

// Create a mock API with S3 storage
const mockApi = new ServerlessApiMockery({
  storage: new StorageAdapter.S3({
    bucket: process.env.S3_BUCKET || 'mock-api-bucket',
    key: process.env.S3_KEY || 'mock-api-data.json',
    region: process.env.AWS_REGION || 'us-east-1'
  }),
  cacheTtl: 300000 // 5 minutes cache to reduce S3 calls
});

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: process.env.AWS_REGION,
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION
  });
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Create the serverless handler
const handler = serverless(app);

// Export the handler function
exports.handler = async (event, context) => {
  // Log the incoming request (useful for debugging)
  console.log('Received event:', JSON.stringify(event, null, 2));
  
  try {
    // Process the request with serverless-http
    const result = await handler(event, context);
    return result;
  } catch (error) {
    console.error('Error handling request:', error);
    
    // Return a proper API Gateway response for errors
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};

// For local testing
if (require.main === module) {
  // Default routes for testing
  const initialData = {
    routes: [
      {
        id: 'getUsers',
        method: 'GET',
        path: '/users',
        statusCode: 200,
        response: {
          users: [
            { id: 1, name: 'User 1' },
            { id: 2, name: 'User 2' }
          ],
          timestamp: '{date:currentDate}'
        }
      },
      {
        id: 'getUserById',
        method: 'GET',
        path: '/users/:id',
        statusCode: 200,
        response: {
          id: '{params.id}',
          name: 'User {params.id}',
          timestamp: '{date:currentDate}'
        }
      },
      {
        id: 'createUser',
        method: 'POST',
        path: '/users',
        statusCode: 201,
        response: {
          success: true,
          id: '12345',
          username: '{body.username}',
          timestamp: '{date:currentDate}'
        }
      }
    ]
  };
  
  // For local testing, switch to memory storage
  mockApi.storage = new StorageAdapter.Memory();
  
  // Initialize the mock data
  mockApi.saveApiData(initialData).then(() => {
    console.log('Mock API data initialized for local testing');
    
    // Start a local server
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Lambda handler running locally on port ${PORT}`);
      console.log('Try the following endpoints:');
      console.log('  GET http://localhost:3000/health');
      console.log('  GET http://localhost:3000/users');
      console.log('  GET http://localhost:3000/users/123');
      console.log('  POST http://localhost:3000/users (with username in body)');
      console.log('  GET http://localhost:3000/mock-data (to view the API configuration)');
    });
  });
}
// File: examples/aws-lambda.js
/**
 * Example demonstrating how to use ServerlessApiMockery with AWS Lambda
 * 
 * This file would be deployed to AWS Lambda using a service like
 * AWS SAM, Serverless Framework, or AWS CDK.
 */
const serverless = require('serverless-http');
const express = require('express');
const ServerlessApiMockery = require('../index');
const { StorageAdapter } = require('../lib/storage');

// Create Express app
const app = express();
app.use(express.json());

// Create a mock API with S3 storage for persistence across Lambda invocations
const mockApi = new ServerlessApiMockery({
  storage: new StorageAdapter.S3({
    bucket: process.env.S3_BUCKET || 'my-mock-api-bucket',
    key: process.env.S3_KEY || 'mock-api-data.json',
    region: process.env.AWS_REGION || 'us-east-1'
    // AWS credentials will be automatically loaded from environment variables
    // or from the Lambda execution role
  }),
  cacheTtl: 300000 // 5 minutes cache to reduce S3 calls
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Add a simple health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Export the serverless handler
exports.handler = serverless(app);

/**
 * For local testing, you can uncomment the following code:
 */
/*
if (require.main === module) {
  // This code only runs when the file is executed directly (not when imported)
  
  // Initialize with some example routes
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
          ]
        }
      },
      {
        id: 'getUserById',
        method: 'GET',
        path: '/users/:id',
        statusCode: 200,
        response: {
          id: '{params.id}',
          name: 'User {params.id}'
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
          username: '{body.username}'
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
      console.log(`Lambda example server running locally on port ${PORT}`);
      console.log('Try the following endpoints:');
      console.log('  GET http://localhost:3000/users');
      console.log('  GET http://localhost:3000/users/123');
      console.log('  POST http://localhost:3000/users (with username in body)');
      console.log('  GET http://localhost:3000/mock-data (to view the API configuration)');
    });
  });
}
*/
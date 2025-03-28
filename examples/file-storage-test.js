// File: examples/file-storage-test.js
/**
 * Example demonstrating how to use the mock API routes JSON file for testing
 * 
 * This example shows how to:
 * 1. Load the mock API routes from a JSON file
 * 2. Use the file storage adapter for persistence
 * 3. Run tests against the mock API
 */
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const request = require('supertest');
const ServerlessApiMockery = require('../index');
const { StorageAdapter } = require('../lib/storage');

// Path to the example mock API routes JSON file
const mockApiRoutesPath = path.join(__dirname, 'mock-api-routes.json');

// Function to run the example
async function runExample() {
  try {
    // Create Express app
    const app = express();
    app.use(express.json());
    
    // Check if the mock API routes file exists
    try {
      await fs.access(mockApiRoutesPath);
      console.log(`Using existing mock API routes file at: ${mockApiRoutesPath}`);
    } catch (error) {
      console.error(`Mock API routes file not found at: ${mockApiRoutesPath}`);
      console.error('Please make sure the file exists before running this example.');
      process.exit(1);
    }
    
    // Create a mock API with file system storage
    const mockApi = new ServerlessApiMockery({
      storage: new StorageAdapter.FileSystem({
        filePath: mockApiRoutesPath
      })
    });
    
    // Add management routes
    mockApi.setupManagementRoutes(app);
    
    // Use the mock API middleware
    app.use(mockApi.middleware());
    
    // Start the server
    const PORT = process.env.PORT || 3000;
    const server = app.listen(PORT, () => {
      console.log(`File storage test server running on port ${PORT}`);
      console.log('Running tests against the mock API...');
      
      // Run tests after the server starts
      runTests(app, server);
    });
  } catch (error) {
    console.error('Error running example:', error);
  }
}

// Function to run tests against the mock API
async function runTests(app, server) {
  try {
    console.log('\n--- Running Tests ---\n');
    
    // Test 1: Get user by ID
    console.log('Test 1: Get user by ID');
    const getUserResponse = await request(app)
      .get('/users/123')
      .expect('Content-Type', /json/)
      .expect(200);
    
    console.log('Response:', JSON.stringify(getUserResponse.body, null, 2));
    console.log('Test 1 passed: ✅\n');
    
    // Test 2: Search users with query parameters
    console.log('Test 2: Search users with query parameters');
    const searchUsersResponse = await request(app)
      .get('/users?q=john&sort=name&page=1&limit=10')
      .expect('Content-Type', /json/)
      .expect(200);
    
    console.log('Response:', JSON.stringify(searchUsersResponse.body, null, 2));
    console.log('Test 2 passed: ✅\n');
    
    // Test 3: Create a user
    console.log('Test 3: Create a user');
    const createUserResponse = await request(app)
      .post('/users')
      .send({
        username: 'newuser',
        email: 'newuser@example.com',
        firstName: 'New',
        lastName: 'User'
      })
      .expect('Content-Type', /json/)
      .expect(201);
    
    console.log('Response:', JSON.stringify(createUserResponse.body, null, 2));
    console.log('Test 3 passed: ✅\n');
    
    // Test 4: Get auth token
    console.log('Test 4: Get auth token');
    const authTokenResponse = await request(app)
      .post('/auth/token')
      .send({
        username: 'testuser',
        password: 'password123'
      })
      .expect('Content-Type', /json/)
      .expect(200);
    
    console.log('Response:', JSON.stringify(authTokenResponse.body, null, 2));
    console.log('Test 4 passed: ✅\n');
    
    // Test 5: Get product by ID
    console.log('Test 5: Get product by ID');
    const getProductResponse = await request(app)
      .get('/products/p123')
      .expect('Content-Type', /json/)
      .expect(200);
    
    console.log('Response:', JSON.stringify(getProductResponse.body, null, 2));
    console.log('Test 5 passed: ✅\n');
    
    // Test 6: Create an order
    console.log('Test 6: Create an order');
    const createOrderResponse = await request(app)
      .post('/orders')
      .send({
        customer: {
          name: 'Test Customer',
          email: 'customer@example.com',
          address: '123 Test St'
        },
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 }
        ],
        total: 249.97,
        paymentMethod: 'credit_card'
      })
      .expect('Content-Type', /json/)
      .expect(201);
    
    console.log('Response:', JSON.stringify(createOrderResponse.body, null, 2));
    console.log('Test 6 passed: ✅\n');
    
    // Test 7: Test error response
    console.log('Test 7: Test error response');
    const errorResponse = await request(app)
      .get('/error/not-found')
      .expect('Content-Type', /json/)
      .expect(404);
    
    console.log('Response:', JSON.stringify(errorResponse.body, null, 2));
    console.log('Test 7 passed: ✅\n');
    
    console.log('All tests passed! ✅');
    
    // Close the server after tests
    server.close(() => {
      console.log('Server closed');
    });
  } catch (error) {
    console.error('Test failed:', error);
    server.close(() => {
      process.exit(1);
    });
  }
}

// Run the example
runExample();
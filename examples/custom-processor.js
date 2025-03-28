// File: examples/custom-processor.js
/**
 * Example demonstrating how to extend the response processor with custom functionality
 */
const express = require('express');
const ServerlessApiMockery = require('../index');
const MockApiResponseProcessor = require('../lib/processor');

// Create Express app
const app = express();
app.use(express.json());

// Extend the MockApiResponseProcessor with custom functionality
class CustomResponseProcessor extends MockApiResponseProcessor {
  constructor() {
    super();
    console.log('Custom response processor initialized');
  }
  
  // Add a custom method to generate random data
  processRandomExpression(expression) {
    if (expression === 'uuid') {
      // Generate a simple UUID-like string
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    
    if (expression === 'number') {
      // Generate a random number between 1 and 1000
      return Math.floor(Math.random() * 1000) + 1;
    }
    
    if (expression.startsWith('number:')) {
      // Generate a random number in a specific range
      // Format: number:min-max
      const range = expression.split(':')[1];
      const [min, max] = range.split('-').map(Number);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    if (expression === 'boolean') {
      // Generate a random boolean
      return Math.random() >= 0.5;
    }
    
    if (expression === 'name') {
      // Generate a random name
      const names = ['John', 'Jane', 'Alice', 'Bob', 'Charlie', 'Diana', 'Edward', 'Fiona'];
      return names[Math.floor(Math.random() * names.length)];
    }
    
    return null;
  }
  
  // Override the interpolateString method to add support for random expressions
  interpolateString(str, params) {
    // First process with the parent method to handle standard expressions
    let result = super.interpolateString(str, params);
    
    // Then process our custom random expressions
    result = result.replace(/\{random:([^}]+)\}/g, (match, expression) => {
      const value = this.processRandomExpression(expression);
      return value !== null ? value : match;
    });
    
    return result;
  }
}

// Create a mock API with our custom processor
const mockApi = new ServerlessApiMockery();

// Replace the default processor with our custom one
mockApi.processor = new CustomResponseProcessor();

// Initialize with routes that use our custom random expressions
const initialData = {
  routes: [
    {
      id: 'getRandomUser',
      method: 'GET',
      path: '/random/user',
      statusCode: 200,
      response: {
        id: '{random:uuid}',
        name: '{random:name}',
        age: '{random:number:18-65}',
        isActive: '{random:boolean}',
        score: '{random:number}',
        createdAt: '{date:currentDate}',
        message: 'This response includes random data'
      }
    },
    {
      id: 'getRandomUsers',
      method: 'GET',
      path: '/random/users',
      statusCode: 200,
      response: {
        users: [
          {
            id: '{random:uuid}',
            name: '{random:name}',
            age: '{random:number:20-40}',
            isActive: '{random:boolean}'
          },
          {
            id: '{random:uuid}',
            name: '{random:name}',
            age: '{random:number:20-40}',
            isActive: '{random:boolean}'
          },
          {
            id: '{random:uuid}',
            name: '{random:name}',
            age: '{random:number:20-40}',
            isActive: '{random:boolean}'
          }
        ],
        total: 3,
        timestamp: '{date:currentDate}'
      }
    },
    {
      id: 'createRandomOrder',
      method: 'POST',
      path: '/random/orders',
      statusCode: 201,
      response: {
        orderId: '{random:uuid}',
        customer: '{body.customer}',
        items: '{body.items}',
        total: '{body.total}',
        trackingNumber: 'TRK-{random:number}',
        estimatedDelivery: '{date:currentDate+259200}', // 3 days from now
        timestamp: '{date:currentDate}'
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with custom processor examples');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Custom processor example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('  GET http://localhost:3000/random/user');
  console.log('  GET http://localhost:3000/random/users');
  console.log('  POST http://localhost:3000/random/orders');
  console.log('    Body: { "customer": "John Doe", "items": [{ "id": "p1", "quantity": 2 }], "total": 39.98 }');
});
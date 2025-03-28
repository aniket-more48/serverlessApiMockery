// File: examples/combined-features.js
/**
 * Example demonstrating multiple features of ServerlessApiMockery combined
 * - Path parameters
 * - Query parameters
 * - Request body
 * - Date expressions
 * - Custom headers
 * - Response delays
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that combine multiple features
const initialData = {
  routes: [
    // E-commerce API example
    {
      id: 'getProducts',
      method: 'GET',
      path: '/products',
      statusCode: 200,
      headers: {
        'Cache-Control': 'max-age=3600',
        'X-API-Version': '1.0.0'
      },
      delay: 300, // Simulate network delay
      response: {
        timestamp: '{date:currentDate}',
        category: '{query.category}',
        sort: '{query.sort}',
        page: '{query.page}',
        limit: '{query.limit}',
        products: [
          { id: 'p1', name: 'Product 1', price: 19.99 },
          { id: 'p2', name: 'Product 2', price: 29.99 },
          { id: 'p3', name: 'Product 3', price: 39.99 }
        ]
      }
    },
    {
      id: 'getProductById',
      method: 'GET',
      path: '/products/:id',
      statusCode: 200,
      headers: {
        'Cache-Control': 'max-age=3600',
        'X-API-Version': '1.0.0'
      },
      delay: 200,
      response: {
        id: '{params.id}',
        name: 'Product {params.id}',
        description: 'Detailed description of product {params.id}',
        price: 19.99,
        inStock: true,
        timestamp: '{date:currentDate}'
      }
    },
    {
      id: 'createOrder',
      method: 'POST',
      path: '/orders',
      statusCode: 201,
      headers: {
        'Location': '/orders/ord-12345'
      },
      delay: 800, // Simulate processing time
      response: {
        success: true,
        orderId: 'ord-12345',
        timestamp: '{date:currentDate}',
        customer: {
          name: '{body.customer.name}',
          email: '{body.customer.email}'
        },
        items: '{body.items}',
        total: '{body.total}',
        estimatedDelivery: '{date:currentDate+432000}' // 5 days from now
      }
    },
    
    // Authentication API example
    {
      id: 'login',
      method: 'POST',
      path: '/auth/login',
      statusCode: 200,
      delay: 500, // Simulate authentication processing
      response: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        username: '{body.username}',
        issuedAt: '{date:currentDate}',
        expiresAt: '{date:currentDate+3600}' // 1 hour from now
      }
    },
    {
      id: 'refreshToken',
      method: 'POST',
      path: '/auth/refresh',
      statusCode: 200,
      delay: 300,
      response: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        issuedAt: '{date:currentDate}',
        expiresAt: '{date:currentDate+3600}' // 1 hour from now
      }
    },
    
    // User profile API example
    {
      id: 'getUserProfile',
      method: 'GET',
      path: '/users/:userId/profile',
      statusCode: 200,
      headers: {
        'Cache-Control': 'no-cache',
        'X-API-Version': '1.0.0'
      },
      delay: 400,
      response: {
        id: '{params.userId}',
        username: 'user{params.userId}',
        email: 'user{params.userId}@example.com',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          bio: 'Software developer'
        },
        lastLogin: '{date:currentDate-86400}', // 1 day ago
        memberSince: '{date:currentDate-2592000}', // 30 days ago
        requestTimestamp: '{date:currentDate}'
      }
    },
    {
      id: 'updateUserProfile',
      method: 'PUT',
      path: '/users/:userId/profile',
      statusCode: 200,
      delay: 600,
      response: {
        success: true,
        id: '{params.userId}',
        updatedFields: {
          firstName: '{body.firstName}',
          lastName: '{body.lastName}',
          bio: '{body.bio}'
        },
        updatedAt: '{date:currentDate}'
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with combined features');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Combined features example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('\nE-commerce API:');
  console.log('  GET http://localhost:3000/products?category=electronics&sort=price&page=1&limit=10');
  console.log('  GET http://localhost:3000/products/p123');
  console.log('  POST http://localhost:3000/orders');
  console.log('    Body: { "customer": { "name": "John Doe", "email": "john@example.com" }, "items": [{ "id": "p1", "quantity": 2 }], "total": 39.98 }');
  
  console.log('\nAuthentication API:');
  console.log('  POST http://localhost:3000/auth/login');
  console.log('    Body: { "username": "johndoe", "password": "password123" }');
  console.log('  POST http://localhost:3000/auth/refresh');
  console.log('    Body: { "refreshToken": "old-token" }');
  
  console.log('\nUser Profile API:');
  console.log('  GET http://localhost:3000/users/123/profile');
  console.log('  PUT http://localhost:3000/users/123/profile');
  console.log('    Body: { "firstName": "John", "lastName": "Doe", "bio": "Software Engineer" }');
  
  console.log('\nManagement API:');
  console.log('  GET http://localhost:3000/mock-data (to view the API configuration)');
});
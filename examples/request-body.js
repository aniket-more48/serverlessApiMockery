// File: examples/request-body.js
/**
 * Example demonstrating the use of request body data in ServerlessApiMockery
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that use request body data
const initialData = {
  routes: [
    {
      id: 'createUser',
      method: 'POST',
      path: '/users',
      statusCode: 201,
      response: {
        success: true,
        message: 'User created successfully',
        user: {
          id: '12345',
          username: '{body.username}',
          email: '{body.email}',
          firstName: '{body.firstName}',
          lastName: '{body.lastName}',
          createdAt: new Date().toISOString()
        }
      }
    },
    {
      id: 'updateUser',
      method: 'PUT',
      path: '/users/:id',
      statusCode: 200,
      response: {
        success: true,
        message: 'User updated successfully',
        userId: '{params.id}',
        updatedFields: {
          username: '{body.username}',
          email: '{body.email}',
          profile: {
            firstName: '{body.profile.firstName}',
            lastName: '{body.profile.lastName}',
            bio: '{body.profile.bio}'
          }
        },
        updatedAt: new Date().toISOString()
      }
    },
    {
      id: 'login',
      method: 'POST',
      path: '/auth/login',
      statusCode: 200,
      response: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        user: {
          username: '{body.username}',
          email: '{body.email}'
        },
        expiresIn: 3600
      }
    },
    {
      id: 'createOrder',
      method: 'POST',
      path: '/orders',
      statusCode: 201,
      response: {
        success: true,
        orderId: 'ORD-12345',
        customer: {
          name: '{body.customer.name}',
          email: '{body.customer.email}',
          address: '{body.customer.address}'
        },
        items: '{body.items}',
        total: '{body.total}',
        paymentMethod: '{body.paymentMethod}',
        createdAt: new Date().toISOString()
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with request body examples');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Request body example server running on port ${PORT}`);
  console.log('Try the following endpoints with appropriate request bodies:');
  console.log('  POST http://localhost:3000/users');
  console.log('    Body: { "username": "johndoe", "email": "john@example.com", "firstName": "John", "lastName": "Doe" }');
  console.log('  PUT http://localhost:3000/users/123');
  console.log('    Body: { "username": "johndoe", "email": "john@example.com", "profile": { "firstName": "John", "lastName": "Doe", "bio": "Software Developer" } }');
  console.log('  POST http://localhost:3000/auth/login');
  console.log('    Body: { "username": "johndoe", "email": "john@example.com", "password": "password123" }');
  console.log('  POST http://localhost:3000/orders');
  console.log('    Body: { "customer": { "name": "John Doe", "email": "john@example.com", "address": "123 Main St" }, "items": [{ "id": "item1", "quantity": 2 }], "total": 59.98, "paymentMethod": "credit_card" }');
});
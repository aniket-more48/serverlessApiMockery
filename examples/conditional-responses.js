// File: examples/conditional-responses.js
/**
 * Example demonstrating how to implement conditional responses
 * based on request parameters
 * 
 * Note: This example extends the core functionality by adding
 * a custom middleware to handle conditional responses.
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that will be used for conditional responses
const initialData = {
  routes: [
    // Success response
    {
      id: 'loginSuccess',
      method: 'POST',
      path: '/auth/login/success',
      statusCode: 200,
      response: {
        success: true,
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        username: '{body.username}',
        expiresAt: '{date:currentDate+3600}'
      }
    },
    // Error response - invalid credentials
    {
      id: 'loginInvalidCredentials',
      method: 'POST',
      path: '/auth/login/invalid-credentials',
      statusCode: 401,
      response: {
        success: false,
        error: 'Invalid username or password',
        errorCode: 'AUTH_INVALID_CREDENTIALS'
      }
    },
    // Error response - account locked
    {
      id: 'loginAccountLocked',
      method: 'POST',
      path: '/auth/login/account-locked',
      statusCode: 403,
      response: {
        success: false,
        error: 'Account is locked due to too many failed attempts',
        errorCode: 'AUTH_ACCOUNT_LOCKED',
        unlockTime: '{date:currentDate+1800}' // 30 minutes from now
      }
    },
    // Success response for user retrieval
    {
      id: 'getUserSuccess',
      method: 'GET',
      path: '/users/success/:id',
      statusCode: 200,
      response: {
        id: '{params.id}',
        username: 'user{params.id}',
        email: 'user{params.id}@example.com',
        isActive: true
      }
    },
    // Error response for user not found
    {
      id: 'getUserNotFound',
      method: 'GET',
      path: '/users/not-found/:id',
      statusCode: 404,
      response: {
        success: false,
        error: 'User not found',
        errorCode: 'USER_NOT_FOUND',
        userId: '{params.id}'
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with conditional response examples');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Custom middleware to handle conditional responses
app.use((req, res, next) => {
  // Only intercept specific endpoints
  if (req.path === '/auth/login') {
    // Determine which response to send based on request body
    const username = req.body?.username;
    const password = req.body?.password;
    
    if (!username || !password) {
      // Redirect to invalid credentials response
      req.url = '/auth/login/invalid-credentials';
    } else if (username === 'locked') {
      // Redirect to account locked response
      req.url = '/auth/login/account-locked';
    } else {
      // Redirect to success response
      req.url = '/auth/login/success';
    }
  } 
  else if (req.path.startsWith('/users/') && !req.path.includes('/success/') && !req.path.includes('/not-found/')) {
    // Extract user ID from path
    const parts = req.path.split('/');
    const userId = parts[parts.length - 1];
    
    // Determine which response to send based on user ID
    if (userId === '404' || userId === 'unknown') {
      // Redirect to not found response
      req.url = `/users/not-found/${userId}`;
    } else {
      // Redirect to success response
      req.url = `/users/success/${userId}`;
    }
  }
  
  next();
});

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Conditional responses example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('\nLogin API (conditional responses):');
  console.log('  POST http://localhost:3000/auth/login');
  console.log('    Body: { "username": "johndoe", "password": "password123" } -> Success response');
  console.log('    Body: { "username": "locked", "password": "password123" } -> Account locked response');
  console.log('    Body: {} -> Invalid credentials response');
  
  console.log('\nUser API (conditional responses):');
  console.log('  GET http://localhost:3000/users/123 -> Success response');
  console.log('  GET http://localhost:3000/users/404 -> Not found response');
  console.log('  GET http://localhost:3000/users/unknown -> Not found response');
  
  console.log('\nDirect access to specific responses:');
  console.log('  POST http://localhost:3000/auth/login/success');
  console.log('  POST http://localhost:3000/auth/login/invalid-credentials');
  console.log('  POST http://localhost:3000/auth/login/account-locked');
  console.log('  GET http://localhost:3000/users/success/123');
  console.log('  GET http://localhost:3000/users/not-found/123');
});
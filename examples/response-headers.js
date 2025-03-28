// File: examples/response-headers.js
/**
 * Example demonstrating the use of custom response headers in ServerlessApiMockery
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that use custom headers
const initialData = {
  routes: [
    {
      id: 'basicHeaders',
      method: 'GET',
      path: '/basic-headers',
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0.0',
        'X-Request-ID': '12345'
      },
      response: {
        message: 'Response with basic headers',
        description: 'This response includes Content-Type, X-API-Version, and X-Request-ID headers'
      }
    },
    {
      id: 'cacheControl',
      method: 'GET',
      path: '/cache-control',
      statusCode: 200,
      headers: {
        'Cache-Control': 'max-age=3600, public',
        'ETag': '"abc123"',
        'Last-Modified': new Date().toUTCString()
      },
      response: {
        message: 'Response with cache control headers',
        description: 'This response includes Cache-Control, ETag, and Last-Modified headers'
      }
    },
    {
      id: 'corsHeaders',
      method: 'GET',
      path: '/cors',
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      },
      response: {
        message: 'Response with CORS headers',
        description: 'This response includes CORS headers for cross-origin requests'
      }
    },
    {
      id: 'securityHeaders',
      method: 'GET',
      path: '/security',
      statusCode: 200,
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'"
      },
      response: {
        message: 'Response with security headers',
        description: 'This response includes security headers to protect against common web vulnerabilities'
      }
    },
    {
      id: 'customHeaders',
      method: 'GET',
      path: '/custom',
      statusCode: 200,
      headers: {
        'X-Custom-Header': 'Custom Value',
        'X-Rate-Limit-Limit': '100',
        'X-Rate-Limit-Remaining': '99',
        'X-Rate-Limit-Reset': Math.floor(Date.now() / 1000) + 3600
      },
      response: {
        message: 'Response with custom headers',
        description: 'This response includes custom headers for application-specific information'
      }
    },
    {
      id: 'redirectExample',
      method: 'GET',
      path: '/redirect',
      statusCode: 302,
      headers: {
        'Location': 'http://localhost:3000/basic-headers'
      },
      response: {
        message: 'Redirecting to another endpoint'
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with response header examples');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Response headers example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('  GET http://localhost:3000/basic-headers');
  console.log('  GET http://localhost:3000/cache-control');
  console.log('  GET http://localhost:3000/cors');
  console.log('  GET http://localhost:3000/security');
  console.log('  GET http://localhost:3000/custom');
  console.log('  GET http://localhost:3000/redirect');
});
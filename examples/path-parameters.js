// File: examples/path-parameters.js
/**
 * Example demonstrating the use of path parameters in ServerlessApiMockery
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that use path parameters
const initialData = {
  routes: [
    {
      id: 'getUserById',
      method: 'GET',
      path: '/users/:id',
      statusCode: 200,
      response: {
        id: '{params.id}',
        name: 'User {params.id}',
        email: 'user{params.id}@example.com'
      }
    },
    {
      id: 'getUserPost',
      method: 'GET',
      path: '/users/:userId/posts/:postId',
      statusCode: 200,
      response: {
        userId: '{params.userId}',
        postId: '{params.postId}',
        title: 'Post {params.postId} by User {params.userId}',
        content: 'This is the content of post {params.postId}'
      }
    },
    {
      id: 'getProductDetails',
      method: 'GET',
      path: '/products/:category/:productId',
      statusCode: 200,
      response: {
        category: '{params.category}',
        productId: '{params.productId}',
        name: 'Product {params.productId} in {params.category}',
        price: 99.99,
        inStock: true
      }
    },
    {
      id: 'getFileContent',
      method: 'GET',
      path: '/files/:folder/:filename',
      statusCode: 200,
      response: {
        folder: '{params.folder}',
        filename: '{params.filename}',
        path: '/{params.folder}/{params.filename}',
        content: 'Content of {params.filename} in {params.folder} folder',
        size: 1024
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with path parameter examples');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Path parameters example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('  GET http://localhost:3000/users/123');
  console.log('  GET http://localhost:3000/users/456/posts/789');
  console.log('  GET http://localhost:3000/products/electronics/tv-101');
  console.log('  GET http://localhost:3000/files/documents/report.pdf');
});
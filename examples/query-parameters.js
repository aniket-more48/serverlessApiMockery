// File: examples/query-parameters.js
/**
 * Example demonstrating the use of query parameters in ServerlessApiMockery
 */
const express = require('express');
const ServerlessApiMockery = require('../index');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Initialize with routes that use query parameters
const initialData = {
  routes: [
    {
      id: 'searchUsers',
      method: 'GET',
      path: '/users',
      statusCode: 200,
      response: {
        query: '{query.q}',
        page: '{query.page}',
        limit: '{query.limit}',
        sortBy: '{query.sort}',
        results: [
          { id: 1, name: 'User 1' },
          { id: 2, name: 'User 2' },
          { id: 3, name: 'User 3' }
        ],
        searchParams: {
          searchTerm: '{query.q}',
          pageNumber: '{query.page}',
          resultsPerPage: '{query.limit}',
          sortField: '{query.sort}'
        }
      }
    },
    {
      id: 'filterProducts',
      method: 'GET',
      path: '/products',
      statusCode: 200,
      response: {
        category: '{query.category}',
        minPrice: '{query.minPrice}',
        maxPrice: '{query.maxPrice}',
        inStock: '{query.inStock}',
        results: [
          { id: 'p1', name: 'Product 1', price: 19.99 },
          { id: 'p2', name: 'Product 2', price: 29.99 },
          { id: 'p3', name: 'Product 3', price: 39.99 }
        ],
        filterParams: {
          productCategory: '{query.category}',
          priceRange: {
            min: '{query.minPrice}',
            max: '{query.maxPrice}'
          },
          availabilityFilter: '{query.inStock}'
        }
      }
    },
    {
      id: 'getReport',
      method: 'GET',
      path: '/reports',
      statusCode: 200,
      response: {
        reportType: '{query.type}',
        format: '{query.format}',
        startDate: '{query.from}',
        endDate: '{query.to}',
        data: {
          type: '{query.type}',
          period: {
            from: '{query.from}',
            to: '{query.to}'
          },
          outputFormat: '{query.format}'
        }
      }
    }
  ]
};

// Save the initial data
mockApi.saveApiData(initialData).then(() => {
  console.log('Mock API data initialized with query parameter examples');
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Query parameters example server running on port ${PORT}`);
  console.log('Try the following endpoints:');
  console.log('  GET http://localhost:3000/users?q=john&page=1&limit=10&sort=name');
  console.log('  GET http://localhost:3000/products?category=electronics&minPrice=10&maxPrice=50&inStock=true');
  console.log('  GET http://localhost:3000/reports?type=sales&format=pdf&from=2023-01-01&to=2023-12-31');
});
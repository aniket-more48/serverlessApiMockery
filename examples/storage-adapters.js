// File: examples/storage-adapters.js
/**
 * Example demonstrating the use of different storage adapters in ServerlessApiMockery
 */
const express = require('express');
const path = require('path');
const ServerlessApiMockery = require('../index');
const { StorageAdapter } = require('../lib/storage');

const app = express();
app.use(express.json());

// Example 1: Memory Storage (default)
const memoryExample = () => {
  console.log('\n--- Memory Storage Example ---');
  
  // Create a mock API with in-memory storage (default)
  const mockApi = new ServerlessApiMockery();
  
  // Initialize with some basic routes
  const initialData = {
    routes: [
      {
        id: 'memoryRoute',
        method: 'GET',
        path: '/memory-example',
        statusCode: 200,
        response: {
          message: 'This route is stored in memory',
          storage: 'Memory Adapter',
          timestamp: new Date().toISOString()
        }
      }
    ]
  };
  
  // Save the initial data
  return mockApi.saveApiData(initialData).then(() => {
    console.log('Memory storage initialized');
    return mockApi;
  });
};

// Example 2: File System Storage
const fileSystemExample = () => {
  console.log('\n--- File System Storage Example ---');
  
  // Create a file path for the mock data
  const filePath = path.join(__dirname, 'mock-data.json');
  
  // Create a mock API with file system storage
  const mockApi = new ServerlessApiMockery({
    storage: new StorageAdapter.FileSystem({
      filePath: filePath
    })
  });
  
  // Initialize with some basic routes
  const initialData = {
    routes: [
      {
        id: 'fileSystemRoute',
        method: 'GET',
        path: '/file-system-example',
        statusCode: 200,
        response: {
          message: 'This route is stored in the file system',
          storage: 'FileSystem Adapter',
          filePath: filePath,
          timestamp: new Date().toISOString()
        }
      }
    ]
  };
  
  // Save the initial data
  return mockApi.saveApiData(initialData).then(() => {
    console.log(`File system storage initialized at ${filePath}`);
    return mockApi;
  });
};

// Example 3: S3 Storage (commented out as it requires AWS credentials)
const s3Example = () => {
  console.log('\n--- S3 Storage Example (Simulated) ---');
  
  // In a real application, you would use actual AWS credentials
  // For this example, we'll just show the code but use memory storage
  
  /*
  // Create a mock API with S3 storage
  const mockApi = new ServerlessApiMockery({
    storage: new StorageAdapter.S3({
      bucket: 'your-bucket-name',
      key: 'mock-api-data.json',
      region: 'us-west-2',
      // Optional: provide credentials if not using environment variables or IAM roles
      // accessKeyId: 'YOUR_ACCESS_KEY',
      // secretAccessKey: 'YOUR_SECRET_KEY'
    })
  });
  */
  
  // For the example, we'll use memory storage
  const mockApi = new ServerlessApiMockery();
  
  // Initialize with some basic routes
  const initialData = {
    routes: [
      {
        id: 's3Route',
        method: 'GET',
        path: '/s3-example',
        statusCode: 200,
        response: {
          message: 'This route would be stored in S3 (simulated)',
          storage: 'S3 Adapter (simulated)',
          bucket: 'your-bucket-name',
          key: 'mock-api-data.json',
          timestamp: new Date().toISOString()
        }
      }
    ]
  };
  
  // Save the initial data
  return mockApi.saveApiData(initialData).then(() => {
    console.log('S3 storage example initialized (simulated)');
    return mockApi;
  });
};

// Example 4: Custom Storage Adapter
const customAdapterExample = () => {
  console.log('\n--- Custom Storage Adapter Example ---');
  
  // Create a custom storage adapter
  class CustomAdapter extends StorageAdapter.Base {
    constructor() {
      super();
      this.data = { routes: [], mockData: {} };
      console.log('Custom adapter initialized');
    }
    
    async getData() {
      console.log('Custom adapter: getData called');
      return this.data;
    }
    
    async saveData(data) {
      console.log('Custom adapter: saveData called');
      this.data = JSON.parse(JSON.stringify(data)); // Deep copy
      return true;
    }
  }
  
  // Create a mock API with the custom storage adapter
  const mockApi = new ServerlessApiMockery({
    storage: new CustomAdapter()
  });
  
  // Initialize with some basic routes
  const initialData = {
    routes: [
      {
        id: 'customAdapterRoute',
        method: 'GET',
        path: '/custom-adapter-example',
        statusCode: 200,
        response: {
          message: 'This route is stored in a custom adapter',
          storage: 'Custom Adapter',
          timestamp: new Date().toISOString()
        }
      }
    ]
  };
  
  // Save the initial data
  return mockApi.saveApiData(initialData).then(() => {
    console.log('Custom storage adapter initialized');
    return mockApi;
  });
};

// Initialize all examples and start the server
Promise.all([
  memoryExample(),
  fileSystemExample(),
  s3Example(),
  customAdapterExample()
]).then(([memoryApi, fileSystemApi, s3Api, customApi]) => {
  // Use the memory API for the server
  // In a real application, you would choose one storage adapter
  
  // Add management routes
  memoryApi.setupManagementRoutes(app);
  
  // Use the mock API middleware
  app.use(memoryApi.middleware());
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\nStorage adapters example server running on port ${PORT}`);
    console.log('Try the following endpoints:');
    console.log('  GET http://localhost:3000/memory-example');
    console.log('  GET http://localhost:3000/file-system-example');
    console.log('  GET http://localhost:3000/s3-example');
    console.log('  GET http://localhost:3000/custom-adapter-example');
    console.log('  GET http://localhost:3000/mock-data (to view the API configuration)');
  });
});
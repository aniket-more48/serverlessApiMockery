# Serverless API Mockery

[![npm version](https://img.shields.io/npm/v/serverless-api-mockery.svg)](https://www.npmjs.com/package/serverless-api-mockery)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A flexible, configurable mock API server for development and testing. Designed to work seamlessly with Express and AWS Lambda.

## Features

- ✅ **Dynamic mock responses** with parameter interpolation
- ✅ **Path parameter support** (`:id` style path parameters)
- ✅ **Flexible storage backends** (Memory, S3, File System)
- ✅ **Response templating** with body, path, and query parameter interpolation
- ✅ **Configurable response delays** for simulating network conditions
- ✅ **Express middleware** for easy integration
- ✅ **Serverless-compatible** with AWS Lambda support
- ✅ **In-memory caching** for improved performance

## Installation

```bash
npm install serverless-api-mockery --save-dev
```

## Quick Start

### Express Application

```javascript
const express = require('express');
const ServerlessApiMockery = require('serverless-api-mockery');

const app = express();
app.use(express.json());

// Create a mock API with in-memory storage
const mockApi = new ServerlessApiMockery();

// Add management routes for mock data
mockApi.setupManagementRoutes(app);

// Use the mock API middleware for all other routes
app.use(mockApi.middleware());

// Start the server
app.listen(3000, () => {
  console.log('Mock API server running on port 3000');
});
```

### AWS Lambda with serverless-http

```javascript
const serverless = require('serverless-http');
const express = require('express');
const ServerlessApiMockery = require('serverless-api-mockery');

const app = express();
app.use(express.json());

// Create a mock API with S3 storage
const mockApi = new ServerlessApiMockery({
  storage: new ServerlessApiMockery.StorageAdapter.S3({
    bucket: "your-s3-bucket",
    key: "mock-api-data.json",
    region: "us-west-2"
  })
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Export the serverless handler
exports.handler = serverless(app);
```

## Lambda Catch-All Pattern

When deploying to AWS Lambda using API Gateway, it's common to define a catch-all route to handle all incoming requests. This ensures that your mock API correctly processes any request path and method without needing explicit definitions for each one.

### Example `serverless.yml` Configuration

```yaml
service: serverless-api-mockery

provider:
  name: aws
  runtime: nodejs18.x
  region: us-west-2
  memorySize: 128
  timeout: 10

functions:
  api:
    handler: index.handler
    events:
      - http:
          path: /{proxy+}
          method: any
```

### Explanation
- `path: /{proxy+}`: This catch-all pattern (`{proxy+}`) ensures that all requests to any route are forwarded to your Lambda function.
- `method: any`: Allows the function to handle GET, POST, PUT, DELETE, and any other HTTP method.

By using this configuration, your mock API server will be able to respond dynamically to any route, making it a seamless testing tool for serverless applications.

## Configuration Format

The mock API data is configured in a JSON format as follows:

```json
{
  "routes": [
    {
      "id": "getUserById",
      "name": "Get User By ID",
      "method": "GET",
      "path": "/users/:id",
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "delay": 1000,
      "response": {
        "id": "{params.id}",
        "name": "User {params.id}",
        "requestedQuery": "{query.include}"
      }
    },
    {
      "id": "searchUsers",
      "name": "Search Users",
      "method": "GET",
      "path": "/users",
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "delay": 1000,
      "response": {
        "query": "{query.q}",
        "sort": "{query.sort}",
        "limit": "{query.limit}",
        "users": [
          { "id": 1, "name": "John" },
          { "id": 2, "name": "Jane" }
        ]
      }
    },
    {
      "id": "createUser",
      "name": "Create User",
      "method": "POST",
      "path": "/users",
      "statusCode": 201,
      "response": {
        "message": "User created successfully",
        "username": "{body.username}",
        "email": "{body.email}"
      }
    }
  ],
  "mockData": {
    // Additional data you might want to store
  }
}
```

### Route Configuration

Each route in the configuration can have the following properties:

- `id`: Unique identifier for the route (alphanumeric, used for referencing)
- `name`: Human-readable name for the route (descriptive text)
- `method`: HTTP method (e.g., "GET", "POST", "PUT", "DELETE")
- `path`: URL path pattern, can include parameters prefixed with `:` (e.g., `/users/:id`)
- `statusCode`: HTTP status code to return (defaults to 200)
- `headers`: Response headers object
- `delay`: Optional delay in milliseconds before responding
- `response`: Response body template (can include parameter placeholders)

## API

### Constructor

```javascript
const mockApi = new ServerlessApiMockery(options);
```

#### Options

- `storage`: Storage adapter instance (defaults to MemoryAdapter)
- `cacheTtl`: Cache time-to-live in milliseconds (defaults to 60000)

### Methods

#### `middleware()`

Returns an Express middleware function that handles mock API requests.

#### `setupManagementRoutes(app)`

Sets up GET and POST routes at `/mock-data` to retrieve and update the mock configuration.

#### `getApiData()`

Retrieves the current mock API configuration from the storage adapter.

#### `saveApiData(data)`

Saves updated mock API configuration to the storage adapter.

## Storage Adapters

### Memory Adapter

```javascript
const memoryAdapter = new ServerlessApiMockery.StorageAdapter.Memory();
```

### S3 Adapter

```javascript
const s3Adapter = new ServerlessApiMockery.StorageAdapter.S3({
  bucket: "your-bucket-name",
  key: "data-file-key.json",
  region: "us-west-2",
  accessKeyId: "optional-access-key",
  secretAccessKey: "optional-secret-key"
});
```

### File System Adapter

```javascript
const fsAdapter = new ServerlessApiMockery.StorageAdapter.FileSystem({
  filePath: "/path/to/mock-data.json"
});
```

## Response Templating

You can use placeholders in your response templates:

- `{params.paramName}` - Path parameters
- `{query.paramName}` - Query parameters
- `{body.field}` - Request body fields (supports nested paths: `body.user.name`)

## Management Endpoints

- `GET /mock-data` - Returns the current mock API configuration
- `POST /mock-data` - Updates the mock API configuration

## Creating Custom Storage Adapters

You can create custom storage adapters by extending the base adapter:

```javascript
const { StorageAdapter } = require('serverless-api-mockery');

class CustomAdapter extends StorageAdapter.Base {
  async getData() {
    // Implementation for retrieving data
  }
  
  async saveData(data) {
    // Implementation for saving data
  }
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
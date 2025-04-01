# Serverless API Mockery

[![npm version](https://img.shields.io/npm/v/serverless-api-mockery.svg)](https://www.npmjs.com/package/serverless-api-mockery)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A flexible, configurable mock API server for development and testing. Designed to work seamlessly with Express and AWS Lambda.

## Features

- ✅ **Dynamic mock responses** with parameter interpolation
- ✅ **Path parameter support** (`:id` style path parameters)
- ✅ **Flexible storage backends** (Memory, S3, File System)
- ✅ **Response templating** with body, path, and query parameter interpolation
- ✅ **Date expressions** for dynamic timestamp generation (seconds or milliseconds precision)
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

## Example Mock API Configuration

We provide a comprehensive example configuration file that you can use as a starting point for your mock API. This file includes examples of various route types, response formats, and features like path parameters, query parameters, and date expressions.

You can find this file at [examples/mock-api-routes.json](examples/mock-api-routes.json).

To use this example configuration with file system storage:

```javascript
const express = require('express');
const path = require('path');
const fs = require('fs');
const ServerlessApiMockery = require('serverless-api-mockery');

const app = express();
app.use(express.json());

// Copy the example file to your project
const examplePath = path.join(__dirname, 'node_modules/serverless-api-mockery/examples/mock-api-routes.json');
const targetPath = path.join(__dirname, 'mock-api-routes.json');

// Only copy if the target doesn't exist
if (!fs.existsSync(targetPath)) {
  fs.copyFileSync(examplePath, targetPath);
  console.log(`Example mock API configuration copied to ${targetPath}`);
}

// Create a mock API with file system storage
const mockApi = new ServerlessApiMockery({
  storage: new ServerlessApiMockery.StorageAdapter.FileSystem({
    filePath: targetPath
  })
});

// Add management routes
mockApi.setupManagementRoutes(app);

// Use the mock API middleware
app.use(mockApi.middleware());

// Start the server
app.listen(3000, () => {
  console.log('Mock API server running on port 3000');
});
```

This example configuration includes:
- User management endpoints (GET, POST, PUT, DELETE)
- Authentication endpoints
- Product catalog endpoints
- Order management endpoints
- Error response examples
- Various HTTP status codes
- Custom headers
- Response delays
- Path and query parameters
- Request body processing
- Date expressions

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
    },
    {
      "id": "getAuthToken",
      "name": "Get Auth Token",
      "method": "POST",
      "path": "/auth/token",
      "statusCode": 200,
      "response": {
        "token": "sample-token",
        "issuedAt": "{date:currentDate}",
        "expiresAt": "{date:currentDate+3600}"
      }
    }
  ]
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
- `{date:expression}` - Dynamic date expressions (see below)

### Date Expressions

You can use date expressions to generate dynamic timestamps in your responses:

- `{date:currentDate}` - Current timestamp in epoch seconds
- `{date:currentDate(ms)}` - Current timestamp in epoch milliseconds
- `{date:currentDate+N}` - Current timestamp plus N seconds
- `{date:currentDate-N}` - Current timestamp minus N seconds
- `{date:currentDate(ms)+N}` - Current timestamp plus N milliseconds
- `{date:currentDate(ms)-N}` - Current timestamp minus N milliseconds

#### Example

```json
{
  "routes": [
    {
      "id": "getAuthToken",
      "method": "POST",
      "path": "/auth/token",
      "statusCode": 200,
      "response": {
        "token": "sample-token",
        "issuedAt": "{date:currentDate}",
        "issuedAtMs": "{date:currentDate(ms)}",
        "expiresAt": "{date:currentDate+3600}",
        "expiresAtMs": "{date:currentDate(ms)+3600000}",
        "refreshExpiresAt": "{date:currentDate+604800}"
      }
    }
  ]
}
```

This will return a response with:
- `issuedAt`: Current timestamp in epoch seconds
- `issuedAtMs`: Current timestamp in epoch milliseconds
- `expiresAt`: Current timestamp + 1 hour (3600 seconds)
- `expiresAtMs`: Current timestamp + 1 hour (3600000 milliseconds)
- `refreshExpiresAt`: Current timestamp + 1 week (604800 seconds)

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

## Advanced Usage

### Conditional Responses

You can implement conditional responses based on request parameters by using custom middleware before the ServerlessApiMockery middleware:

```javascript
// Custom middleware for conditional responses
app.use((req, res, next) => {
  // Example: Return different responses based on a query parameter
  if (req.path === '/users' && req.query.status === 'inactive') {
    // Redirect to a specific mock route
    req.url = '/users/inactive';
  }
  
  // Example: Simulate authentication errors
  if (req.path === '/auth/login') {
    const { username, password } = req.body || {};
    
    if (!username || !password) {
      req.url = '/auth/login/invalid-credentials';
    } else if (username === 'locked') {
      req.url = '/auth/login/account-locked';
    } else {
      req.url = '/auth/login/success';
    }
  }
  
  next();
});

// Use the mock API middleware after your custom middleware
app.use(mockApi.middleware());
```

This approach allows you to create a single endpoint that returns different responses based on the request content, without needing to define separate routes for each scenario.

### Custom Response Processors

You can extend the response processor to add custom functionality, such as random data generation:

```javascript
const MockApiResponseProcessor = require('serverless-api-mockery/lib/processor');

class CustomResponseProcessor extends MockApiResponseProcessor {
  constructor() {
    super();
  }
  
  // Add a method to generate random data
  processRandomExpression(expression) {
    if (expression === 'uuid') {
      // Generate a UUID-like string
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
      // Generate a random number in a specific range (number:min-max)
      const range = expression.split(':')[1];
      const [min, max] = range.split('-').map(Number);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    return null;
  }
  
  // Override the interpolateString method to add support for random expressions
  interpolateString(str, params) {
    // First process with the parent method
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
mockApi.processor = new CustomResponseProcessor();
```

With this custom processor, you can use expressions like `{random:uuid}`, `{random:number}`, or `{random:number:10-100}` in your response templates.

### Dynamic Mock Data

You can use the `mockData` property in your configuration to store reusable data that can be referenced across multiple routes:

```json
{
  "routes": [
    {
      "id": "getUsers",
      "method": "GET",
      "path": "/users",
      "response": {
        "users": "{mockData.users}"
      }
    },
    {
      "id": "getProducts",
      "method": "GET",
      "path": "/products",
      "response": {
        "products": "{mockData.products}"
      }
    }
  ],
  "mockData": {
    "users": [
      { "id": 1, "name": "John Doe" },
      { "id": 2, "name": "Jane Smith" }
    ],
    "products": [
      { "id": "p1", "name": "Product 1", "price": 99.99 },
      { "id": "p2", "name": "Product 2", "price": 49.99 }
    ]
  }
}
```

This approach allows you to maintain a single source of truth for your mock data, making it easier to update and maintain.

### Testing with ServerlessApiMockery

ServerlessApiMockery is ideal for testing your frontend applications or API clients. Here's how to use it in your test suite:

```javascript
const request = require('supertest');
const express = require('express');
const path = require('path');
const ServerlessApiMockery = require('serverless-api-mockery');

describe('API Tests', function() {
  let app;
  let server;
  
  before(async function() {
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Create mock API with file storage
    const mockApi = new ServerlessApiMockery({
      storage: new ServerlessApiMockery.StorageAdapter.FileSystem({
        filePath: path.join(__dirname, 'test-mock-data.json')
      })
    });
    
    // Setup routes
    mockApi.setupManagementRoutes(app);
    app.use(mockApi.middleware());
    
    // Start server
    server = app.listen(3000);
  });
  
  after(function() {
    server.close();
  });
  
  it('should get user data', async function() {
    const response = await request(app)
      .get('/users/123')
      .expect(200);
      
    expect(response.body).to.have.property('id', '123');
  });
  
  // More tests...
});
```

### Performance Optimization

#### Caching

ServerlessApiMockery includes built-in caching to reduce storage access. You can configure the cache TTL (time-to-live) when creating the instance:

```javascript
const mockApi = new ServerlessApiMockery({
  cacheTtl: 300000 // 5 minutes in milliseconds
});
```

For AWS Lambda environments, a longer cache TTL can significantly reduce S3 access costs and improve response times.

#### Response Delays

While the `delay` property is useful for simulating real-world conditions during development, you might want to disable delays in test environments for faster test execution:

```javascript
// Custom middleware to override delays in test environment
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    // Find the route and set delay to 0
    mockApi.getApiData().then(data => {
      data.routes.forEach(route => {
        route.delay = 0;
      });
      next();
    });
  } else {
    next();
  }
});
```

### Docker Deployment

You can deploy ServerlessApiMockery as a Docker container:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Example `server.js`:

```javascript
const express = require('express');
const ServerlessApiMockery = require('serverless-api-mockery');
const path = require('path');

const app = express();
app.use(express.json());

const mockApi = new ServerlessApiMockery({
  storage: new ServerlessApiMockery.StorageAdapter.FileSystem({
    filePath: path.join(__dirname, 'mock-api-data.json')
  })
});

mockApi.setupManagementRoutes(app);
app.use(mockApi.middleware());

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
});
```

### Troubleshooting

#### Routes Not Matching

If your routes aren't matching as expected:

1. Check that the HTTP method matches exactly (case-insensitive)
2. Ensure path parameters are correctly formatted (`:paramName`)
3. Verify that more specific routes come before parameterized routes in your configuration

#### S3 Storage Issues

When using S3 storage:

1. Ensure your Lambda has the correct IAM permissions
2. Check that the S3 bucket exists and is accessible
3. Verify region settings match your bucket's region

#### Response Templating

If response templating isn't working:

1. Check the syntax of your placeholders (`{params.id}`, `{query.q}`, etc.)
2. Ensure nested paths are correctly specified for body parameters
3. Verify that date expressions follow the correct format

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

// File: test/file-storage.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs').promises;
const ServerlessApiMockery = require('../index');
const { StorageAdapter } = require('../lib/storage');

describe('ServerlessApiMockery with File Storage', () => {
  const mockApiRoutesPath = path.join(__dirname, '../examples/mock-api-routes.json');
  let mockApi;
  let mockData;
  
  before(async () => {
    // Load the mock API routes from the JSON file
    try {
      const fileContent = await fs.readFile(mockApiRoutesPath, 'utf8');
      mockData = JSON.parse(fileContent);
    } catch (error) {
      console.error(`Error loading mock API routes from ${mockApiRoutesPath}:`, error);
      throw error;
    }
  });
  
  beforeEach(() => {
    // Create a mock API with file system storage
    mockApi = new ServerlessApiMockery({
      storage: new StorageAdapter.FileSystem({
        filePath: mockApiRoutesPath
      })
    });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('Route Configuration', () => {
    it('should load routes from the JSON file', async () => {
      const apiData = await mockApi.getApiData();
      
      expect(apiData).to.have.property('routes').that.is.an('array');
      expect(apiData.routes.length).to.be.at.least(1);
      expect(apiData).to.deep.equal(mockData);
    });
    
    it('should have valid route configurations', async () => {
      const apiData = await mockApi.getApiData();
      
      // Check each route for required properties
      apiData.routes.forEach(route => {
        expect(route).to.have.property('id').that.is.a('string');
        expect(route).to.have.property('method').that.is.a('string');
        expect(route).to.have.property('path').that.is.a('string');
        
        // statusCode is optional but should be a number if present
        if (route.statusCode !== undefined) {
          expect(route.statusCode).to.be.a('number');
        }
        
        // headers is optional but should be an object if present
        if (route.headers !== undefined) {
          expect(route.headers).to.be.an('object');
        }
        
        // delay is optional but should be a number if present
        if (route.delay !== undefined) {
          expect(route.delay).to.be.a('number');
        }
        
        // response is optional for some status codes (e.g., 204)
        if (route.response !== undefined) {
          expect(route.response).to.be.an('object');
        }
      });
    });
  });
  
  describe('Request Handling', () => {
    it('should handle GET requests with path parameters', async () => {
      const req = {
        method: 'GET',
        path: '/users/123',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('id', '123');
      expect(response.body).to.have.property('name', 'User 123');
      expect(response.body).to.have.property('email', 'user123@example.com');
    });
    
    it('should handle GET requests with query parameters', async () => {
      const req = {
        method: 'GET',
        path: '/users',
        query: {
          q: 'search term',
          sort: 'name',
          page: '1',
          limit: '10'
        },
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('query', 'search term');
      expect(response.body).to.have.property('sort', 'name');
      expect(response.body).to.have.property('page', '1');
      expect(response.body).to.have.property('limit', '10');
      expect(response.body).to.have.property('users').that.is.an('array');
    });
    
    it('should handle POST requests with request body', async () => {
      const req = {
        method: 'POST',
        path: '/users',
        query: {},
        body: {
          username: 'testuser',
          email: 'test@example.com'
        }
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(201);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'User created successfully');
      expect(response.body).to.have.property('username', '"testuser"');
      expect(response.body).to.have.property('email', '"test@example.com"');
    });
    
    it('should handle requests with date expressions', async () => {
      // Mock Date.now() to return a fixed timestamp
      const now = 1609459200000; // 2021-01-01 00:00:00 UTC
      sinon.stub(Date, 'now').returns(now);
      
      const req = {
        method: 'POST',
        path: '/auth/token',
        query: {},
        body: {
          username: 'testuser'
        }
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('issuedAt', '1609459200');
      expect(response.body).to.have.property('expiresAt', '1609462800'); // +3600 seconds
      expect(response.body).to.have.property('refreshExpiresAt', '1610064000'); // +604800 seconds
    });
    
    it('should handle error responses', async () => {
      const req = {
        method: 'GET',
        path: '/error/not-found',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(404);
      expect(response.body).to.have.property('error', 'Not Found');
      expect(response.body).to.have.property('message', 'The requested resource was not found');
    });
    
    it('should return 404 for non-matching routes', async () => {
      const req = {
        method: 'GET',
        path: '/nonexistent',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(404);
      expect(response.body).to.have.property('error');
    });
  });
  
  describe('Response Processing', () => {
    it('should process nested objects in the response', async () => {
      const req = {
        method: 'GET',
        path: '/products/p123',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('id', 'p123');
      expect(response.body).to.have.property('name', 'Product p123');
      expect(response.body).to.have.property('specs').that.is.an('object');
      expect(response.body.specs).to.have.property('weight', '1.5kg');
      expect(response.body.specs).to.have.property('dimensions', '10 x 20 x 5 cm');
    });
    
    it('should process arrays in the response', async () => {
      const req = {
        method: 'GET',
        path: '/products/p123',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.have.property('images').that.is.an('array');
      expect(response.body.images).to.include('https://example.com/images/productp123_1.jpg');
      expect(response.body.images).to.include('https://example.com/images/productp123_2.jpg');
    });
    
    it('should handle complex request bodies', async () => {
      const req = {
        method: 'POST',
        path: '/orders',
        query: {},
        body: {
          customer: {
            name: 'John Doe',
            email: 'john@example.com',
            address: '123 Main St'
          },
          items: [
            { productId: 'p1', quantity: 2 },
            { productId: 'p2', quantity: 1 }
          ],
          total: 249.97,
          paymentMethod: 'credit_card'
        }
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(201);
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('customer').that.is.an('object');
      expect(response.body.customer).to.have.property('name', '"John Doe"');
      expect(response.body.customer).to.have.property('email', '"john@example.com"');
      expect(response.body.customer).to.have.property('address', '"123 Main St"');
    });
  });
  
  describe('Headers and Status Codes', () => {
    it('should set the correct headers', async () => {
      const req = {
        method: 'GET',
        path: '/users/123',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.headers).to.have.property('Content-Type', 'application/json');
      expect(response.headers).to.have.property('Cache-Control', 'max-age=3600');
    });
    
    it('should set the correct status code', async () => {
      const req = {
        method: 'POST',
        path: '/users',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(201);
    });
    
    it('should handle 204 No Content responses', async () => {
      const req = {
        method: 'DELETE',
        path: '/users/123',
        query: {},
        body: {}
      };
      
      const response = await mockApi.handleRequest(req);
      
      expect(response.statusCode).to.equal(204);
      expect(response.body).to.be.undefined;
    });
  });
});
// File: test/file-storage-integration.test.js
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const path = require('path');
const sinon = require('sinon');
const ServerlessApiMockery = require('../index');
const { StorageAdapter } = require('../lib/storage');

describe('ServerlessApiMockery Integration with File Storage', function() {
  // Increase timeout for integration tests
  this.timeout(5000);
  
  const mockApiRoutesPath = path.join(__dirname, '../examples/mock-api-routes.json');
  let app;
  let mockApi;
  let clock;
  
  before(() => {
    // Create a fixed timestamp for testing
    clock = sinon.useFakeTimers({
      now: new Date('2023-01-01T00:00:00Z').getTime(),
      shouldAdvanceTime: true
    });
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Create mockery with file storage
    mockApi = new ServerlessApiMockery({
      storage: new StorageAdapter.FileSystem({
        filePath: mockApiRoutesPath
      })
    });
    
    // Setup management routes
    mockApi.setupManagementRoutes(app);
    
    // Use mockery middleware
    app.use(mockApi.middleware());
  });
  
  after(() => {
    clock.restore();
  });
  
  describe('User API Endpoints', () => {
    it('should get a user by ID', async () => {
      const response = await request(app)
        .get('/users/123')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('id', '123');
      expect(response.body).to.have.property('name', 'User 123');
      expect(response.body).to.have.property('email', 'user123@example.com');
    });
    
    it('should search users with query parameters', async () => {
      const response = await request(app)
        .get('/users?q=test&sort=name&page=1&limit=10')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('query', 'test');
      expect(response.body).to.have.property('sort', 'name');
      expect(response.body).to.have.property('page', '1');
      expect(response.body).to.have.property('limit', '10');
      expect(response.body).to.have.property('users').that.is.an('array');
    });
    
    it('should create a user', async () => {
      const userData = {
        username: 'testuser',
        email: 'test@example.com'
      };
      
      const response = await request(app)
        .post('/users')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'User created successfully');
      expect(response.body).to.have.property('username', '"testuser"');
      expect(response.body).to.have.property('email', '"test@example.com"');
    });
    
    it('should update a user', async () => {
      const userData = {
        username: 'updateduser',
        email: 'updated@example.com',
        profile: {
          firstName: 'Updated',
          lastName: 'User'
        }
      };
      
      const response = await request(app)
        .put('/users/123')
        .send(userData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('message', 'User updated successfully');
      expect(response.body).to.have.property('id', '123');
      expect(response.body).to.have.property('updatedFields').that.is.an('object');
      expect(response.body.updatedFields).to.have.property('username', '"updateduser"');
      expect(response.body.updatedFields).to.have.property('email', '"updated@example.com"');
      expect(response.body.updatedFields).to.have.property('profile', '{"firstName":"Updated","lastName":"User"}');
    });
    
    it('should delete a user', async () => {
      await request(app)
        .delete('/users/123')
        .expect(204);
    });
  });
  
  describe('Authentication API Endpoints', () => {
    it('should get an auth token', async () => {
      const authData = {
        username: 'testuser',
        password: 'password123'
      };
      
      const response = await request(app)
        .post('/auth/token')
        .send(authData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      expect(response.body).to.have.property('token').that.is.a('string');
      expect(response.body).to.have.property('username', '"testuser"');
      expect(response.body).to.have.property('issuedAt', currentTimestamp.toString());
      expect(response.body).to.have.property('expiresAt', (currentTimestamp + 3600).toString());
      expect(response.body).to.have.property('refreshExpiresAt', (currentTimestamp + 604800).toString());
    });
    
    it('should refresh an auth token', async () => {
      const refreshData = {
        refreshToken: 'old-token'
      };
      
      const response = await request(app)
        .post('/auth/refresh')
        .send(refreshData)
        .expect('Content-Type', /json/)
        .expect(200);
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      expect(response.body).to.have.property('token').that.is.a('string');
      expect(response.body).to.have.property('refreshToken', '"old-token"');
      expect(response.body).to.have.property('issuedAt', currentTimestamp.toString());
      expect(response.body).to.have.property('expiresAt', (currentTimestamp + 3600).toString());
    });
  });
  
  describe('Product API Endpoints', () => {
    it('should get products with query parameters', async () => {
      const response = await request(app)
        .get('/products?category=electronics&minPrice=10&maxPrice=100&sort=price&page=1&limit=10')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('category', 'electronics');
      expect(response.body).to.have.property('minPrice', '10');
      expect(response.body).to.have.property('maxPrice', '100');
      expect(response.body).to.have.property('sort', 'price');
      expect(response.body).to.have.property('products').that.is.an('array');
    });
    
    it('should get a product by ID', async () => {
      const response = await request(app)
        .get('/products/p123')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('id', 'p123');
      expect(response.body).to.have.property('name', 'Product p123');
      expect(response.body).to.have.property('description').that.includes('p123');
      expect(response.body).to.have.property('images').that.is.an('array');
      expect(response.body).to.have.property('specs').that.is.an('object');
    });
  });
  
  describe('Order API Endpoints', () => {
    it('should create an order', async () => {
      const orderData = {
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
      };
      
      const response = await request(app)
        .post('/orders')
        .send(orderData)
        .expect('Content-Type', /json/)
        .expect(201);
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      expect(response.body).to.have.property('success', true);
      expect(response.body).to.have.property('orderId', 'ord-12345');
      expect(response.body).to.have.property('timestamp', currentTimestamp.toString());
      expect(response.body).to.have.property('customer').that.is.an('object');
      expect(response.body.customer).to.have.property('name', '"John Doe"');
      expect(response.body).to.have.property('estimatedDelivery', (currentTimestamp + 432000).toString());
    });
    
    it('should get an order by ID', async () => {
      const response = await request(app)
        .get('/orders/ord-123')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('id', 'ord-123');
      expect(response.body).to.have.property('status', 'processing');
      expect(response.body).to.have.property('customer').that.is.an('object');
      expect(response.body).to.have.property('items').that.is.an('array');
    });
  });
  
  describe('Error Handling', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/nonexistent')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).to.have.property('error');
    });
    
    it('should handle 404 error responses', async () => {
      const response = await request(app)
        .get('/error/not-found')
        .expect('Content-Type', /json/)
        .expect(404);
      
      expect(response.body).to.have.property('error', 'Not Found');
      expect(response.body).to.have.property('message', 'The requested resource was not found');
    });
    
    it('should handle 401 error responses', async () => {
      const response = await request(app)
        .get('/error/unauthorized')
        .expect('Content-Type', /json/)
        .expect(401);
      
      expect(response.body).to.have.property('error', 'Unauthorized');
      expect(response.body).to.have.property('message', 'Authentication is required to access this resource');
    });
    
    it('should handle 403 error responses', async () => {
      const response = await request(app)
        .get('/error/forbidden')
        .expect('Content-Type', /json/)
        .expect(403);
      
      expect(response.body).to.have.property('error', 'Forbidden');
      expect(response.body).to.have.property('message', 'You do not have permission to access this resource');
    });
    
    it('should handle 500 error responses', async () => {
      const response = await request(app)
        .get('/error/server-error')
        .expect('Content-Type', /json/)
        .expect(500);
      
      expect(response.body).to.have.property('error', 'Internal Server Error');
      expect(response.body).to.have.property('message', 'An unexpected error occurred while processing your request');
    });
  });
  
  describe('Management API', () => {
    it('should get the current mock API configuration', async () => {
      const response = await request(app)
        .get('/mock-data')
        .expect('Content-Type', /json/)
        .expect(200);
      
      expect(response.body).to.have.property('routes').that.is.an('array');
      expect(response.body.routes.length).to.be.at.least(1);
      expect(response.body).to.have.property('mockData').that.is.an('object');
    });
  });
});
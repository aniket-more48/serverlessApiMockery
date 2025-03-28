// File: test/index.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const ServerlessApiMockery = require('../index');
const StorageAdapter = require('../lib/storage');

describe('ServerlessApiMockery', () => {
  let mockery;
  let mockStorage;
  
  beforeEach(() => {
    // Create a mock storage with controlled data
    mockStorage = new StorageAdapter.Memory();
    sinon.stub(mockStorage, 'getData').resolves({
      routes: [
        {
          id: 'testRoute',
          method: 'get',
          path: '/test/:id',
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          response: { id: '{params.id}', message: 'Test response' }
        }
      ],
      mockData: {}
    });
    
    mockery = new ServerlessApiMockery({ storage: mockStorage });
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('constructor', () => {
    it('should initialize with default options', () => {
      const instance = new ServerlessApiMockery();
      expect(instance.router).to.exist;
      expect(instance.processor).to.exist;
      expect(instance.storage).to.be.instanceOf(StorageAdapter.Memory);
      expect(instance.cache.ttl).to.equal(60000);
    });
    
    it('should initialize with custom options', () => {
      const customStorage = new StorageAdapter.Memory();
      const instance = new ServerlessApiMockery({
        storage: customStorage,
        cacheTtl: 30000
      });
      
      expect(instance.storage).to.equal(customStorage);
      expect(instance.cache.ttl).to.equal(30000);
    });
  });
  
  describe('getApiData', () => {
    it('should fetch data from storage when cache is empty', async () => {
      const result = await mockery.getApiData();
      
      expect(mockStorage.getData.calledOnce).to.be.true;
      expect(result).to.have.property('routes').that.is.an('array');
      expect(mockery.cache.data).to.equal(result);
      expect(mockery.cache.timestamp).to.be.a('number').and.be.above(0);
    });
    
    it('should return cached data when cache is valid', async () => {
      // First call to populate cache
      await mockery.getApiData();
      
      // Second call should use cache
      const result = await mockery.getApiData();
      
      expect(mockStorage.getData.calledOnce).to.be.true;
      expect(result).to.have.property('routes').that.is.an('array');
    });
    
    it('should refresh cache when TTL expired', async () => {
      // Create mockery with very short TTL
      mockery = new ServerlessApiMockery({ 
        storage: mockStorage,
        cacheTtl: 1 // 1ms TTL
      });
      
      // First call to populate cache
      await mockery.getApiData();
      
      // Wait for cache to expire
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Second call should refresh cache
      await mockery.getApiData();
      
      expect(mockStorage.getData.calledTwice).to.be.true;
    });
    
    it('should handle storage errors gracefully', async () => {
      mockStorage.getData.rejects(new Error('Storage error'));
      
      const result = await mockery.getApiData();
      
      expect(result).to.deep.equal({ routes: [], mockData: {} });
    });
  });
  
  describe('saveApiData', () => {
    it('should save data to storage and update cache', async () => {
      sinon.stub(mockStorage, 'saveData').resolves(true);
      
      const testData = { routes: [{ id: 'newRoute' }], mockData: {} };
      const result = await mockery.saveApiData(testData);
      
      expect(mockStorage.saveData.calledOnceWith(testData)).to.be.true;
      expect(result).to.be.true;
      expect(mockery.cache.data).to.equal(testData);
    });
    
    it('should propagate storage errors', async () => {
      sinon.stub(mockStorage, 'saveData').rejects(new Error('Save error'));
      
      try {
        await mockery.saveApiData({ routes: [] });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.equal('Save error');
      }
    });
  });
  
  describe('handleRequest', () => {
    it('should return 404 for non-matching routes', async () => {
      const req = {
        method: 'GET',
        path: '/nonexistent',
        query: {},
        body: {}
      };
      
      const response = await mockery.handleRequest(req);
      
      expect(response.statusCode).to.equal(404);
      expect(response.body).to.have.property('error');
    });
    
    it('should process matching routes correctly', async () => {
      const req = {
        method: 'GET',
        path: '/test/123',
        query: {},
        body: {}
      };
      
      const response = await mockery.handleRequest(req);
      
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.deep.equal({ id: '123', message: 'Test response' });
    });
  });
  
  describe('middleware', () => {
    it('should skip middleware for management endpoints', () => {
      const middleware = mockery.middleware();
      const req = { path: '/mock-data' };
      const res = {};
      const next = sinon.spy();
      
      middleware(req, res, next);
      
      expect(next.calledOnce).to.be.true;
    });
    
    it('should handle requests and send responses', async () => {
      const middleware = mockery.middleware();
      const req = {
        method: 'GET',
        path: '/test/123',
        query: {},
        body: {}
      };
      
      const res = {
        status: sinon.spy(),
        setHeader: sinon.spy(),
        json: sinon.spy()
      };
      
      const next = sinon.spy();
      
      await middleware(req, res, next);
      
      expect(res.status.calledOnceWith(200)).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      expect(res.json.firstCall.args[0]).to.deep.equal({ 
        id: '123', 
        message: 'Test response' 
      });
    });
    
    it('should handle errors gracefully', async () => {
      sinon.stub(mockery, 'handleRequest').rejects(new Error('Test error'));
      
      const middleware = mockery.middleware();
      const req = { method: 'GET', path: '/test' };
      const res = {
        status: sinon.spy(),
        json: sinon.spy()
      };
      
      await middleware(req, res, {});
      
      expect(res.status.calledOnceWith(500)).to.be.true;
      expect(res.json.firstCall.args[0]).to.have.property('error');
    });
    
    it('should respect delay parameter', async () => {
      // Override the mock data to include a delay
      mockStorage.getData.resolves({
        routes: [
          {
            id: 'delayedRoute',
            method: 'get',
            path: '/delayed',
            statusCode: 200,
            delay: 50,
            response: { message: 'Delayed response' }
          }
        ]
      });
      
      const middleware = mockery.middleware();
      const req = {
        method: 'GET',
        path: '/delayed',
        query: {},
        body: {}
      };
      
      const res = {
        status: sinon.spy(),
        setHeader: sinon.spy(),
        json: sinon.spy()
      };
      
      const startTime = Date.now();
      await middleware(req, res, {});
      const endTime = Date.now();
      
      expect(endTime - startTime).to.be.at.least(45); // Allow for small timing variations
      expect(res.json.calledOnce).to.be.true;
    });
  });
  
  describe('setupManagementRoutes', () => {
    it('should set up GET and POST routes', () => {
      const app = {
        get: sinon.spy(),
        post: sinon.spy()
      };
      
      mockery.setupManagementRoutes(app);
      
      expect(app.get.calledOnceWith('/mock-data')).to.be.true;
      expect(app.post.calledOnceWith('/mock-data')).to.be.true;
    });
  });
});
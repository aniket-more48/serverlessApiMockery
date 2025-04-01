// File: test/integration.test.js
const { expect } = require('chai');
const request = require('supertest');
const express = require('express');
const sinon = require('sinon');
const ServerlessApiMockery = require('../index');

describe('ServerlessApiMockery Integration', () => {
  let app;
  let mockery;
  let clock;
  
  beforeEach(() => {
    // Create a fixed timestamp for testing
    clock = sinon.useFakeTimers({
      now: new Date('2023-01-01T00:00:00Z').getTime(),
      shouldAdvanceTime: true
    });
    
    // Create Express app
    app = express();
    app.use(express.json());
    
    // Create mockery with test data
    mockery = new ServerlessApiMockery();
    
    // Stub the getApiData method to return test routes
    sinon.stub(mockery, 'getApiData').resolves({
      routes: [
        {
          id: 'getUser',
          method: 'GET',
          path: '/users/:id',
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          response: {
            id: '{params.id}',
            name: 'User {params.id}',
            query: '{query.filter}'
          }
        },
        {
          id: 'createUser',
          method: 'POST',
          path: '/users',
          statusCode: 201,
          response: {
            success: true,
            username: '{body.username}'
          }
        },
        {
          id: 'delayedResponse',
          method: 'GET',
          path: '/delayed',
          statusCode: 200,
          delay: 500,
          response: {
            message: 'Delayed response'
          }
        },
        {
          id: 'dateResponse',
          method: 'GET',
          path: '/dates',
          statusCode: 200,
          response: {
            current: '{date:currentDate}',
            future: '{date:currentDate+60}',
            past: '{date:currentDate-60}'
          }
        },
        {
          id: 'dateResponseMilliseconds',
          method: 'GET',
          path: '/dates/ms',
          statusCode: 200,
          response: {
            current: '{date:currentDate(ms)}',
            future: '{date:currentDate(ms)+60000}',
            past: '{date:currentDate(ms)-60000}'
          }
        },
        {
          id: 'mixedDateResponse',
          method: 'GET',
          path: '/dates/mixed',
          statusCode: 200,
          response: {
            seconds: '{date:currentDate}',
            milliseconds: '{date:currentDate(ms)}',
            futureSeconds: '{date:currentDate+3600}',
            futureMilliseconds: '{date:currentDate(ms)+3600000}'
          }
        },
        {
          id: 'pureDateResponse',
          method: 'GET',
          path: '/dates/pure',
          statusCode: 200,
          response: {
            pureSeconds: "{date:currentDate}",
            pureMilliseconds: "{date:currentDate(ms)}"
          }
        }
      ],
      mockData: {}
    });
    
    // Setup management routes
    mockery.setupManagementRoutes(app);
    
    // Use mockery middleware
    app.use(mockery.middleware());
  });
  
  afterEach(() => {
    sinon.restore();
    clock.restore();
  });
  
  describe('Route Handling', () => {
    it('should handle GET requests with path parameters', async () => {
      const response = await request(app)
        .get('/users/123')
        .query({ filter: 'active' });
      
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        id: '123',
        name: 'User 123',
        query: 'active'
      });
    });
    
    it('should handle POST requests with body data', async () => {
      const response = await request(app)
        .post('/users')
        .send({ username: 'johndoe', email: 'john@example.com' });
      
      expect(response.status).to.equal(201);
      expect(response.body).to.deep.equal({
        success: true,
        username: '"johndoe"'
      });
    });
    
    it('should return 404 for non-matching routes', async () => {
      const response = await request(app)
        .get('/nonexistent');
      
      expect(response.status).to.equal(404);
      expect(response.body).to.have.property('error');
    });
    
    it('should respect delay parameter', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/delayed');
      
      const endTime = Date.now();
      
      expect(response.status).to.equal(200);
      expect(endTime - startTime).to.be.at.least(500);
      expect(response.body).to.deep.equal({
        message: 'Delayed response'
      });
    });
    
    it('should process date expressions correctly (seconds)', async () => {
      const response = await request(app)
        .get('/dates');
      
      const currentTimestamp = Math.floor(Date.now() / 1000);
      
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        current: currentTimestamp.toString(),
        future: (currentTimestamp + 60).toString(),
        past: (currentTimestamp - 60).toString()
      });
    });

    it('should process date expressions correctly with millisecond precision', async () => {
      const response = await request(app)
        .get('/dates/ms');
      
      const currentTimestampMs = Date.now();
      
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        current: currentTimestampMs.toString(),
        future: (currentTimestampMs + 60000).toString(),
        past: (currentTimestampMs - 60000).toString()
      });
    });

    it('should handle mixed second and millisecond date expressions', async () => {
      const response = await request(app)
        .get('/dates/mixed');
      
      const currentTimestampSec = Math.floor(Date.now() / 1000);
      const currentTimestampMs = Date.now();
      
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        seconds: currentTimestampSec.toString(),
        milliseconds: currentTimestampMs.toString(),
        futureSeconds: (currentTimestampSec + 3600).toString(),
        futureMilliseconds: (currentTimestampMs + 3600000).toString()
      });
    });

    it('should return pure date expressions as numbers, not strings', async () => {
      const response = await request(app)
        .get('/dates/pure');
      
      const currentTimestampSec = Math.floor(Date.now() / 1000);
      const currentTimestampMs = Date.now();
      
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        pureSeconds: currentTimestampSec,
        pureMilliseconds: currentTimestampMs
      });
      
      // Verify the types are numbers, not strings
      expect(typeof response.body.pureSeconds).to.equal('number');
      expect(typeof response.body.pureMilliseconds).to.equal('number');
    });
  });
  
  describe('Management Routes', () => {
    it('should return mock API data on GET /mock-data', async () => {
      const response = await request(app)
        .get('/mock-data');
      
      expect(response.status).to.equal(200);
      expect(response.body).to.have.property('routes').that.is.an('array');
    });
    
    it('should update mock API data on POST /mock-data', async () => {
      // Stub saveApiData to avoid actual storage operations
      sinon.stub(mockery, 'saveApiData').resolves(true);
      
      const newData = {
        routes: [
          {
            id: 'newRoute',
            method: 'GET',
            path: '/new',
            response: { message: 'New route' }
          }
        ]
      };
      
      const response = await request(app)
        .post('/mock-data')
        .send(newData);
      
      expect(response.status).to.equal(200);
      expect(mockery.saveApiData.calledOnceWith(newData)).to.be.true;
    });
    
    it('should handle errors when updating mock data', async () => {
      sinon.stub(mockery, 'saveApiData').rejects(new Error('Save error'));
      
      const response = await request(app)
        .post('/mock-data')
        .send({ routes: [] });
      
      expect(response.status).to.equal(500);
      expect(response.body).to.have.property('error');
    });
  });
});

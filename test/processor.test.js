// File: test/processor.test.js
const { expect } = require('chai');
const sinon = require('sinon');
const MockApiResponseProcessor = require('../lib/processor');

describe('MockApiResponseProcessor', () => {
  let processor;
  
  beforeEach(() => {
    processor = new MockApiResponseProcessor();
  });
  
  afterEach(() => {
    sinon.restore();
  });
  
  describe('processResponse', () => {
    it('should process a simple response template', () => {
      const template = {
        message: 'Hello, world!',
        status: 'success'
      };
      
      const result = processor.processResponse(template, {
        pathParams: {},
        queryParams: {},
        body: {}
      });
      
      expect(result).to.deep.equal(template);
      expect(result).to.not.equal(template); // Should be a copy, not the same object
    });
    
    it('should interpolate path parameters', () => {
      const template = {
        id: '{params.id}',
        name: 'User {params.id}'
      };
      
      const result = processor.processResponse(template, {
        pathParams: { id: '123' },
        queryParams: {},
        body: {}
      });
      
      expect(result).to.deep.equal({
        id: '123',
        name: 'User 123'
      });
    });
    
    it('should interpolate query parameters', () => {
      const template = {
        query: '{query.q}',
        sort: '{query.sort}',
        page: '{query.page}'
      };
      
      const result = processor.processResponse(template, {
        pathParams: {},
        queryParams: { q: 'search term', sort: 'asc', page: '2' },
        body: {}
      });
      
      expect(result).to.deep.equal({
        query: 'search term',
        sort: 'asc',
        page: '2'
      });
    });
    
    it('should interpolate body fields', () => {
      const template = {
        username: '{body.username}',
        email: '{body.email}'
      };
      
      const result = processor.processResponse(template, {
        pathParams: {},
        queryParams: {},
        body: { username: 'johndoe', email: 'john@example.com' }
      });
      
      expect(result).to.deep.equal({
        username: '"johndoe"',
        email: '"john@example.com"'
      });
    });
    
    it('should handle nested body fields', () => {
      const template = {
        name: '{body.user.name}',
        address: '{body.user.address.city}'
      };
      
      const result = processor.processResponse(template, {
        pathParams: {},
        queryParams: {},
        body: { 
          user: { 
            name: 'John Doe',
            address: { 
              city: 'New York' 
            } 
          } 
        }
      });
      
      expect(result).to.deep.equal({
        name: '"John Doe"',
        address: '"New York"'
      });
    });
    
    it('should process arrays in the template', () => {
      const template = {
        users: [
          { id: 1, name: 'User {params.id}' },
          { id: 2, name: 'User {params.id}2' }
        ]
      };
      
      const result = processor.processResponse(template, {
        pathParams: { id: '123' },
        queryParams: {},
        body: {}
      });
      
      expect(result).to.deep.equal({
        users: [
          { id: 1, name: 'User 123' },
          { id: 2, name: 'User 1232' }
        ]
      });
    });
    
    it('should handle missing parameters gracefully', () => {
      const template = {
        id: '{params.id}',
        query: '{query.q}',
        body: '{body.data}'
      };
      
      const result = processor.processResponse(template, {
        pathParams: {},
        queryParams: {},
        body: {}
      });
      
      expect(result).to.deep.equal({
        id: '{params.id}',
        query: '{query.q}',
        body: '{body.data}'
      });
    });
  });
  
  describe('processDateExpression', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      sinon.stub(Date, 'now').returns(1609459200000); // 2021-01-01 00:00:00 UTC (1609459200 seconds)
    });
    
    it('should process currentDate expression', () => {
      const result = processor.processDateExpression('currentDate');
      expect(result).to.equal(1609459200); // Epoch seconds
    });
    
    it('should process currentDate+N expression', () => {
      const result = processor.processDateExpression('currentDate+60');
      expect(result).to.equal(1609459200 + 60); // Add 60 seconds
    });
    
    it('should process currentDate-N expression', () => {
      const result = processor.processDateExpression('currentDate-60');
      expect(result).to.equal(1609459200 - 60); // Subtract 60 seconds
    });
    
    it('should handle whitespace in expressions', () => {
      const result = processor.processDateExpression('currentDate + 60');
      expect(result).to.equal(1609459200 + 60);
    });
    
    it('should return null for invalid expressions', () => {
      expect(processor.processDateExpression('invalidExpression')).to.be.null;
      expect(processor.processDateExpression('currentDate+abc')).to.be.null;
      expect(processor.processDateExpression('currentDate*60')).to.be.null;
    });
  });
  
  describe('interpolateString with date support', () => {
    beforeEach(() => {
      // Mock Date.now() to return a fixed timestamp
      sinon.stub(Date, 'now').returns(1609459200000); // 2021-01-01 00:00:00 UTC
    });
    
    it('should interpolate date expressions', () => {
      const str = 'Current timestamp: {date:currentDate}';
      
      const result = processor.interpolateString(str, {
        pathParams: {},
        queryParams: {},
        body: {}
      });
      
      expect(result).to.equal('Current timestamp: 1609459200');
    });
    
    it('should interpolate date expressions with addition', () => {
      const str = 'Expiry timestamp: {date:currentDate+3600}';
      
      const result = processor.interpolateString(str, {
        pathParams: {},
        queryParams: {},
        body: {}
      });
      
      expect(result).to.equal('Expiry timestamp: 1609462800'); // +1 hour
    });
    
    it('should interpolate date expressions with subtraction', () => {
      const str = 'Previous timestamp: {date:currentDate-3600}';
      
      const result = processor.interpolateString(str, {
        pathParams: {},
        queryParams: {},
        body: {}
      });
      
      expect(result).to.equal('Previous timestamp: 1609455600'); // -1 hour
    });
    
    it('should handle multiple date expressions in one string', () => {
      const str = 'Current: {date:currentDate}, Future: {date:currentDate+60}, Past: {date:currentDate-60}';
      
      const result = processor.interpolateString(str, {
        pathParams: {},
        queryParams: {},
        body: {}
      });
      
      expect(result).to.equal(
        'Current: 1609459200, Future: 1609459260, Past: 1609459140'
      );
    });
    
    it('should leave invalid date expressions unchanged', () => {
      const str = 'Invalid: {date:invalid}';
      
      const result = processor.interpolateString(str, {
        pathParams: {},
        queryParams: {},
        body: {}
      });
      
      expect(result).to.equal('Invalid: {date:invalid}');
    });
    
    it('should handle mixed parameter types in one string', () => {
      const str = 'ID: {params.id}, Query: {query.q}, Timestamp: {date:currentDate+10}';
      
      const result = processor.interpolateString(str, {
        pathParams: { id: '123' },
        queryParams: { q: 'search' },
        body: {}
      });
      
      expect(result).to.equal('ID: 123, Query: search, Timestamp: 1609459210');
    });
  });
});
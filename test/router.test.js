// File: test/router.test.js
const { expect } = require('chai');
const MockApiRouter = require('../lib/router');

describe('MockApiRouter', () => {
  let router;
  
  beforeEach(() => {
    router = new MockApiRouter();
  });
  
  describe('findMatchingRoute', () => {
    it('should find exact path matches', () => {
      const routes = [
        { method: 'get', path: '/users' },
        { method: 'post', path: '/users' }
      ];
      
      const result = router.findMatchingRoute(routes, 'get', '/users');
      
      expect(result.route).to.equal(routes[0]);
      expect(result.pathParams).to.deep.equal({});
    });
    
    it('should find path with parameters', () => {
      const routes = [
        { method: 'get', path: '/users/:id' },
        { method: 'get', path: '/users/:id/profile' }
      ];
      
      const result = router.findMatchingRoute(routes, 'get', '/users/123');
      
      expect(result.route).to.equal(routes[0]);
      expect(result.pathParams).to.deep.equal({ id: '123' });
    });
    
    it('should find path with multiple parameters', () => {
      const routes = [
        { method: 'get', path: '/users/:userId/posts/:postId' }
      ];
      
      const result = router.findMatchingRoute(routes, 'get', '/users/123/posts/456');
      
      expect(result.route).to.equal(routes[0]);
      expect(result.pathParams).to.deep.equal({ userId: '123', postId: '456' });
    });
    
    it('should match case-insensitive HTTP methods', () => {
      const routes = [
        { method: 'GET', path: '/users' },
        { method: 'post', path: '/users' }
      ];
      
      const result = router.findMatchingRoute(routes, 'get', '/users');
      
      expect(result.route).to.equal(routes[0]);
    });
    
    it('should return null for non-matching paths', () => {
      const routes = [
        { method: 'get', path: '/users' }
      ];
      
      const result = router.findMatchingRoute(routes, 'get', '/products');
      
      expect(result.route).to.be.null;
    });
    
    it('should return null for non-matching methods', () => {
      const routes = [
        { method: 'get', path: '/users' }
      ];
      
      const result = router.findMatchingRoute(routes, 'post', '/users');
      
      expect(result.route).to.be.null;
    });
    
    it('should handle path segments with special characters', () => {
      const routes = [
        { method: 'get', path: '/users/:id/files/:filename' }
      ];
      
      const result = router.findMatchingRoute(
        routes, 
        'get', 
        '/users/123/files/report.pdf'
      );
      
      expect(result.route).to.equal(routes[0]);
      expect(result.pathParams).to.deep.equal({ 
        id: '123', 
        filename: 'report.pdf' 
      });
    });
    
    it('should match the most specific route when multiple routes match', () => {
      const routes = [
        { method: 'get', path: '/users/:id' },
        { method: 'get', path: '/users/profile' }
      ];
      
      // Should match the specific route, not the parameterized one
      const result = router.findMatchingRoute(routes, 'get', '/users/profile');
      
      expect(result.route).to.equal(routes[1]);
      expect(result.pathParams).to.deep.equal({});
    });
  });
});
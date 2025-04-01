// File: lib/router.js 
class MockApiRouter {
    /**
     * Find a matching route and extract path parameters
     * @param {Array} routes Array of route configurations
     * @param {string} method HTTP method
     * @param {string} path Request path
     * @returns {Object} Object containing matched route and path parameters
     */
    findMatchingRoute(routes, method, path) {
      // Validate routes array
      if (!routes || !Array.isArray(routes)) {
        console.warn('Warning: Invalid or empty routes configuration');
        return { route: null, pathParams: {} };
      }

      for (const route of routes) {
        // Skip empty route objects or ones without required properties
        if (!route || typeof route !== 'object') {
          console.warn('Warning: Skipping empty route object');
          continue;
        }

        if (!route.method || !route.path) {
          console.warn('Warning: Skipping invalid route configuration:', route);
          continue;
        }

        if (route.method.toLowerCase() !== method) {
          continue;
        }
  
        const { isMatch, params } = this.matchPathWithParams(path, route.path);
        
        if (isMatch) {
          return { route, pathParams: params };
        }
      }
      
      return { route: null, pathParams: {} };
    }
  
    /**
     * Match request path with route path and extract parameters
     * @param {string} requestPath Actual request path
     * @param {string} routePath Route path pattern with parameters
     * @returns {Object} Object with match status and extracted parameters
     */
    matchPathWithParams(requestPath, routePath) {
      // Validate inputs
      if (!requestPath || !routePath || typeof requestPath !== 'string' || typeof routePath !== 'string') {
        console.warn('Warning: Invalid path parameters for matching');
        return { isMatch: false, params: {} };
      }

      // Create path parts for both
      const routeParts = routePath.split('/').filter(Boolean);
      const requestParts = requestPath.split('/').filter(Boolean);
      
      // Quick check - if different number of parts (excluding trailing slashes)
      if (routeParts.length !== requestParts.length) {
        return { isMatch: false, params: {} };
      }
      
      const params = {};
      
      for (let i = 0; i < routeParts.length; i++) {
        const routePart = routeParts[i];
        const requestPart = requestParts[i];
        
        // Check if this part is a parameter
        if (routePart.startsWith(':')) {
          // Extract parameter name (remove the colon)
          const paramName = routePart.substring(1);
          // Store parameter value
          params[paramName] = requestPart;
          continue;
        }
        
        // If not a parameter, parts must match exactly
        if (routePart !== requestPart) {
          return { isMatch: false, params: {} };
        }
      }
      
      return { isMatch: true, params };
    }
  
    /**
     * Load and validate routes from configuration
     * @param {Object} routesConfig Configuration object containing routes
     * @returns {Array} Validated array of routes
     */
    loadRoutes(routesConfig) {
      if (!routesConfig || !routesConfig.routes || !Array.isArray(routesConfig.routes)) {
        console.warn('Warning: Invalid or empty routes configuration');
        return [];
      }
      
      // Filter out invalid route objects
      return routesConfig.routes.filter(route => {
        const isValid = route && typeof route === 'object' && route.path && route.method;
        if (!isValid) {
          console.warn('Warning: Skipping invalid route configuration:', route);
        }
        return isValid;
      });
    }
  }
  
  module.exports = MockApiRouter;

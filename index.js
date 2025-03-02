// File: index.js
const MockApiRouter = require('./lib/router');
const MockApiResponseProcessor = require('./lib/processor');
const StorageAdapter = require('./lib/storage');

class ServerlessApiMockery {
  constructor(options = {}) {
    this.router = new MockApiRouter();
    this.processor = new MockApiResponseProcessor();
    this.storage = options.storage || new StorageAdapter.Memory();
    this.cache = {
      data: null,
      timestamp: 0,
      ttl: options.cacheTtl || 60000 // 1 minute default
    };
  }

  async getApiData() {
    const now = Date.now();
    if (this.cache.data && (now - this.cache.timestamp < this.cache.ttl)) {
      return this.cache.data;
    }
    
    try {
      const data = await this.storage.getData();
      this.cache.data = data;
      this.cache.timestamp = now;
      return data;
    } catch (error) {
      console.error("Error fetching API data:", error);
      return { routes: [], mockData: {} };
    }
  }

  async saveApiData(updatedData) {
    try {
      await this.storage.saveData(updatedData);
      this.cache.data = updatedData;
      this.cache.timestamp = Date.now();
      return true;
    } catch (error) {
      console.error("Error saving API data:", error);
      throw error;
    }
  }

  async handleRequest(req) {
    const data = await this.getApiData();
    const method = req.method.toLowerCase();
    const path = req.path;
    
    // Find matching route
    const { route, pathParams } = this.router.findMatchingRoute(data.routes, method, path);
    
    if (!route) {
      return {
        statusCode: 404,
        body: {
          error: "Mock API endpoint not found",
          requestedPath: path,
          requestedMethod: method
        }
      };
    }
    
    // Process the response with parameters
    const responseData = this.processor.processResponse(route.response, {
      pathParams, 
      queryParams: req.query, 
      body: req.body
    });
    
    return {
      statusCode: route.statusCode || 200,
      headers: route.headers || {},
      body: responseData,
      delay: route.delay
    };
  }

  // Express middleware
  middleware() {
    return async (req, res, next) => {
      // Skip middleware for management endpoints
      if (req.path === '/mock-data') {
        return next();
      }

      try {
        const response = await this.handleRequest(req);
        
        // Set status code
        res.status(response.statusCode);
        
        // Set headers
        if (response.headers) {
          Object.entries(response.headers).forEach(([key, value]) => {
            res.setHeader(key, value);
          });
        }
        
        // Handle delay if specified
        if (response.delay && !isNaN(response.delay)) {
          await new Promise(resolve => setTimeout(resolve, parseInt(response.delay)));
        }
        
        // Send response
        res.json(response.body);
      } catch (error) {
        console.error("Error in mock API middleware:", error);
        res.status(500).json({ error: "Server error" });
      }
    };
  }

  // Express management routes
  setupManagementRoutes(app) {
    app.get("/mock-data", async (req, res) => {
      try {
        const data = await this.getApiData();
        res.json(data || {});
      } catch (error) {
        res.status(500).json({ error: "Failed to fetch mock data" });
      }
    });

    app.post("/mock-data", async (req, res) => {
      try {
        await this.saveApiData(req.body);
        res.json({ message: "Mock data updated successfully" });
      } catch (error) {
        console.error("Error updating mock data:", error);
        res.status(500).json({ error: "Failed to update mock data" });
      }
    });
  }
}

module.exports = ServerlessApiMockery;
module.exports.Router = MockApiRouter;
module.exports.ResponseProcessor = MockApiResponseProcessor;
module.exports.StorageAdapter = StorageAdapter;
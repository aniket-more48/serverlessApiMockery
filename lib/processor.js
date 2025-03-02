// File: lib/processor.js
class MockApiResponseProcessor {
    /**
     * Process the response template with parameters
     * @param {Object} responseTemplate Response template from route config
     * @param {Object} params Parameters object with pathParams, queryParams, and body
     * @returns {Object} Processed response with interpolated values
     */
    processResponse(responseTemplate, { pathParams, queryParams, body }) {
      // Create deep copy of the response template
      const response = JSON.parse(JSON.stringify(responseTemplate));
      
      // Process the response recursively
      return this.processObject(response, { pathParams, queryParams, body });
    }
  
    /**
     * Recursively process object values for parameter interpolation
     * @param {*} obj Object or value to process
     * @param {Object} params Parameters object
     * @returns {*} Processed object or value
     */
    processObject(obj, params) {
      if (obj === null || obj === undefined) {
        return obj;
      }
      
      // Handle strings with template placeholders
      if (typeof obj === 'string') {
        return this.interpolateString(obj, params);
      }
      
      // Handle arrays
      if (Array.isArray(obj)) {
        return obj.map(item => this.processObject(item, params));
      }
      
      // Handle objects
      if (typeof obj === 'object') {
        const result = {};
        for (const [key, value] of Object.entries(obj)) {
          // Process both key and value
          const processedKey = typeof key === 'string' 
            ? this.interpolateString(key, params) 
            : key;
          result[processedKey] = this.processObject(value, params);
        }
        return result;
      }
      
      // Return other types as is
      return obj;
    }
  
    /**
     * Interpolate a string with parameters
     * @param {string} str String to interpolate
     * @param {Object} params Parameters object
     * @returns {string} Interpolated string
     */
    interpolateString(str, { pathParams, queryParams, body }) {
      // Replace path parameters: {params.id}
      let result = str.replace(/\{params\.([^}]+)\}/g, (match, paramName) => {
        return pathParams[paramName] !== undefined ? pathParams[paramName] : match;
      });
      
      // Replace query parameters: {query.sort}
      result = result.replace(/\{query\.([^}]+)\}/g, (match, paramName) => {
        return queryParams[paramName] !== undefined ? queryParams[paramName] : match;
      });
      
      // Replace body fields: {body.user.name}
      result = result.replace(/\{body\.([\w.]+)\}/g, (match, path) => {
        const parts = path.split('.');
        let current = body;
        
        // Navigate the nested structure
        for (const part of parts) {
          if (current === undefined || current === null) {
            return match;  // Keep original if path is invalid
          }
          current = current[part];
        }
        
        return current !== undefined ? JSON.stringify(current) : match;
      });
      
      return result;
    }
  }
  
  module.exports = MockApiResponseProcessor;
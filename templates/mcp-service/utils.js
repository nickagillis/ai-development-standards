/**
 * MCP Service Utilities
 * 
 * Utility functions for MCP service operations
 */

/**
 * Validate input against schema
 */
function validateInput(input, schema) {
  const errors = [];
  
  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (!(field in input)) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }
  
  // Validate properties
  if (schema.properties) {
    for (const [field, rules] of Object.entries(schema.properties)) {
      if (field in input) {
        const value = input[field];
        
        if (rules.type && typeof value !== rules.type) {
          errors.push(`Invalid type for ${field}: expected ${rules.type}`);
        }
        
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push(`Invalid value for ${field}: must be one of ${rules.enum.join(', ')}`);
        }
      }
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Enhanced error handling
 */
function handleError(error, context) {
  const enhancedError = new Error(`${context}: ${error.message}`);
  enhancedError.originalError = error;
  enhancedError.context = context;
  enhancedError.timestamp = new Date().toISOString();
  
  return enhancedError;
}

/**
 * Calculate context usage
 */
function calculateContextUsage(text) {
  const estimatedTokens = Math.ceil(text.length / 4);
  return {
    characters: text.length,
    estimatedTokens,
    utilizationRate: (estimatedTokens / 8192) * 100 // Assuming 8k context window
  };
}

/**
 * Rate limiting utility
 */
class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }
  
  isAllowed() {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    if (this.requests.length < this.maxRequests) {
      this.requests.push(now);
      return true;
    }
    
    return false;
  }
  
  getRemainingRequests() {
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

module.exports = {
  validateInput,
  handleError,
  calculateContextUsage,
  RateLimiter
};
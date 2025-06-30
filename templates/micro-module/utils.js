/**
 * Utility functions for [MODULE_NAME]
 * 
 * Collection of focused helper functions:
 * - Input validation
 * - Data transformation
 * - Error handling
 * - Common operations
 */

/**
 * Validate input against schema
 * @param {*} input - Input to validate
 * @param {Object} schema - Validation schema
 * @returns {*} Validated input
 * @throws {Error} If validation fails
 */
function validateInput(input, schema) {
  if (!schema) {
    return input;
  }
  
  // Basic validation logic
  if (schema.required && schema.required.length > 0) {
    for (const field of schema.required) {
      if (input[field] === undefined || input[field] === null) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
  }
  
  return input;
}

/**
 * Safe JSON parsing with error handling
 * @param {string} jsonString - JSON string to parse
 * @param {*} defaultValue - Default value if parsing fails
 * @returns {*} Parsed object or default value
 */
function safeJsonParse(jsonString, defaultValue = null) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    return defaultValue;
  }
}

/**
 * Deep clone an object
 * @param {*} obj - Object to clone
 * @returns {*} Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item));
  }
  
  if (typeof obj === 'object') {
    const cloned = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned;
  }
  
  return obj;
}

/**
 * Create a timeout promise
 * @param {number} ms - Timeout in milliseconds
 * @param {string} message - Error message
 * @returns {Promise} Promise that rejects after timeout
 */
function createTimeout(ms, message = 'Operation timed out') {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), ms);
  });
}

/**
 * Race a promise against a timeout
 * @param {Promise} promise - Promise to race
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise that resolves/rejects first
 */
function withTimeout(promise, timeout) {
  return Promise.race([
    promise,
    createTimeout(timeout)
  ]);
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {number} maxAttempts - Maximum retry attempts
 * @param {number} baseDelay - Base delay in milliseconds
 * @returns {Promise} Promise that resolves with function result
 */
async function withRetry(fn, maxAttempts = 3, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxAttempts) {
        break;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Format error for logging
 * @param {Error} error - Error to format
 * @param {Object} context - Additional context
 * @returns {Object} Formatted error object
 */
function formatError(error, context = {}) {
  return {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  };
}

module.exports = {
  validateInput,
  safeJsonParse,
  deepClone,
  createTimeout,
  withTimeout,
  withRetry,
  formatError
};
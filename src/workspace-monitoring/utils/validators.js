/**
 * Input Validation Utilities
 * 
 * Purpose: Centralized validation for workspace monitoring system
 * Architecture: Pure utility functions with comprehensive error handling
 * Context: Optimized for security and reliability
 */

/**
 * Validate file path input
 * @param {string} filePath - File path to validate
 * @returns {string} Validated file path
 * @throws {Error} If invalid
 */
function validateFilePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a non-empty string');
  }
  
  if (filePath.length > 4096) {
    throw new Error('File path too long (max 4096 characters)');
  }
  
  // Check for dangerous patterns
  const dangerousPatterns = ['../', '..\\', '<script', 'javascript:'];
  for (const pattern of dangerousPatterns) {
    if (filePath.includes(pattern)) {
      throw new Error(`File path contains dangerous pattern: ${pattern}`);
    }
  }
  
  return filePath.trim();
}

/**
 * Validate editor identifier
 * @param {string} editor - Editor identifier to validate
 * @returns {string} Validated editor identifier
 * @throws {Error} If invalid
 */
function validateEditor(editor) {
  if (!editor || typeof editor !== 'string') {
    throw new Error('Editor identifier must be a non-empty string');
  }
  
  if (editor.length > 256) {
    throw new Error('Editor identifier too long (max 256 characters)');
  }
  
  // Allow alphanumeric, hyphens, underscores, and dots
  const validPattern = /^[a-zA-Z0-9._-]+$/;
  if (!validPattern.test(editor)) {
    throw new Error('Editor identifier contains invalid characters');
  }
  
  return editor.trim();
}

/**
 * Validate timestamp
 * @param {string} timestamp - ISO timestamp to validate
 * @returns {Date} Validated Date object
 * @throws {Error} If invalid
 */
function validateTimestamp(timestamp) {
  if (!timestamp) {
    return new Date(); // Default to current time
  }
  
  const date = new Date(timestamp);
  
  if (isNaN(date.getTime())) {
    throw new Error('Invalid timestamp format');
  }
  
  // Check if timestamp is reasonable (not too far in past/future)
  const now = Date.now();
  const diff = Math.abs(date.getTime() - now);
  const maxDiff = 24 * 60 * 60 * 1000; // 24 hours
  
  if (diff > maxDiff) {
    throw new Error('Timestamp is too far from current time');
  }
  
  return date;
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validated configuration
 * @throws {Error} If invalid
 */
function validateConfig(config) {
  if (!config || typeof config !== 'object') {
    throw new Error('Configuration must be an object');
  }
  
  const validated = { ...config };
  
  // Validate numeric values
  const numericFields = ['debounceMs', 'timeWindowMs', 'maxFiles', 'maxMessageSize'];
  for (const field of numericFields) {
    if (validated[field] !== undefined) {
      const value = Number(validated[field]);
      if (isNaN(value) || value < 0) {
        throw new Error(`${field} must be a non-negative number`);
      }
      validated[field] = value;
    }
  }
  
  // Validate boolean values
  const booleanFields = ['enabled', 'compressionEnabled', 'trackingEnabled'];
  for (const field of booleanFields) {
    if (validated[field] !== undefined) {
      validated[field] = Boolean(validated[field]);
    }
  }
  
  // Validate arrays
  const arrayFields = ['extensions', 'ignorePaths'];
  for (const field of arrayFields) {
    if (validated[field] !== undefined) {
      if (!Array.isArray(validated[field])) {
        throw new Error(`${field} must be an array`);
      }
      
      // Validate array elements are strings
      validated[field] = validated[field].map(item => {
        if (typeof item !== 'string') {
          throw new Error(`${field} array must contain only strings`);
        }
        return item.trim();
      });
    }
  }
  
  return validated;
}

/**
 * Validate input data according to schema
 * @param {*} input - Input data to validate
 * @param {Object} schema - Validation schema
 * @returns {*} Validated input
 * @throws {Error} If validation fails
 */
function validateInput(input, schema = {}) {
  if (!schema) {
    return input; // No validation required
  }
  
  // Basic type validation
  if (schema.type && typeof input !== schema.type) {
    throw new Error(`Expected ${schema.type}, got ${typeof input}`);
  }
  
  // Required field validation
  if (schema.required && (input === null || input === undefined)) {
    throw new Error('Required field is missing');
  }
  
  // String validation
  if (schema.type === 'string' && typeof input === 'string') {
    if (schema.minLength && input.length < schema.minLength) {
      throw new Error(`String too short (min ${schema.minLength} characters)`);
    }
    if (schema.maxLength && input.length > schema.maxLength) {
      throw new Error(`String too long (max ${schema.maxLength} characters)`);
    }
    if (schema.pattern && !schema.pattern.test(input)) {
      throw new Error('String does not match required pattern');
    }
  }
  
  // Number validation
  if (schema.type === 'number' && typeof input === 'number') {
    if (schema.min !== undefined && input < schema.min) {
      throw new Error(`Number too small (min ${schema.min})`);
    }
    if (schema.max !== undefined && input > schema.max) {
      throw new Error(`Number too large (max ${schema.max})`);
    }
  }
  
  return input;
}

module.exports = {
  validateFilePath,
  validateEditor,
  validateTimestamp,
  validateConfig,
  validateInput
};
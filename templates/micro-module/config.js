/**
 * Configuration for [MODULE_NAME]
 * 
 * Centralized configuration management with:
 * - Environment variable support
 * - Validation
 * - Defaults
 * - Type safety
 */

/**
 * Default configuration values
 */
const defaultConfig = {
  // Module metadata
  version: '1.0.0',
  name: '[MODULE_NAME]',
  
  // Core settings
  enabled: true,
  timeout: 5000,
  retryAttempts: 3,
  
  // Performance settings
  maxConcurrency: 5,
  cacheEnabled: true,
  cacheSize: 100,
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  enableDebug: process.env.DEBUG === 'true',
  
  // Validation schema
  inputSchema: {
    type: 'object',
    required: ['data'],
    properties: {
      data: { type: 'any' }
    }
  }
};

/**
 * Environment-specific configurations
 */
const environmentConfigs = {
  development: {
    logLevel: 'debug',
    enableDebug: true,
    timeout: 10000
  },
  
  test: {
    logLevel: 'error',
    enableDebug: false,
    timeout: 1000,
    cacheEnabled: false
  },
  
  production: {
    logLevel: 'warn',
    enableDebug: false,
    timeout: 5000,
    maxConcurrency: 10
  }
};

/**
 * Load configuration based on environment
 * @param {string} environment - Environment name
 * @returns {Object} Merged configuration
 */
function loadConfig(environment = process.env.NODE_ENV || 'development') {
  const envConfig = environmentConfigs[environment] || {};
  
  return {
    ...defaultConfig,
    ...envConfig,
    // Environment variables override
    timeout: parseInt(process.env.MODULE_TIMEOUT) || defaultConfig.timeout,
    maxConcurrency: parseInt(process.env.MODULE_MAX_CONCURRENCY) || defaultConfig.maxConcurrency
  };
}

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @throws {Error} If configuration is invalid
 */
function validateConfig(config) {
  const requiredFields = ['version', 'name', 'timeout'];
  
  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Required configuration field missing: ${field}`);
    }
  }
  
  if (config.timeout < 1000) {
    throw new Error('Timeout must be at least 1000ms');
  }
  
  if (config.maxConcurrency < 1) {
    throw new Error('Max concurrency must be at least 1');
  }
}

module.exports = {
  defaultConfig,
  environmentConfigs,
  loadConfig,
  validateConfig
};
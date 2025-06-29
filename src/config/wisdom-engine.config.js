/**
 * Community Wisdom Engine Configuration
 * Environment-driven configuration with validation
 * Single responsibility: Configuration management
 */

const path = require('path');
const fs = require('fs');

/**
 * Configuration schema with validation
 */
const CONFIG_SCHEMA = {
  engine: {
    enabled: { type: 'boolean', default: true, required: true },
    participationLevel: { 
      type: 'string', 
      default: 'observer', 
      enum: ['none', 'observer', 'contributor'],
      required: true 
    },
    privacyLevel: { 
      type: 'string', 
      default: 'maximum', 
      enum: ['basic', 'enhanced', 'maximum'],
      required: true 
    },
    autoSuggest: { type: 'boolean', default: true, required: true }
  },
  mcp: {
    githubEnabled: { type: 'boolean', default: true, required: true },
    allowRepositoryAccess: { type: 'boolean', default: false, required: true },
    maxAnalysisDepth: { type: 'number', default: 3, min: 1, max: 5, required: true },
    timeout: { type: 'number', default: 30000, min: 5000, max: 120000, required: true }
  },
  security: {
    validateInputs: { type: 'boolean', default: true, required: true },
    sanitizeFilePaths: { type: 'boolean', default: true, required: true },
    allowExternalConnections: { type: 'boolean', default: false, required: true },
    maxFileSize: { type: 'number', default: 10485760, min: 1024, required: true }, // 10MB
    allowedFileTypes: { 
      type: 'array', 
      default: ['.js', '.ts', '.json', '.md', '.yml', '.yaml'], 
      required: true 
    }
  },
  performance: {
    maxConcurrentAnalyses: { type: 'number', default: 3, min: 1, max: 10, required: true },
    cacheEnabled: { type: 'boolean', default: true, required: true },
    cacheTTL: { type: 'number', default: 3600000, min: 60000, required: true }, // 1 hour
    enableMetrics: { type: 'boolean', default: false, required: true }
  }
};

class WisdomEngineConfig {
  constructor(environment = 'development') {
    this.environment = environment;
    this.config = this.loadConfiguration();
    this.validateConfiguration();
  }

  /**
   * Load configuration from environment variables and defaults
   */
  loadConfiguration() {
    const config = {};
    
    // Load from environment variables
    config.engine = {
      enabled: this.getEnvBool('WISDOM_ENGINE_ENABLED', true),
      participationLevel: this.getEnvString('WISDOM_PARTICIPATION_LEVEL', 'observer', ['none', 'observer', 'contributor']),
      privacyLevel: this.getEnvString('WISDOM_PRIVACY_LEVEL', 'maximum', ['basic', 'enhanced', 'maximum']),
      autoSuggest: this.getEnvBool('WISDOM_AUTO_SUGGEST', true)
    };

    config.mcp = {
      githubEnabled: this.getEnvBool('MCP_GITHUB_ENABLED', true),
      allowRepositoryAccess: this.getEnvBool('MCP_ALLOW_REPO_ACCESS', false),
      maxAnalysisDepth: this.getEnvNumber('MCP_MAX_ANALYSIS_DEPTH', 3, 1, 5),
      timeout: this.getEnvNumber('MCP_TIMEOUT', 30000, 5000, 120000)
    };

    config.security = {
      validateInputs: this.getEnvBool('SECURITY_VALIDATE_INPUTS', true),
      sanitizeFilePaths: this.getEnvBool('SECURITY_SANITIZE_PATHS', true),
      allowExternalConnections: this.getEnvBool('SECURITY_ALLOW_EXTERNAL', false),
      maxFileSize: this.getEnvNumber('SECURITY_MAX_FILE_SIZE', 10485760, 1024),
      allowedFileTypes: this.getEnvArray('SECURITY_ALLOWED_TYPES', ['.js', '.ts', '.json', '.md', '.yml', '.yaml'])
    };

    config.performance = {
      maxConcurrentAnalyses: this.getEnvNumber('PERF_MAX_CONCURRENT', 3, 1, 10),
      cacheEnabled: this.getEnvBool('PERF_CACHE_ENABLED', true),
      cacheTTL: this.getEnvNumber('PERF_CACHE_TTL', 3600000, 60000),
      enableMetrics: this.getEnvBool('PERF_ENABLE_METRICS', false)
    };

    // Environment-specific overrides
    if (this.environment === 'production') {
      config.security.allowExternalConnections = false;
      config.performance.enableMetrics = true;
      config.engine.autoSuggest = false; // More conservative in production
    } else if (this.environment === 'development') {
      config.performance.enableMetrics = true;
      config.mcp.allowRepositoryAccess = true; // Allow for development
    }

    return config;
  }

  /**
   * Validate configuration against schema
   */
  validateConfiguration() {
    try {
      this.validateObject(this.config, CONFIG_SCHEMA);
    } catch (error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
  }

  /**
   * Validate object against schema recursively
   */
  validateObject(obj, schema) {
    for (const [key, rules] of Object.entries(schema)) {
      if (typeof rules === 'object' && !Array.isArray(rules) && !rules.type) {
        // Nested object
        if (!obj[key]) {
          throw new Error(`Missing required configuration section: ${key}`);
        }
        this.validateObject(obj[key], rules);
      } else {
        // Value validation
        this.validateValue(obj[key], rules, key);
      }
    }
  }

  /**
   * Validate individual value against rules
   */
  validateValue(value, rules, key) {
    if (rules.required && (value === undefined || value === null)) {
      throw new Error(`Required configuration missing: ${key}`);
    }

    if (value === undefined || value === null) {
      return; // Optional value, skip validation
    }

    // Type validation
    if (rules.type && typeof value !== rules.type) {
      throw new Error(`Configuration ${key} must be of type ${rules.type}, got ${typeof value}`);
    }

    // Enum validation
    if (rules.enum && !rules.enum.includes(value)) {
      throw new Error(`Configuration ${key} must be one of: ${rules.enum.join(', ')}, got: ${value}`);
    }

    // Number range validation
    if (rules.type === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        throw new Error(`Configuration ${key} must be >= ${rules.min}, got: ${value}`);
      }
      if (rules.max !== undefined && value > rules.max) {
        throw new Error(`Configuration ${key} must be <= ${rules.max}, got: ${value}`);
      }
    }
  }

  // Environment variable helpers with validation
  getEnvBool(name, defaultValue) {
    const value = process.env[name];
    if (value === undefined) return defaultValue;
    return value.toLowerCase() === 'true';
  }

  getEnvString(name, defaultValue, allowedValues = null) {
    const value = process.env[name] || defaultValue;
    if (allowedValues && !allowedValues.includes(value)) {
      throw new Error(`Environment variable ${name} must be one of: ${allowedValues.join(', ')}`);
    }
    return value;
  }

  getEnvNumber(name, defaultValue, min = null, max = null) {
    const value = process.env[name];
    const numValue = value ? parseInt(value, 10) : defaultValue;
    
    if (isNaN(numValue)) {
      throw new Error(`Environment variable ${name} must be a number`);
    }
    
    if (min !== null && numValue < min) {
      throw new Error(`Environment variable ${name} must be >= ${min}`);
    }
    
    if (max !== null && numValue > max) {
      throw new Error(`Environment variable ${name} must be <= ${max}`);
    }
    
    return numValue;
  }

  getEnvArray(name, defaultValue) {
    const value = process.env[name];
    if (!value) return defaultValue;
    
    try {
      return JSON.parse(value);
    } catch {
      // Fallback to comma-separated string
      return value.split(',').map(item => item.trim());
    }
  }

  /**
   * Get configuration value by path (e.g., 'engine.enabled')
   */
  get(path) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      value = value?.[key];
      if (value === undefined) {
        throw new Error(`Configuration path not found: ${path}`);
      }
    }
    
    return value;
  }

  /**
   * Get all configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Check if feature is enabled
   */
  isEnabled(feature) {
    switch (feature) {
      case 'engine': return this.get('engine.enabled');
      case 'mcp': return this.get('mcp.githubEnabled');
      case 'cache': return this.get('performance.cacheEnabled');
      case 'metrics': return this.get('performance.enableMetrics');
      default: throw new Error(`Unknown feature: ${feature}`);
    }
  }

  /**
   * Get security settings for validation
   */
  getSecuritySettings() {
    return { ...this.config.security };
  }

  /**
   * Get performance settings
   */
  getPerformanceSettings() {
    return { ...this.config.performance };
  }
}

// Singleton instance
let configInstance = null;

/**
 * Get configuration instance (singleton)
 */
function getConfig(environment = process.env.NODE_ENV || 'development') {
  if (!configInstance) {
    configInstance = new WisdomEngineConfig(environment);
  }
  return configInstance;
}

/**
 * Reset configuration (for testing)
 */
function resetConfig() {
  configInstance = null;
}

module.exports = {
  WisdomEngineConfig,
  getConfig,
  resetConfig,
  CONFIG_SCHEMA
};
/**
 * Workspace Monitoring Configuration
 * 
 * Purpose: Central configuration for workspace monitoring system
 * Architecture: Context-optimized configuration module
 */

const defaultConfig = {
  name: 'workspace-monitor',
  version: '1.0.0',
  
  // File monitoring settings
  monitoring: {
    extensions: ['.js', '.ts', '.md', '.json', '.yml', '.yaml'],
    ignorePaths: ['node_modules', '.git', 'dist', 'build'],
    debounceMs: 500,
    maxWatchFiles: 1000
  },
  
  // Conflict detection settings
  conflicts: {
    timeWindowMs: 300000, // 5 minutes
    maxSimultaneousEditors: 3,
    notificationThreshold: 2
  },
  
  // Collaboration analysis
  collaboration: {
    trackingEnabled: true,
    sessionTimeoutMs: 1800000, // 30 minutes
    teamSizeThreshold: 5
  },
  
  // MCP integration
  mcp: {
    enabled: true,
    reconnectAttempts: 3,
    heartbeatIntervalMs: 30000,
    maxMessageSize: 1024 * 1024 // 1MB
  },
  
  // Logging and events
  logging: {
    level: 'info',
    enableEvents: true,
    maxLogSize: 1024 * 1024 * 10 // 10MB
  }
};

/**
 * Validate configuration object
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validated configuration
 */
function validateConfig(config) {
  const merged = { ...defaultConfig, ...config };
  
  // Basic validation
  if (!merged.name || typeof merged.name !== 'string') {
    throw new Error('Config name must be a non-empty string');
  }
  
  if (!merged.version || typeof merged.version !== 'string') {
    throw new Error('Config version must be a non-empty string');
  }
  
  return merged;
}

module.exports = {
  defaultConfig,
  validateConfig
};
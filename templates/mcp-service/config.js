/**
 * MCP Service Configuration
 * 
 * Configuration template for MCP services
 */

module.exports = {
  defaults: {
    // Connection settings
    endpoint: process.env.MCP_ENDPOINT || 'http://localhost:3000',
    apiKey: process.env.MCP_API_KEY,
    timeout: 30000,
    retries: 3,
    
    // Context optimization
    maxConcurrentRequests: 5,
    requestBatchSize: 10,
    contextWindowSize: 8192,
    
    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    enableMetrics: true
  },
  
  // Request validation schema
  requestSchema: {
    required: ['type', 'data'],
    properties: {
      type: { type: 'string', enum: ['query', 'update', 'delete'] },
      data: { type: 'object' },
      metadata: { type: 'object' }
    }
  },
  
  // Response format
  responseFormat: {
    success: true,
    data: null,
    metadata: {
      timestamp: null,
      processingTime: null,
      contextUsed: null
    }
  }
};
/**
 * MCP Service Template
 * 
 * Template for creating MCP-compatible services with context optimization
 * @template-version 1.7.0
 */

const { EventEmitter } = require('events');
const config = require('./config');
const { validateInput, handleError } = require('./utils');

/**
 * {{SERVICE_NAME}} MCP Service
 * 
 * Focused MCP service following context optimization guidelines
 */
class {{SERVICE_NAME}}Service extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = { ...config.defaults, ...options };
    this.state = {
      connected: false,
      initialized: false,
      lastActivity: null
    };
    
    this.setupEventHandlers();
  }
  
  /**
   * Initialize MCP service
   */
  async initialize() {
    try {
      await this.validateConfiguration();
      await this.establishConnection();
      
      this.state.initialized = true;
      this.emit('initialized');
      
      return this;
      
    } catch (error) {
      this.emit('error', handleError(error, 'initialization'));
      throw error;
    }
  }
  
  /**
   * Connect to MCP endpoint
   */
  async connect() {
    if (this.state.connected) {
      return this;
    }
    
    try {
      await this.establishConnection();
      this.state.connected = true;
      this.state.lastActivity = new Date();
      
      this.emit('connected');
      return this;
      
    } catch (error) {
      this.emit('error', handleError(error, 'connection'));
      throw error;
    }
  }
  
  /**
   * Process MCP request
   */
  async processRequest(request) {
    const validation = validateInput(request, this.config.requestSchema);
    if (!validation.isValid) {
      throw new Error(`Invalid request: ${validation.errors.join(', ')}`);
    }
    
    try {
      this.updateActivity();
      const result = await this.handleRequest(request);
      
      this.emit('request_processed', { request, result });
      return result;
      
    } catch (error) {
      this.emit('error', handleError(error, 'request_processing'));
      throw error;
    }
  }
  
  /**
   * Disconnect from MCP endpoint
   */
  async disconnect() {
    if (!this.state.connected) {
      return this;
    }
    
    try {
      await this.closeConnection();
      this.state.connected = false;
      
      this.emit('disconnected');
      return this;
      
    } catch (error) {
      this.emit('error', handleError(error, 'disconnection'));
      throw error;
    }
  }
  
  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      connected: this.state.connected,
      initialized: this.state.initialized,
      lastActivity: this.state.lastActivity,
      uptime: this.calculateUptime()
    };
  }
  
  // --- PRIVATE METHODS ---
  
  setupEventHandlers() {
    this.on('error', (error) => {
      console.error(`{{SERVICE_NAME}} Service Error:`, error.message);
    });
  }
  
  async validateConfiguration() {
    const required = ['endpoint', 'apiKey'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing configuration: ${missing.join(', ')}`);
    }
  }
  
  async establishConnection() {
    // Implement connection logic
    throw new Error('establishConnection must be implemented by subclass');
  }
  
  async handleRequest(request) {
    // Implement request handling
    throw new Error('handleRequest must be implemented by subclass');
  }
  
  async closeConnection() {
    // Implement disconnection logic
    throw new Error('closeConnection must be implemented by subclass');
  }
  
  updateActivity() {
    this.state.lastActivity = new Date();
  }
  
  calculateUptime() {
    if (!this.state.lastActivity) return 0;
    return Date.now() - this.state.lastActivity.getTime();
  }
}

module.exports = {{SERVICE_NAME}}Service;
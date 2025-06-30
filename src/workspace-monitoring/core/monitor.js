/**
 * Workspace Monitor - Main orchestrator
 * 
 * Purpose: Coordinate workspace monitoring services
 * Architecture: Core-Extensions pattern with event-driven composition
 * Context: Optimized for Claude Desktop MCP integration
 */

const { EventHub } = require('./event-hub');
const { validateConfig } = require('../config/workspace-config');

/**
 * WorkspaceMonitor - Main monitoring system coordinator
 * 
 * Orchestrates multiple monitoring services:
 * - File change detection
 * - Conflict analysis
 * - Collaboration tracking
 * - MCP integration
 */
class WorkspaceMonitor {
  constructor(options = {}) {
    this.config = validateConfig(options);
    this.eventHub = new EventHub(this.config);
    
    this.state = {
      initialized: false,
      active: false,
      startTime: null,
      lastActivity: null
    };
    
    this.services = new Map();
    this.setupEventListeners();
  }
  
  /**
   * Initialize the monitoring system
   * @returns {Promise<boolean>} Initialization success
   */
  async initialize() {
    try {
      if (this.state.initialized) {
        return true;
      }
      
      // Initialize all registered services
      for (const [name, service] of this.services) {
        if (typeof service.initialize === 'function') {
          await service.initialize();
        }
      }
      
      this.state.initialized = true;
      this.state.startTime = new Date().toISOString();
      
      this.eventHub.emit('monitor:initialized', this.getStatus());
      return true;
      
    } catch (error) {
      this.eventHub.emit('monitor:error', {
        phase: 'initialization',
        error: error.message
      });
      throw error;
    }
  }
  
  /**
   * Start monitoring workspace
   * @returns {Promise<boolean>} Start success
   */
  async start() {
    if (!this.state.initialized) {
      await this.initialize();
    }
    
    this.state.active = true;
    this.state.lastActivity = new Date().toISOString();
    
    this.eventHub.emit('monitor:started', this.getStatus());
    return true;
  }
  
  /**
   * Register a monitoring service
   * @param {Object} service - Service instance
   */
  use(service) {
    if (!service.name) {
      throw new Error('Service must have a name property');
    }
    
    this.services.set(service.name, service);
    this.eventHub.register(service);
  }
  
  /**
   * Get monitoring system status
   * @returns {Object} Complete system status
   */
  getStatus() {
    return {
      name: this.config.name,
      version: this.config.version,
      state: { ...this.state },
      services: Array.from(this.services.keys()),
      eventHub: this.eventHub.getStatus()
    };
  }
  
  /**
   * Stop monitoring and cleanup
   * @returns {Promise<boolean>} Shutdown success
   */
  async shutdown() {
    try {
      this.state.active = false;
      await this.eventHub.shutdown();
      
      this.eventHub.emit('monitor:shutdown');
      return true;
      
    } catch (error) {
      this.eventHub.emit('monitor:error', {
        phase: 'shutdown',
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Set up core event listeners
   */
  setupEventListeners() {
    this.eventHub.on('file:changed', (data) => {
      this.state.lastActivity = new Date().toISOString();
    });
    
    this.eventHub.on('conflict:detected', (data) => {
      this.state.lastActivity = new Date().toISOString();
    });
  }
}

module.exports = { WorkspaceMonitor };
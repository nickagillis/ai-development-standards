/**
 * Workspace Monitoring Event Hub
 * 
 * Purpose: Central event coordination for workspace monitoring system
 * Architecture: Event-driven composition pattern
 * Context: Optimized for Claude Desktop analysis
 */

const EventEmitter = require('events');

/**
 * EventHub - Central event coordinator for workspace monitoring
 * 
 * Manages communication between monitoring services with:
 * - Event routing and filtering
 * - Service registration and lifecycle
 * - Error propagation and recovery
 */
class EventHub extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = config;
    this.services = new Map();
    this.eventStats = {
      total: 0,
      errors: 0,
      lastEvent: null
    };
    
    // Set up error handling
    this.on('error', this.handleError.bind(this));
  }
  
  /**
   * Register a monitoring service
   * @param {Object} service - Service instance with name and setEventHub method
   */
  register(service) {
    if (!service.name || typeof service.setEventHub !== 'function') {
      throw new Error('Service must have name and setEventHub method');
    }
    
    if (this.services.has(service.name)) {
      throw new Error(`Service ${service.name} already registered`);
    }
    
    this.services.set(service.name, service);
    service.setEventHub(this);
    
    this.emit('service:registered', { name: service.name });
  }
  
  /**
   * Unregister a monitoring service
   * @param {string} serviceName - Name of service to unregister
   */
  unregister(serviceName) {
    const service = this.services.get(serviceName);
    if (service) {
      this.services.delete(serviceName);
      this.emit('service:unregistered', { name: serviceName });
    }
  }
  
  /**
   * Enhanced emit with statistics tracking
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  emit(eventName, data) {
    this.eventStats.total++;
    this.eventStats.lastEvent = new Date().toISOString();
    
    try {
      return super.emit(eventName, data);
    } catch (error) {
      this.eventStats.errors++;
      this.handleError(error);
      return false;
    }
  }
  
  /**
   * Get system status
   * @returns {Object} Hub status with services and statistics
   */
  getStatus() {
    return {
      services: Array.from(this.services.keys()),
      eventStats: { ...this.eventStats },
      listenerCount: this.eventNames().length
    };
  }
  
  /**
   * Shutdown all services gracefully
   */
  async shutdown() {
    const shutdownPromises = Array.from(this.services.values())
      .filter(service => typeof service.shutdown === 'function')
      .map(service => service.shutdown());
    
    await Promise.all(shutdownPromises);
    this.removeAllListeners();
    this.emit('hub:shutdown');
  }
  
  /**
   * Handle errors from services
   * @param {Error} error - Error to handle
   */
  handleError(error) {
    console.error('[EventHub] Error:', error.message);
    // Could integrate with logging service here
  }
}

module.exports = { EventHub };
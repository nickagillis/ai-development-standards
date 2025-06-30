/**
 * Production-Ready Logging System
 * Single responsibility: Centralized logging
 * Environment-aware log levels and formatting
 * 
 * FIXED: Circular dependency with config system
 * - Uses lazy configuration loading
 * - Provides sensible defaults when config unavailable
 * - Maintains thread-safety and performance
 */

const fs = require('fs');
const path = require('path');

class Logger {
  constructor(component = 'WisdomEngine') {
    this.component = component;
    this._config = null; // Lazy-loaded configuration
    this._configLoadAttempted = false;
    this._configLoadError = null;
    
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Default log level (will be overridden by config when available)
    this.currentLogLevel = this.getDefaultLogLevel();
    
    // Initialize log directory if needed
    this.initializeLogDirectory();
  }

  /**
   * Get default log level based on NODE_ENV (no config dependency)
   */
  getDefaultLogLevel() {
    const env = process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        return this.logLevels.warn;
      case 'development':
        return this.logLevels.debug;
      case 'test':
        return this.logLevels.error;
      default:
        return this.logLevels.info;
    }
  }

  /**
   * Lazy-load configuration to avoid circular dependency
   */
  getConfig() {
    if (this._config) {
      return this._config;
    }
    
    if (this._configLoadAttempted && this._configLoadError) {
      // Don't keep trying if we failed before
      return null;
    }
    
    if (!this._configLoadAttempted) {
      this._configLoadAttempted = true;
      
      try {
        // Dynamic require to avoid circular dependency during module initialization
        const { getConfig } = require('../config/wisdom-engine.config');
        this._config = getConfig();
        
        // Update log level based on config now that it's available
        this.currentLogLevel = this.getEnvironmentLogLevel();
        
        return this._config;
      } catch (error) {
        this._configLoadError = error;
        
        // Use console.warn directly to avoid recursive logging
        console.warn('[Logger] Config unavailable, using defaults:', error.message);
        return null;
      }
    }
    
    return this._config;
  }

  /**
   * Get appropriate log level for environment (with config if available)
   */
  getEnvironmentLogLevel() {
    const config = this.getConfig();
    
    if (!config) {
      return this.getDefaultLogLevel();
    }
    
    const env = config.environment || process.env.NODE_ENV || 'development';
    
    switch (env) {
      case 'production':
        return this.logLevels.warn;
      case 'development':
        return this.logLevels.debug;
      case 'test':
        return this.logLevels.error;
      default:
        return this.logLevels.info;
    }
  }

  /**
   * Check if feature is enabled (with graceful fallback)
   */
  isFeatureEnabled(feature) {
    const config = this.getConfig();
    
    if (!config) {
      // Sensible defaults when config is unavailable
      switch (feature) {
        case 'metrics': return process.env.NODE_ENV === 'development';
        case 'fileLogging': return process.env.NODE_ENV !== 'test';
        default: return false;
      }
    }
    
    try {
      return config.isEnabled(feature);
    } catch (error) {
      // Fallback if config method fails
      console.warn(`[Logger] Failed to check feature '${feature}':`, error.message);
      return false;
    }
  }

  /**
   * Get environment safely
   */
  getEnvironment() {
    const config = this.getConfig();
    return config?.environment || process.env.NODE_ENV || 'development';
  }

  /**
   * Initialize log directory
   */
  initializeLogDirectory() {
    const logDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (error) {
        // Fallback to console-only logging
        console.warn('[Logger] Could not create log directory, using console-only logging');
      }
    }
  }

  /**
   * Format log message
   */
  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      component: this.component,
      message,
      ...(data && { data })
    };

    // Console format (human-readable)
    const consoleMessage = `[${timestamp}] ${level.toUpperCase()} [${this.component}] ${message}`;
    
    return {
      console: data ? `${consoleMessage}\n${JSON.stringify(data, null, 2)}` : consoleMessage,
      file: JSON.stringify(logEntry)
    };
  }

  /**
   * Check if level should be logged
   */
  shouldLog(level) {
    return this.logLevels[level] >= this.currentLogLevel;
  }

  /**
   * Write to log file (with safe environment check)
   */
  writeToFile(level, formattedMessage) {
    const env = this.getEnvironment();
    
    if (env === 'test' || !this.isFeatureEnabled('fileLogging')) {
      return; // Skip file logging in tests or when disabled
    }

    try {
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `wisdom-engine-${level}.log`);
      const logEntry = `${formattedMessage.file}\n`;
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Fallback to console if file writing fails
      console.warn('[Logger] Failed to write to log file:', error.message);
    }
  }

  /**
   * Core logging method
   */
  log(level, message, data = null) {
    if (!this.shouldLog(level)) {
      return;
    }

    const formatted = this.formatMessage(level, message, data);
    
    // Console output
    switch (level) {
      case 'debug':
        console.debug(formatted.console);
        break;
      case 'info':
        console.info(formatted.console);
        break;
      case 'warn':
        console.warn(formatted.console);
        break;
      case 'error':
        console.error(formatted.console);
        break;
      default:
        console.log(formatted.console);
    }

    // File output for important logs
    if (level === 'error' || level === 'warn') {
      this.writeToFile(level, formatted);
    }
    
    // Write all logs to general log file in development
    if (this.getEnvironment() === 'development') {
      this.writeToFile('all', formatted);
    }
  }

  /**
   * Debug level logging
   */
  debug(message, data = null) {
    this.log('debug', message, data);
  }

  /**
   * Info level logging
   */
  info(message, data = null) {
    this.log('info', message, data);
  }

  /**
   * Warning level logging
   */
  warn(message, data = null) {
    this.log('warn', message, data);
  }

  /**
   * Error level logging
   */
  error(message, data = null) {
    this.log('error', message, data);
  }

  /**
   * Log performance metrics (with safe feature check)
   */
  performance(operation, duration, metadata = {}) {
    if (!this.isFeatureEnabled('metrics')) {
      return;
    }

    this.info('Performance metric', {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }

  /**
   * Log MCP operations
   */
  mcpOperation(operation, params, result, duration) {
    this.debug('MCP operation completed', {
      operation,
      params: this.sanitizeParams(params),
      success: !result.error,
      duration: `${duration}ms`,
      ...(result.error && { error: result.error })
    });
  }

  /**
   * Log security events
   */
  security(event, details = {}) {
    this.warn('Security event', {
      event,
      timestamp: new Date().toISOString(),
      ...details
    });
    
    // Always write security events to file
    this.writeToFile('security', this.formatMessage('security', event, details));
  }

  /**
   * Sanitize parameters for logging (remove sensitive data)
   */
  sanitizeParams(params) {
    if (!params || typeof params !== 'object') {
      return params;
    }

    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Create child logger with additional context
   */
  child(additionalComponent) {
    return new Logger(`${this.component}:${additionalComponent}`);
  }

  /**
   * Log analysis results
   */
  analysisResult(repository, score, patterns, duration) {
    this.info('Analysis completed', {
      repository: this.sanitizeRepository(repository),
      score,
      patterns: patterns.length,
      duration: `${duration}ms`
    });
  }

  /**
   * Sanitize repository info for logging
   */
  sanitizeRepository(repo) {
    if (typeof repo === 'string') {
      return repo.replace(/[^a-zA-Z0-9-_/]/g, '');
    }
    
    if (repo && typeof repo === 'object') {
      return {
        owner: repo.owner?.replace(/[^a-zA-Z0-9-_]/g, '') || 'unknown',
        name: repo.name?.replace(/[^a-zA-Z0-9-_]/g, '') || 'unknown'
      };
    }
    
    return 'unknown';
  }

  /**
   * Flush logs (useful for graceful shutdown)
   */
  flush() {
    // In a real implementation, this would ensure all pending log writes complete
    this.debug('Log flush requested');
  }

  /**
   * Reset configuration cache (useful for testing or dynamic reconfiguration)
   */
  resetConfig() {
    this._config = null;
    this._configLoadAttempted = false;
    this._configLoadError = null;
    this.currentLogLevel = this.getDefaultLogLevel();
  }

  /**
   * Get current configuration status for debugging
   */
  getConfigStatus() {
    return {
      configLoaded: !!this._config,
      configLoadAttempted: this._configLoadAttempted,
      configLoadError: this._configLoadError?.message || null,
      currentLogLevel: Object.keys(this.logLevels).find(key => this.logLevels[key] === this.currentLogLevel),
      environment: this.getEnvironment()
    };
  }
}

/**
 * Get logger instance
 */
function getLogger(component) {
  return new Logger(component);
}

/**
 * Create a simple logger for use during early initialization
 * (when config system might not be available yet)
 */
function createSimpleLogger(component = 'Bootstrap') {
  return {
    debug: (msg, data) => {
      if (process.env.NODE_ENV === 'development') {
        console.debug(`[DEBUG] [${component}] ${msg}`, data || '');
      }
    },
    info: (msg, data) => console.info(`[INFO] [${component}] ${msg}`, data || ''),
    warn: (msg, data) => console.warn(`[WARN] [${component}] ${msg}`, data || ''),
    error: (msg, data) => console.error(`[ERROR] [${component}] ${msg}`, data || '')
  };
}

module.exports = {
  Logger,
  getLogger,
  createSimpleLogger
};
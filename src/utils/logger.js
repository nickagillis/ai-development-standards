/**
 * Production-Ready Logging System
 * Single responsibility: Centralized logging
 * Environment-aware log levels and formatting
 */

const fs = require('fs');
const path = require('path');
const { getConfig } = require('../config/wisdom-engine.config');

class Logger {
  constructor(component = 'WisdomEngine') {
    this.component = component;
    this.config = getConfig();
    this.logLevels = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3
    };
    
    // Set log level based on environment
    this.currentLogLevel = this.getEnvironmentLogLevel();
    
    // Initialize log directory if needed
    this.initializeLogDirectory();
  }

  /**
   * Get appropriate log level for environment
   */
  getEnvironmentLogLevel() {
    const env = this.config.environment;
    
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
   * Initialize log directory
   */
  initializeLogDirectory() {
    const logDir = path.join(process.cwd(), 'logs');
    
    if (!fs.existsSync(logDir)) {
      try {
        fs.mkdirSync(logDir, { recursive: true });
      } catch (error) {
        // Fallback to console-only logging
        console.warn('Could not create log directory, using console-only logging');
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
   * Write to log file
   */
  writeToFile(level, formattedMessage) {
    if (this.config.environment === 'test') {
      return; // Skip file logging in tests
    }

    try {
      const logDir = path.join(process.cwd(), 'logs');
      const logFile = path.join(logDir, `wisdom-engine-${level}.log`);
      const logEntry = `${formattedMessage.file}\n`;
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      // Fallback to console if file writing fails
      console.warn('Failed to write to log file:', error.message);
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
    if (this.config.environment === 'development') {
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
   * Log performance metrics
   */
  performance(operation, duration, metadata = {}) {
    if (!this.config.isEnabled('metrics')) {
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
}

/**
 * Get logger instance
 */
function getLogger(component) {
  return new Logger(component);
}

module.exports = {
  Logger,
  getLogger
};
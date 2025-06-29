/**
 * Production-Ready Error Handling
 * Single responsibility: Error management and logging
 * Graceful degradation for production systems
 */

const { getConfig } = require('../config/wisdom-engine.config');
const { Logger } = require('./logger');

class ErrorHandler {
  constructor() {
    this.config = getConfig();
    this.logger = new Logger('ErrorHandler');
  }

  /**
   * Handle errors with graceful degradation
   */
  handleError(error, context = 'Unknown', options = {}) {
    const errorInfo = this.analyzeError(error);
    
    // Log error with context
    this.logError(error, context, errorInfo);

    // Return appropriate response based on error type
    if (options.fallback) {
      this.logger.info('Using fallback response due to error');
      return options.fallback;
    }

    if (errorInfo.recoverable) {
      return this.getRecoverableResponse(errorInfo, context);
    }

    throw new HandledError(errorInfo.userMessage, errorInfo.code, errorInfo.statusCode);
  }

  /**
   * Analyze error to determine type and severity
   */
  analyzeError(error) {
    const errorInfo = {
      type: 'unknown',
      severity: 'medium',
      recoverable: false,
      userMessage: 'An unexpected error occurred',
      code: 'UNKNOWN_ERROR',
      statusCode: 500,
      originalMessage: error.message,
      stack: error.stack
    };

    // Analyze by error type
    if (error instanceof ValidationError) {
      errorInfo.type = 'validation';
      errorInfo.severity = 'low';
      errorInfo.recoverable = true;
      errorInfo.userMessage = error.message;
      errorInfo.code = 'VALIDATION_ERROR';
      errorInfo.statusCode = 400;
    } else if (error instanceof McpError) {
      errorInfo.type = 'mcp';
      errorInfo.severity = error.severity || 'medium';
      errorInfo.recoverable = error.recoverable || true;
      errorInfo.userMessage = error.userMessage || 'MCP operation failed';
      errorInfo.code = error.code || 'MCP_ERROR';
      errorInfo.statusCode = error.statusCode || 503;
    } else if (error instanceof NetworkError) {
      errorInfo.type = 'network';
      errorInfo.severity = 'medium';
      errorInfo.recoverable = true;
      errorInfo.userMessage = 'Network connection failed';
      errorInfo.code = 'NETWORK_ERROR';
      errorInfo.statusCode = 503;
    } else if (error.code === 'ENOENT') {
      errorInfo.type = 'file_not_found';
      errorInfo.severity = 'low';
      errorInfo.recoverable = true;
      errorInfo.userMessage = 'Requested file or directory not found';
      errorInfo.code = 'FILE_NOT_FOUND';
      errorInfo.statusCode = 404;
    } else if (error.code === 'EACCES') {
      errorInfo.type = 'permission';
      errorInfo.severity = 'medium';
      errorInfo.recoverable = false;
      errorInfo.userMessage = 'Permission denied';
      errorInfo.code = 'PERMISSION_DENIED';
      errorInfo.statusCode = 403;
    } else if (error.name === 'SyntaxError') {
      errorInfo.type = 'syntax';
      errorInfo.severity = 'low';
      errorInfo.recoverable = true;
      errorInfo.userMessage = 'Invalid data format';
      errorInfo.code = 'SYNTAX_ERROR';
      errorInfo.statusCode = 400;
    }

    return errorInfo;
  }

  /**
   * Log error with appropriate level
   */
  logError(error, context, errorInfo = null) {
    if (!errorInfo) {
      errorInfo = this.analyzeError(error);
    }

    const logData = {
      context,
      type: errorInfo.type,
      code: errorInfo.code,
      message: errorInfo.originalMessage,
      severity: errorInfo.severity,
      recoverable: errorInfo.recoverable,
      timestamp: new Date().toISOString()
    };

    // Include stack trace in development
    if (this.config.environment === 'development') {
      logData.stack = errorInfo.stack;
    }

    // Log based on severity
    switch (errorInfo.severity) {
      case 'low':
        this.logger.warn('Low severity error occurred', logData);
        break;
      case 'medium':
        this.logger.error('Medium severity error occurred', logData);
        break;
      case 'high':
        this.logger.error('High severity error occurred', logData);
        break;
      default:
        this.logger.error('Unknown severity error occurred', logData);
    }
  }

  /**
   * Get recoverable response for graceful degradation
   */
  getRecoverableResponse(errorInfo, context) {
    const baseResponse = {
      status: 'partial_success',
      message: errorInfo.userMessage,
      context,
      timestamp: new Date().toISOString()
    };

    switch (errorInfo.type) {
      case 'mcp':
        return {
          ...baseResponse,
          fallbackMode: true,
          recommendations: [
            'Check MCP connection status',
            'Verify GitHub access permissions',
            'Try again in a few moments'
          ]
        };
      
      case 'network':
        return {
          ...baseResponse,
          offlineMode: true,
          recommendations: [
            'Check internet connection',
            'Verify network settings',
            'Use cached data if available'
          ]
        };
      
      case 'validation':
        return {
          ...baseResponse,
          validationErrors: [errorInfo.originalMessage],
          recommendations: [
            'Check input parameters',
            'Verify data format',
            'Consult API documentation'
          ]
        };
      
      case 'file_not_found':
        return {
          ...baseResponse,
          missingResource: true,
          recommendations: [
            'Verify file path is correct',
            'Check repository structure',
            'Ensure file exists in repository'
          ]
        };
      
      default:
        return {
          ...baseResponse,
          recommendations: [
            'Try again in a few moments',
            'Check system status',
            'Contact support if problem persists'
          ]
        };
    }
  }

  /**
   * Create error for async operations
   */
  createAsyncError(message, code = 'ASYNC_ERROR') {
    return new AsyncOperationError(message, code);
  }

  /**
   * Wrap async operations with error handling
   */
  async wrapAsync(operation, context = 'Async operation', options = {}) {
    try {
      return await operation();
    } catch (error) {
      return this.handleError(error, context, options);
    }
  }

  /**
   * Create retry wrapper for operations
   */
  async withRetry(operation, retries = 3, delay = 1000, context = 'Retry operation') {
    let lastError;
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        const errorInfo = this.analyzeError(error);
        
        // Don't retry if error is not recoverable
        if (!errorInfo.recoverable) {
          throw error;
        }
        
        if (attempt < retries) {
          this.logger.warn(`Attempt ${attempt} failed, retrying in ${delay}ms`, {
            context,
            error: error.message,
            attempt,
            maxRetries: retries
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }
}

/**
 * Custom error classes
 */
class HandledError extends Error {
  constructor(message, code = 'HANDLED_ERROR', statusCode = 500) {
    super(message);
    this.name = 'HandledError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

class McpError extends Error {
  constructor(message, code = 'MCP_ERROR', severity = 'medium', recoverable = true) {
    super(message);
    this.name = 'McpError';
    this.code = code;
    this.severity = severity;
    this.recoverable = recoverable;
    this.userMessage = message;
    this.statusCode = 503;
  }
}

class NetworkError extends Error {
  constructor(message, code = 'NETWORK_ERROR') {
    super(message);
    this.name = 'NetworkError';
    this.code = code;
    this.statusCode = 503;
  }
}

class AsyncOperationError extends Error {
  constructor(message, code = 'ASYNC_ERROR') {
    super(message);
    this.name = 'AsyncOperationError';
    this.code = code;
  }
}

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}

module.exports = {
  ErrorHandler,
  HandledError,
  McpError,
  NetworkError,
  AsyncOperationError,
  ValidationError
};
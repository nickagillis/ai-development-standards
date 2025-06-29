/**
 * Input Validation and Sanitization
 * Single responsibility: Secure input handling
 * Production-ready security validation
 */

const path = require('path');
const { getConfig } = require('../config/wisdom-engine.config');

class InputValidator {
  constructor() {
    this.config = getConfig();
    this.securitySettings = this.config.getSecuritySettings();
  }

  /**
   * Validate repository parameters
   */
  validateRepositoryParams(owner, repo) {
    if (!this.securitySettings.validateInputs) {
      return;
    }

    // Validate owner
    if (!owner || typeof owner !== 'string') {
      throw new ValidationError('Repository owner must be a non-empty string');
    }

    if (!/^[a-zA-Z0-9\-_.]+$/.test(owner)) {
      throw new ValidationError('Repository owner contains invalid characters');
    }

    if (owner.length > 100) {
      throw new ValidationError('Repository owner name too long');
    }

    // Validate repo
    if (!repo || typeof repo !== 'string') {
      throw new ValidationError('Repository name must be a non-empty string');
    }

    if (!/^[a-zA-Z0-9\-_.]+$/.test(repo)) {
      throw new ValidationError('Repository name contains invalid characters');
    }

    if (repo.length > 200) {
      throw new ValidationError('Repository name too long');
    }
  }

  /**
   * Validate search query
   */
  validateSearchQuery(query) {
    if (!this.securitySettings.validateInputs) {
      return;
    }

    if (!query || typeof query !== 'string') {
      throw new ValidationError('Search query must be a non-empty string');
    }

    if (query.length < 3) {
      throw new ValidationError('Search query must be at least 3 characters');
    }

    if (query.length > 1000) {
      throw new ValidationError('Search query too long');
    }

    // Check for potential injection attempts
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i,
      /eval\(/i,
      /expression\(/i
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(query)) {
        throw new ValidationError('Search query contains potentially dangerous content');
      }
    }
  }

  /**
   * Validate and sanitize file path
   */
  validateFilePath(filePath) {
    if (!this.securitySettings.sanitizeFilePaths) {
      return filePath;
    }

    if (!filePath || typeof filePath !== 'string') {
      throw new ValidationError('File path must be a non-empty string');
    }

    // Normalize path
    const normalizedPath = path.normalize(filePath);

    // Check for directory traversal
    if (normalizedPath.includes('..')) {
      throw new ValidationError('File path contains directory traversal');
    }

    // Check for absolute paths (should be relative)
    if (path.isAbsolute(normalizedPath)) {
      throw new ValidationError('Absolute file paths not allowed');
    }

    // Check file extension
    const ext = path.extname(normalizedPath).toLowerCase();
    if (ext && !this.securitySettings.allowedFileTypes.includes(ext)) {
      throw new ValidationError(`File type not allowed: ${ext}`);
    }

    return normalizedPath;
  }

  /**
   * Validate file size
   */
  validateFileSize(size) {
    if (!this.securitySettings.validateInputs) {
      return;
    }

    if (typeof size !== 'number' || size < 0) {
      throw new ValidationError('File size must be a positive number');
    }

    if (size > this.securitySettings.maxFileSize) {
      throw new ValidationError(`File size exceeds maximum allowed: ${this.securitySettings.maxFileSize} bytes`);
    }
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    // Remove dangerous characters
    return input
      .replace(/[<>"'&]/g, '') // Basic XSS prevention
      .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
      .trim()
      .slice(0, 1000); // Limit length
  }

  /**
   * Validate JSON input
   */
  validateJSON(jsonString) {
    if (!jsonString || typeof jsonString !== 'string') {
      throw new ValidationError('JSON input must be a non-empty string');
    }

    if (jsonString.length > 1000000) { // 1MB limit
      throw new ValidationError('JSON input too large');
    }

    try {
      const parsed = JSON.parse(jsonString);
      
      // Additional validation for parsed object
      this.validateObjectDepth(parsed, 0, 10); // Max depth 10
      
      return parsed;
    } catch (error) {
      throw new ValidationError(`Invalid JSON: ${error.message}`);
    }
  }

  /**
   * Validate object depth to prevent DoS
   */
  validateObjectDepth(obj, currentDepth, maxDepth) {
    if (currentDepth > maxDepth) {
      throw new ValidationError('Object depth exceeds maximum allowed');
    }

    if (obj && typeof obj === 'object') {
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          this.validateObjectDepth(obj[key], currentDepth + 1, maxDepth);
        }
      }
    }
  }

  /**
   * Validate array input
   */
  validateArray(arr, maxLength = 1000) {
    if (!Array.isArray(arr)) {
      throw new ValidationError('Input must be an array');
    }

    if (arr.length > maxLength) {
      throw new ValidationError(`Array length exceeds maximum: ${maxLength}`);
    }

    return arr;
  }

  /**
   * Validate URL
   */
  validateURL(url) {
    if (!url || typeof url !== 'string') {
      throw new ValidationError('URL must be a non-empty string');
    }

    try {
      const parsedUrl = new URL(url);
      
      // Only allow HTTPS
      if (parsedUrl.protocol !== 'https:') {
        throw new ValidationError('Only HTTPS URLs are allowed');
      }

      // Block private IP ranges if external connections not allowed
      if (!this.securitySettings.allowExternalConnections) {
        const hostname = parsedUrl.hostname;
        if (this.isPrivateIP(hostname)) {
          throw new ValidationError('Private IP addresses not allowed');
        }
      }

      return parsedUrl;
    } catch (error) {
      throw new ValidationError(`Invalid URL: ${error.message}`);
    }
  }

  /**
   * Check if IP is in private range
   */
  isPrivateIP(hostname) {
    const privateRanges = [
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^fc00::/,
      /^fe80::/
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Validate environment configuration
   */
  validateEnvironmentConfig() {
    const requiredEnvVars = [
      'NODE_ENV'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new ValidationError(`Missing required environment variables: ${missingVars.join(', ')}`);
    }
  }

  /**
   * Validate MCP parameters
   */
  validateMcpParams(params) {
    if (!params || typeof params !== 'object') {
      throw new ValidationError('MCP parameters must be an object');
    }

    // Validate common MCP parameters
    if (params.owner) {
      this.validateRepositoryParams(params.owner, params.repo || 'temp');
    }

    if (params.query) {
      this.validateSearchQuery(params.query);
    }

    if (params.path) {
      this.validateFilePath(params.path);
    }

    return params;
  }
}

/**
 * Custom validation error class
 */
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.code = 'VALIDATION_ERROR';
  }
}

module.exports = {
  InputValidator,
  ValidationError
};
/**
 * Context Validation Configuration
 * 
 * Centralized configuration for context optimization rules
 */

/**
 * Context optimization rules and limits
 */
const CONTEXT_RULES = {
  // File size limits (lines)
  maxFileSize: {
    'core': 100,        // Core logic files
    'utility': 75,      // Utility modules
    'config': 50,       // Configuration files
    'test': 200,        // Test files
    'docs': 500,        // Documentation files
    'example': 150,     // Example/demo files
    'integration': 200, // Integration modules
    'default': 100      // Default limit
  },
  
  // Token estimation limits
  maxTokensPerFile: {
    'core': 2000,
    'utility': 1500,
    'config': 1000,
    'test': 4000,
    'docs': 10000,
    'example': 3000,
    'default': 2000
  },
  
  // File type patterns
  patterns: {
    'core': ['**/core/**/*.js', '**/src/**/index.js'],
    'utility': ['**/utils/**/*.js', '**/helpers/**/*.js'],
    'config': ['**/config/**/*.js', '**/*config.js'],
    'test': ['**/test/**/*.js', '**/*.test.js', '**/*.spec.js'],
    'docs': ['**/*.md', '**/docs/**/*'],
    'example': ['**/examples/**/*.js', '**/demo/**/*.js'],
    'integration': ['**/integrations/**/*.js', '**/mcp/**/*.js']
  }
};

/**
 * Default validation options
 */
const DEFAULT_OPTIONS = {
  rootPath: process.cwd(),
  strictMode: false,
  excludePatterns: [
    '**/node_modules/**',
    '**/dist/**',
    '**/build/**',
    '**/.git/**'
  ],
  includeExtensions: ['.js', '.md', '.json', '.ts', '.jsx', '.tsx']
};

module.exports = {
  CONTEXT_RULES,
  DEFAULT_OPTIONS
};
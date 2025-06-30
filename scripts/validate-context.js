/**
 * Context Optimization Validation Script - Modular Version
 * 
 * Validates project files against context optimization guidelines
 */

const fs = require('fs').promises;
const path = require('path');

// Import modular validation components
const { CONTEXT_RULES } = require('./validation/context-rules');
const { ContextValidator } = require('./validation/context-validator');
const { generateReport } = require('./validation/report-generator');

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    rootPath: args[0] || process.cwd(),
    strictMode: args.includes('--strict'),
    fixMode: args.includes('--fix')
  };
  
  const validator = new ContextValidator(options);
  
  validator.validateProject()
    .then(results => {
      const isValid = generateReport(results);
      
      if (options.fixMode) {
        console.log('\\n🔧 Run npm run refactor-analysis for specific suggestions');
      }
      
      process.exit(isValid ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  ContextValidator,
  CONTEXT_RULES,
  generateReport
};
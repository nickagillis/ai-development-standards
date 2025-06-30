#!/usr/bin/env node

/**
 * Context Optimization Validation CLI
 * 
 * Modular validation script following context optimization standards
 */

const ContextValidator = require('../src/validation/core-validator');
const { generateReport } = require('../src/validation/reporter');
const { DEFAULT_OPTIONS } = require('../src/validation/config');

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  const options = {
    ...DEFAULT_OPTIONS,
    rootPath: args[0] || process.cwd(),
    strictMode: args.includes('--strict'),
    fixMode: args.includes('--fix')
  };
  
  const validator = new ContextValidator(options);
  
  try {
    const results = await validator.validateProject();
    const isValid = generateReport(results);
    
    if (options.fixMode) {
      console.log('\n🔧 REFACTORING SUGGESTIONS:');
      console.log('   • Run: npm run refactor-large-files');
      console.log('   • See: docs/context-optimization.md');
    }
    
    process.exit(isValid ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
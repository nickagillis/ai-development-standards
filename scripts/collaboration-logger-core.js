#!/usr/bin/env node

/**
 * AI Collaboration Logger - Redirect to Working System
 * FIXED: Redirect broken dependencies to working implementation
 */

console.log('🔧 REDIRECT: collaboration-logger-core.js → working-collaboration-logger.js');
console.log('📋 This file previously required non-existent modules');
console.log('✅ Redirecting to working implementation...');
console.log('');

// Import and use the working logger
const { WorkingCollaborationLogger } = require('./working-collaboration-logger');

class AICollaborationLogger {
  constructor() {
    console.log('⚠️  DEPRECATION NOTICE: collaboration-logger-core.js is deprecated');
    console.log('🔄 Automatically redirecting to working-collaboration-logger.js');
    console.log('');
    
    this.workingLogger = new WorkingCollaborationLogger();
  }

  async logCollaborationSession() {
    console.log('🔄 Delegating to working collaboration logger...');
    return await this.workingLogger.logCurrentSession();
  }
}

// Main execution
async function main() {
  console.log('🤖 AI Collaboration Session Logger - FIXED VERSION');
  console.log('📋 Previously broken - now redirects to working implementation');
  console.log('');
  
  const logger = new AICollaborationLogger();
  
  try {
    const result = await logger.logCollaborationSession();
    
    console.log('\\n🎯 COLLABORATION SESSION COMPLETE (via working system)');
    console.log('═'.repeat(50));
    console.log('✅ Fixed broken dependencies by redirecting to working system');
    console.log('🔧 Problem: Required non-existent ./collab-logger/ modules');
    console.log('🚀 Solution: Delegate to working-collaboration-logger.js');
    console.log('📋 Recommendation: Update scripts to use working system directly');
    
  } catch (error) {
    console.error('❌ Failed to log collaboration session:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { AICollaborationLogger };
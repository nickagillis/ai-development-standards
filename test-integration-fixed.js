/**
 * Integration Test Runner - Modular Version
 * Tests core system functionality with focused test modules
 */

const { testCircularDependencyFix } = require('./tests/circular-dependency.test');
const { testApiConnections } = require('./tests/api-connections.test'); 
const { testConfiguration } = require('./tests/configuration.test');

/**
 * Main test runner with summary reporting
 */
async function runIntegrationTests() {
  console.log('🚀 AI Development Standards - Integration Test Suite');
  console.log('═'.repeat(60));
  
  const results = {
    circularDependency: false,
    apiConnections: false,
    configuration: false
  };
  
  try {
    // Run modular tests
    results.circularDependency = await testCircularDependencyFix();
    results.apiConnections = await testApiConnections();
    results.configuration = await testConfiguration();
    
    // Generate summary
    console.log('\\n📊 INTEGRATION TEST SUMMARY');
    console.log('═'.repeat(60));
    console.log(`🔧 Circular Dependency: ${results.circularDependency ? '✅ PASSED' : '❌ FAILED'}`);
    console.log(`🌐 API Connections: ${results.apiConnections ? '✅ WORKING' : '⚠️ LIMITED'}`);
    console.log(`⚙️ Configuration: ${results.configuration ? '✅ ROBUST' : '❌ ISSUE'}`);
    
    const success = results.circularDependency && results.configuration;
    console.log(`\\n🎯 Overall Status: ${success ? '✅ SUCCESS' : '⚠️ ISSUES DETECTED'}`);
    
    return success;
    
  } catch (error) {
    console.error('💥 Test runner failed:', error.message);
    return false;
  }
}

// CLI execution
if (require.main === module) {
  runIntegrationTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Integration tests failed:', error);
      process.exit(1);
    });
}

module.exports = {
  runIntegrationTests
};
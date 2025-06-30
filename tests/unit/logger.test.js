/**
 * Unit Tests for Logger with Circular Dependency Fix
 * Testing framework agnostic tests for the fixed logger system
 * 
 * These tests validate:
 * - No circular dependency during initialization
 * - Lazy configuration loading works correctly
 * - Fallback mechanisms function properly
 * - Security and performance features remain intact
 */

const assert = require('assert');
const { Logger, getLogger, createSimpleLogger } = require('../../src/utils/logger');
const { resetConfig } = require('../../src/config/wisdom-engine.config');

/**
 * Test Suite: Logger Initialization
 */
function testLoggerInitialization() {
  console.log('🧪 Testing Logger Initialization...');
  
  // Test 1: Logger can be created without config
  try {
    resetConfig();
    const logger = new Logger('TestComponent');
    assert(logger instanceof Logger, 'Logger should be instantiated');
    assert(logger.component === 'TestComponent', 'Component name should be set');
    console.log('   ✅ Logger initialization without config');
  } catch (error) {
    console.log('   ❌ Logger initialization failed:', error.message);
    throw error;
  }
  
  // Test 2: Simple logger should work immediately
  try {
    const simpleLogger = createSimpleLogger('SimpleTest');
    assert(typeof simpleLogger.info === 'function', 'Simple logger should have logging methods');
    
    // Should not throw
    simpleLogger.info('Test message');
    simpleLogger.debug('Debug message');
    simpleLogger.warn('Warning message');
    simpleLogger.error('Error message');
    
    console.log('   ✅ Simple logger functional');
  } catch (error) {
    console.log('   ❌ Simple logger failed:', error.message);
    throw error;
  }
  
  // Test 3: Logger should handle multiple instances
  try {
    const logger1 = getLogger('Component1');
    const logger2 = getLogger('Component2');
    
    assert(logger1.component === 'Component1', 'First logger component correct');
    assert(logger2.component === 'Component2', 'Second logger component correct');
    
    console.log('   ✅ Multiple logger instances');
  } catch (error) {
    console.log('   ❌ Multiple logger instances failed:', error.message);
    throw error;
  }
}

/**
 * Test Suite: Lazy Configuration Loading
 */
function testLazyConfigurationLoading() {
  console.log('🧪 Testing Lazy Configuration Loading...');
  
  // Test 1: Config should not load during initialization
  try {
    resetConfig();
    const logger = new Logger('LazyTest');
    
    // Initially, config should not be loaded
    const initialStatus = logger.getConfigStatus();
    assert(!initialStatus.configLoadAttempted, 'Config should not be loaded initially');
    
    console.log('   ✅ Config not loaded during initialization');
  } catch (error) {
    console.log('   ❌ Lazy loading test failed:', error.message);
    throw error;
  }
  
  // Test 2: Config should load when first accessed
  try {
    const logger = new Logger('LazyLoadTest');
    
    // Trigger config loading
    logger.isFeatureEnabled('metrics');
    
    const postAccessStatus = logger.getConfigStatus();
    assert(postAccessStatus.configLoadAttempted, 'Config should be attempted after access');
    
    console.log('   ✅ Config loads when first accessed');
  } catch (error) {
    console.log('   ❌ Config lazy loading failed:', error.message);
    throw error;
  }
  
  // Test 3: Logger should work even if config fails
  try {
    const logger = new Logger('FailureTest');
    
    // Force config reset to simulate failure
    logger.resetConfig();
    
    // These should all work without throwing
    logger.debug('Debug test');
    logger.info('Info test');
    logger.warn('Warning test');
    logger.error('Error test');
    
    const status = logger.getConfigStatus();
    assert(typeof status.environment === 'string', 'Environment should be available');
    
    console.log('   ✅ Logger resilient to config failures');
  } catch (error) {
    console.log('   ❌ Config failure resilience failed:', error.message);
    throw error;
  }
}

/**
 * Test Suite: Security Features
 */
function testSecurityFeatures() {
  console.log('🧪 Testing Security Features...');
  
  // Test 1: Parameter sanitization
  try {
    const logger = new Logger('SecurityTest');
    
    const sensitiveParams = {
      username: 'testuser',
      password: 'secret123',
      apiToken: 'sensitive_token',
      regularData: 'safe_data'
    };
    
    const sanitized = logger.sanitizeParams(sensitiveParams);
    
    assert(sanitized.username === 'testuser', 'Non-sensitive data should remain');
    assert(sanitized.password === '[REDACTED]', 'Password should be redacted');
    assert(sanitized.apiToken === '[REDACTED]', 'Token should be redacted');
    assert(sanitized.regularData === 'safe_data', 'Regular data should remain');
    
    console.log('   ✅ Parameter sanitization working');
  } catch (error) {
    console.log('   ❌ Parameter sanitization failed:', error.message);
    throw error;
  }
  
  // Test 2: Repository sanitization
  try {
    const logger = new Logger('SecurityTest');
    
    const maliciousRepo = {
      owner: 'test<script>alert(1)</script>',
      name: 'repo$(dangerous)'
    };
    
    const sanitized = logger.sanitizeRepository(maliciousRepo);
    
    assert(!sanitized.owner.includes('<script>'), 'Script tags should be removed');
    assert(!sanitized.name.includes('$('), 'Special characters should be removed');
    
    console.log('   ✅ Repository sanitization working');
  } catch (error) {
    console.log('   ❌ Repository sanitization failed:', error.message);
    throw error;
  }
}

/**
 * Test Suite: Performance Features
 */
function testPerformanceFeatures() {
  console.log('🧪 Testing Performance Features...');
  
  // Test 1: Log level filtering
  try {
    const logger = new Logger('PerformanceTest');
    
    // In production-like environment, debug should not log
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    logger.resetConfig();
    
    // This should respect log levels
    const shouldLogDebug = logger.shouldLog('debug');
    const shouldLogError = logger.shouldLog('error');
    
    assert(!shouldLogDebug || process.env.NODE_ENV !== 'production', 'Debug should not log in production');
    assert(shouldLogError, 'Error should always log');
    
    process.env.NODE_ENV = originalEnv;
    
    console.log('   ✅ Log level filtering working');
  } catch (error) {
    console.log('   ❌ Log level filtering failed:', error.message);
    throw error;
  }
  
  // Test 2: Child logger creation
  try {
    const parentLogger = new Logger('Parent');
    const childLogger = parentLogger.child('Child');
    
    assert(childLogger.component === 'Parent:Child', 'Child logger component should be hierarchical');
    
    console.log('   ✅ Child logger creation working');
  } catch (error) {
    console.log('   ❌ Child logger creation failed:', error.message);
    throw error;
  }
}

/**
 * Test Suite: Error Handling
 */
function testErrorHandling() {
  console.log('🧪 Testing Error Handling...');
  
  // Test 1: Graceful handling of invalid data
  try {
    const logger = new Logger('ErrorTest');
    
    // These should not throw
    logger.sanitizeParams(null);
    logger.sanitizeParams(undefined);
    logger.sanitizeParams('string');
    logger.sanitizeParams(123);
    
    logger.sanitizeRepository(null);
    logger.sanitizeRepository('string-repo');
    logger.sanitizeRepository(undefined);
    
    console.log('   ✅ Graceful handling of invalid data');
  } catch (error) {
    console.log('   ❌ Invalid data handling failed:', error.message);
    throw error;
  }
  
  // Test 2: Feature checking with unavailable config
  try {
    const logger = new Logger('FeatureTest');
    logger.resetConfig();
    
    // Should not throw even if config is unavailable
    const metricsEnabled = logger.isFeatureEnabled('metrics');
    const fileLoggingEnabled = logger.isFeatureEnabled('fileLogging');
    
    assert(typeof metricsEnabled === 'boolean', 'Feature check should return boolean');
    assert(typeof fileLoggingEnabled === 'boolean', 'Feature check should return boolean');
    
    console.log('   ✅ Feature checking with fallbacks');
  } catch (error) {
    console.log('   ❌ Feature checking failed:', error.message);
    throw error;
  }
}

/**
 * Test Suite: Integration with Real Components
 */
function testComponentIntegration() {
  console.log('🧪 Testing Component Integration...');
  
  // Test 1: MCP operation logging
  try {
    const logger = new Logger('MCPTest');
    
    const mockParams = {
      repository: 'test/repo',
      action: 'analyze',
      token: 'secret_token'
    };
    
    const mockResult = {
      success: true,
      data: { score: 85 }
    };
    
    // Should not throw
    logger.mcpOperation('analyze', mockParams, mockResult, 150);
    
    console.log('   ✅ MCP operation logging');
  } catch (error) {
    console.log('   ❌ MCP operation logging failed:', error.message);
    throw error;
  }
  
  // Test 2: Analysis result logging
  try {
    const logger = new Logger('AnalysisTest');
    
    // Should not throw
    logger.analysisResult('test/repo', 85, ['pattern1', 'pattern2'], 250);
    
    console.log('   ✅ Analysis result logging');
  } catch (error) {
    console.log('   ❌ Analysis result logging failed:', error.message);
    throw error;
  }
  
  // Test 3: Security event logging
  try {
    const logger = new Logger('SecurityEventTest');
    
    // Should not throw
    logger.security('unauthorized_access_attempt', {
      ip: '192.168.1.1',
      user: 'test_user',
      resource: '/sensitive/endpoint'
    });
    
    console.log('   ✅ Security event logging');
  } catch (error) {
    console.log('   ❌ Security event logging failed:', error.message);
    throw error;
  }
}

/**
 * Main test runner
 */
function runLoggerTests() {
  console.log('🚀 Running Logger Unit Tests');
  console.log('═'.repeat(60));
  
  const tests = [
    { name: 'Logger Initialization', fn: testLoggerInitialization },
    { name: 'Lazy Configuration Loading', fn: testLazyConfigurationLoading },
    { name: 'Security Features', fn: testSecurityFeatures },
    { name: 'Performance Features', fn: testPerformanceFeatures },
    { name: 'Error Handling', fn: testErrorHandling },
    { name: 'Component Integration', fn: testComponentIntegration }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.name}`);
      test.fn();
      console.log(`✅ ${test.name} PASSED`);
      passed++;
    } catch (error) {
      console.log(`❌ ${test.name} FAILED:`, error.message);
      failed++;
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST RESULTS');
  console.log('═'.repeat(60));
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🔥 Circular dependency fix is production-ready');
  } else {
    console.log('\n⚠️  Some tests failed - review issues above');
    process.exit(1);
  }
  
  return { passed, failed };
}

// Run tests if this file is executed directly
if (require.main === module) {
  runLoggerTests();
}

module.exports = {
  runLoggerTests,
  testLoggerInitialization,
  testLazyConfigurationLoading,
  testSecurityFeatures,
  testPerformanceFeatures,
  testErrorHandling,
  testComponentIntegration
};
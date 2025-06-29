/**
 * Test Setup for Workspace Monitoring
 * 
 * Configures Jest environment and provides common test utilities
 */

// Increase timeout for integration tests
jest.setTimeout(10000);

// Mock external dependencies that aren't available in test environment
jest.mock('chokidar', () => ({
  watch: jest.fn(() => ({
    on: jest.fn().mockReturnThis(),
    close: jest.fn()
  }))
}));

jest.mock('ws', () => {
  const mockWS = {
    OPEN: 1,
    readyState: 1,
    send: jest.fn(),
    close: jest.fn(),
    on: jest.fn()
  };
  
  const MockWebSocket = jest.fn(() => mockWS);
  MockWebSocket.Server = jest.fn(() => ({
    on: jest.fn(),
    close: jest.fn()
  }));
  
  return MockWebSocket;
});

// Global test utilities
global.createTestWorkspace = async () => {
  const fs = require('fs').promises;
  const path = require('path');
  
  const testDir = path.join(__dirname, `test-workspace-${Date.now()}`);
  await fs.mkdir(testDir, { recursive: true });
  
  // Create some test files
  await fs.writeFile(path.join(testDir, 'test.js'), 'console.log("test");');
  await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project');
  
  return testDir;
};

global.cleanupTestWorkspace = async (testDir) => {
  const fs = require('fs').promises;
  try {
    await fs.rmdir(testDir, { recursive: true });
  } catch (error) {
    // Ignore cleanup errors
  }
};

// Mock configuration for testing
global.testConfig = {
  monitoring: {
    enabled: true,
    watchPaths: ['./test'],
    ignorePatterns: ['**/node_modules/**']
  },
  websocket: {
    port: 8081,
    maxConnections: 10
  },
  conflictDetection: {
    threshold: 0.5,
    learningEnabled: false
  },
  logging: {
    level: 'error',
    enableConsole: false
  }
};

// Suppress console output during tests unless DEBUG is set
if (!process.env.DEBUG) {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
}

// Test utilities
global.waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

global.createMockSession = () => ({
  id: 'test-session',
  token: 'test-token-123',
  developerId: 'test-dev',
  startTime: new Date().toISOString(),
  activeFiles: new Set(),
  metadata: {
    team: 'test-team',
    timezone: 'UTC'
  }
});

global.createMockConflictAnalysis = (overrides = {}) => ({
  hasConflict: true,
  probability: 0.8,
  filePath: './test-file.js',
  concurrentDevelopers: [
    { id: 'dev1', metadata: { team: 'frontend' } },
    { id: 'dev2', metadata: { team: 'backend' } }
  ],
  suggestions: [
    {
      type: 'communication',
      priority: 'high',
      title: 'Notify team',
      description: 'Alert other developers',
      confidence: 0.9
    }
  ],
  preventable: true,
  detectionTime: 50,
  ...overrides
});

// Performance testing utilities
global.measurePerformance = async (fn, iterations = 1) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    await fn();
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1000000); // Convert to milliseconds
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    times
  };
};

// Cleanup after all tests
process.on('exit', () => {
  // Any global cleanup if needed
});
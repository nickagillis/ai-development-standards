#!/usr/bin/env node

/**
 * Installation Validation Script
 * 
 * Comprehensive validation of workspace monitoring installation
 * Tests all components and dependencies
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { RealTimeWorkspaceMonitor } = require('../real-time-monitor');
const { WorkspaceMonitorClient } = require('../client/workspace-monitor-client');

class InstallationValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }
  
  log(message, type = 'info') {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      error: '❌',
      warning: '⚠️'
    };
    console.log(`${icons[type]} ${message}`);
  }
  
  async test(name, testFn) {
    try {
      await testFn();
      this.log(`${name}: PASSED`, 'success');
      this.results.passed++;
      this.results.tests.push({ name, status: 'passed' });
    } catch (error) {
      this.log(`${name}: FAILED - ${error.message}`, 'error');
      this.results.failed++;
      this.results.tests.push({ name, status: 'failed', error: error.message });
    }
  }
  
  async validateNodeVersion() {
    const version = process.version;
    const major = parseInt(version.split('.')[0].substring(1));
    
    if (major < 16) {
      throw new Error(`Node.js ${version} is too old. Requires >= 16.0.0`);
    }
  }
  
  async validateDependencies() {
    const packageJson = require('../package.json');
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const [dep, version] of Object.entries(dependencies)) {
      try {
        require.resolve(dep);
      } catch (error) {
        throw new Error(`Missing dependency: ${dep}`);
      }
    }
  }
  
  async validateFileStructure() {
    const requiredFiles = [
      'real-time-monitor.js',
      'conflict-detector.js',
      'collaboration-analyzer.js',
      'client/workspace-monitor-client.js',
      'config/.workspacemonitorrc.example',
      'package.json',
      'README.md'
    ];
    
    for (const file of requiredFiles) {
      const filePath = path.join(__dirname, '..', file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing required file: ${file}`);
      }
    }
  }
  
  async validateConfiguration() {
    const configPath = path.join(__dirname, '..', 'config', '.workspacemonitorrc.example');
    
    if (!fs.existsSync(configPath)) {
      throw new Error('Example configuration file not found');
    }
    
    const configContent = fs.readFileSync(configPath, 'utf8');
    
    try {
      const config = JSON.parse(configContent);
      
      // Validate required configuration sections
      const requiredSections = ['monitoring', 'websocket', 'conflictDetection', 'collaboration'];
      for (const section of requiredSections) {
        if (!config[section]) {
          throw new Error(`Missing configuration section: ${section}`);
        }
      }
    } catch (error) {
      throw new Error(`Invalid configuration format: ${error.message}`);
    }
  }
  
  async validateServerStartup() {
    const monitor = new RealTimeWorkspaceMonitor({
      workspacePath: __dirname,
      websocketPort: 8081, // Use different port for testing
      enabled: false // Don't actually start file watching
    });
    
    // Test basic initialization
    if (!monitor.logger) {
      throw new Error('Logger not initialized');
    }
    
    if (!monitor.conflictDetector) {
      throw new Error('Conflict detector not initialized');
    }
    
    if (!monitor.collaborationAnalyzer) {
      throw new Error('Collaboration analyzer not initialized');
    }
  }
  
  async validateWebSocketServer() {
    return new Promise((resolve, reject) => {
      const monitor = new RealTimeWorkspaceMonitor({
        workspacePath: __dirname,
        websocketPort: 8082
      });
      
      const timeout = setTimeout(() => {
        monitor.stopMonitoring();
        reject(new Error('WebSocket server startup timeout'));
      }, 5000);
      
      monitor.startMonitoring().then(() => {
        clearTimeout(timeout);
        monitor.stopMonitoring().then(() => {
          resolve();
        }).catch(reject);
      }).catch(reject);
    });
  }
  
  async validateClientConnection() {
    return new Promise((resolve, reject) => {
      // Start a test server
      const monitor = new RealTimeWorkspaceMonitor({
        workspacePath: __dirname,
        websocketPort: 8083
      });
      
      monitor.startMonitoring().then(() => {
        // Test client connection
        const client = new WorkspaceMonitorClient({
          serverUrl: 'ws://localhost:8083',
          developerId: 'test-client'
        });
        
        const timeout = setTimeout(() => {
          monitor.stopMonitoring();
          reject(new Error('Client connection timeout'));
        }, 5000);
        
        client.initialize().then(() => {
          clearTimeout(timeout);
          monitor.stopMonitoring().then(() => {
            resolve();
          }).catch(reject);
        }).catch(reject);
      }).catch(reject);
    });
  }
  
  async validateConflictDetection() {
    const monitor = new RealTimeWorkspaceMonitor({
      workspacePath: __dirname,
      websocketPort: 8084
    });
    
    await monitor.startMonitoring();
    
    try {
      // Register test sessions
      const session1 = await monitor.registerDeveloperSession('test-dev-1');
      const session2 = await monitor.registerDeveloperSession('test-dev-2');
      
      // Test file activity reporting
      const analysis1 = await monitor.reportFileActivity(
        session1,
        './test-file.js',
        'edit'
      );
      
      if (!analysis1 || typeof analysis1.probability !== 'number') {
        throw new Error('Invalid conflict analysis result');
      }
      
      // Test concurrent access detection
      const analysis2 = await monitor.reportFileActivity(
        session2,
        './test-file.js',
        'edit'
      );
      
      if (!analysis2 || typeof analysis2.probability !== 'number') {
        throw new Error('Invalid concurrent access analysis');
      }
      
      // Should detect higher risk with concurrent access
      if (analysis2.probability <= analysis1.probability) {
        console.warn('⚠️  Expected higher conflict probability with concurrent access');
      }
      
    } finally {
      await monitor.stopMonitoring();
    }
  }
  
  async validateAPIEndpoints() {
    // This would test REST API endpoints if implemented
    // For now, just validate the structure exists
    const monitor = new RealTimeWorkspaceMonitor();
    
    if (typeof monitor.getWorkspaceStatus !== 'function') {
      throw new Error('getWorkspaceStatus method not found');
    }
    
    if (typeof monitor.registerDeveloperSession !== 'function') {
      throw new Error('registerDeveloperSession method not found');
    }
    
    if (typeof monitor.reportFileActivity !== 'function') {
      throw new Error('reportFileActivity method not found');
    }
  }
  
  async validatePerformance() {
    const monitor = new RealTimeWorkspaceMonitor({
      workspacePath: __dirname,
      websocketPort: 8085
    });
    
    await monitor.startMonitoring();
    
    try {
      const sessionToken = await monitor.registerDeveloperSession('perf-test');
      
      // Test response time
      const startTime = Date.now();
      const iterations = 10;
      
      for (let i = 0; i < iterations; i++) {
        await monitor.reportFileActivity(
          sessionToken,
          `./test-file-${i}.js`,
          'edit'
        );
      }
      
      const endTime = Date.now();
      const avgTime = (endTime - startTime) / iterations;
      
      if (avgTime > 200) {
        throw new Error(`Performance test failed: average response time ${avgTime}ms > 200ms`);
      }
      
    } finally {
      await monitor.stopMonitoring();
    }
  }
  
  async runAllTests() {
    this.log('🚀 Starting Installation Validation', 'info');
    this.log('=' .repeat(50), 'info');
    
    await this.test('Node.js Version', () => this.validateNodeVersion());
    await this.test('Dependencies', () => this.validateDependencies());
    await this.test('File Structure', () => this.validateFileStructure());
    await this.test('Configuration', () => this.validateConfiguration());
    await this.test('Server Startup', () => this.validateServerStartup());
    await this.test('WebSocket Server', () => this.validateWebSocketServer());
    await this.test('Client Connection', () => this.validateClientConnection());
    await this.test('Conflict Detection', () => this.validateConflictDetection());
    await this.test('API Methods', () => this.validateAPIEndpoints());
    await this.test('Performance', () => this.validatePerformance());
    
    this.log('=' .repeat(50), 'info');
    this.log(`🎯 Validation Results: ${this.results.passed} passed, ${this.results.failed} failed`, 
      this.results.failed === 0 ? 'success' : 'error');
    
    if (this.results.failed === 0) {
      this.log('🎉 Installation validation PASSED! Workspace monitoring is ready to use.', 'success');
      this.log('💡 Next steps:', 'info');
      this.log('   1. Run "npm run demo" to see it in action', 'info');
      this.log('   2. Check the integration guides in docs/', 'info');
      this.log('   3. Configure for your team environment', 'info');
    } else {
      this.log('❌ Installation validation FAILED. Please fix the issues above.', 'error');
      this.log('💡 Getting help:', 'info');
      this.log('   • Check the troubleshooting guide', 'info');
      this.log('   • Report issues on GitHub', 'info');
      this.log('   • Review the installation documentation', 'info');
    }
    
    return this.results.failed === 0;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new InstallationValidator();
  validator.runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  }).catch((error) => {
    console.error('❌ Validation failed with error:', error.message);
    process.exit(1);
  });
}

module.exports = { InstallationValidator };
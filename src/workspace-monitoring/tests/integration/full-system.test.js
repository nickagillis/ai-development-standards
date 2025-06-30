/**
 * Full System Integration Tests
 * 
 * Purpose: Test complete workspace monitoring system integration
 * Architecture: End-to-end behavior testing
 * Context: Real-world workflow scenarios
 */

const { createWorkspaceMonitor, quickStart } = require('../../index');
const { defaultConfig } = require('../../config/workspace-config');

describe('Workspace Monitoring System Integration', () => {
  let monitor;
  
  afterEach(async () => {
    if (monitor && monitor.stop) {
      await monitor.stop();
    }
  });
  
  describe('System Creation and Initialization', () => {
    test('should create monitor with default config', async () => {
      monitor = await createWorkspaceMonitor();
      
      expect(monitor.monitor).toBeDefined();
      expect(monitor.start).toBeDefined();
      expect(monitor.stop).toBeDefined();
      expect(monitor.status).toBeDefined();
      expect(monitor.config).toBeDefined();
    });
    
    test('should create monitor with custom config', async () => {
      const customConfig = {
        name: 'custom-monitor',
        monitoring: {
          extensions: ['.ts', '.tsx'],
          debounceMs: 1000
        }
      };
      
      monitor = await createWorkspaceMonitor(customConfig);
      
      expect(monitor.config.name).toBe('custom-monitor');
      expect(monitor.config.monitoring.extensions).toContain('.ts');
    });
    
    test('should handle invalid configuration gracefully', async () => {
      const invalidConfig = {
        monitoring: {
          extensions: 'not-an-array', // Invalid
          debounceMs: -100 // Invalid
        }
      };
      
      await expect(createWorkspaceMonitor(invalidConfig))
        .rejects.toThrow();
    });
  });
  
  describe('Quick Start Functionality', () => {
    test('should quick start with workspace path', async () => {
      monitor = await quickStart('./test-workspace');
      
      expect(monitor.monitor).toBeDefined();
      
      const status = monitor.status();
      expect(status.state.active).toBe(true);
      expect(status.state.initialized).toBe(true);
    });
  });
  
  describe('Service Integration', () => {
    test('should integrate all services properly', async () => {
      monitor = await createWorkspaceMonitor();
      await monitor.start();
      
      const status = monitor.status();
      
      // Check that all expected services are registered
      expect(status.services).toContain('conflict-detector');
      expect(status.services).toContain('collab-analyzer');
      expect(status.services).toContain('mcp-connector');
    });
    
    test('should handle cross-service communication', async () => {
      monitor = await createWorkspaceMonitor();
      await monitor.start();
      
      let conflictDetected = false;
      let insightsGenerated = false;
      
      // Listen for cross-service events
      monitor.monitor.eventHub.on('conflict:detected', () => {
        conflictDetected = true;
      });
      
      monitor.monitor.eventHub.on('collaboration:insights', () => {
        insightsGenerated = true;
      });
      
      // Simulate file change that should trigger multiple services
      monitor.monitor.eventHub.emit('file:changed', {
        filePath: 'test.js',
        editor: 'alice',
        timestamp: new Date().toISOString()
      });
      
      monitor.monitor.eventHub.emit('file:changed', {
        filePath: 'test.js',
        editor: 'bob',
        timestamp: new Date().toISOString()
      });
      
      // Give services time to process
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(conflictDetected).toBe(true);
    });
  });
  
  describe('Event Flow and Processing', () => {
    test('should process file change workflow end-to-end', async () => {
      monitor = await createWorkspaceMonitor();
      await monitor.start();
      
      const events = [];
      
      // Capture all events in order
      monitor.monitor.eventHub.on('file:changed', (data) => {
        events.push({ type: 'file:changed', data });
      });
      
      monitor.monitor.eventHub.on('conflict:detected', (data) => {
        events.push({ type: 'conflict:detected', data });
      });
      
      monitor.monitor.eventHub.on('mcp:connected', (data) => {
        events.push({ type: 'mcp:connected', data });
      });
      
      // Simulate complex workflow
      const timestamp = new Date().toISOString();
      
      // Single editor starts
      monitor.monitor.eventHub.emit('file:changed', {
        filePath: 'workflow.js',
        editor: 'alice',
        timestamp
      });
      
      // Second editor joins (should trigger conflict)
      monitor.monitor.eventHub.emit('file:changed', {
        filePath: 'workflow.js',
        editor: 'bob',
        timestamp
      });
      
      // Allow processing
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify event flow
      const fileChangeEvents = events.filter(e => e.type === 'file:changed');
      const conflictEvents = events.filter(e => e.type === 'conflict:detected');
      
      expect(fileChangeEvents.length).toBe(2);
      expect(conflictEvents.length).toBe(1);
    });
  });
  
  describe('Error Handling and Recovery', () => {
    test('should handle service failures gracefully', async () => {
      monitor = await createWorkspaceMonitor();
      await monitor.start();
      
      let errorHandled = false;
      
      monitor.monitor.eventHub.on('monitor:error', () => {
        errorHandled = true;
      });
      
      // Simulate service error
      monitor.monitor.eventHub.emit('error', new Error('Test service failure'));
      
      expect(errorHandled).toBe(true);
    });
    
    test('should shutdown cleanly under all conditions', async () => {
      monitor = await createWorkspaceMonitor();
      await monitor.start();
      
      // Start some activity
      monitor.monitor.eventHub.emit('file:changed', {
        filePath: 'active.js',
        editor: 'alice',
        timestamp: new Date().toISOString()
      });
      
      // Should shutdown cleanly even with active processes
      const shutdownResult = await monitor.stop();
      expect(shutdownResult).toBe(true);
      
      const status = monitor.status();
      expect(status.state.active).toBe(false);
    });
  });
});
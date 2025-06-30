/**
 * WorkspaceMonitor Core Tests
 * 
 * Purpose: Test main monitoring system coordinator
 * Architecture: Behavior-driven test organization
 * Context: Comprehensive coverage for core functionality
 */

const { WorkspaceMonitor } = require('../../core/monitor');
const { ConflictDetector } = require('../../services/conflict-detector');

const mockConfig = {
  name: 'test-monitor',
  version: '1.0.0',
  monitoring: {
    extensions: ['.js', '.md'],
    debounceMs: 100
  }
};

describe('WorkspaceMonitor', () => {
  let monitor;
  
  beforeEach(() => {
    monitor = new WorkspaceMonitor(mockConfig);
  });
  
  afterEach(async () => {
    if (monitor.state.initialized) {
      await monitor.shutdown();
    }
  });
  
  describe('Initialization', () => {
    test('should create monitor with valid config', () => {
      expect(monitor.config.name).toBe('test-monitor');
      expect(monitor.state.initialized).toBe(false);
      expect(monitor.eventHub).toBeDefined();
    });
    
    test('should initialize successfully', async () => {
      const result = await monitor.initialize();
      
      expect(result).toBe(true);
      expect(monitor.state.initialized).toBe(true);
      expect(monitor.state.startTime).toBeDefined();
    });
    
    test('should not re-initialize if already initialized', async () => {
      await monitor.initialize();
      const secondInit = await monitor.initialize();
      
      expect(secondInit).toBe(true);
    });
  });
  
  describe('Service Management', () => {
    test('should register services', () => {
      const service = new ConflictDetector();
      
      monitor.use(service);
      
      expect(monitor.services.has('conflict-detector')).toBe(true);
    });
    
    test('should reject services without name', () => {
      const invalidService = {};
      
      expect(() => {
        monitor.use(invalidService);
      }).toThrow('Service must have a name property');
    });
  });
  
  describe('System Operations', () => {
    test('should start monitoring system', async () => {
      const result = await monitor.start();
      
      expect(result).toBe(true);
      expect(monitor.state.active).toBe(true);
      expect(monitor.state.lastActivity).toBeDefined();
    });
    
    test('should provide system status', async () => {
      await monitor.initialize();
      const status = monitor.getStatus();
      
      expect(status.name).toBe('test-monitor');
      expect(status.version).toBe('1.0.0');
      expect(status.state).toBeDefined();
      expect(status.services).toEqual([]);
    });
    
    test('should shutdown gracefully', async () => {
      await monitor.initialize();
      await monitor.start();
      
      const result = await monitor.shutdown();
      
      expect(result).toBe(true);
      expect(monitor.state.active).toBe(false);
    });
  });
  
  describe('Event Handling', () => {
    test('should update activity on file changes', async () => {
      await monitor.initialize();
      
      const initialActivity = monitor.state.lastActivity;
      
      // Simulate file change
      monitor.eventHub.emit('file:changed', {
        filePath: 'test.js',
        timestamp: new Date().toISOString()
      });
      
      // Activity should be updated
      expect(monitor.state.lastActivity).not.toBe(initialActivity);
    });
    
    test('should handle errors gracefully', () => {
      const errorHandler = jest.fn();
      monitor.eventHub.on('monitor:error', errorHandler);
      
      // Trigger error by invalid initialization
      monitor.config = null;
      
      expect(() => monitor.initialize()).rejects.toThrow();
    });
  });
});
/**
 * Tests for [MODULE_NAME]
 * 
 * Focused unit tests covering:
 * - Core functionality
 * - Error handling
 * - Configuration
 * - Edge cases
 */

const { [ModuleName] } = require('./index');
const { loadConfig, validateConfig } = require('./config');
const { validateInput, withTimeout, withRetry } = require('./utils');

describe('[ModuleName]', () => {
  let module;
  
  beforeEach(() => {
    const config = loadConfig('test');
    module = new [ModuleName](config);
  });
  
  afterEach(async () => {
    if (module && module.state.initialized) {
      await module.shutdown();
    }
  });
  
  describe('initialization', () => {
    test('should initialize successfully with valid config', async () => {
      const result = await module.initialize();
      
      expect(result).toBe(true);
      expect(module.state.initialized).toBe(true);
      expect(module.state.active).toBe(true);
    });
    
    test('should emit initialized event', async () => {
      const eventPromise = new Promise(resolve => {
        module.once('initialized', resolve);
      });
      
      await module.initialize();
      const eventData = await eventPromise;
      
      expect(eventData).toHaveProperty('initialized', true);
    });
    
    test('should handle duplicate initialization', async () => {
      await module.initialize();
      const result = await module.initialize();
      
      expect(result).toBe(true);
    });
  });
  
  describe('processing', () => {
    beforeEach(async () => {
      await module.initialize();
    });
    
    test('should process valid input', async () => {
      const input = { data: 'test data' };
      const result = await module.process(input);
      
      expect(result).toHaveProperty('processed', true);
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('input', input);
    });
    
    test('should emit processed event', async () => {
      const eventPromise = new Promise(resolve => {
        module.once('processed', resolve);
      });
      
      const input = { data: 'test' };
      await module.process(input);
      
      const eventData = await eventPromise;
      expect(eventData).toHaveProperty('input');
      expect(eventData).toHaveProperty('result');
    });
    
    test('should reject processing when not initialized', async () => {
      const uninitializedModule = new [ModuleName]();
      
      await expect(uninitializedModule.process({ data: 'test' }))
        .rejects
        .toThrow('[ModuleName] not initialized');
    });
    
    test('should validate input', async () => {
      await expect(module.process(null))
        .rejects
        .toThrow('Required field missing');
    });
  });
  
  describe('status and monitoring', () => {
    test('should return correct status when not initialized', () => {
      const status = module.getStatus();
      
      expect(status).toHaveProperty('initialized', false);
      expect(status).toHaveProperty('active', false);
      expect(status).toHaveProperty('name', '[MODULE_NAME]');
    });
    
    test('should return correct status when initialized', async () => {
      await module.initialize();
      const status = module.getStatus();
      
      expect(status).toHaveProperty('initialized', true);
      expect(status).toHaveProperty('active', true);
      expect(status).toHaveProperty('lastUpdate');
    });
  });
  
  describe('shutdown', () => {
    test('should shutdown gracefully', async () => {
      await module.initialize();
      const result = await module.shutdown();
      
      expect(result).toBe(true);
      expect(module.state.initialized).toBe(false);
      expect(module.state.active).toBe(false);
    });
    
    test('should emit shutdown event', async () => {
      await module.initialize();
      
      const eventPromise = new Promise(resolve => {
        module.once('shutdown', resolve);
      });
      
      await module.shutdown();
      await eventPromise; // Should not timeout
    });
    
    test('should handle shutdown when not initialized', async () => {
      const result = await module.shutdown();
      expect(result).toBe(true);
    });
  });
  
  describe('error handling', () => {
    test('should emit error events on processing failure', async () => {
      const errorPromise = new Promise(resolve => {
        module.once('error', resolve);
      });
      
      try {
        await module.process({ invalid: 'data' });
      } catch (error) {
        // Expected to throw
      }
      
      const errorEvent = await errorPromise;
      expect(errorEvent).toHaveProperty('phase', 'processing');
      expect(errorEvent).toHaveProperty('error');
    });
  });
});

describe('Configuration', () => {
  test('should load default configuration', () => {
    const config = loadConfig('test');
    
    expect(config).toHaveProperty('version');
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('timeout');
  });
  
  test('should validate configuration', () => {
    expect(() => validateConfig({ version: '1.0.0', name: 'test', timeout: 5000 }))
      .not.toThrow();
    
    expect(() => validateConfig({ version: '1.0.0' }))
      .toThrow('Required configuration field missing');
  });
});

describe('Utilities', () => {
  test('should validate input correctly', () => {
    const schema = {
      required: ['data'],
      properties: { data: { type: 'string' } }
    };
    
    expect(() => validateInput({ data: 'test' }, schema))
      .not.toThrow();
    
    expect(() => validateInput({}, schema))
      .toThrow('Required field missing: data');
  });
  
  test('should handle timeouts', async () => {
    const slowPromise = new Promise(resolve => setTimeout(resolve, 100));
    
    await expect(withTimeout(slowPromise, 50))
      .rejects
      .toThrow('Operation timed out');
  });
  
  test('should retry failed operations', async () => {
    let attempts = 0;
    const flakyFunction = () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    };
    
    const result = await withRetry(flakyFunction, 3, 10);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });
});
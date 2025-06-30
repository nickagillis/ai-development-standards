/**
 * MCP Service Tests
 * 
 * Test template for MCP services
 */

const assert = require('assert');
const {{SERVICE_NAME}}Service = require('./index');
const { validateInput, handleError } = require('./utils');

describe('{{SERVICE_NAME}}Service', () => {
  let service;
  
  beforeEach(() => {
    service = new {{SERVICE_NAME}}Service({
      endpoint: 'http://test.example.com',
      apiKey: 'test-key'
    });
  });
  
  afterEach(() => {
    if (service.state.connected) {
      service.disconnect();
    }
  });
  
  describe('initialization', () => {
    it('should initialize with default config', () => {
      assert.ok(service.config.endpoint);
      assert.ok(service.config.apiKey);
      assert.strictEqual(service.state.initialized, false);
    });
    
    it('should validate required configuration', async () => {
      const invalidService = new {{SERVICE_NAME}}Service({});
      
      try {
        await invalidService.initialize();
        assert.fail('Should throw validation error');
      } catch (error) {
        assert.ok(error.message.includes('Missing configuration'));
      }
    });
  });
  
  describe('connection management', () => {
    it('should track connection state', async () => {
      assert.strictEqual(service.state.connected, false);
      
      // Mock connection
      service.establishConnection = async () => Promise.resolve();
      await service.connect();
      
      assert.strictEqual(service.state.connected, true);
      assert.ok(service.state.lastActivity);
    });
    
    it('should handle connection errors', async () => {
      service.establishConnection = async () => {
        throw new Error('Connection failed');
      };
      
      try {
        await service.connect();
        assert.fail('Should throw connection error');
      } catch (error) {
        assert.ok(error.message.includes('Connection failed'));
      }
    });
  });
  
  describe('request processing', () => {
    beforeEach(async () => {
      service.establishConnection = async () => Promise.resolve();
      service.handleRequest = async (request) => ({ result: 'success', data: request.data });
      await service.connect();
    });
    
    it('should validate request format', async () => {
      const invalidRequest = { invalidField: 'test' };
      
      try {
        await service.processRequest(invalidRequest);
        assert.fail('Should throw validation error');
      } catch (error) {
        assert.ok(error.message.includes('Invalid request'));
      }
    });
    
    it('should process valid requests', async () => {
      const validRequest = {
        type: 'query',
        data: { test: 'data' }
      };
      
      const result = await service.processRequest(validRequest);
      assert.strictEqual(result.result, 'success');
      assert.deepStrictEqual(result.data, validRequest.data);
    });
  });
  
  describe('health monitoring', () => {
    it('should provide health status', () => {
      const health = service.getHealthStatus();
      
      assert.ok('connected' in health);
      assert.ok('initialized' in health);
      assert.ok('lastActivity' in health);
      assert.ok('uptime' in health);
    });
  });
});

describe('Utility Functions', () => {
  describe('validateInput', () => {
    it('should validate required fields', () => {
      const schema = {
        required: ['name', 'email'],
        properties: {
          name: { type: 'string' },
          email: { type: 'string' }
        }
      };
      
      const result = validateInput({ name: 'test' }, schema);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(err => err.includes('email')));
    });
    
    it('should validate data types', () => {
      const schema = {
        properties: {
          count: { type: 'number' }
        }
      };
      
      const result = validateInput({ count: 'invalid' }, schema);
      assert.strictEqual(result.isValid, false);
      assert.ok(result.errors.some(err => err.includes('Invalid type')));
    });
  });
  
  describe('handleError', () => {
    it('should enhance error with context', () => {
      const originalError = new Error('Test error');
      const enhanced = handleError(originalError, 'test_context');
      
      assert.ok(enhanced.message.includes('test_context'));
      assert.strictEqual(enhanced.originalError, originalError);
      assert.strictEqual(enhanced.context, 'test_context');
      assert.ok(enhanced.timestamp);
    });
  });
});
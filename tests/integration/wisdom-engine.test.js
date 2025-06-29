/**
 * Integration Tests for Community Wisdom Engine
 * Production-ready testing with comprehensive coverage
 */

const { describe, test, beforeEach, afterEach, expect } = require('@jest/globals');
const { CommunityWisdomEngine } = require('../../scripts/community-wisdom-engine');
const { WisdomEngineConfig, resetConfig } = require('../../src/config/wisdom-engine.config');
const { GitHubMcpIntegration } = require('../../src/mcp/github-integration');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock MCP client for testing
class MockMcpClient {
  constructor(shouldFail = false) {
    this.shouldFail = shouldFail;
    this.calls = [];
  }

  async testConnection() {
    this.calls.push('testConnection');
    if (this.shouldFail) {
      throw new Error('Mock connection failed');
    }
    return true;
  }

  async getFileContents(params) {
    this.calls.push('getFileContents');
    if (this.shouldFail) {
      throw new Error('Mock file access failed');
    }

    // Mock responses based on path
    if (params.path === 'package.json') {
      return {
        content: Buffer.from(JSON.stringify({
          name: 'test-project',
          version: '1.0.0',
          dependencies: {
            express: '^4.18.0',
            lodash: '^4.17.21'
          },
          scripts: {
            test: 'jest',
            validate: 'node validate.js'
          }
        })).toString('base64')
      };
    }

    if (params.path === '') {
      return [
        { type: 'file', name: 'README.md' },
        { type: 'file', name: 'package.json' },
        { type: 'dir', name: 'src' },
        { type: 'dir', name: 'tests' },
        { type: 'dir', name: 'docs' }
      ];
    }

    return null;
  }

  async searchRepositories(params) {
    this.calls.push('searchRepositories');
    if (this.shouldFail) {
      throw new Error('Mock search failed');
    }

    return {
      total_count: 1,
      items: [
        {
          name: 'test-repo',
          owner: { login: 'test-user' },
          description: 'Test repository',
          language: 'JavaScript',
          stargazers_count: 42,
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]
    };
  }
}

describe('Community Wisdom Engine Integration Tests', () => {
  let tempDir;
  let originalEnv;

  beforeEach(() => {
    // Reset configuration
    resetConfig();
    
    // Save original environment
    originalEnv = { ...process.env };
    
    // Create temporary directory for test projects
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wisdom-engine-test-'));
    
    // Set test environment
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    
    // Clean up temp directory
    if (tempDir && fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('Configuration Management', () => {
    test('should load default configuration correctly', () => {
      const config = new WisdomEngineConfig('test');
      
      expect(config.get('engine.enabled')).toBe(true);
      expect(config.get('engine.participationLevel')).toBe('observer');
      expect(config.get('security.validateInputs')).toBe(true);
    });

    test('should validate configuration schema', () => {
      expect(() => {
        process.env.WISDOM_PARTICIPATION_LEVEL = 'invalid';
        new WisdomEngineConfig('test');
      }).toThrow();
    });

    test('should apply environment-specific overrides', () => {
      const prodConfig = new WisdomEngineConfig('production');
      
      expect(prodConfig.get('security.allowExternalConnections')).toBe(false);
      expect(prodConfig.get('performance.enableMetrics')).toBe(true);
    });
  });

  describe('MCP Integration', () => {
    test('should initialize MCP client successfully', async () => {
      const mockClient = new MockMcpClient();
      const integration = new GitHubMcpIntegration(mockClient);
      
      const result = await integration.initialize();
      
      expect(result).toBe(true);
      expect(mockClient.calls).toContain('testConnection');
    });

    test('should handle MCP connection failures gracefully', async () => {
      const mockClient = new MockMcpClient(true);
      const integration = new GitHubMcpIntegration(mockClient);
      
      const result = await integration.initialize();
      
      expect(result).toBe(false);
    });

    test('should analyze repository through MCP', async () => {
      const mockClient = new MockMcpClient();
      const integration = new GitHubMcpIntegration(mockClient);
      
      await integration.initialize();
      const analysis = await integration.analyzeRepository('test-user', 'test-repo');
      
      expect(analysis).toHaveProperty('repository');
      expect(analysis).toHaveProperty('structure');
      expect(analysis).toHaveProperty('dependencies');
      expect(analysis.repository.owner).toBe('test-user');
      expect(analysis.repository.repo).toBe('test-repo');
    });

    test('should cache analysis results', async () => {
      const mockClient = new MockMcpClient();
      const integration = new GitHubMcpIntegration(mockClient);
      
      await integration.initialize();
      
      // First call
      await integration.analyzeRepository('test-user', 'test-repo');
      const callsAfterFirst = mockClient.calls.length;
      
      // Second call (should use cache)
      await integration.analyzeRepository('test-user', 'test-repo');
      const callsAfterSecond = mockClient.calls.length;
      
      expect(callsAfterSecond).toBe(callsAfterFirst);
    });
  });

  describe('Local Project Analysis', () => {
    test('should analyze well-structured project', async () => {
      // Create test project structure
      const projectDir = path.join(tempDir, 'test-project');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'src'));
      fs.mkdirSync(path.join(projectDir, 'tests'));
      fs.mkdirSync(path.join(projectDir, 'docs'));
      
      // Create package.json
      fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify({
        name: 'test-project',
        scripts: {
          test: 'jest',
          validate: 'node validate.js'
        },
        dependencies: {
          express: '^4.18.0'
        }
      }, null, 2));
      
      // Create README
      fs.writeFileSync(path.join(projectDir, 'README.md'), '# Test Project\nA test project');
      
      // Create test files
      fs.writeFileSync(path.join(projectDir, 'tests', 'example.test.js'), 'test("example", () => {});');
      
      // Analyze project
      const engine = new CommunityWisdomEngine();
      const results = await engine.analyzeProject(projectDir);
      
      expect(results).toHaveProperty('localAnalysis');
      expect(results.localAnalysis.architecture.score).toBeGreaterThan(70);
      expect(results.localAnalysis.testing.score).toBeGreaterThan(50);
      expect(results.localAnalysis.documentation.score).toBeGreaterThan(40);
    });

    test('should identify documentation framework patterns', async () => {
      // Create documentation framework structure
      const projectDir = path.join(tempDir, 'docs-framework');
      fs.mkdirSync(projectDir, { recursive: true });
      fs.mkdirSync(path.join(projectDir, 'docs'));
      fs.mkdirSync(path.join(projectDir, 'templates'));
      fs.mkdirSync(path.join(projectDir, 'checklists'));
      
      fs.writeFileSync(path.join(projectDir, 'README.md'), '# Documentation Framework');
      fs.writeFileSync(path.join(projectDir, 'docs', 'architecture.md'), '# Architecture');
      fs.writeFileSync(path.join(projectDir, 'templates', 'project.md'), '# Project Template');
      fs.writeFileSync(path.join(projectDir, 'checklists', 'review.md'), '# Review Checklist');
      
      const engine = new CommunityWisdomEngine();
      const results = await engine.analyzeProject(projectDir);
      
      expect(results.localAnalysis.projectType).toBe('documentation-framework');
      expect(results.localAnalysis.architecture.patterns.standardsFramework).toBe(true);
    });

    test('should handle analysis errors gracefully', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent');
      
      const engine = new CommunityWisdomEngine();
      const results = await engine.analyzeProject(nonExistentPath);
      
      expect(results).toHaveProperty('message');
      expect(results.message).toContain('Analysis unavailable');
      expect(results).toHaveProperty('fallback');
    });
  });

  describe('Security Validation', () => {
    test('should validate repository parameters', async () => {
      const mockClient = new MockMcpClient();
      const integration = new GitHubMcpIntegration(mockClient);
      
      await integration.initialize();
      
      // Test invalid characters
      await expect(
        integration.analyzeRepository('invalid@user', 'test-repo')
      ).rejects.toThrow();
      
      // Test too long names
      const longName = 'a'.repeat(300);
      await expect(
        integration.analyzeRepository(longName, 'test-repo')
      ).rejects.toThrow();
    });

    test('should sanitize search queries', async () => {
      const mockClient = new MockMcpClient();
      const integration = new GitHubMcpIntegration(mockClient);
      
      await integration.initialize();
      
      // Test XSS attempt
      const results = await integration.searchRepositories('<script>alert(1)</script>');
      expect(results).toHaveProperty('error');
    });
  });

  describe('Performance and Reliability', () => {
    test('should handle timeout gracefully', async () => {
      // Set very short timeout
      process.env.MCP_TIMEOUT = '1';
      resetConfig();
      
      const slowMockClient = {
        testConnection: () => new Promise(resolve => setTimeout(resolve, 100)),
        getFileContents: () => new Promise(resolve => setTimeout(resolve, 100))
      };
      
      const integration = new GitHubMcpIntegration(slowMockClient);
      await integration.initialize();
      
      const results = await integration.analyzeRepository('test-user', 'test-repo');
      expect(results).toHaveProperty('fallback');
    });

    test('should respect concurrency limits', async () => {
      process.env.PERF_MAX_CONCURRENT = '1';
      resetConfig();
      
      const mockClient = new MockMcpClient();
      const integration = new GitHubMcpIntegration(mockClient);
      
      await integration.initialize();
      
      // This test would need more sophisticated concurrency testing
      // For now, just verify the configuration is respected
      const config = integration.config;
      expect(config.get('performance.maxConcurrentAnalyses')).toBe(1);
    });
  });

  describe('Error Recovery', () => {
    test('should provide fallback analysis when MCP fails', async () => {
      const engine = new CommunityWisdomEngine();
      
      // Simulate MCP failure by providing invalid path
      const results = await engine.analyzeProject('/invalid/path');
      
      expect(results).toHaveProperty('message');
      expect(results).toHaveProperty('fallback');
      expect(results.fallback).toHaveProperty('recommendations');
    });

    test('should continue operation after partial failures', async () => {
      const mockClient = new MockMcpClient();
      const integration = new GitHubMcpIntegration(mockClient);
      
      await integration.initialize();
      
      // First call succeeds
      const success = await integration.analyzeRepository('test-user', 'test-repo');
      expect(success).toHaveProperty('repository');
      
      // Make mock fail for subsequent calls
      mockClient.shouldFail = true;
      
      // Second call should still return graceful response
      const failure = await integration.analyzeRepository('test-user', 'other-repo');
      expect(failure).toHaveProperty('fallback');
    });
  });
});

// Test utilities
function createTestProject(baseDir, structure) {
  for (const [filePath, content] of Object.entries(structure)) {
    const fullPath = path.join(baseDir, filePath);
    const dir = path.dirname(fullPath);
    
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    if (typeof content === 'string') {
      fs.writeFileSync(fullPath, content);
    }
  }
}

module.exports = {
  MockMcpClient,
  createTestProject
};
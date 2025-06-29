/**
 * Tests for Duplicate Work Detection System
 * Comprehensive testing of collaboration features
 */

const { describe, test, beforeEach, afterEach, expect } = require('@jest/globals');
const { DuplicateWorkDetector } = require('../../src/collaboration/duplicate-work-detector');
const { WorkspaceCoordinator } = require('../../src/collaboration/workspace-coordinator');
const { resetConfig } = require('../../src/config/wisdom-engine.config');

// Enhanced Mock MCP Client with collaboration features
class MockMcpClientWithCollaboration {
  constructor() {
    this.mockData = {
      pullRequests: [],
      issues: [],
      commits: []
    };
  }

  // Set mock data for testing
  setMockData(data) {
    this.mockData = { ...this.mockData, ...data };
  }

  async listPullRequests(params) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    return this.mockData.pullRequests.filter(pr => {
      if (params.state && pr.state !== params.state && params.state !== 'all') {
        return false;
      }
      return new Date(pr.updated_at) > cutoffDate;
    });
  }

  async listIssues(params) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    return this.mockData.issues.filter(issue => {
      if (params.state && issue.state !== params.state && params.state !== 'all') {
        return false;
      }
      return new Date(issue.updated_at) > cutoffDate;
    });
  }

  async listCommits(params) {
    return this.mockData.commits.filter(commit => {
      if (params.since) {
        return new Date(commit.commit.author.date) > new Date(params.since);
      }
      return true;
    });
  }
}

describe('Duplicate Work Detection System', () => {
  let mockClient;
  let detector;
  let coordinator;
  let originalEnv;

  beforeEach(() => {
    resetConfig();
    originalEnv = { ...process.env };
    process.env.NODE_ENV = 'test';
    
    mockClient = new MockMcpClientWithCollaboration();
    detector = new DuplicateWorkDetector(mockClient);
    coordinator = new WorkspaceCoordinator(mockClient);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('Duplicate Work Detection', () => {
    test('should detect high similarity duplicate work', async () => {
      // Setup mock data with similar PR
      mockClient.setMockData({
        pullRequests: [
          {
            number: 42,
            title: 'Add user authentication system',
            body: 'Implement JWT-based authentication with login and logout functionality',
            state: 'open',
            head: { ref: 'feature/user-auth' },
            user: { login: 'teammate1' },
            created_at: '2025-06-20T00:00:00Z',
            updated_at: '2025-06-25T00:00:00Z'
          }
        ]
      });

      const proposedWork = {
        title: 'Implement user authentication',
        description: 'Add JWT authentication with login/logout',
        branchName: 'feature/authentication',
        author: 'developer1',
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await detector.checkForDuplicateWork(proposedWork);

      expect(result.duplicateRisk).toBe('high');
      expect(result.similarWork).toHaveLength(1);
      expect(result.similarWork[0].similarity).toBeGreaterThan(0.6);
      expect(result.similarWork[0].riskLevel).toBe('high');
    });

    test('should detect medium similarity with different state', async () => {
      mockClient.setMockData({
        pullRequests: [
          {
            number: 35,
            title: 'Payment system implementation',
            body: 'Add payment processing with Stripe integration',
            state: 'closed',
            head: { ref: 'feature/payments' },
            user: { login: 'teammate2' },
            created_at: '2025-06-15T00:00:00Z',
            updated_at: '2025-06-20T00:00:00Z'
          }
        ]
      });

      const proposedWork = {
        title: 'Implement payment processing',
        description: 'Add Stripe payment integration',
        branchName: 'feature/payment-system',
        author: 'developer2',
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await detector.checkForDuplicateWork(proposedWork);

      expect(result.duplicateRisk).toBe('low');
      expect(result.similarWork).toHaveLength(1);
      expect(result.similarWork[0].riskLevel).toBe('medium');
    });

    test('should identify collaboration opportunities', async () => {
      mockClient.setMockData({
        pullRequests: [
          {
            number: 28,
            title: 'API endpoint improvements',
            body: 'Enhance API performance and add caching',
            state: 'open',
            head: { ref: 'feature/api-improvements' },
            user: { login: 'api-expert' },
            created_at: '2025-06-18T00:00:00Z',
            updated_at: '2025-06-22T00:00:00Z'
          }
        ]
      });

      const proposedWork = {
        title: 'Add API caching layer',
        description: 'Implement Redis caching for API responses',
        branchName: 'feature/api-caching',
        author: 'developer3',
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await detector.checkForDuplicateWork(proposedWork);

      expect(result.collaborationOpportunities).toHaveLength(1);
      expect(result.collaborationOpportunities[0].type).toBe('active_contributor');
      expect(result.collaborationOpportunities[0].author).toBe('api-expert');
    });

    test('should handle branch pattern collisions', async () => {
      mockClient.setMockData({
        pullRequests: [
          {
            number: 50,
            title: 'Feature A implementation',
            body: 'Add feature A',
            state: 'open',
            head: { ref: 'feature/new-feature-a' },
            user: { login: 'dev1' },
            created_at: '2025-06-20T00:00:00Z',
            updated_at: '2025-06-25T00:00:00Z'
          },
          {
            number: 51,
            title: 'Feature B implementation',
            body: 'Add feature B',
            state: 'open',
            head: { ref: 'feature/new-feature-b' },
            user: { login: 'dev2' },
            created_at: '2025-06-21T00:00:00Z',
            updated_at: '2025-06-24T00:00:00Z'
          }
        ]
      });

      const proposedWork = {
        title: 'Feature C implementation',
        description: 'Add feature C',
        branchName: 'feature/new-feature-c',
        author: 'developer4',
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await detector.checkForDuplicateWork(proposedWork);

      expect(result.riskFactors).toBeDefined();
      expect(result.riskFactors.some(rf => rf.type === 'branch_prefix_collision')).toBe(true);
    });
  });

  describe('Workspace Coordination', () => {
    test('should detect author overload', async () => {
      mockClient.setMockData({
        pullRequests: [
          {
            number: 60,
            title: 'Feature X',
            state: 'open',
            user: { login: 'busy-developer' },
            created_at: '2025-06-20T00:00:00Z',
            updated_at: '2025-06-25T00:00:00Z'
          },
          {
            number: 61,
            title: 'Feature Y',
            state: 'open',
            user: { login: 'busy-developer' },
            created_at: '2025-06-21T00:00:00Z',
            updated_at: '2025-06-24T00:00:00Z'
          }
        ],
        issues: [
          {
            number: 101,
            title: 'Bug fix Z',
            state: 'open',
            assignees: [{ login: 'busy-developer' }],
            user: { login: 'reporter' },
            created_at: '2025-06-22T00:00:00Z',
            updated_at: '2025-06-23T00:00:00Z'
          }
        ]
      });

      const workRequest = {
        type: 'feature',
        scope: 'medium',
        title: 'New feature implementation',
        author: 'busy-developer',
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await coordinator.coordinateNewWork(workRequest);

      expect(result.workspaceStatus.resourceContention).toBeDefined();
      const overload = result.workspaceStatus.resourceContention.find(
        c => c.type === 'author_overload'
      );
      expect(overload).toBeDefined();
      expect(overload.severity).toBe('medium');
    });

    test('should identify critical path dependencies', async () => {
      mockClient.setMockData({
        pullRequests: [
          {
            number: 70,
            title: 'Critical security update',
            body: 'Fix critical security vulnerability',
            state: 'open',
            labels: [{ name: 'critical' }, { name: 'security' }],
            user: { login: 'security-team' },
            created_at: '2025-06-23T00:00:00Z',
            updated_at: '2025-06-25T00:00:00Z'
          },
          {
            number: 71,
            title: 'Core architecture refactor',
            body: 'Refactor core system architecture',
            state: 'open',
            user: { login: 'architect' },
            created_at: '2025-06-20T00:00:00Z',
            updated_at: '2025-06-24T00:00:00Z'
          }
        ]
      });

      const workRequest = {
        type: 'feature',
        scope: 'major',
        title: 'New user dashboard',
        author: 'frontend-dev',
        dependencies: ['authentication', 'core'],
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await coordinator.coordinateNewWork(workRequest);

      expect(result.workspaceStatus.criticalPaths).toHaveLength(2);
      expect(result.workspaceStatus.blockers).toBeDefined();
      expect(result.coordination.strategy).toBe('coordinate_first');
    });

    test('should generate appropriate coordination plan', async () => {
      mockClient.setMockData({
        pullRequests: [
          {
            number: 80,
            title: 'Payment integration',
            body: 'Add payment processing',
            state: 'open',
            user: { login: 'payments-expert' },
            created_at: '2025-06-22T00:00:00Z',
            updated_at: '2025-06-25T00:00:00Z'
          }
        ]
      });

      const workRequest = {
        type: 'feature',
        scope: 'medium',
        title: 'Enhanced payment flow',
        description: 'Improve payment user experience',
        author: 'ux-developer',
        files: ['src/payment/', 'src/components/Payment.jsx'],
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await coordinator.coordinateNewWork(workRequest);

      expect(result.status).toBe('completed');
      expect(result.coordination.strategy).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      
      const hasCollaborationRec = result.recommendations.some(
        rec => rec.action.includes('COLLABORATE')
      );
      expect(hasCollaborationRec).toBe(true);
    });
  });

  describe('Text Similarity Algorithms', () => {
    test('should calculate text similarity correctly', () => {
      const similarity1 = detector.calculateTextSimilarity(
        'Add user authentication system',
        'Implement user authentication'
      );
      expect(similarity1).toBeGreaterThan(0.6);

      const similarity2 = detector.calculateTextSimilarity(
        'Add payment processing',
        'Implement email notifications'
      );
      expect(similarity2).toBeLessThan(0.3);
    });

    test('should extract relevant keywords', () => {
      const keywords1 = detector.extractKeywords({
        title: 'Add API authentication',
        description: 'Implement JWT auth for API endpoints',
        branchName: 'feature/api-auth'
      });
      expect(keywords1).toContain('api');
      expect(keywords1).toContain('auth');

      const keywords2 = detector.extractKeywords({
        title: 'Frontend performance optimization',
        description: 'Improve UI performance and caching'
      });
      expect(keywords2).toContain('performance');
      expect(keywords2).toContain('ui');
    });

    test('should calculate keyword overlap accurately', () => {
      const work1 = {
        title: 'API security validation',
        description: 'Add security checks to API endpoints'
      };
      
      const work2 = {
        title: 'API performance testing',
        description: 'Test API endpoint performance'
      };

      const overlap = detector.calculateKeywordOverlap(work1, work2);
      expect(overlap).toBeGreaterThan(0);
      expect(overlap).toBeLessThan(1);
    });
  });

  describe('Error Handling and Fallbacks', () => {
    test('should handle MCP client failures gracefully', async () => {
      const failingClient = {
        listPullRequests: () => { throw new Error('MCP failure'); },
        listIssues: () => { throw new Error('MCP failure'); },
        listCommits: () => { throw new Error('MCP failure'); }
      };

      const failureDetector = new DuplicateWorkDetector(failingClient);
      
      const proposedWork = {
        title: 'Test work',
        author: 'developer',
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await failureDetector.checkForDuplicateWork(proposedWork);
      
      expect(result.status || result.fallback).toBeDefined();
      expect(result.message || result.fallback?.message).toContain('fallback');
    });

    test('should provide meaningful fallback recommendations', async () => {
      const noClientDetector = new DuplicateWorkDetector(null);
      
      const proposedWork = {
        title: 'Test work',
        author: 'developer',
        owner: 'testorg',
        repo: 'testproject'
      };

      const result = await noClientDetector.checkForDuplicateWork(proposedWork);
      
      expect(result.fallback || result.recommendations).toBeDefined();
      
      const recommendations = result.recommendations || result.fallback?.recommendations || [];
      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0].action).toContain('MANUAL');
    });
  });

  describe('Configuration and Customization', () => {
    test('should respect similarity thresholds', () => {
      const customDetector = new DuplicateWorkDetector(mockClient);
      customDetector.similarityThresholds = {
        branchName: 0.9,
        title: 0.8,
        description: 0.7,
        fileChanges: 0.6
      };

      const similarity = customDetector.calculateWorkSimilarity(
        {
          title: 'Add feature A',
          description: 'Implement feature A functionality',
          branchName: 'feature/a'
        },
        {
          title: 'Add feature B',
          body: 'Implement feature B functionality',
          branch: 'feature/b'
        }
      );

      expect(similarity.overall).toBeDefined();
      expect(similarity.details).toBeDefined();
    });

    test('should handle different work priority assessments', () => {
      const highPriorityWork = {
        title: 'Critical security fix',
        labels: [{ name: 'critical' }, { name: 'security' }]
      };
      
      const mediumPriorityWork = {
        title: 'Add new feature',
        labels: [{ name: 'enhancement' }]
      };
      
      const lowPriorityWork = {
        title: 'Update documentation',
        labels: [{ name: 'documentation' }]
      };

      expect(coordinator.assessWorkPriority(highPriorityWork)).toBe('high');
      expect(coordinator.assessWorkPriority(mediumPriorityWork)).toBe('medium');
      expect(coordinator.assessWorkPriority(lowPriorityWork)).toBe('low');
    });
  });
});

// Test utilities
function createMockWorkItem(overrides = {}) {
  return {
    id: Math.floor(Math.random() * 1000),
    title: 'Default work item',
    body: 'Default description',
    state: 'open',
    user: { login: 'default-user' },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides
  };
}

function createMockWorkRequest(overrides = {}) {
  return {
    type: 'feature',
    scope: 'medium',
    title: 'Default work request',
    description: 'Default work description',
    author: 'default-author',
    owner: 'default-org',
    repo: 'default-repo',
    ...overrides
  };
}

module.exports = {
  MockMcpClientWithCollaboration,
  createMockWorkItem,
  createMockWorkRequest
};
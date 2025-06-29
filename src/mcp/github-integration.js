/**
 * MCP GitHub Integration Layer
 * Single responsibility: Handle all GitHub MCP connections
 * Clean separation from business logic
 */

const { getConfig } = require('../config/wisdom-engine.config');
const { InputValidator } = require('../security/input-validator');
const { ErrorHandler, McpError } = require('../utils/error-handler');
const { Logger } = require('../utils/logger');

class GitHubMcpIntegration {
  constructor(mcpClient = null) {
    this.config = getConfig();
    this.validator = new InputValidator();
    this.errorHandler = new ErrorHandler();
    this.logger = new Logger('GitHubMCP');
    this.mcpClient = mcpClient;
    this.analysisCache = new Map();
  }

  /**
   * Initialize MCP connection with error handling
   */
  async initialize() {
    try {
      if (!this.config.isEnabled('mcp')) {
        this.logger.info('MCP GitHub integration disabled by configuration');
        return false;
      }

      this.logger.info('Initializing MCP GitHub integration...');
      
      // Validate MCP client availability
      if (!this.mcpClient) {
        throw new McpError('MCP client not provided', 'MCP_CLIENT_MISSING');
      }

      // Test connection with simple operation
      await this.testConnection();
      
      this.logger.info('MCP GitHub integration initialized successfully');
      return true;
    } catch (error) {
      this.errorHandler.logError(error, 'Failed to initialize MCP GitHub integration');
      return false;
    }
  }

  /**
   * Test MCP connection
   */
  async testConnection() {
    try {
      // Simple test operation - this would use actual MCP client
      // For now, simulate the test
      if (typeof this.mcpClient?.testConnection === 'function') {
        await this.mcpClient.testConnection();
      }
      return true;
    } catch (error) {
      throw new McpError(`MCP connection test failed: ${error.message}`, 'MCP_CONNECTION_FAILED');
    }
  }

  /**
   * Safely analyze repository structure via MCP
   */
  async analyzeRepository(owner, repo, options = {}) {
    try {
      // Validate inputs
      this.validator.validateRepositoryParams(owner, repo);
      
      // Check permissions
      if (!this.config.get('mcp.allowRepositoryAccess')) {
        throw new McpError('Repository access not allowed by configuration', 'ACCESS_DENIED');
      }

      // Check cache first
      const cacheKey = `${owner}/${repo}`;
      if (this.config.get('performance.cacheEnabled') && this.analysisCache.has(cacheKey)) {
        const cached = this.analysisCache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.config.get('performance.cacheTTL')) {
          this.logger.debug(`Using cached analysis for ${cacheKey}`);
          return cached.data;
        }
      }

      this.logger.info(`Analyzing repository: ${owner}/${repo}`);
      
      // Perform analysis with timeout
      const analysisPromise = this.performRepositoryAnalysis(owner, repo, options);
      const timeoutMs = this.config.get('mcp.timeout');
      
      const analysis = await Promise.race([
        analysisPromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new McpError('Analysis timeout', 'TIMEOUT')), timeoutMs)
        )
      ]);

      // Cache result
      if (this.config.get('performance.cacheEnabled')) {
        this.analysisCache.set(cacheKey, {
          data: analysis,
          timestamp: Date.now()
        });
      }

      return analysis;
    } catch (error) {
      return this.errorHandler.handleError(error, 'Repository analysis failed', {
        owner,
        repo,
        fallback: this.getFallbackAnalysis()
      });
    }
  }

  /**
   * Perform actual repository analysis
   */
  async performRepositoryAnalysis(owner, repo, options) {
    const analysis = {
      repository: { owner, repo },
      structure: {},
      dependencies: {},
      metadata: {},
      timestamp: Date.now()
    };

    try {
      // Get repository structure
      analysis.structure = await this.getRepositoryStructure(owner, repo);
      
      // Get package.json if exists
      analysis.dependencies = await this.getDependencyInfo(owner, repo);
      
      // Get repository metadata
      analysis.metadata = await this.getRepositoryMetadata(owner, repo);
      
      return analysis;
    } catch (error) {
      throw new McpError(`Repository analysis failed: ${error.message}`, 'ANALYSIS_FAILED');
    }
  }

  /**
   * Get repository file structure
   */
  async getRepositoryStructure(owner, repo) {
    try {
      const maxDepth = this.config.get('mcp.maxAnalysisDepth');
      
      // This would use actual MCP GitHub client
      // For now, simulate the structure gathering
      const structure = {
        files: [],
        directories: [],
        depth: maxDepth
      };

      // Simulate MCP call: github:get_file_contents for root
      if (this.mcpClient?.getFileContents) {
        const rootContents = await this.mcpClient.getFileContents({
          owner,
          repo,
          path: ''
        });
        
        structure.files = rootContents.filter(item => item.type === 'file').map(item => item.name);
        structure.directories = rootContents.filter(item => item.type === 'dir').map(item => item.name);
      }

      return structure;
    } catch (error) {
      this.logger.warn(`Failed to get repository structure: ${error.message}`);
      return { files: [], directories: [], error: error.message };
    }
  }

  /**
   * Get dependency information from package.json
   */
  async getDependencyInfo(owner, repo) {
    try {
      // Simulate MCP call: github:get_file_contents for package.json
      if (this.mcpClient?.getFileContents) {
        const packageJson = await this.mcpClient.getFileContents({
          owner,
          repo,
          path: 'package.json'
        });
        
        if (packageJson?.content) {
          const content = Buffer.from(packageJson.content, 'base64').toString('utf8');
          return JSON.parse(content);
        }
      }
      
      return null;
    } catch (error) {
      this.logger.debug(`No package.json found or parse failed: ${error.message}`);
      return null;
    }
  }

  /**
   * Get repository metadata
   */
  async getRepositoryMetadata(owner, repo) {
    try {
      return {
        analyzedAt: new Date().toISOString(),
        mcpEnabled: true,
        analysisDepth: this.config.get('mcp.maxAnalysisDepth')
      };
    } catch (error) {
      this.logger.warn(`Failed to get repository metadata: ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Search repositories with safety validation
   */
  async searchRepositories(query, options = {}) {
    try {
      this.validator.validateSearchQuery(query);
      
      if (!this.config.get('mcp.allowRepositoryAccess')) {
        throw new McpError('Repository search not allowed by configuration', 'ACCESS_DENIED');
      }

      this.logger.info(`Searching repositories: ${query}`);
      
      // Simulate MCP call: github:search_repositories
      if (this.mcpClient?.searchRepositories) {
        const results = await this.mcpClient.searchRepositories({
          query,
          per_page: Math.min(options.limit || 10, 100), // Safety limit
          page: options.page || 1
        });
        
        return this.sanitizeSearchResults(results);
      }
      
      return { items: [], total_count: 0 };
    } catch (error) {
      return this.errorHandler.handleError(error, 'Repository search failed', {
        query,
        fallback: { items: [], total_count: 0, error: error.message }
      });
    }
  }

  /**
   * Sanitize search results for security
   */
  sanitizeSearchResults(results) {
    try {
      const sanitized = {
        items: [],
        total_count: results.total_count || 0
      };

      if (results.items && Array.isArray(results.items)) {
        sanitized.items = results.items.map(repo => ({
          name: this.validator.sanitizeString(repo.name),
          owner: repo.owner ? this.validator.sanitizeString(repo.owner.login) : null,
          description: repo.description ? this.validator.sanitizeString(repo.description) : null,
          language: repo.language ? this.validator.sanitizeString(repo.language) : null,
          stars: typeof repo.stargazers_count === 'number' ? repo.stargazers_count : 0,
          updated_at: repo.updated_at || null
        }));
      }

      return sanitized;
    } catch (error) {
      this.logger.error(`Failed to sanitize search results: ${error.message}`);
      return { items: [], total_count: 0, error: 'Failed to process results' };
    }
  }

  /**
   * Get fallback analysis when MCP fails
   */
  getFallbackAnalysis() {
    return {
      status: 'fallback',
      message: 'MCP analysis unavailable, using basic analysis',
      recommendations: [
        'Ensure repository follows standard structure patterns',
        'Add comprehensive documentation',
        'Implement proper testing framework',
        'Follow security best practices'
      ]
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
    this.logger.debug('Analysis cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.analysisCache.size,
      enabled: this.config.get('performance.cacheEnabled'),
      ttl: this.config.get('performance.cacheTTL')
    };
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      this.logger.info('Shutting down MCP GitHub integration...');
      this.clearCache();
      
      if (this.mcpClient?.disconnect) {
        await this.mcpClient.disconnect();
      }
      
      this.logger.info('MCP GitHub integration shutdown complete');
    } catch (error) {
      this.logger.error(`Error during shutdown: ${error.message}`);
    }
  }
}

module.exports = { GitHubMcpIntegration };
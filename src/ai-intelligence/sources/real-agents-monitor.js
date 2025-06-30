/**
 * Real AI Agents Monitor - Production GitHub Integration
 * 
 * Purpose: Track actual AI agent framework developments using real GitHub data
 * Architecture: Replaces simulated data with live API integration
 * Context: Production-ready monitoring of agent ecosystem
 */

const { GitHubDataSource } = require('./github-data-source');
const { getLogger } = require('../../utils/logger');

/**
 * RealAgentsMonitor - Live AI agent development tracking
 * 
 * Features:
 * - Real GitHub API integration
 * - Release monitoring for major frameworks
 * - Commit activity analysis
 * - Community engagement metrics
 */
class RealAgentsMonitor {
  constructor(options = {}) {
    this.name = 'real-agents-monitor';
    this.config = {
      repositories: [
        { owner: 'langchain-ai', repo: 'langchain', category: 'framework' },
        { owner: 'Significant-Gravitas', repo: 'AutoGPT', category: 'autonomous' },
        { owner: 'joaomdmoura', repo: 'crewAI', category: 'multi-agent' },
        { owner: 'microsoft', repo: 'semantic-kernel', category: 'framework' },
        { owner: 'langchain-ai', repo: 'langgraph', category: 'workflow' },
        { owner: 'deepset-ai', repo: 'haystack', category: 'rag-framework' }
      ],
      checkInterval: 1800000, // 30 minutes
      releaseCheckDays: 30, // Look for releases in last 30 days
      ...options
    };
    
    this.logger = getLogger('RealAgentsMonitor');
    this.github = new GitHubDataSource(options.github);
    this.lastScan = null;
    this.knownReleases = new Set();
  }
  
  /**
   * Scan for real AI agent developments
   * @returns {Array} Array of detected developments
   */
  async scan() {
    this.logger.debug('🤖 Scanning real AI agent developments...');
    
    const developments = [];
    
    try {
      // Check each repository for new releases
      for (const repo of this.config.repositories) {
        const releases = await this.scanRepository(repo);
        developments.push(...releases);
      }
      
      // Get trending repositories in agent space
      const trending = await this.getTrendingAgentRepos();
      developments.push(...trending);
      
      this.lastScan = new Date().toISOString();
      
    } catch (error) {
      this.logger.error('Error scanning agent developments:', error.message);
    }
    
    return developments;
  }
  
  /**
   * Scan individual repository for developments
   * @param {Object} repoConfig - Repository configuration
   * @returns {Array} Repository developments
   */
  async scanRepository(repoConfig) {
    const { owner, repo, category } = repoConfig;
    const developments = [];
    
    try {
      // Get latest releases
      const releases = await this.github.getLatestReleases(owner, repo, 3);
      
      for (const release of releases) {
        const releaseId = `${owner}-${repo}-${release.version}`;
        
        if (!this.knownReleases.has(releaseId)) {
          // Check if release is recent (within checkDays)
          const releaseDate = new Date(release.publishedAt);
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - this.config.releaseCheckDays);
          
          if (releaseDate > cutoffDate) {
            const development = {
              id: releaseId,
              title: `${repo} ${release.version} Released`,
              source: `${owner}/${repo}`,
              url: release.url,
              content: this.summarizeRelease(release),
              timestamp: release.publishedAt,
              category: `${category}_release`,
              tags: this.extractTags(repo, release),
              impact_indicators: this.analyzeImpact(release),
              metadata: {
                repository: `${owner}/${repo}`,
                version: release.version,
                prerelease: release.prerelease,
                author: release.author
              }
            };
            
            developments.push(development);
            this.knownReleases.add(releaseId);
            
            this.logger.info(`🚀 New ${category} release:`, development.title);
          }
        }
      }
      
      // Get repository stats for trend analysis
      const stats = await this.github.getRepositoryStats(owner, repo);
      if (stats) {
        this.analyzeRepositoryTrends(repoConfig, stats);
      }
      
    } catch (error) {
      this.logger.error(`Error scanning ${owner}/${repo}:`, error.message);
    }
    
    return developments;
  }
  
  /**
   * Summarize release information
   * @param {Object} release - Release data
   * @returns {string} Release summary
   */
  summarizeRelease(release) {
    const description = release.description || 'No description available';
    
    // Extract key points from release notes
    const keyPoints = [];
    const lines = description.split('\n').slice(0, 10); // First 10 lines
    
    lines.forEach(line => {
      if (line.includes('*') || line.includes('-') || line.includes('•')) {
        keyPoints.push(line.trim());
      }
    });
    
    let summary = description.substring(0, 500);
    if (keyPoints.length > 0) {
      summary = keyPoints.slice(0, 3).join(' ').substring(0, 500);
    }
    
    return summary + (summary.length >= 500 ? '...' : '');
  }
  
  /**
   * Extract relevant tags from release
   * @param {string} repo - Repository name
   * @param {Object} release - Release data
   * @returns {Array} Relevant tags
   */
  extractTags(repo, release) {
    const tags = [repo.toLowerCase()];
    const text = `${release.description || ''} ${release.version}`.toLowerCase();
    
    const relevantTerms = [
      'agent', 'framework', 'performance', 'bug-fix', 'feature',
      'breaking-change', 'security', 'optimization', 'api',
      'memory', 'tool', 'integration', 'model', 'deployment'
    ];
    
    relevantTerms.forEach(term => {
      if (text.includes(term) || text.includes(term.replace('-', ' '))) {
        tags.push(term);
      }
    });
    
    return [...new Set(tags)];
  }
  
  /**
   * Analyze release impact
   * @param {Object} release - Release data
   * @returns {Array} Impact indicators
   */
  analyzeImpact(release) {
    const indicators = [];
    const text = `${release.description || ''} ${release.version}`.toLowerCase();
    
    if (text.includes('major') || release.version.includes('.0.0')) {
      indicators.push('major release');
    }
    
    if (text.includes('breaking') || text.includes('migration')) {
      indicators.push('breaking changes');
    }
    
    if (text.includes('performance') || text.includes('optimization')) {
      indicators.push('performance improvements');
    }
    
    if (text.includes('security') || text.includes('vulnerability')) {
      indicators.push('security update');
    }
    
    if (text.includes('feature') || text.includes('new')) {
      indicators.push('new features');
    }
    
    return indicators;
  }
  
  /**
   * Get trending AI agent repositories
   * @returns {Array} Trending developments
   */
  async getTrendingAgentRepos() {
    const developments = [];
    
    try {
      const queries = [
        'AI agent language:JavaScript created:>2024-01-01',
        'LangChain agent language:Python stars:>100',
        'autonomous agent language:TypeScript',
        'multi-agent system language:Python updated:>2024-12-01'
      ];
      
      for (const query of queries) {
        const results = await this.github.searchRepositories(query, 5);
        
        results.forEach(repo => {
          if (repo.stars > 50) { // Filter for significant repos
            const development = {
              id: `trending-${repo.fullName.replace('/', '-')}`,
              title: `Trending: ${repo.name} - ${repo.description}`,
              source: 'GitHub Trending',
              url: repo.url,
              content: `${repo.description} | ${repo.stars} stars | Language: ${repo.language}`,
              timestamp: repo.updatedAt,
              category: 'trending_repository',
              tags: ['trending', 'repository', repo.language?.toLowerCase()].filter(Boolean),
              impact_indicators: [`${repo.stars} stars`, 'trending'],
              metadata: {
                repository: repo.fullName,
                stars: repo.stars,
                language: repo.language
              }
            };
            
            developments.push(development);
          }
        });
      }
      
    } catch (error) {
      this.logger.error('Error getting trending repos:', error.message);
    }
    
    return developments;
  }
  
  /**
   * Analyze repository trends
   * @param {Object} repoConfig - Repository configuration
   * @param {Object} stats - Repository statistics
   */
  analyzeRepositoryTrends(repoConfig, stats) {
    // Store stats for trend analysis (implement persistence as needed)
    this.logger.debug(`${repoConfig.owner}/${repoConfig.repo} stats:`, {
      stars: stats.stars,
      forks: stats.forks,
      issues: stats.issues,
      lastPush: stats.lastPush
    });
  }
  
  /**
   * Get monitor status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      name: this.name,
      lastScan: this.lastScan,
      knownReleases: this.knownReleases.size,
      repositories: this.config.repositories.length,
      rateLimitStatus: this.github.requestCount
    };
  }
  
  /**
   * Reset known developments (for testing)
   */
  reset() {
    this.knownReleases.clear();
    this.lastScan = null;
  }
}

module.exports = { RealAgentsMonitor };
/**
 * GitHub Data Source - Real GitHub API Integration
 * 
 * Purpose: Fetch real data from GitHub repositories and releases
 * Architecture: Production-ready API client with rate limiting
 * Context: Replace simulated data with actual GitHub developments
 */

const { getLogger } = require('../../utils/logger');

/**
 * GitHubDataSource - Real GitHub API integration
 * 
 * Features:
 * - Repository releases monitoring
 * - Commit activity tracking
 * - Star/fork trend analysis
 * - Rate limiting compliance
 */
class GitHubDataSource {
  constructor(options = {}) {
    this.name = 'github-data-source';
    this.config = {
      apiToken: process.env.GITHUB_TOKEN, // Set in .env
      baseUrl: 'https://api.github.com',
      rateLimit: {
        requests: 5000, // Per hour with token
        window: 3600000 // 1 hour
      },
      retryDelay: 2000,
      timeout: 30000,
      ...options
    };
    
    this.logger = getLogger('GitHubDataSource');
    this.requestCount = 0;
    this.lastReset = Date.now();
  }
  
  /**
   * Check rate limit before making requests
   * @returns {boolean} Whether request can be made
   */
  checkRateLimit() {
    const now = Date.now();
    
    // Reset counter if window expired
    if (now - this.lastReset > this.config.rateLimit.window) {
      this.requestCount = 0;
      this.lastReset = now;
    }
    
    return this.requestCount < this.config.rateLimit.requests;
  }
  
  /**
   * Make authenticated GitHub API request
   * @param {string} endpoint - API endpoint
   * @returns {Object} API response
   */
  async makeRequest(endpoint) {
    if (!this.checkRateLimit()) {
      this.logger.warn('Rate limit exceeded, waiting...');
      await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
    }
    
    const headers = {
      'User-Agent': 'AI-Development-Standards/1.0',
      'Accept': 'application/vnd.github.v3+json'
    };
    
    if (this.config.apiToken) {
      headers['Authorization'] = `token ${this.config.apiToken}`;
    }
    
    try {
      const url = `${this.config.baseUrl}${endpoint}`;
      this.logger.debug(`Fetching: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.requestCount++;
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      return await response.json();
      
    } catch (error) {
      this.logger.error(`GitHub API request failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Get latest releases for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} limit - Number of releases to fetch
   * @returns {Array} Release information
   */
  async getLatestReleases(owner, repo, limit = 5) {
    try {
      const releases = await this.makeRequest(`/repos/${owner}/${repo}/releases?per_page=${limit}`);
      
      return releases.map(release => ({
        id: `${owner}-${repo}-${release.tag_name}`,
        title: `${repo} ${release.tag_name} Released`,
        version: release.tag_name,
        description: release.body || 'No description available',
        publishedAt: release.published_at,
        url: release.html_url,
        downloadUrl: release.tarball_url,
        prerelease: release.prerelease,
        author: release.author ? release.author.login : 'Unknown'
      }));
      
    } catch (error) {
      this.logger.error(`Failed to fetch releases for ${owner}/${repo}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get recent commits for a repository
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @param {number} limit - Number of commits to fetch
   * @returns {Array} Commit information
   */
  async getRecentCommits(owner, repo, limit = 10) {
    try {
      const commits = await this.makeRequest(`/repos/${owner}/${repo}/commits?per_page=${limit}`);
      
      return commits.map(commit => ({
        id: commit.sha,
        message: commit.commit.message,
        author: commit.commit.author.name,
        date: commit.commit.author.date,
        url: commit.html_url,
        additions: commit.stats ? commit.stats.additions : 0,
        deletions: commit.stats ? commit.stats.deletions : 0
      }));
      
    } catch (error) {
      this.logger.error(`Failed to fetch commits for ${owner}/${repo}:`, error.message);
      return [];
    }
  }
  
  /**
   * Get repository statistics
   * @param {string} owner - Repository owner
   * @param {string} repo - Repository name
   * @returns {Object} Repository stats
   */
  async getRepositoryStats(owner, repo) {
    try {
      const repoData = await this.makeRequest(`/repos/${owner}/${repo}`);
      
      return {
        stars: repoData.stargazers_count,
        forks: repoData.forks_count,
        issues: repoData.open_issues_count,
        language: repoData.language,
        lastPush: repoData.pushed_at,
        description: repoData.description,
        topics: repoData.topics || []
      };
      
    } catch (error) {
      this.logger.error(`Failed to fetch stats for ${owner}/${repo}:`, error.message);
      return null;
    }
  }
  
  /**
   * Search for repositories by topic or keyword
   * @param {string} query - Search query
   * @param {number} limit - Number of results
   * @returns {Array} Repository search results
   */
  async searchRepositories(query, limit = 10) {
    try {
      const results = await this.makeRequest(`/search/repositories?q=${encodeURIComponent(query)}&sort=updated&per_page=${limit}`);
      
      return results.items.map(repo => ({
        name: repo.name,
        fullName: repo.full_name,
        description: repo.description,
        stars: repo.stargazers_count,
        language: repo.language,
        updatedAt: repo.updated_at,
        url: repo.html_url
      }));
      
    } catch (error) {
      this.logger.error(`Failed to search repositories: ${error.message}`);
      return [];
    }
  }
}

module.exports = { GitHubDataSource };
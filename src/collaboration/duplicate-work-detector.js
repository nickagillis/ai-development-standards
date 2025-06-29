/**
 * Duplicate Work Detection System
 * Single responsibility: Prevent duplicate development efforts
 * Intelligent collaboration suggestion engine
 */

const { getConfig } = require('../config/wisdom-engine.config');
const { InputValidator } = require('../security/input-validator');
const { ErrorHandler } = require('../utils/error-handler');
const { Logger } = require('../utils/logger');

class DuplicateWorkDetector {
  constructor(mcpClient = null) {
    this.config = getConfig();
    this.validator = new InputValidator();
    this.errorHandler = new ErrorHandler();
    this.logger = new Logger('DuplicateWorkDetector');
    this.mcpClient = mcpClient;
    
    // Pattern matching thresholds
    this.similarityThresholds = {
      branchName: 0.7,
      title: 0.6,
      description: 0.5,
      fileChanges: 0.4
    };
  }

  /**
   * Check for duplicate work before starting new development
   */
  async checkForDuplicateWork(proposedWork) {
    try {
      this.validator.validateMcpParams(proposedWork);
      
      this.logger.info('Checking for duplicate work', {
        type: proposedWork.type,
        scope: proposedWork.scope
      });

      const analysis = {
        duplicateRisk: 'none',
        similarWork: [],
        recommendations: [],
        collaborationOpportunities: [],
        timestamp: new Date().toISOString()
      };

      // Check recent branches
      const recentBranches = await this.getRecentDevelopmentActivity(proposedWork.owner, proposedWork.repo);
      
      // Analyze for duplicates
      const duplicateAnalysis = await this.analyzePotentialDuplicates(proposedWork, recentBranches);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(duplicateAnalysis);
      
      return {
        ...analysis,
        ...duplicateAnalysis,
        recommendations
      };
    } catch (error) {
      return this.errorHandler.handleError(error, 'Duplicate work detection failed', {
        fallback: this.getBasicDuplicateCheckFallback()
      });
    }
  }

  /**
   * Get recent development activity from GitHub
   */
  async getRecentDevelopmentActivity(owner, repo) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Last 30 days
      
      // Get recent pull requests
      const pullRequests = await this.getRecentPullRequests(owner, repo, cutoffDate);
      
      // Get recent issues
      const issues = await this.getRecentIssues(owner, repo, cutoffDate);
      
      // Get recent commits
      const commits = await this.getRecentCommits(owner, repo, cutoffDate);
      
      return {
        pullRequests,
        issues,
        commits,
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.warn(`Failed to get recent activity: ${error.message}`);
      return { pullRequests: [], issues: [], commits: [] };
    }
  }

  /**
   * Get recent pull requests via MCP
   */
  async getRecentPullRequests(owner, repo, cutoffDate) {
    try {
      if (!this.mcpClient?.listPullRequests) {
        return [];
      }

      const prs = await this.mcpClient.listPullRequests({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 50
      });

      return prs.filter(pr => new Date(pr.updated_at) > cutoffDate)
        .map(pr => ({
          id: pr.number,
          title: pr.title,
          body: pr.body || '',
          state: pr.state,
          branch: pr.head?.ref || '',
          files: [], // Will be populated separately if needed
          author: pr.user?.login || 'unknown',
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          type: 'pull_request'
        }));
    } catch (error) {
      this.logger.debug(`Failed to get recent PRs: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recent issues via MCP
   */
  async getRecentIssues(owner, repo, cutoffDate) {
    try {
      if (!this.mcpClient?.listIssues) {
        return [];
      }

      const issues = await this.mcpClient.listIssues({
        owner,
        repo,
        state: 'all',
        sort: 'updated',
        direction: 'desc',
        per_page: 30
      });

      return issues.filter(issue => new Date(issue.updated_at) > cutoffDate)
        .map(issue => ({
          id: issue.number,
          title: issue.title,
          body: issue.body || '',
          state: issue.state,
          labels: issue.labels?.map(l => l.name) || [],
          author: issue.user?.login || 'unknown',
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          type: 'issue'
        }));
    } catch (error) {
      this.logger.debug(`Failed to get recent issues: ${error.message}`);
      return [];
    }
  }

  /**
   * Get recent commits via MCP
   */
  async getRecentCommits(owner, repo, cutoffDate) {
    try {
      if (!this.mcpClient?.listCommits) {
        return [];
      }

      const commits = await this.mcpClient.listCommits({
        owner,
        repo,
        since: cutoffDate.toISOString(),
        per_page: 50
      });

      return commits.map(commit => ({
        sha: commit.sha,
        message: commit.commit?.message || '',
        author: commit.commit?.author?.name || 'unknown',
        date: commit.commit?.author?.date || commit.commit?.committer?.date,
        type: 'commit'
      }));
    } catch (error) {
      this.logger.debug(`Failed to get recent commits: ${error.message}`);
      return [];
    }
  }

  /**
   * Analyze potential duplicates using similarity algorithms
   */
  async analyzePotentialDuplicates(proposedWork, recentActivity) {
    const analysis = {
      duplicateRisk: 'none',
      similarWork: [],
      riskFactors: [],
      collaborationOpportunities: []
    };

    // Check against pull requests
    for (const pr of recentActivity.pullRequests) {
      const similarity = this.calculateWorkSimilarity(proposedWork, pr);
      
      if (similarity.overall > 0.6) {
        analysis.similarWork.push({
          type: 'pull_request',
          id: pr.id,
          title: pr.title,
          similarity: similarity.overall,
          details: similarity.details,
          state: pr.state,
          author: pr.author,
          riskLevel: this.assessRiskLevel(similarity.overall, pr.state)
        });
      }
    }

    // Check against issues
    for (const issue of recentActivity.issues) {
      const similarity = this.calculateWorkSimilarity(proposedWork, issue);
      
      if (similarity.overall > 0.5) {
        analysis.similarWork.push({
          type: 'issue',
          id: issue.id,
          title: issue.title,
          similarity: similarity.overall,
          details: similarity.details,
          state: issue.state,
          author: issue.author,
          riskLevel: this.assessRiskLevel(similarity.overall, issue.state)
        });
      }
    }

    // Check for branch name patterns
    const branchPatterns = this.analyzeBranchPatterns(proposedWork, recentActivity);
    analysis.riskFactors.push(...branchPatterns);

    // Assess overall duplicate risk
    analysis.duplicateRisk = this.assessOverallDuplicateRisk(analysis.similarWork);

    // Identify collaboration opportunities
    analysis.collaborationOpportunities = this.identifyCollaborationOpportunities(analysis.similarWork);

    return analysis;
  }

  /**
   * Calculate similarity between proposed work and existing work
   */
  calculateWorkSimilarity(proposedWork, existingWork) {
    const details = {};
    
    // Title similarity
    details.titleSimilarity = this.calculateTextSimilarity(
      proposedWork.title || '', 
      existingWork.title || ''
    );

    // Description similarity
    details.descriptionSimilarity = this.calculateTextSimilarity(
      proposedWork.description || '', 
      existingWork.body || ''
    );

    // Branch name similarity (if applicable)
    details.branchSimilarity = this.calculateTextSimilarity(
      proposedWork.branchName || '', 
      existingWork.branch || ''
    );

    // Keyword overlap
    details.keywordOverlap = this.calculateKeywordOverlap(
      proposedWork, 
      existingWork
    );

    // Calculate weighted overall similarity
    const overall = (
      details.titleSimilarity * 0.4 +
      details.descriptionSimilarity * 0.3 +
      details.branchSimilarity * 0.15 +
      details.keywordOverlap * 0.15
    );

    return {
      overall: Math.round(overall * 100) / 100,
      details
    };
  }

  /**
   * Calculate text similarity using simple algorithm
   */
  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    
    const words1 = this.normalizeText(text1).split(/\s+/);
    const words2 = this.normalizeText(text2).split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate keyword overlap between works
   */
  calculateKeywordOverlap(work1, work2) {
    const keywords1 = this.extractKeywords(work1);
    const keywords2 = this.extractKeywords(work2);
    
    const overlap = keywords1.filter(k => keywords2.includes(k)).length;
    const total = new Set([...keywords1, ...keywords2]).size;
    
    return total > 0 ? overlap / total : 0;
  }

  /**
   * Extract keywords from work description
   */
  extractKeywords(work) {
    const text = `${work.title || ''} ${work.description || ''} ${work.branchName || ''}`;
    const normalized = this.normalizeText(text);
    
    // Common development keywords
    const devKeywords = [
      'api', 'auth', 'database', 'frontend', 'backend', 'ui', 'ux',
      'test', 'validation', 'security', 'performance', 'integration',
      'mcp', 'github', 'config', 'error', 'logging', 'cache',
      'architecture', 'documentation', 'framework', 'engine', 'system'
    ];
    
    return devKeywords.filter(keyword => normalized.includes(keyword));
  }

  /**
   * Normalize text for comparison
   */
  normalizeText(text) {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Analyze branch naming patterns
   */
  analyzeBranchPatterns(proposedWork, recentActivity) {
    const patterns = [];
    const proposedBranch = proposedWork.branchName || '';
    
    if (!proposedBranch) {
      return patterns;
    }

    // Check for similar branch prefixes
    const branchPrefix = proposedBranch.split('/')[0];
    const similarPrefixes = recentActivity.pullRequests
      .filter(pr => pr.branch && pr.branch.startsWith(branchPrefix))
      .filter(pr => pr.state === 'open');
    
    if (similarPrefixes.length > 0) {
      patterns.push({
        type: 'branch_prefix_collision',
        message: `Similar branch prefix "${branchPrefix}" found in ${similarPrefixes.length} open PR(s)`,
        suggestions: [
          'Consider coordinating with existing work',
          'Use more specific branch naming',
          'Check if work can be combined'
        ]
      });
    }

    return patterns;
  }

  /**
   * Assess risk level based on similarity and state
   */
  assessRiskLevel(similarity, state) {
    if (state === 'open' && similarity > 0.8) return 'high';
    if (state === 'open' && similarity > 0.6) return 'medium';
    if (state === 'closed' && similarity > 0.9) return 'medium';
    return 'low';
  }

  /**
   * Assess overall duplicate risk
   */
  assessOverallDuplicateRisk(similarWork) {
    const highRisk = similarWork.filter(w => w.riskLevel === 'high').length;
    const mediumRisk = similarWork.filter(w => w.riskLevel === 'medium').length;
    
    if (highRisk > 0) return 'high';
    if (mediumRisk > 1) return 'medium';
    if (mediumRisk > 0 || similarWork.length > 2) return 'low';
    return 'none';
  }

  /**
   * Identify collaboration opportunities
   */
  identifyCollaborationOpportunities(similarWork) {
    const opportunities = [];
    
    // Group by author
    const byAuthor = {};
    similarWork.forEach(work => {
      if (!byAuthor[work.author]) {
        byAuthor[work.author] = [];
      }
      byAuthor[work.author].push(work);
    });
    
    // Find potential collaborators
    Object.entries(byAuthor).forEach(([author, works]) => {
      if (works.length > 0 && works.some(w => w.state === 'open')) {
        opportunities.push({
          type: 'active_contributor',
          author,
          suggestion: `Consider collaborating with ${author} who has similar active work`,
          relatedWork: works.map(w => ({ id: w.id, title: w.title, type: w.type }))
        });
      }
    });
    
    // Find recently closed similar work
    const recentlyClosed = similarWork.filter(w => 
      w.state === 'closed' && w.similarity > 0.7
    );
    
    if (recentlyClosed.length > 0) {
      opportunities.push({
        type: 'recent_implementation',
        suggestion: 'Similar work was recently completed - consider building on existing solution',
        relatedWork: recentlyClosed.map(w => ({ id: w.id, title: w.title, author: w.author }))
      });
    }
    
    return opportunities;
  }

  /**
   * Generate actionable recommendations
   */
  generateRecommendations(analysis) {
    const recommendations = [];
    
    if (analysis.duplicateRisk === 'high') {
      recommendations.push({
        priority: 'high',
        action: 'STOP - Review existing work before proceeding',
        reasoning: 'High similarity to active development detected',
        nextSteps: [
          'Contact authors of similar active work',
          'Determine if coordination or combination is possible',
          'Consider different approach or specialization'
        ]
      });
    } else if (analysis.duplicateRisk === 'medium') {
      recommendations.push({
        priority: 'medium',
        action: 'COORDINATE - Contact related work authors',
        reasoning: 'Moderate similarity to existing work detected',
        nextSteps: [
          'Review similar work for lessons learned',
          'Identify complementary approaches',
          'Consider collaboration opportunities'
        ]
      });
    }
    
    // Add collaboration-specific recommendations
    analysis.collaborationOpportunities.forEach(opp => {
      recommendations.push({
        priority: 'low',
        action: `COLLABORATE - ${opp.suggestion}`,
        reasoning: opp.type,
        nextSteps: ['Reach out for coordination', 'Share implementation plans']
      });
    });
    
    // Add general best practices
    if (analysis.duplicateRisk === 'none') {
      recommendations.push({
        priority: 'info',
        action: 'PROCEED - No duplicate work detected',
        reasoning: 'Clear to proceed with proposed development',
        nextSteps: [
          'Document approach for future reference',
          'Share progress updates for coordination'
        ]
      });
    }
    
    return recommendations;
  }

  /**
   * Get basic duplicate check fallback
   */
  getBasicDuplicateCheckFallback() {
    return {
      status: 'fallback',
      message: 'Advanced duplicate detection unavailable, using basic check',
      duplicateRisk: 'unknown',
      recommendations: [
        {
          priority: 'medium',
          action: 'MANUAL CHECK - Review recent activity manually',
          reasoning: 'Automated detection unavailable',
          nextSteps: [
            'Check recent pull requests and issues',
            'Search for similar branch names',
            'Contact team members for coordination'
          ]
        }
      ]
    };
  }

  /**
   * Generate duplicate work report
   */
  generateDuplicateWorkReport(analysis) {
    const report = {
      summary: {
        duplicateRisk: analysis.duplicateRisk,
        similarWorkCount: analysis.similarWork?.length || 0,
        collaborationOpportunities: analysis.collaborationOpportunities?.length || 0,
        timestamp: analysis.timestamp
      },
      details: {
        similarWork: analysis.similarWork || [],
        riskFactors: analysis.riskFactors || [],
        collaborationOpportunities: analysis.collaborationOpportunities || []
      },
      recommendations: analysis.recommendations || []
    };
    
    this.logger.info('Duplicate work analysis completed', {
      duplicateRisk: report.summary.duplicateRisk,
      similarWorkCount: report.summary.similarWorkCount,
      recommendationCount: report.recommendations.length
    });
    
    return report;
  }
}

module.exports = { DuplicateWorkDetector };
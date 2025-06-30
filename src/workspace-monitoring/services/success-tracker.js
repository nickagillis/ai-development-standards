/**
 * Success Tracker Service
 * 
 * Purpose: Track and celebrate development successes automatically
 * Architecture: Event-driven success monitoring with community integration
 * Context: Follow our own standards by logging victories and learnings
 */

const { getLogger } = require('../../utils/logger');

/**
 * SuccessTracker - Automatically tracks development victories
 * 
 * Features:
 * - Milestone detection and celebration
 * - Success pattern analysis
 * - Community wisdom contribution
 * - Momentum tracking
 */
class SuccessTracker {
  constructor(options = {}) {
    this.name = 'success-tracker';
    this.config = {
      trackMilestones: true,
      celebrateWins: true,
      analyzeSuccessPatterns: true,
      contributeToCommunity: false, // Opt-in only
      ...options
    };
    
    this.logger = getLogger('SuccessTracker');
    this.eventHub = null;
    
    this.successes = [];
    this.milestones = {
      'first_test_pass': false,
      'build_success': false,
      'pr_created': false,
      'context_optimization': false,
      'mcp_integration': false,
      'standards_compliance': false
    };
    
    this.momentum = {
      currentStreak: 0,
      bestStreak: 0,
      lastSuccess: null,
      velocityScore: 0
    };
  }
  
  /**
   * Connect to event hub
   * @param {EventHub} hub - Central event hub
   */
  setEventHub(hub) {
    this.eventHub = hub;
    
    // Listen for success events
    hub.on('test:passed', this.handleTestSuccess.bind(this));
    hub.on('build:success', this.handleBuildSuccess.bind(this));
    hub.on('pr:created', this.handlePRCreated.bind(this));
    hub.on('feature:completed', this.handleFeatureCompletion.bind(this));
    hub.on('pattern:captured', this.handlePatternCapture.bind(this));
    hub.on('standards:validated', this.handleStandardsCompliance.bind(this));
  }
  
  /**
   * Initialize success tracking
   */
  async initialize() {
    this.logger.info('Success tracking initialized', {
      trackMilestones: this.config.trackMilestones,
      celebrateWins: this.config.celebrateWins
    });
    
    // Celebrate starting the success tracking! 🎉
    this.trackSuccess({
      type: 'system_initialization',
      description: 'Success tracking system activated',
      significance: 'foundation',
      momentum: 1
    });
  }
  
  /**
   * Track a development success
   * @param {Object} success - Success data
   */
  trackSuccess(success) {
    const successEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      type: success.type,
      description: success.description,
      significance: success.significance || 'normal',
      momentum: success.momentum || 1,
      metadata: success.metadata || {}
    };
    
    this.successes.push(successEntry);
    this.updateMomentum(successEntry);
    
    // Check for milestone achievements
    this.checkMilestones(successEntry);
    
    // Celebrate if enabled
    if (this.config.celebrateWins) {
      this.celebrateSuccess(successEntry);
    }
    
    this.logger.info('Success tracked', {
      type: successEntry.type,
      description: successEntry.description,
      momentum: this.momentum.currentStreak
    });
    
    // Emit for other services
    if (this.eventHub) {
      this.eventHub.emit('success:tracked', successEntry);
    }
  }
  
  /**
   * Handle test success events
   * @param {Object} test - Test event data
   */
  handleTestSuccess(test) {
    this.trackSuccess({
      type: 'test_success',
      description: `${test.testCount || 1} tests passed`,
      significance: test.firstPass ? 'milestone' : 'normal',
      momentum: test.testCount ? Math.min(test.testCount / 10, 3) : 1,
      metadata: {
        testSuite: test.suite,
        coverage: test.coverage
      }
    });
  }
  
  /**
   * Handle build success events
   * @param {Object} build - Build event data
   */
  handleBuildSuccess(build) {
    this.trackSuccess({
      type: 'build_success',
      description: 'Clean build completed successfully',
      significance: 'milestone',
      momentum: 2,
      metadata: {
        duration: build.duration,
        warnings: build.warnings || 0
      }
    });
  }
  
  /**
   * Handle PR creation events
   * @param {Object} pr - Pull request data
   */
  handlePRCreated(pr) {
    this.trackSuccess({
      type: 'pr_created',
      description: 'Pull request created with comprehensive changes',
      significance: 'major_milestone',
      momentum: 3,
      metadata: {
        filesChanged: pr.filesChanged,
        linesAdded: pr.linesAdded,
        title: pr.title
      }
    });
  }
  
  /**
   * Handle feature completion events
   * @param {Object} feature - Feature completion data
   */
  handleFeatureCompletion(feature) {
    this.trackSuccess({
      type: 'feature_completed',
      description: `Feature implementation completed: ${feature.name}`,
      significance: 'major_milestone',
      momentum: 4,
      metadata: {
        complexity: feature.complexity,
        approach: feature.approach,
        duration: feature.duration
      }
    });
  }
  
  /**
   * Handle pattern capture events
   * @param {Object} pattern - Pattern capture data
   */
  handlePatternCapture(pattern) {
    if (pattern.type === 'success') {
      this.trackSuccess({
        type: 'pattern_success',
        description: 'Successful pattern captured for community wisdom',
        significance: 'community_contribution',
        momentum: 2,
        metadata: {
          patternCategory: pattern.pattern.category,
          approach: pattern.pattern.approach
        }
      });
    }
  }
  
  /**
   * Handle standards compliance validation
   * @param {Object} validation - Standards validation data
   */
  handleStandardsCompliance(validation) {
    if (validation.passed) {
      this.trackSuccess({
        type: 'standards_compliance',
        description: 'Project meets all AI development standards',
        significance: 'quality_milestone',
        momentum: 3,
        metadata: {
          score: validation.score,
          compliance: validation.compliance
        }
      });
    }
  }
  
  /**
   * Update momentum tracking
   * @param {Object} success - Success entry
   */
  updateMomentum(success) {
    const now = new Date();
    const lastSuccess = this.momentum.lastSuccess ? new Date(this.momentum.lastSuccess) : null;
    
    // Check if success is within momentum window (24 hours)
    const momentumWindow = 24 * 60 * 60 * 1000; // 24 hours
    const withinWindow = !lastSuccess || (now - lastSuccess) < momentumWindow;
    
    if (withinWindow) {
      this.momentum.currentStreak += success.momentum;
    } else {
      // Reset streak if too much time has passed
      this.momentum.currentStreak = success.momentum;
    }
    
    // Update best streak
    if (this.momentum.currentStreak > this.momentum.bestStreak) {
      this.momentum.bestStreak = this.momentum.currentStreak;
    }
    
    this.momentum.lastSuccess = success.timestamp;
    this.momentum.velocityScore = this.calculateVelocity();
  }
  
  /**
   * Calculate development velocity score
   * @returns {number} Velocity score
   */
  calculateVelocity() {
    const recentSuccesses = this.getRecentSuccesses(7); // Last 7 days
    const totalMomentum = recentSuccesses.reduce((sum, s) => sum + s.momentum, 0);
    
    return Math.round(totalMomentum / 7 * 10) / 10; // Average per day
  }
  
  /**
   * Check for milestone achievements
   * @param {Object} success - Success entry
   */
  checkMilestones(success) {
    switch (success.type) {
      case 'test_success':
        if (!this.milestones.first_test_pass) {
          this.achieveMilestone('first_test_pass', 'First tests passing! 🧪');
        }
        break;
        
      case 'build_success':
        if (!this.milestones.build_success) {
          this.achieveMilestone('build_success', 'Clean build achieved! 🏗️');
        }
        break;
        
      case 'pr_created':
        if (!this.milestones.pr_created) {
          this.achieveMilestone('pr_created', 'Pull request created! 🚀');
        }
        break;
        
      case 'standards_compliance':
        if (!this.milestones.standards_compliance) {
          this.achieveMilestone('standards_compliance', 'Standards compliance achieved! 📏');
        }
        break;
    }
  }
  
  /**
   * Mark milestone as achieved
   * @param {string} milestone - Milestone name
   * @param {string} message - Achievement message
   */
  achieveMilestone(milestone, message) {
    this.milestones[milestone] = true;
    
    this.logger.info(`🎉 MILESTONE ACHIEVED: ${message}`, {
      milestone,
      streak: this.momentum.currentStreak,
      velocity: this.momentum.velocityScore
    });
    
    if (this.eventHub) {
      this.eventHub.emit('milestone:achieved', {
        milestone,
        message,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  /**
   * Celebrate a success
   * @param {Object} success - Success to celebrate
   */
  celebrateSuccess(success) {
    const celebrations = {
      'normal': '✅',
      'milestone': '🎯',
      'major_milestone': '🚀',
      'quality_milestone': '📏',
      'community_contribution': '🤝'
    };
    
    const emoji = celebrations[success.significance] || '✅';
    
    this.logger.info(`${emoji} SUCCESS: ${success.description}`, {
      momentum: this.momentum.currentStreak,
      velocity: this.momentum.velocityScore
    });
  }
  
  /**
   * Get recent successes
   * @param {number} days - Number of days to look back
   * @returns {Array} Recent successes
   */
  getRecentSuccesses(days = 7) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.successes.filter(s => new Date(s.timestamp) > cutoff);
  }
  
  /**
   * Generate unique ID
   * @returns {string} Unique identifier
   */
  generateId() {
    return `success_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get success analytics
   * @returns {Object} Success analytics
   */
  getAnalytics() {
    const recent = this.getRecentSuccesses(7);
    const thisWeek = this.getRecentSuccesses(7).length;
    const lastWeek = this.getRecentSuccesses(14).length - thisWeek;
    
    return {
      totalSuccesses: this.successes.length,
      thisWeek,
      lastWeek,
      growth: lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek * 100).toFixed(1) : 'N/A',
      momentum: this.momentum,
      milestones: Object.keys(this.milestones).filter(m => this.milestones[m]),
      velocity: this.momentum.velocityScore
    };
  }
  
  /**
   * Get current status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      name: this.name,
      analytics: this.getAnalytics(),
      config: this.config
    };
  }
  
  /**
   * Shutdown service
   */
  async shutdown() {
    // Final celebration! 🎉
    this.trackSuccess({
      type: 'system_completion',
      description: 'Success tracking completed - workspace monitoring system delivered!',
      significance: 'major_milestone',
      momentum: 5,
      metadata: {
        totalSuccesses: this.successes.length,
        finalVelocity: this.momentum.velocityScore,
        milestonesAchieved: Object.values(this.milestones).filter(Boolean).length
      }
    });
    
    this.logger.info('🎊 SUCCESS TRACKING COMPLETED!', this.getAnalytics());
    this.removeAllListeners();
  }
}

module.exports = { SuccessTracker };
/**
 * Pattern Logger Service - Community Wisdom Integration
 * 
 * Purpose: Capture development patterns for community wisdom engine
 * Architecture: Service-Interface pattern with privacy-first design
 * Context: Auto-log our own successes and failures (eating our own dog food!)
 */

const { getLogger } = require('../../utils/logger');

/**
 * PatternLogger - Captures development patterns automatically
 * 
 * Integrates with community wisdom engine to:
 * - Log successful implementations
 * - Track failure patterns
 * - Build community knowledge
 * - Follow our own standards!
 */
class PatternLogger {
  constructor(options = {}) {
    this.name = 'pattern-logger';
    this.config = {
      autoCapture: true,
      privacyLevel: 'maximum', // Follow community wisdom standards
      contributeToWisdom: false, // User must opt-in
      captureSuccess: true,
      captureFailures: true,
      ...options
    };
    
    this.logger = getLogger('PatternLogger');
    this.eventHub = null;
    
    this.patterns = {
      successes: [],
      failures: [],
      learnings: []
    };
  }
  
  /**
   * Connect to event hub
   * @param {EventHub} hub - Central event hub
   */
  setEventHub(hub) {
    this.eventHub = hub;
    
    // Listen for development events
    hub.on('project:completed', this.captureSuccess.bind(this));
    hub.on('error:resolved', this.captureResolution.bind(this));
    hub.on('pattern:detected', this.capturePattern.bind(this));
    hub.on('build:success', this.captureBuildSuccess.bind(this));
    hub.on('build:failure', this.captureBuildFailure.bind(this));
  }
  
  /**
   * Initialize pattern logging
   */
  async initialize() {
    this.logger.info('Pattern logging initialized', {
      autoCapture: this.config.autoCapture,
      privacyLevel: this.config.privacyLevel
    });
    
    // Start our own pattern - implementing workspace monitoring!
    this.capturePattern({
      type: 'implementation_start',
      pattern: 'workspace-monitoring-system',
      approach: 'context-optimized-modular-architecture',
      goals: ['fix-context-cutoff', 'mcp-integration', 'follow-standards']
    });
  }
  
  /**
   * Capture successful completion patterns
   * @param {Object} success - Success event data
   */
  captureSuccess(success) {
    if (!this.config.captureSuccess) return;
    
    const pattern = this.anonymizePattern({
      type: 'success',
      category: success.category || 'general',
      approach: success.approach,
      duration: success.duration,
      techniques: success.techniques || [],
      outcome: 'successful_completion',
      lessons: success.lessons || [],
      timestamp: new Date().toISOString()
    });
    
    this.patterns.successes.push(pattern);
    
    this.logger.info('Success pattern captured', {
      category: pattern.category,
      approach: pattern.approach,
      outcome: pattern.outcome
    });
    
    // Emit for potential community contribution
    if (this.eventHub) {
      this.eventHub.emit('pattern:captured', {
        type: 'success',
        pattern,
        eligibleForSharing: this.config.contributeToWisdom
      });
    }
  }
  
  /**
   * Capture failure resolution patterns
   * @param {Object} resolution - Error resolution data
   */
  captureResolution(resolution) {
    if (!this.config.captureFailures) return;
    
    const pattern = this.anonymizePattern({
      type: 'failure_resolution',
      category: resolution.category || 'technical',
      problem: this.sanitizeProblem(resolution.problem),
      solution: this.sanitizeSolution(resolution.solution),
      timeToResolve: resolution.duration,
      approach: resolution.approach,
      outcome: 'resolved',
      lessons: resolution.lessons || [],
      timestamp: new Date().toISOString()
    });
    
    this.patterns.failures.push(pattern);
    
    this.logger.info('Resolution pattern captured', {
      category: pattern.category,
      problem: pattern.problem,
      timeToResolve: pattern.timeToResolve
    });
  }
  
  /**
   * Capture general development patterns
   * @param {Object} patternData - Pattern data
   */
  capturePattern(patternData) {
    const pattern = this.anonymizePattern({
      type: 'pattern',
      category: patternData.category || 'development',
      pattern: patternData.pattern,
      context: patternData.context,
      approach: patternData.approach,
      effectiveness: patternData.effectiveness,
      lessons: patternData.lessons || [],
      timestamp: new Date().toISOString()
    });
    
    this.patterns.learnings.push(pattern);
    
    this.logger.debug('Development pattern captured', {
      pattern: pattern.pattern,
      approach: pattern.approach
    });
  }
  
  /**
   * Capture successful build patterns
   * @param {Object} build - Build success data
   */
  captureBuildSuccess(build) {
    this.captureSuccess({
      category: 'build_system',
      approach: build.approach || 'standard_build',
      duration: build.duration,
      techniques: build.techniques || ['automated_testing', 'ci_cd'],
      lessons: [
        'Build succeeded with current configuration',
        'No context cutoff issues',
        'All tests passed'
      ]
    });
  }
  
  /**
   * Capture build failure patterns for learning
   * @param {Object} failure - Build failure data
   */
  captureBuildFailure(failure) {
    this.captureResolution({
      category: 'build_system',
      problem: this.sanitizeProblem(failure.error),
      solution: 'pending_investigation',
      duration: 0, // Not resolved yet
      approach: failure.attemptedFix || 'investigation_needed',
      lessons: [
        'Build failure requires attention',
        'May indicate configuration issues'
      ]
    });
  }
  
  /**
   * Anonymize pattern data for privacy
   * @param {Object} pattern - Raw pattern data
   * @returns {Object} Anonymized pattern
   */
  anonymizePattern(pattern) {
    // Remove any identifying information
    const anonymized = { ...pattern };
    
    // Remove specific project names, paths, etc.
    if (anonymized.context) {
      anonymized.context = this.sanitizeContext(anonymized.context);
    }
    
    // Ensure no sensitive data in lessons
    if (anonymized.lessons) {
      anonymized.lessons = anonymized.lessons.map(lesson => 
        this.sanitizeLesson(lesson)
      );
    }
    
    return anonymized;
  }
  
  /**
   * Sanitize problem description
   * @param {string} problem - Problem description
   * @returns {string} Sanitized problem
   */
  sanitizeProblem(problem) {
    if (!problem) return 'unknown_problem';
    
    // Remove file paths, URLs, sensitive info
    return problem
      .replace(/\/[^\s]+/g, '[PATH]')
      .replace(/https?:\/\/[^\s]+/g, '[URL]')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
      .substring(0, 200); // Limit length
  }
  
  /**
   * Sanitize solution description
   * @param {string} solution - Solution description
   * @returns {string} Sanitized solution
   */
  sanitizeSolution(solution) {
    if (!solution) return 'solution_pending';
    
    return this.sanitizeProblem(solution); // Same sanitization
  }
  
  /**
   * Sanitize context information
   * @param {string} context - Context information
   * @returns {string} Sanitized context
   */
  sanitizeContext(context) {
    if (!context) return 'general';
    
    // Keep only general technical context
    return context
      .replace(/[a-zA-Z0-9._-]+\.(com|org|net)/g, '[DOMAIN]')
      .replace(/\b[A-Za-z0-9]{8,}\b/g, '[ID]')
      .substring(0, 100);
  }
  
  /**
   * Sanitize lesson learned
   * @param {string} lesson - Lesson text
   * @returns {string} Sanitized lesson
   */
  sanitizeLesson(lesson) {
    if (!lesson) return '';
    
    return this.sanitizeProblem(lesson);
  }
  
  /**
   * Get captured patterns summary
   * @returns {Object} Patterns summary
   */
  getPatternsSummary() {
    return {
      successes: this.patterns.successes.length,
      failures: this.patterns.failures.length,
      learnings: this.patterns.learnings.length,
      lastCapture: this.patterns.successes.length > 0 ? 
        this.patterns.successes[this.patterns.successes.length - 1].timestamp :
        null
    };
  }
  
  /**
   * Export patterns for community wisdom (if user consents)
   * @returns {Object} Exportable patterns
   */
  exportForCommunity() {
    if (!this.config.contributeToWisdom) {
      this.logger.info('Community contribution disabled by user');
      return null;
    }
    
    return {
      successes: this.patterns.successes.filter(p => p.outcome === 'successful_completion'),
      resolutions: this.patterns.failures.filter(p => p.outcome === resolved),
      metadata: {
        totalPatterns: this.patterns.successes.length + this.patterns.failures.length,
        privacyLevel: this.config.privacyLevel,
        contribution: 'voluntary'
      }
    };
  }
  
  /**
   * Get current status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      name: this.name,
      patterns: this.getPatternsSummary(),
      config: {
        autoCapture: this.config.autoCapture,
        privacyLevel: this.config.privacyLevel,
        contributeToWisdom: this.config.contributeToWisdom
      }
    };
  }
  
  /**
   * Shutdown service
   */
  async shutdown() {
    // Log our completion pattern!
    this.captureSuccess({
      category: 'workspace_monitoring',
      approach: 'context-optimized-modular-architecture',
      duration: 'implementation_session',
      techniques: [
        'micro-module-pattern',
        'event-driven-composition',
        'mcp-integration',
        'comprehensive-testing',
        'safety-first-development'
      ],
      lessons: [
        'Context optimization solved cutoff issues',
        'Modular architecture enables AI analysis',
        'Following own standards increases quality',
        'Community wisdom integration valuable'
      ]
    });
    
    this.logger.info('Pattern logging completed', this.getPatternsSummary());
    this.removeAllListeners();
  }
}

module.exports = { PatternLogger };
/**
 * AI Intelligence System Configuration
 * 
 * Purpose: Central configuration for AI industry monitoring
 * Architecture: Environment-driven configuration for flexible deployment
 * Context: Optimized for both learning and production use
 */

const defaultConfig = {
  system: {
    name: 'ai-intelligence-monitor',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  
  // Monitoring intervals
  scanning: {
    arxivIntervalMs: 3600000,      // 1 hour
    githubIntervalMs: 1800000,     // 30 minutes
    industryIntervalMs: 7200000,   // 2 hours
    emergencyIntervalMs: 300000,   // 5 minutes (for urgent updates)
    maxConcurrentScans: 3
  },
  
  // Information sources
  sources: {
    arxiv: {
      enabled: true,
      categories: ['cs.AI', 'cs.CL', 'cs.LG', 'cs.CV'],
      maxResults: 50,
      relevanceThreshold: 0.6
    },
    github: {
      enabled: true,
      languages: ['javascript', 'python', 'typescript'],
      topics: ['ai', 'llm', 'claude', 'openai', 'machine-learning'],
      minStars: 100,
      trendsTimeframe: '7d'
    },
    openai: {
      enabled: true,
      sources: [
        'https://openai.com/blog',
        'https://platform.openai.com/docs',
        'https://help.openai.com/en/articles/6825453-chatgpt-release-notes'
      ]
    },
    anthropic: {
      enabled: true,
      sources: [
        'https://www.anthropic.com/news',
        'https://docs.anthropic.com/claude/docs',
        'https://support.anthropic.com/en/'
      ]
    },
    industry: {
      enabled: true,
      sources: [
        'https://techcrunch.com/category/artificial-intelligence/',
        'https://www.theverge.com/ai-artificial-intelligence',
        'https://venturebeat.com/ai/'
      ]
    }
  },
  
  // Analysis configuration
  analysis: {
    relevanceThreshold: 0.7,      // Minimum relevance to our standards
    impactThreshold: 0.8,         // Minimum impact to trigger action
    urgencyThreshold: 0.9,        // Immediate action threshold
    
    // Keywords that increase relevance
    relevantKeywords: [
      'claude', 'openai', 'gpt', 'llm', 'ai development',
      'api integration', 'mcp', 'context window', 'tokens',
      'prompt engineering', 'ai safety', 'hallucination',
      'multimodal', 'reasoning', 'fine-tuning'
    ],
    
    // Keywords that indicate high impact
    impactKeywords: [
      'breaking', 'major release', 'vulnerability', 'deprecated',
      'new model', 'api changes', 'security', 'performance',
      'best practices', 'breaking changes'
    ]
  },
  
  // Report generation
  reporting: {
    dailyReport: true,
    weeklyDigest: true,
    urgentAlerts: true,
    
    formats: {
      markdown: true,
      json: true,
      html: false
    },
    
    distribution: {
      github: true,        // Create GitHub issues/PRs
      email: false,        // Email notifications (if configured)
      slack: false         // Slack notifications (if configured)
    }
  },
  
  // Automated actions
  automation: {
    autoCreatePRs: false,          // Requires manual approval initially
    autoUpdateDocs: false,         // Requires manual approval initially
    autoGenerateAlerts: true,      // Generate alerts automatically
    autoScoreRelevance: true,      // Automatic relevance scoring
    
    // PR generation rules
    prRules: {
      urgentThreshold: 0.95,       // Auto-create PR if urgency > 95%
      requiresApproval: true,      // All PRs need approval
      assignReviewers: true,       // Auto-assign reviewers
      addLabels: true              // Auto-add relevant labels
    }
  },
  
  // Student learning features
  learning: {
    enableTutorials: true,         // Include learning resources
    explainAnalysis: true,         // Explain how analysis works
    showScoring: true,             // Show relevance/impact scores
    includeExamples: true,         // Include real examples
    
    difficulty: {
      beginner: {
        simplifiedReports: true,
        extraExplanations: true,
        guidedSetup: true
      },
      intermediate: {
        fullReports: true,
        analysisDetails: true,
        customization: true
      },
      advanced: {
        rawData: true,
        algorithmDetails: true,
        extensibility: true
      }
    }
  },
  
  // Rate limiting and safety
  limits: {
    maxRequestsPerHour: 1000,
    maxConcurrentRequests: 10,
    requestTimeoutMs: 30000,
    retryAttempts: 3,
    backoffMs: 1000
  },
  
  // Logging and debugging
  logging: {
    level: 'info',
    enableFileLogging: true,
    enableEventLogging: true,
    enablePerformanceLogging: true
  }
};

/**
 * Get configuration based on environment
 * @param {string} environment - Environment name
 * @returns {Object} Environment-specific configuration
 */
function getEnvironmentConfig(environment = 'development') {
  const configs = {
    development: {
      ...defaultConfig,
      scanning: {
        ...defaultConfig.scanning,
        arxivIntervalMs: 1800000,     // 30 minutes (faster for development)
        githubIntervalMs: 900000      // 15 minutes
      },
      automation: {
        ...defaultConfig.automation,
        autoCreatePRs: false,         // Never auto-create in development
        autoUpdateDocs: false
      },
      learning: {
        ...defaultConfig.learning,
        difficulty: {
          ...defaultConfig.learning.difficulty,
          beginner: {
            ...defaultConfig.learning.difficulty.beginner,
            guidedSetup: true           // Extra guidance in development
          }
        }
      }
    },
    
    production: {
      ...defaultConfig,
      logging: {
        ...defaultConfig.logging,
        level: 'warn'                 // Less verbose in production
      },
      automation: {
        ...defaultConfig.automation,
        autoCreatePRs: true,          // Can auto-create in production
        autoUpdateDocs: true          // Can auto-update in production
      }
    },
    
    student: {
      ...defaultConfig,
      learning: {
        ...defaultConfig.learning,
        enableTutorials: true,
        explainAnalysis: true,
        showScoring: true,
        includeExamples: true
      },
      automation: {
        ...defaultConfig.automation,
        autoCreatePRs: false,         // Students should review manually
        autoUpdateDocs: false
      }
    }
  };
  
  return configs[environment] || configs.development;
}

/**
 * Validate configuration
 * @param {Object} config - Configuration to validate
 * @returns {Object} Validated configuration
 */
function validateConfig(config) {
  // Basic validation
  if (!config.system || !config.system.name) {
    throw new Error('Configuration must include system name');
  }
  
  // Validate thresholds
  const thresholds = ['relevanceThreshold', 'impactThreshold', 'urgencyThreshold'];
  for (const threshold of thresholds) {
    if (config.analysis[threshold] < 0 || config.analysis[threshold] > 1) {
      throw new Error(`${threshold} must be between 0 and 1`);
    }
  }
  
  return config;
}

module.exports = {
  defaultConfig,
  getEnvironmentConfig,
  validateConfig
};
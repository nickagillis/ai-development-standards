/**
 * AI Intelligence System - Main Entry Point
 * 
 * Purpose: Standalone AI industry intelligence for keeping standards current
 * Architecture: Independent system perfect for AI consultancy students
 * Context: Monitor and analyze AI developments automatically
 */

const { AIIntelligenceMonitor } = require('./core/monitor');
const { getEnvironmentConfig } = require('./config/intelligence-config');

/**
 * Create and initialize AI intelligence system
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Initialized intelligence system
 */
async function createAIIntelligence(options = {}) {
  const environment = options.environment || process.env.AI_INTELLIGENCE_ENV || 'development';
  const config = { ...getEnvironmentConfig(environment), ...options };
  
  try {
    const monitor = new AIIntelligenceMonitor(config);
    await monitor.initialize();
    
    return {
      monitor,
      start: () => monitor.start(),
      stop: () => monitor.shutdown(),
      scan: () => monitor.performScan(),
      generateReport: () => monitor.generateReport(),
      getStatus: () => monitor.getStatus(),
      config: monitor.config
    };
    
  } catch (error) {
    throw new Error(`Failed to create AI intelligence system: ${error.message}`);
  }
}

/**
 * Quick start for students - simplified setup
 * @param {string} level - Learning level: 'beginner', 'intermediate', 'advanced'
 * @returns {Promise<Object>} Student-optimized intelligence system
 */
async function quickStartForStudents(level = 'beginner') {
  const studentConfig = {
    environment: 'student',
    learning: {
      enableTutorials: true,
      explainAnalysis: true,
      showScoring: true,
      includeExamples: true,
      difficulty: {
        [level]: {
          enabled: true
        }
      }
    },
    sources: {
      // Start with easier sources for beginners
      arxiv: level !== 'beginner',
      github: true,
      openai: true,
      anthropic: level !== 'beginner',
      industry: level === 'advanced'
    },
    automation: {
      autoCreatePRs: false,          // Students should review manually
      autoUpdateDocs: false,
      autoGenerateAlerts: true,
      autoScoreRelevance: true
    }
  };
  
  const intelligence = await createAIIntelligence(studentConfig);
  
  // Add student-friendly methods
  intelligence.tutorial = () => intelligence.monitor.generateTutorial();
  intelligence.explainLastScan = () => intelligence.monitor.explainLastScan();
  intelligence.practiceAnalysis = (text) => intelligence.monitor.practiceAnalysis(text);
  
  return intelligence;
}

/**
 * Demo the system with sample data
 * @returns {Promise<Object>} Demo results
 */
async function runDemo() {
  console.log('🧠 AI Intelligence System Demo');
  console.log('=====================================');
  
  const intelligence = await createAIIntelligence({
    environment: 'development',
    sources: {
      // Enable only safe demo sources
      github: true,
      openai: false,  // Don't hit real APIs in demo
      anthropic: false,
      industry: false
    }
  });
  
  // Simulate finding a development
  const mockDevelopment = {
    title: 'GPT-4.5 Released with Enhanced Reasoning',
    source: 'OpenAI Blog',
    url: 'https://openai.com/blog/gpt-4-5',
    content: 'OpenAI today released GPT-4.5 with improved reasoning capabilities...',
    timestamp: new Date().toISOString(),
    relevanceScore: 0.95,
    impactScore: 0.88
  };
  
  console.log('📊 Sample Development Detected:');
  console.log(JSON.stringify(mockDevelopment, null, 2));
  
  // Generate sample report
  const report = {
    date: new Date().toISOString(),
    summary: 'High-impact AI development detected',
    developments: [mockDevelopment],
    recommendedActions: [
      'Update OpenAI integration guidelines',
      'Review context handling recommendations',
      'Test new reasoning capabilities'
    ]
  };
  
  console.log('\n📈 Generated Intelligence Report:');
  console.log(JSON.stringify(report, null, 2));
  
  await intelligence.stop();
  
  return report;
}

// Export public API
module.exports = {
  createAIIntelligence,
  quickStartForStudents,
  runDemo
};

// Run demo if called directly
if (require.main === module) {
  runDemo().catch(console.error);
}
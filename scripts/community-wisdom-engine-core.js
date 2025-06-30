#!/usr/bin/env node

/**
 * Community Wisdom Engine - Main Orchestrator
 * Context-optimized entry point (< 100 lines)
 */

const { ProjectAnalyzer } = require('./wisdom-engine/analyzer');
const { PatternDetector } = require('./wisdom-engine/detector');
const { GuidanceGenerator } = require('./wisdom-engine/guidance');
const { WisdomAnonymizer } = require('./wisdom-engine/anonymizer');

class CommunityWisdomEngine {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      participationLevel: config.participationLevel ?? 'observer',
      privacyLevel: config.privacyLevel ?? 'maximum',
      autoSuggest: config.autoSuggest ?? true,
      ...config
    };
    
    this.analyzer = new ProjectAnalyzer();
    this.detector = new PatternDetector();
    this.guidance = new GuidanceGenerator();
    this.anonymizer = new WisdomAnonymizer();
    
    console.log('🧠 Community Wisdom Engine v1.5 (Context-Optimized)');
    console.log(`🛡️ Privacy Level: ${this.config.privacyLevel}`);
    console.log(`👤 Participation: ${this.config.participationLevel}`);
  }

  async analyzeProject(projectPath, userConsent = { allowLocalAnalysis: true }) {
    if (!userConsent.allowLocalAnalysis) {
      return { message: 'Local analysis disabled by user preference' };
    }

    console.log(`\n🔍 Analyzing project: ${projectPath}`);
    
    try {
      // Detect patterns
      const patterns = await this.detector.scanProject(projectPath);
      
      // Analyze for insights  
      const analysis = await this.analyzer.analyzePatterns(patterns);
      
      // Generate guidance
      const guidance = await this.guidance.generateLocalGuidance(analysis);
      
      // Create anonymized version
      const anonymizedPattern = this.anonymizer.anonymize(analysis);
      
      return {
        localAnalysis: analysis,
        guidance: guidance,
        anonymizedPreview: anonymizedPattern,
        contributionSuggestion: this.shouldSuggestContribution(analysis)
      };
      
    } catch (error) {
      console.warn('⚠️ Pattern analysis failed safely:', error.message);
      return { 
        message: 'Analysis unavailable, proceeding normally',
        fallback: this.getBasicGuidance(projectPath)
      };
    }
  }

  shouldSuggestContribution(analysis) {
    const score = this.calculateOverallScore(analysis);
    const hasInterestingPatterns = analysis.dependencies.experimental > 0 || 
                                 analysis.testing.score > 70 ||
                                 analysis.architecture.score > 80 ||
                                 analysis.projectType === 'documentation-framework';
    
    if (hasInterestingPatterns && score > 70) {
      return {
        suggested: true,
        reason: 'Project shows valuable patterns for community learning',
        score: score,
        anonymizedPreview: this.anonymizer.anonymize(analysis)
      };
    }
    
    return { suggested: false };
  }

  calculateOverallScore(analysis) {
    const weights = {
      architecture: 0.25, testing: 0.20, security: 0.20,
      dependencies: 0.15, documentation: 0.10, performance: 0.10
    };
    
    return Math.round(
      analysis.architecture.score * weights.architecture +
      analysis.testing.score * weights.testing +
      analysis.security.score * weights.security +
      analysis.dependencies.score * weights.dependencies +
      analysis.documentation.score * weights.documentation +
      analysis.performance.score * weights.performance
    );
  }

  getBasicGuidance(projectPath) {
    return {
      message: 'Basic project structure detected',
      recommendations: [
        'Ensure clean separation of concerns with organized folder structure',
        'Add comprehensive README.md documentation',
        'Implement proper validation and testing framework',
        'Set up automated quality assurance processes'
      ]
    };
  }
}

// CLI Interface
async function main() {
  const projectPath = process.argv[2] || '.';
  const wisdomEngine = new CommunityWisdomEngine({
    participationLevel: 'contributor',
    privacyLevel: 'maximum',
    autoSuggest: true
  });
  
  const userConsent = {
    allowLocalAnalysis: true,
    shareWithCommunity: false,
    reviewBeforeSharing: true
  };
  
  try {
    const results = await wisdomEngine.analyzeProject(projectPath, userConsent);
    console.log('\n📊 PROJECT ANALYSIS RESULTS');
    console.log('='.repeat(50));
    
    // Output results (delegated to separate module to stay under 100 lines)
    require('./wisdom-engine/reporter').displayResults(results, wisdomEngine);
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

module.exports = { CommunityWisdomEngine };

if (require.main === module) {
  main().catch(console.error);
}
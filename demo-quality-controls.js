// demo-quality-controls.js - See quality filtering in action
// Run with: node demo-quality-controls.js

require('dotenv').config();

const { RealAgentsMonitor } = require('./src/ai-intelligence/sources/real-agents-monitor');
const { ArxivDataSource } = require('./src/ai-intelligence/sources/arxiv-data-source');

/**
 * Quality Control Demo - Show filtering in action
 */
class QualityControlDemo {
  constructor() {
    this.relevanceThreshold = 0.70; // 70% minimum relevance
    this.maxDevelopments = 5;       // Maximum 5 developments shown
    this.impactKeywords = [
      'major release', 'breakthrough', 'performance', 'production',
      'enhanced', 'new features', 'optimization', 'improvement'
    ];
  }
  
  /**
   * Analyze relevance with detailed scoring
   */
  analyzeRelevance(development) {
    const aiKeywords = [
      'agent', 'llm', 'ai', 'machine learning', 'framework',
      'langchain', 'rag', 'vector', 'embedding', 'deployment',
      'inference', 'model', 'autonomous', 'multi-agent'
    ];
    
    const text = `${development.title} ${development.content}`.toLowerCase();
    const matches = aiKeywords.filter(keyword => text.includes(keyword));
    const score = Math.min(matches.length / aiKeywords.length * 1.5, 1);
    
    return {
      score: score,
      matches: matches,
      threshold: this.relevanceThreshold,
      passes: score >= this.relevanceThreshold
    };
  }
  
  /**
   * Assess impact level
   */
  assessImpact(development) {
    const text = `${development.title} ${development.content}`.toLowerCase();
    const impactMatches = this.impactKeywords.filter(keyword => text.includes(keyword));
    
    let level = 'low';
    if (impactMatches.length >= 3) level = 'high';
    else if (impactMatches.length >= 1) level = 'medium';
    
    return {
      level: level,
      indicators: impactMatches,
      score: impactMatches.length / this.impactKeywords.length
    };
  }
  
  /**
   * Generate clean, professional summary
   */
  generateCleanSummary(development) {
    const maxLength = 200;
    let summary = development.content;
    
    // Clean up content
    summary = summary
      .replace(/\s+/g, ' ')          // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, '')  // Remove special chars
      .trim();
    
    // Truncate professionally
    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength);
      const lastSpace = summary.lastIndexOf(' ');
      summary = summary.substring(0, lastSpace) + '...';
    }
    
    return summary;
  }
  
  /**
   * Run quality control demo
   */
  async runDemo() {
    console.log('🧹 AI Development Intelligence - Quality Control Demo');
    console.log('━'.repeat(60));
    console.log(`📊 Relevance threshold: ${this.relevanceThreshold * 100}%`);
    console.log(`📝 Max developments: ${this.maxDevelopments}`);
    console.log(`🎯 Impact keywords: ${this.impactKeywords.length} criteria`);
    console.log('━'.repeat(60));
    console.log('');
    
    try {
      // Get real developments
      console.log('📡 Fetching real AI developments...');
      const monitor = new RealAgentsMonitor({
        github: { apiToken: process.env.GITHUB_TOKEN }
      });
      
      const rawDevelopments = await monitor.scan();
      console.log(`📥 Found ${rawDevelopments.length} raw developments`);
      console.log('');
      
      // Process each development through quality controls
      const qualityResults = [];
      
      console.log('🔍 Quality Control Analysis:');
      console.log('─'.repeat(40));
      
      for (const [index, dev] of rawDevelopments.entries()) {
        console.log(`${index + 1}. ${dev.title}`);
        
        // Relevance check
        const relevance = this.analyzeRelevance(dev);
        console.log(`   📊 Relevance: ${(relevance.score * 100).toFixed(1)}% (${relevance.passes ? '✅ PASS' : '❌ FILTERED'})`);
        console.log(`   🔍 Matches: ${relevance.matches.join(', ')}`);
        
        // Impact assessment
        const impact = this.assessImpact(dev);
        console.log(`   🎯 Impact: ${impact.level.toUpperCase()} (${impact.indicators.join(', ')})`);
        
        // Quality decision
        if (relevance.passes && impact.level !== 'low') {
          const cleanSummary = this.generateCleanSummary(dev);
          qualityResults.push({
            ...dev,
            relevanceScore: relevance.score,
            impactLevel: impact.level,
            cleanSummary: cleanSummary,
            qualityReason: `High relevance (${(relevance.score * 100).toFixed(1)}%) + ${impact.level} impact`
          });
          console.log(`   ✅ APPROVED for documentation`);
        } else {
          console.log(`   ❌ FILTERED OUT (${!relevance.passes ? 'low relevance' : 'low impact'})`);
        }
        
        console.log('');
      }
      
      // Show final results
      console.log('📋 FINAL QUALITY-CONTROLLED RESULTS:');
      console.log('━'.repeat(60));
      console.log(`📥 Raw developments: ${rawDevelopments.length}`);
      console.log(`✅ Approved for docs: ${qualityResults.length}`);
      console.log(`❌ Filtered out: ${rawDevelopments.length - qualityResults.length}`);
      console.log(`📊 Quality rate: ${((qualityResults.length / rawDevelopments.length) * 100).toFixed(1)}%`);
      console.log('');
      
      if (qualityResults.length > 0) {
        console.log('📝 PROFESSIONAL DOCUMENTATION PREVIEW:');
        console.log('━'.repeat(60));
        console.log('## 🔬 Latest AI Developments\\n');
        console.log('*Last updated: ' + new Date().toLocaleDateString() + '*\\n');
        
        qualityResults.slice(0, this.maxDevelopments).forEach((dev, i) => {
          console.log(`### ${dev.title}`);
          console.log(`**Source:** ${dev.source}`);
          console.log(`**Impact:** ${dev.impactLevel} - ${dev.impact_indicators?.join(', ') || 'significant development'}`);
          console.log('');
          console.log(dev.cleanSummary);
          console.log('');
          console.log(`[Learn more](${dev.url})`);
          console.log('');
        });
        
        console.log('✨ RESULT: Clean, professional, high-value AI intelligence!');
      } else {
        console.log('📭 No developments met quality standards - docs stay clean!');
      }
      
    } catch (error) {
      if (error.message.includes('GITHUB_TOKEN')) {
        console.log('❌ Need GitHub token for real data demo');
        console.log('💡 Run: bash scripts/quick-token-setup.sh ghp_your_token');
      } else {
        console.log('❌ Demo error:', error.message);
      }
    }
  }
}

// Check for token
if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === 'your_github_token_here') {
  console.log('🔑 GitHub Token Required for Live Demo');
  console.log('━'.repeat(40));
  console.log('Get token: https://github.com/settings/tokens');
  console.log('Setup: bash scripts/quick-token-setup.sh ghp_your_token');
  console.log('');
  console.log('💡 This demo shows real quality filtering with live AI data');
  process.exit(1);
}

// Run the demo
const demo = new QualityControlDemo();
demo.runDemo().catch(console.error);
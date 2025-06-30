// continuous-ai-monitoring.js - 24/7 Real AI Development Monitoring
// Production entry point for continuous AI intelligence
// Run with: npm run monitor-ai or npm run start-intelligence

require('dotenv').config(); // Load environment variables

const { RealAgentsMonitor } = require('./src/ai-intelligence/sources/real-agents-monitor');
const { ArxivDataSource } = require('./src/ai-intelligence/sources/arxiv-data-source');
const { DocumentUpdater } = require('./src/ai-intelligence/automation/document-updater');

/**
 * Production AI Intelligence System
 * Continuously monitors AI developments and updates documentation
 */
class ProductionAIIntelligence {
  constructor() {
    this.config = {
      checkInterval: parseInt(process.env.AI_INTELLIGENCE_CHECK_INTERVAL) || (30 * 60 * 1000), // 30 minutes
      autoUpdateDocs: process.env.AI_INTELLIGENCE_AUTO_UPDATE_DOCS === 'true',
      maxRetries: 3,
      repositories: [
        'langchain-ai/langchain',      // AI agent framework
        'Significant-Gravitas/AutoGPT', // Autonomous AI
        'joaomdmoura/crewAI',          // Multi-agent systems  
        'microsoft/semantic-kernel',    // Microsoft AI framework
        'run-llama/llama_index',       // RAG/document processing
        'chroma-core/chroma',          // Vector database
        'weaviate/weaviate',           // Vector search
        'continuedev/continue',        // AI coding assistant
        'ollama/ollama',               // Local LLM deployment
        'vllm-project/vllm'            // High-performance inference
      ]
    };
    
    this.isRunning = false;
    this.updateCount = 0;
    this.lastUpdate = null;
    this.startTime = null;
    
    // Initialize monitors
    this.agentsMonitor = new RealAgentsMonitor({
      github: { apiToken: process.env.GITHUB_TOKEN }
    });
    
    this.arxivSource = new ArxivDataSource();
    this.documentUpdater = new DocumentUpdater({
      autoCommit: this.config.autoUpdateDocs
    });
  }
  
  /**
   * Start continuous monitoring
   */
  async start() {
    if (this.isRunning) {
      console.log('⚠️  Monitoring already running');
      return;
    }
    
    this.startTime = new Date();
    
    console.log('🚀 Starting Production AI Intelligence System');
    console.log('━'.repeat(60));
    console.log(`📡 Monitoring: ${this.config.repositories.length} repositories`);
    console.log(`⏰ Check interval: ${this.config.checkInterval / 60000} minutes`);
    console.log(`📝 Auto-update docs: ${this.config.autoUpdateDocs ? 'Enabled' : 'Disabled'}`);
    console.log(`🔑 GitHub API: ${process.env.GITHUB_TOKEN ? 'Configured' : 'Missing'}`);
    console.log('━'.repeat(60));
    
    // Verify configuration
    if (!process.env.GITHUB_TOKEN) {
      console.error('❌ GITHUB_TOKEN not configured');
      console.log('💡 Add your GitHub token to .env file');
      return;
    }
    
    this.isRunning = true;
    
    // Run initial scan
    console.log('🔍 Running initial scan...\n');
    await this.performMonitoringCycle();
    
    // Schedule periodic checks
    this.scheduleNextCheck();
    
    console.log('\n✅ Continuous monitoring active!');
    console.log('💡 Press Ctrl+C to stop gracefully\n');
  }
  
  /**
   * Schedule next monitoring check
   */
  scheduleNextCheck() {
    if (!this.isRunning) return;
    
    setTimeout(async () => {
      try {
        await this.performMonitoringCycle();
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error.message);
      }
      
      // Schedule next check
      this.scheduleNextCheck();
    }, this.config.checkInterval);
  }
  
  /**
   * Perform one complete monitoring cycle
   */
  async performMonitoringCycle() {
    const cycleStart = Date.now();
    const timestamp = new Date().toLocaleTimeString();
    
    console.log(`🔄 [${timestamp}] Monitoring Cycle #${this.updateCount + 1}`);
    console.log('─'.repeat(50));
    
    const allDevelopments = [];
    
    try {
      // 1. Scan AI Agents (GitHub)
      console.log('  🤖 Scanning AI agent repositories...');
      const agentDevelopments = await this.agentsMonitor.scan();
      allDevelopments.push(...agentDevelopments);
      
      if (agentDevelopments.length > 0) {
        console.log(`    ✅ Found ${agentDevelopments.length} agent developments`);
        agentDevelopments.slice(0, 2).forEach(dev => {
          console.log(`       - ${dev.title}`);
        });
      } else {
        console.log('    📭 No new agent developments');
      }
      
      // 2. Scan Research Papers (arXiv)
      console.log('  📑 Scanning latest AI research...');
      try {
        const papers = await this.arxivSource.getLatestPapers({
          searchQuery: 'agent OR rag OR "large language model"',
          maxResults: 10
        });
        
        // Filter for high relevance
        const relevantPapers = papers.filter(paper => 
          this.arxivSource.analyzeRelevance(paper) > 0.6
        );
        
        if (relevantPapers.length > 0) {
          console.log(`    ✅ Found ${relevantPapers.length} relevant research papers`);
          // Convert to development format
          relevantPapers.forEach(paper => {
            allDevelopments.push({
              id: paper.id,
              title: `Research: ${paper.title.substring(0, 60)}...`,
              source: 'arXiv',
              url: paper.url,
              content: paper.content.substring(0, 300) + '...',
              category: 'research_paper',
              timestamp: paper.publishedAt,
              tags: ['research', 'arxiv', ...paper.categories],
              impact_indicators: ['peer-reviewed', 'latest-research']
            });
          });
        } else {
          console.log('    📭 No highly relevant papers found');
        }
      } catch (arxivError) {
        console.log('    ⚠️  arXiv temporarily unavailable');
      }
      
      // 3. Update Documents (if developments found)
      if (allDevelopments.length > 0) {
        console.log(`  📝 Updating documents with ${allDevelopments.length} developments...`);
        
        const updateResults = await this.documentUpdater.updateDocuments(allDevelopments);
        
        if (updateResults.changesDetected) {
          this.updateCount++;
          this.lastUpdate = new Date().toISOString();
          
          console.log('    ✅ Documents updated:');
          updateResults.updated.forEach(doc => {
            const changes = doc.changes;
            console.log(`       - ${doc.path} (+${changes.linesAdded} lines)`);
          });
          
          if (this.config.autoUpdateDocs) {
            console.log('    🔄 Changes committed automatically');
          } else {
            console.log('    💡 Review changes manually and commit');
          }
        } else {
          console.log('    📄 No document updates needed');
        }
      } else {
        console.log('  📭 No new developments - documents current');
      }
      
      // 4. Cycle Summary
      const duration = Date.now() - cycleStart;
      console.log(`  ⏱️  Cycle completed in ${duration}ms`);
      console.log(`  📊 Total updates: ${this.updateCount}`);
      
      const nextCheck = new Date(Date.now() + this.config.checkInterval);
      console.log(`  ⏭️  Next check: ${nextCheck.toLocaleTimeString()}\n`);
      
    } catch (error) {
      console.error('  ❌ Cycle error:', error.message);
      console.log('  🔄 Will retry on next cycle\n');
    }
  }
  
  /**
   * Stop monitoring
   */
  stop() {
    console.log('\n🛑 Stopping AI intelligence monitoring...');
    this.isRunning = false;
    
    if (this.updateCount > 0) {
      const runtime = Math.floor((Date.now() - this.startTime) / 1000 / 60);
      console.log(`📊 Session summary: ${this.updateCount} updates in ${runtime} minutes`);
    }
    
    console.log('✅ Monitoring stopped gracefully');
  }
  
  /**
   * Get current status
   */
  getStatus() {
    const runtime = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000 / 60) : 0;
    
    return {
      isRunning: this.isRunning,
      updateCount: this.updateCount,
      lastUpdate: this.lastUpdate,
      runtime: `${runtime} minutes`,
      repositoriesMonitored: this.config.repositories.length,
      nextCheck: this.isRunning ? new Date(Date.now() + this.config.checkInterval).toLocaleTimeString() : null
    };
  }
}

// Production startup
async function startProduction() {
  const intelligence = new ProductionAIIntelligence();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    intelligence.stop();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    intelligence.stop();
    process.exit(0);
  });
  
  // Start monitoring
  await intelligence.start();
  
  // Status reporting every 10 minutes
  if (intelligence.isRunning) {
    setInterval(() => {
      const status = intelligence.getStatus();
      console.log(`📊 Status: ${status.updateCount} updates, running ${status.runtime}`);
    }, 10 * 60 * 1000);
  }
}

// Auto-start if run directly
if (require.main === module) {
  console.log('🧠 AI Intelligence System - Production Mode');
  startProduction().catch(error => {
    console.error('💥 Startup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { ProductionAIIntelligence };
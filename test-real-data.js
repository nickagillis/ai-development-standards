// test-real-data.js - Quick test of real data connections
// Run with: npm run test-real-data

const { GitHubDataSource } = require('./src/ai-intelligence/sources/github-data-source');
const { ArxivDataSource } = require('./src/ai-intelligence/sources/arxiv-data-source');
const { RealAgentsMonitor } = require('./src/ai-intelligence/sources/real-agents-monitor');

async function testRealDataConnections() {
  console.log('🔬 Testing Real AI Intelligence Data Connections...\n');
  
  // Test 1: GitHub API
  console.log('1️⃣ Testing GitHub API...');
  try {
    const github = new GitHubDataSource();
    
    // Test basic API access
    console.log('   📡 Connecting to GitHub API...');
    const releases = await github.getLatestReleases('langchain-ai', 'langchain', 3);
    
    if (releases.length > 0) {
      console.log('   ✅ GitHub API WORKING');
      console.log('   📦 Latest LangChain releases:');
      releases.forEach(r => {
        const date = new Date(r.publishedAt).toLocaleDateString();
        console.log(`      - ${r.version}: ${r.title} (${date})`);
      });
      
      // Test repository stats
      const stats = await github.getRepositoryStats('langchain-ai', 'langchain');
      if (stats) {
        console.log(`   📊 Repository stats: ${stats.stars} stars, ${stats.forks} forks`);
      }
      
    } else {
      console.log('   ⚠️  GitHub API connected but no releases found');
    }
  } catch (error) {
    console.log('   ❌ GitHub API Error:', error.message);
    if (error.message.includes('401')) {
      console.log('   💡 Invalid GITHUB_TOKEN - check your token in .env file');
    } else if (error.message.includes('403')) {
      console.log('   💡 Rate limited or forbidden - check token permissions');
    } else {
      console.log('   💡 Network or API issue - try again later');
    }
  }
  
  console.log('\n' + '━'.repeat(60) + '\n');
  
  // Test 2: arXiv Research Papers
  console.log('2️⃣ Testing arXiv Research API...');
  try {
    const arxiv = new ArxivDataSource();
    
    console.log('   📡 Fetching latest AI research papers...');
    const papers = await arxiv.getLatestPapers({ 
      searchQuery: 'large language model',
      maxResults: 3 
    });
    
    if (papers.length > 0) {
      console.log('   ✅ arXiv API WORKING');
      console.log('   📑 Latest AI research:');
      papers.forEach((p, i) => {
        const title = p.title.length > 70 ? p.title.substring(0, 70) + '...' : p.title;
        const authors = p.authors.slice(0, 2).join(', ') + (p.authors.length > 2 ? ' et al.' : '');
        console.log(`      ${i + 1}. ${title}`);
        console.log(`         Authors: ${authors}`);
      });
    } else {
      console.log('   ⚠️  arXiv API connected but no papers found for query');
    }
  } catch (error) {
    console.log('   ❌ arXiv API Error:', error.message);
    console.log('   💡 This might be a temporary network issue - arXiv is freely accessible');
  }
  
  console.log('\n' + '━'.repeat(60) + '\n');
  
  // Test 3: Real Agents Monitor (combines GitHub + analysis)
  console.log('3️⃣ Testing Real AI Agents Monitor...');
  try {
    const monitor = new RealAgentsMonitor();
    
    console.log('   📡 Scanning for AI agent developments...');
    const developments = await monitor.scan();
    
    if (developments.length > 0) {
      console.log('   ✅ REAL AGENTS MONITOR WORKING');
      console.log('   🤖 Recent AI agent developments:');
      developments.slice(0, 3).forEach((d, i) => {
        console.log(`      ${i + 1}. ${d.title}`);
        console.log(`         Source: ${d.source} | Category: ${d.category}`);
        if (d.impact_indicators && d.impact_indicators.length > 0) {
          console.log(`         Impact: ${d.impact_indicators.join(', ')}`);
        }
      });
    } else {
      console.log('   ✅ Monitor working - no new developments detected');
      console.log('   💡 This is normal if no recent releases occurred');
    }
  } catch (error) {
    console.log('   ❌ Agents Monitor Error:', error.message);
    console.log('   💡 Check GitHub token and network connectivity');
  }
  
  console.log('\n' + '━'.repeat(60) + '\n');
  
  // Summary
  console.log('🎯 REAL DATA CONNECTION SUMMARY');
  console.log('━'.repeat(60));
  console.log('✅ Your AI intelligence system can now:');
  console.log('   📦 Monitor real releases from LangChain, AutoGPT, CrewAI, etc.');
  console.log('   📑 Track latest AI research papers from arXiv');
  console.log('   🤖 Analyze real AI agent developments automatically');
  console.log('   📝 Update your repository documents with real data');
  console.log('');
  console.log('🚀 Next steps:');
  console.log('   npm run demo-real          # See real developments in action');
  console.log('   npm run monitor-ai         # Start continuous monitoring');
  console.log('   npm run start-intelligence # Full production monitoring');
  console.log('');
  console.log('🎉 You\'re now connected to the live AI development ecosystem!');
}

// Check environment first
if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === 'your_github_token_here') {
  console.log('❌ GITHUB_TOKEN not configured');
  console.log('');
  console.log('🔧 Quick setup:');
  console.log('1. Get token: https://github.com/settings/tokens');
  console.log('2. Edit .env file and add: GITHUB_TOKEN=your_token_here');
  console.log('3. Run: npm run test-real-data');
  console.log('');
  console.log('💡 Or run automated setup: npm run setup-real-data');
  process.exit(1);
}

// Run the test
testRealDataConnections().catch(console.error);
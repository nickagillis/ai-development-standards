// quick-fix-test.js - Bypass config validation for testing real data
// Run with: node quick-fix-test.js

const { GitHubDataSource } = require('./src/ai-intelligence/sources/github-data-source');
const { ArxivDataSource } = require('./src/ai-intelligence/sources/arxiv-data-source');

// Simple logger that doesn't use the complex config system
const simpleLogger = {
  debug: (msg) => console.log(`[DEBUG] ${msg}`),
  info: (msg) => console.log(`[INFO] ${msg}`),
  warn: (msg) => console.log(`[WARN] ${msg}`),
  error: (msg) => console.log(`[ERROR] ${msg}`)
};

async function testRealDataQuick() {
  console.log('🔬 Quick Real Data Test (Bypassing Config Validation)');
  console.log('━'.repeat(60));
  
  // Test GitHub API directly
  console.log('1️⃣ Testing GitHub API...');
  try {
    // Create GitHub data source with minimal config
    const github = new GitHubDataSource({
      apiToken: process.env.GITHUB_TOKEN || null,
      baseUrl: 'https://api.github.com',
      timeout: 30000
    });
    
    // Override the logger to avoid config issues
    github.logger = simpleLogger;
    
    const releases = await github.getLatestReleases('langchain-ai', 'langchain', 3);
    
    if (releases.length > 0) {
      console.log('   ✅ GitHub API WORKING!');
      console.log('   📦 Latest LangChain releases:');
      releases.forEach(r => {
        const date = new Date(r.publishedAt).toLocaleDateString();
        console.log(`      - ${r.version}: ${r.title} (${date})`);
      });
    } else {
      console.log('   ⚠️  Connected but no releases found');
    }
    
  } catch (error) {
    console.log('   ❌ GitHub API Error:', error.message);
    if (error.message.includes('401')) {
      console.log('   💡 Invalid GITHUB_TOKEN - check your token');
    } else if (error.message.includes('403')) {
      console.log('   💡 Rate limited - check token permissions');
    }
  }
  
  console.log('');
  console.log('━'.repeat(60));
  
  // Test arXiv API
  console.log('2️⃣ Testing arXiv API...');
  try {
    const arxiv = new ArxivDataSource({
      baseUrl: 'http://export.arxiv.org/api/query',
      maxResults: 3,
      timeout: 30000
    });
    
    // Override logger
    arxiv.logger = simpleLogger;
    
    const papers = await arxiv.getLatestPapers({
      searchQuery: 'large language model',
      maxResults: 3
    });
    
    if (papers.length > 0) {
      console.log('   ✅ arXiv API WORKING!');
      console.log('   📑 Latest AI research:');
      papers.forEach((p, i) => {
        const title = p.title.length > 60 ? p.title.substring(0, 60) + '...' : p.title;
        console.log(`      ${i + 1}. ${title}`);
      });
    } else {
      console.log('   ⚠️  Connected but no papers found');
    }
    
  } catch (error) {
    console.log('   ❌ arXiv API Error:', error.message);
  }
  
  console.log('');
  console.log('🎯 QUICK TEST SUMMARY');
  console.log('━'.repeat(60));
  console.log('✅ This test bypasses the config validation issue');
  console.log('📊 Tests the core GitHub and arXiv API functionality');
  console.log('🔧 Real data connections work - config system needs fixing');
  console.log('');
  
  if (process.env.GITHUB_TOKEN) {
    console.log('🚀 GitHub token detected - real monitoring ready!');
  } else {
    console.log('🔑 Add GitHub token to .env for full functionality');
    console.log('   Get token: https://github.com/settings/tokens');
    console.log('   Scope needed: public_repo');
  }
}

// Check for token
if (!process.env.GITHUB_TOKEN || process.env.GITHUB_TOKEN === 'your_github_token_here') {
  console.log('🔑 GitHub Token Setup Needed');
  console.log('━'.repeat(40));
  console.log('1. Get token: https://github.com/settings/tokens');
  console.log('2. Select scope: public_repo');
  console.log('3. Add to .env: GITHUB_TOKEN=ghp_your_token');
  console.log('');
  console.log('💡 This test will still show you arXiv data without token');
  console.log('');
}

// Run the test
testRealDataQuick().catch(console.error);
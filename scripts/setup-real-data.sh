#!/bin/bash
# setup-real-data.sh - Quick setup for real AI intelligence monitoring

echo "🚀 Setting up Real AI Intelligence Monitoring..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Check for GitHub token
if ! grep -q "GITHUB_TOKEN=" .env || grep -q "GITHUB_TOKEN=your_github_token_here" .env; then
    echo ""
    echo "🔑 GITHUB TOKEN SETUP REQUIRED"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "1. Go to: https://github.com/settings/tokens"
    echo "2. Click 'Generate new token (classic)'"
    echo "3. Select 'repo' scope"
    echo "4. Copy the token"
    echo "5. Edit .env file and replace 'your_github_token_here' with your token"
    echo ""
    echo "❌ Cannot proceed without GitHub token"
    echo "💡 After adding token, run: npm run test-real-data"
    exit 1
fi

echo "✅ GitHub token found in .env"

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Test real data connections
echo ""
echo "🔬 Testing real data connections..."
node -e "
const { GitHubDataSource } = require('./src/ai-intelligence/sources/github-data-source');
const github = new GitHubDataSource();

console.log('Testing GitHub API...');
github.getLatestReleases('langchain-ai', 'langchain', 2)
  .then(releases => {
    if (releases.length > 0) {
      console.log('✅ REAL DATA CONNECTED!');
      console.log('Latest LangChain releases:');
      releases.forEach(r => console.log(\`  - \${r.title} (\${r.publishedAt})\`));
      
      console.log('');
      console.log('🎉 SUCCESS! Your AI intelligence system is now connected to real data');
      console.log('');
      console.log('🚀 Quick commands:');
      console.log('  npm run test-real-data     # Test all data sources');
      console.log('  npm run monitor-ai         # Start continuous monitoring');
      console.log('  npm run demo-real         # See real developments');
      console.log('');
      console.log('📊 Your repository will now automatically update with real AI developments!');
    } else {
      console.log('⚠️  Connected but no releases found');
    }
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    console.log('💡 Check your GITHUB_TOKEN in .env file');
    process.exit(1);
  });
"

echo ""
echo "✅ Real data setup complete!"
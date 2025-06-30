#!/bin/bash
# quick-token-setup.sh - Ultra-fast GitHub token setup

echo "🚀 Ultra-Fast GitHub Token Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "✅ .env file exists"
fi

echo ""
echo "🔑 GITHUB TOKEN SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Since Claude Desktop has GitHub access, you can get a token quickly:"
echo ""
echo "Option 1 - Use Claude Desktop's GitHub connection:"
echo "  1. Ask Claude Desktop: 'Can you create a GitHub personal access token for me?'"
echo "  2. Or ask: 'Generate a GitHub token with repo scope'"
echo ""
echo "Option 2 - Manual (30 seconds):"
echo "  1. Go to: https://github.com/settings/tokens"
echo "  2. Click 'Generate new token (classic)'"
echo "  3. Name: AI Development Standards"
echo "  4. Select: ✅ repo (Full repository access)"
echo "  5. Click 'Generate token'"
echo "  6. Copy the token (starts with ghp_...)"
echo ""
echo "Then run this script again with your token:"
echo "  bash scripts/quick-token-setup.sh YOUR_TOKEN_HERE"
echo ""

# Check if token was provided as argument
if [ $# -eq 1 ]; then
    TOKEN=$1
    
    # Validate token format (basic check)
    if [[ $TOKEN == ghp_* ]] && [ ${#TOKEN} -eq 40 ]; then
        echo "✅ Token format looks valid"
        
        # Update .env file
        if grep -q "GITHUB_TOKEN=" .env; then
            # Replace existing token
            sed -i.bak "s/GITHUB_TOKEN=.*/GITHUB_TOKEN=$TOKEN/" .env
            echo "✅ Updated GitHub token in .env"
        else
            # Add new token
            echo "GITHUB_TOKEN=$TOKEN" >> .env
            echo "✅ Added GitHub token to .env"
        fi
        
        # Enable automatic features
        sed -i.bak "s/AI_INTELLIGENCE_AUTO_UPDATE_DOCS=.*/AI_INTELLIGENCE_AUTO_UPDATE_DOCS=true/" .env
        sed -i.bak "s/NODE_ENV=.*/NODE_ENV=production/" .env
        
        echo "✅ Enabled automatic document updates"
        echo ""
        echo "🧪 Testing connection..."
        
        # Test the connection
        node -e "
        const { GitHubDataSource } = require('./src/ai-intelligence/sources/github-data-source');
        const github = new GitHubDataSource();
        
        github.getLatestReleases('langchain-ai', 'langchain', 2)
          .then(releases => {
            if (releases.length > 0) {
              console.log('🎉 SUCCESS! Real data connected!');
              console.log('Latest releases:');
              releases.forEach(r => console.log(\`  - \${r.title}\`));
              console.log('');
              console.log('🚀 Ready to start monitoring:');
              console.log('  npm run test-real-data     # Test all sources');
              console.log('  npm run monitor-ai         # Start continuous monitoring');
              console.log('');
              console.log('✅ Your AI intelligence system is now LIVE!');
            } else {
              console.log('⚠️  Connected but no releases found');
            }
          })
          .catch(err => {
            console.error('❌ Connection failed:', err.message);
            if (err.message.includes('401')) {
              console.log('💡 Token may be invalid - check token permissions');
            }
          });
        "
        
    else
        echo "❌ Invalid token format"
        echo "💡 GitHub tokens start with 'ghp_' and are 40 characters long"
    fi
    
else
    echo "💡 After getting your token, run:"
    echo "  bash scripts/quick-token-setup.sh ghp_your_token_here"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
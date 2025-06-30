#!/bin/bash
# AI Integration Prompts Update Script
# Updates prompts when Community Wisdom Engine discovers improvements

set -e

PROMPTS_FILE="docs/ai-integration-prompts.md"
CURRENT_VERSION=$(grep "Version.*:" "$PROMPTS_FILE" | grep -o "v[0-9]\+\.[0-9]\+")
WISDOM_PATTERNS="community-patterns.json"

echo "🧠 Checking for Community Wisdom improvements..."

# Check if community wisdom has new patterns
if npm run community-wisdom --silent > /dev/null 2>&1; then
    echo "✅ Community Wisdom Engine available"
    
    # Analyze patterns for prompt improvements
    if node -e "
        const fs = require('fs');
        const patterns = JSON.parse(fs.readFileSync('$WISDOM_PATTERNS', 'utf8') || '[]');
        const promptImprovements = patterns.filter(p => p.category === 'prompt-enhancement');
        if (promptImprovements.length > 0) {
            console.log('📈 Found', promptImprovements.length, 'prompt improvements');
            process.exit(1); // Indicates updates available
        }
    " 2>/dev/null; then
        echo "ℹ️ No prompt improvements found"
    else
        echo "🎯 Prompt improvements discovered!"
        echo "📝 Community patterns suggest enhancements to AI integration prompts"
        echo ""
        echo "📋 Suggested improvements:"
        node -e "
            const fs = require('fs');
            const patterns = JSON.parse(fs.readFileSync('$WISDOM_PATTERNS', 'utf8') || '[]');
            const improvements = patterns.filter(p => p.category === 'prompt-enhancement');
            improvements.forEach((imp, i) => {
                console.log(\`   \${i+1}. \${imp.pattern}\`);
                console.log(\`      Context: \${imp.context}\`);
                console.log(\`      Outcome: \${imp.outcome}\`);
                console.log('');
            });
        " 2>/dev/null || echo "   (Error reading patterns - file may not exist yet)"
        
        echo "🔧 To apply improvements:"
        echo "   1. Review patterns in $WISDOM_PATTERNS"
        echo "   2. Update $PROMPTS_FILE with improvements"
        echo "   3. Increment version number"
        echo "   4. Commit changes with 'feat: prompt improvements from community wisdom'"
        echo ""
        echo "💡 Or run: npm run apply-prompt-improvements"
    fi
else
    echo "⚠️ Community Wisdom Engine not available"
    echo "💡 Install: npm install && npm run setup"
fi

echo ""
echo "📊 Current prompt version: $CURRENT_VERSION"
echo "📚 Documentation: $PROMPTS_FILE"
echo "🔄 Check complete!"

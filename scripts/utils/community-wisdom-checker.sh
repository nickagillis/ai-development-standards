#!/bin/bash
# Community Wisdom Pattern Checking

WISDOM_PATTERNS="community-patterns.json"

check_community_wisdom_patterns() {
    echo ""
    echo "🧠 Checking Community Wisdom Engine for improvements..."
    
    if [ -f "$WISDOM_PATTERNS" ]; then
        echo "📊 Found community patterns file: $WISDOM_PATTERNS"
        check_prompt_improvements
    elif npm run community-wisdom --silent >/dev/null 2>&1; then
        echo "🔧 Community Wisdom Engine available but no patterns file yet"
        echo "💡 Generate patterns: npm run community-wisdom"
    else
        echo "⚠️  Community Wisdom Engine not available"
        echo "💡 Setup: npm install && npm run setup"
    fi
}

check_prompt_improvements() {
    PROMPT_IMPROVEMENTS=$(cat "$WISDOM_PATTERNS" 2>/dev/null | grep -c '"category":"prompt-enhancement"' || echo "0")
    if [ "$PROMPT_IMPROVEMENTS" -gt 0 ]; then
        echo "📈 Found $PROMPT_IMPROVEMENTS prompt improvement patterns!"
        echo ""
        echo "🎯 Community-suggested improvements:"
        
        if command -v jq >/dev/null 2>&1; then
            cat "$WISDOM_PATTERNS" | jq -r '.[] | select(.category=="prompt-enhancement") | "   • \(.pattern): \(.outcome)"' 2>/dev/null || echo "   (Install jq for detailed pattern display)"
        else
            echo "   • Multiple improvements available (install jq for details)"
        fi
        
        echo ""
        echo "🔧 To apply community improvements:"
        echo "   1. Review patterns: cat $WISDOM_PATTERNS | jq '.[] | select(.category==\"prompt-enhancement\")'"
        echo "   2. Update prompts based on successful patterns"
        echo "   3. Test with: npm run validate-context && npm run validate"
        UPDATES_AVAILABLE=true
        export UPDATES_AVAILABLE
    else
        echo "✅ No new community prompt improvements at this time"
    fi
}
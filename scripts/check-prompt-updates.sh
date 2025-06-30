#!/bin/bash
# AI Integration Prompts Update Checker v1.0
# Checks for prompt improvements from community wisdom and upstream changes

set -e

PROMPTS_FILE="docs/ai-integration-prompts.md"
CHANGELOG_FILE="docs/prompt-changelog.md"
WISDOM_PATTERNS="community-patterns.json"

echo "🧠 AI Integration Prompts Update Checker v1.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check current prompt version
if [ -f "$PROMPTS_FILE" ]; then
    CURRENT_VERSION=$(grep "# AI Development Standards Integration v" "$PROMPTS_FILE" | head -1 | grep -o "v[0-9]\+\.[0-9]\+" || echo "v1.0")
    echo "📋 Current prompt version: $CURRENT_VERSION"
else
    echo "⚠️  Prompts file not found: $PROMPTS_FILE"
    echo "💡 Run: npm install && npm run setup"
    exit 1
fi

# Check if we're in a git repository
if [ -d ".git" ]; then
    echo "📁 Repository detected: Checking for upstream updates..."
    
    # Check for upstream remote (for fork users)
    if git remote | grep -q "upstream"; then
        echo "🍴 Fork detected: Checking upstream for prompt improvements..."
        git fetch upstream --quiet 2>/dev/null || echo "⚠️  Could not fetch upstream (network issue?)"
        
        # Check if upstream has prompt updates
        UPSTREAM_CHANGES=$(git diff HEAD upstream/main --name-only 2>/dev/null | grep -c "$PROMPTS_FILE\|$CHANGELOG_FILE" || echo "0")
        if [ "$UPSTREAM_CHANGES" -gt 0 ]; then
            echo "🚀 Upstream prompt improvements detected!"
            echo "📝 Files updated upstream:"
            git diff HEAD upstream/main --name-only 2>/dev/null | grep "$PROMPTS_FILE\|$CHANGELOG_FILE" | sed 's/^/     - /'
            echo ""
            echo "🔧 To review and apply:"
            echo "   git diff upstream/main -- $PROMPTS_FILE"
            echo "   git diff upstream/main -- $CHANGELOG_FILE"
            echo ""
            echo "💡 Selective merge (preserves customizations):"
            echo "   git checkout -b update-prompts-$(date +%Y%m%d)"
            echo "   git checkout upstream/main -- $PROMPTS_FILE $CHANGELOG_FILE"
            echo "   # Review changes, test, then merge"
            UPDATES_AVAILABLE=true
        else
            echo "✅ Your prompts are current with upstream"
        fi
    else
        echo "📖 Reference usage detected: Checking for latest releases..."
        
        # Check GitHub releases for latest version (requires curl/internet)
        if command -v curl >/dev/null 2>&1; then
            LATEST_RELEASE=$(curl -s "https://api.github.com/repos/nickagillis/ai-development-standards/releases/latest" 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4 || echo "unknown")
            if [ "$LATEST_RELEASE" != "unknown" ] && [ "$LATEST_RELEASE" != "$CURRENT_VERSION" ]; then
                echo "🚀 New prompt version available: $LATEST_RELEASE"
                echo "📋 Current version: $CURRENT_VERSION"
                echo "📝 Release notes: https://github.com/nickagillis/ai-development-standards/releases/latest"
                echo ""
                echo "🔧 To update:"
                echo "   1. Visit: https://github.com/nickagillis/ai-development-standards/blob/main/$PROMPTS_FILE"
                echo "   2. Review changes in: https://github.com/nickagillis/ai-development-standards/blob/main/$CHANGELOG_FILE"
                echo "   3. Copy updated prompt to your AI assistant"
                UPDATES_AVAILABLE=true
            else
                echo "✅ You have the latest prompt version: $CURRENT_VERSION"
            fi
        else
            echo "⚠️  curl not available - cannot check for updates"
            echo "💡 Manual check: https://github.com/nickagillis/ai-development-standards/releases"
        fi
    fi
else
    echo "📖 Not in git repository: Checking for community wisdom improvements..."
fi

echo ""

# Check for community wisdom patterns
echo "🧠 Checking Community Wisdom Engine for improvements..."
if [ -f "$WISDOM_PATTERNS" ]; then
    echo "📊 Found community patterns file: $WISDOM_PATTERNS"
    
    # Check for prompt-related improvements
    PROMPT_IMPROVEMENTS=$(cat "$WISDOM_PATTERNS" 2>/dev/null | grep -c '"category":"prompt-enhancement"' || echo "0")
    if [ "$PROMPT_IMPROVEMENTS" -gt 0 ]; then
        echo "📈 Found $PROMPT_IMPROVEMENTS prompt improvement patterns!"
        echo ""
        echo "🎯 Community-suggested improvements:"
        
        # Extract and display improvements (requires jq if available)
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
    else
        echo "✅ No new community prompt improvements at this time"
    fi
elif npm run community-wisdom --silent >/dev/null 2>&1; then
    echo "🔧 Community Wisdom Engine available but no patterns file yet"
    echo "💡 Generate patterns: npm run community-wisdom"
else
    echo "⚠️  Community Wisdom Engine not available"
    echo "💡 Setup: npm install && npm run setup"
fi

echo ""

# Check local prompt configuration
echo "🔍 Checking local prompt configuration..."
PROJECT_INSTRUCTIONS_FILES=("claude-project-instructions.txt" ".claude-project" "project-instructions.md" "ai-instructions.md")
FOUND_CONFIG=false

for file in "${PROJECT_INSTRUCTIONS_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "📋 Found AI instructions: $file"
        PROMPT_VERSION=$(grep "AI Development Standards Integration v" "$file" | grep -o "v[0-9]\+\.[0-9]\+" || echo "not found")
        if [ "$PROMPT_VERSION" != "not found" ]; then
            echo "   Version: $PROMPT_VERSION"
            if [ "$PROMPT_VERSION" != "$CURRENT_VERSION" ]; then
                echo "   ⚠️  Version mismatch! Repository has $CURRENT_VERSION"
                UPDATES_AVAILABLE=true
            else
                echo "   ✅ Version matches repository"
            fi
        else
            echo "   ⚠️  No version found in prompt"
        fi
        FOUND_CONFIG=true
        break
    fi
done

if [ "$FOUND_CONFIG" = false ]; then
    echo "📝 No local AI instructions found"
    echo "💡 Create one with prompts from: $PROMPTS_FILE"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Summary and recommendations
if [ "${UPDATES_AVAILABLE:-false}" = true ]; then
    echo "🚀 UPDATES AVAILABLE!"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Review changelog: cat $CHANGELOG_FILE"
    echo "   2. Check improvements: https://github.com/nickagillis/ai-development-standards/blob/main/$PROMPTS_FILE"
    echo "   3. Update your AI assistant with latest prompts"
    echo "   4. Validate: npm run validate-context && npm run validate"
    echo ""
    echo "💡 Set reminder: Check for updates monthly with 'npm run check-prompt-updates'"
else
    echo "✅ ALL SYSTEMS CURRENT!"
    echo ""
    echo "📊 Status summary:"
    echo "   • Prompt version: $CURRENT_VERSION (latest)"
    echo "   • Repository: Up to date"
    echo "   • Community wisdom: No new improvements"
    echo ""
    echo "🔄 Next check: Run 'npm run check-prompt-updates' next month"
fi

echo ""
echo "📚 Resources:"
echo "   • Documentation: $PROMPTS_FILE"
echo "   • Change history: $CHANGELOG_FILE"
echo "   • Community discussions: https://github.com/nickagillis/ai-development-standards/discussions"
echo "   • Get help: https://github.com/nickagillis/ai-development-standards/discussions/categories/prompts"

exit 0
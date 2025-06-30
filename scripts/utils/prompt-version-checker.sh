#!/bin/bash
# Prompt Version Checking Utilities

PROMPTS_FILE="docs/ai-integration-prompts-core.md"
CHANGELOG_FILE="docs/prompt-changelog-core.md"

check_current_prompt_version() {
    if [ -f "$PROMPTS_FILE" ]; then
        CURRENT_VERSION=$(grep "# AI Development Standards Integration v" "$PROMPTS_FILE" | head -1 | grep -o "v[0-9]\+\.[0-9]\+" || echo "v1.0")
        echo "📋 Current prompt version: $CURRENT_VERSION"
        export CURRENT_VERSION
    else
        echo "⚠️  Prompts file not found: $PROMPTS_FILE"
        echo "💡 Run: npm install && npm run setup"
        exit 1
    fi
}

check_upstream_updates() {
    if [ -d ".git" ]; then
        echo "📁 Repository detected: Checking for upstream updates..."
        
        if git remote | grep -q "upstream"; then
            echo "🍴 Fork detected: Checking upstream for prompt improvements..."
            check_fork_updates
        else
            echo "📖 Reference usage detected: Checking for latest releases..."
            check_release_updates
        fi
    else
        echo "📖 Not in git repository: Checking for community wisdom improvements..."
    fi
}

check_fork_updates() {
    git fetch upstream --quiet 2>/dev/null || echo "⚠️  Could not fetch upstream (network issue?)"
    
    UPSTREAM_CHANGES=$(git diff HEAD upstream/main --name-only 2>/dev/null | grep -c "docs/ai-integration-prompts\|docs/prompt-changelog" || echo "0")
    if [ "$UPSTREAM_CHANGES" -gt 0 ]; then
        echo "🚀 Upstream prompt improvements detected!"
        echo "📝 Files updated upstream:"
        git diff HEAD upstream/main --name-only 2>/dev/null | grep "docs/ai-integration-prompts\|docs/prompt-changelog" | sed 's/^/     - /'
        echo ""
        echo "🔧 To review and apply:"
        echo "   git diff upstream/main -- docs/ai-integration-prompts-core.md"
        echo "   git diff upstream/main -- docs/prompt-changelog-core.md"
        UPDATES_AVAILABLE=true
        export UPDATES_AVAILABLE
    else
        echo "✅ Your prompts are current with upstream"
    fi
}

check_release_updates() {
    if command -v curl >/dev/null 2>&1; then
        LATEST_RELEASE=$(curl -s "https://api.github.com/repos/nickagillis/ai-development-standards/releases/latest" 2>/dev/null | grep '"tag_name"' | cut -d'"' -f4 || echo "unknown")
        if [ "$LATEST_RELEASE" != "unknown" ] && [ "$LATEST_RELEASE" != "$CURRENT_VERSION" ]; then
            echo "🚀 New prompt version available: $LATEST_RELEASE"
            echo "📋 Current version: $CURRENT_VERSION"
            echo "📝 Release notes: https://github.com/nickagillis/ai-development-standards/releases/latest"
            UPDATES_AVAILABLE=true
            export UPDATES_AVAILABLE
        else
            echo "✅ You have the latest prompt version: $CURRENT_VERSION"
        fi
    else
        echo "⚠️  curl not available - cannot check for updates"
    fi
}
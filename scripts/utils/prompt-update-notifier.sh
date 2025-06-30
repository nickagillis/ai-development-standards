#!/bin/bash
# Prompt Update Notification and Summary

check_local_prompt_configuration() {
    echo ""
    echo "🔍 Checking local prompt configuration..."
    
    PROJECT_INSTRUCTIONS_FILES=("claude-project-instructions.txt" ".claude-project" "project-instructions.md" "ai-instructions.md")
    FOUND_CONFIG=false
    
    for file in "${PROJECT_INSTRUCTIONS_FILES[@]}"; do
        if [ -f "$file" ]; then
            echo "📋 Found AI instructions: $file"
            check_file_version "$file"
            FOUND_CONFIG=true
            break
        fi
    done
    
    if [ "$FOUND_CONFIG" = false ]; then
        echo "📝 No local AI instructions found"
        echo "💡 Create one with prompts from: docs/ai-integration-prompts-core.md"
    fi
}

check_file_version() {
    local file="$1"
    PROMPT_VERSION=$(grep "AI Development Standards Integration v" "$file" | grep -o "v[0-9]\+\.[0-9]\+" || echo "not found")
    if [ "$PROMPT_VERSION" != "not found" ]; then
        echo "   Version: $PROMPT_VERSION"
        if [ "$PROMPT_VERSION" != "$CURRENT_VERSION" ]; then
            echo "   ⚠️  Version mismatch! Repository has $CURRENT_VERSION"
            UPDATES_AVAILABLE=true
            export UPDATES_AVAILABLE
        else
            echo "   ✅ Version matches repository"
        fi
    else
        echo "   ⚠️  No version found in prompt"
    fi
}

generate_update_summary() {
    echo ""
}

print_final_summary() {
    if [ "${UPDATES_AVAILABLE:-false}" = true ]; then
        echo "🚀 UPDATES AVAILABLE!"
        echo ""
        echo "📋 Next steps:"
        echo "   1. Review changelog: cat docs/prompt-changelog-core.md"
        echo "   2. Check improvements: https://github.com/nickagillis/ai-development-standards/blob/main/docs/ai-integration-prompts-core.md"
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
}

print_resources() {
    echo ""
    echo "📚 Resources:"
    echo "   • Core prompts: docs/ai-integration-prompts-core.md"
    echo "   • Change history: docs/prompt-changelog-core.md"
    echo "   • Community discussions: https://github.com/nickagillis/ai-development-standards/discussions"
    echo "   • Get help: https://github.com/nickagillis/ai-development-standards/discussions/categories/prompts"
}
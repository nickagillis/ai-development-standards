#!/bin/bash
# AI Integration Prompts Update Checker v1.0 - Core
# Modular entry point for prompt update checking

set -e

echo "🧠 AI Integration Prompts Update Checker v1.0"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load utility modules
source "$(dirname "$0")/utils/prompt-version-checker.sh"
source "$(dirname "$0")/utils/community-wisdom-checker.sh"
source "$(dirname "$0")/utils/prompt-update-notifier.sh"

# Main execution flow
check_current_prompt_version
check_upstream_updates
check_community_wisdom_patterns
check_local_prompt_configuration
generate_update_summary

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_final_summary
print_resources

exit 0
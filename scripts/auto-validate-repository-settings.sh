#!/bin/bash
# Auto-Healing Repository Compliance Checker
# File: scripts/auto-validate-repository-settings.sh
# Purpose: Automatically validate GitHub repository compliance with standards
# Author: AI Development Standards Team
# Lines: <75 (utility file limit)

set -euo pipefail

# Source auto-healing commons for standardized functions
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "${SCRIPT_DIR}/auto-healing-commons.sh"

# Configuration
REPO_OWNER="${GITHUB_REPOSITORY_OWNER:-nickagillis}"
REPO_NAME="${GITHUB_REPOSITORY_NAME:-ai-development-standards}"
API_BASE="https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}"

# Initialize auto-healing for this process
setup_auto_healing_trap "auto-validate-repository-settings"

auto_log_change "automation" "Created repository compliance validator" "medium" "scripts/auto-validate-repository-settings.sh"

# Validate branch protection settings
validate_branch_protection() {
    local branch="${1:-main}"
    echo "🔍 Checking branch protection for: ${branch}"
    
    # Use GitHub CLI if available, otherwise curl
    if command -v gh &> /dev/null; then
        gh api "repos/${REPO_OWNER}/${REPO_NAME}/branches/${branch}/protection" 2>/dev/null || {
            echo "❌ Branch protection not configured for ${branch}"
            return 1
        }
    else
        curl -s -f "${API_BASE}/branches/${branch}/protection" >/dev/null || {
            echo "❌ Branch protection not configured for ${branch}"
            return 1
        }
    fi
    
    echo "✅ Branch protection active for ${branch}"
    return 0
}

# Validate GitHub Actions workflows
validate_workflows() {
    echo "🔍 Checking required GitHub Actions workflows"
    local required_workflows=(
        "auto-healing-compliance.yml"
        "pre-merge-validation.yml" 
        "context-validation.yml"
    )
    
    for workflow in "${required_workflows[@]}"; do
        if [[ -f ".github/workflows/${workflow}" ]]; then
            echo "✅ Workflow present: ${workflow}"
        else
            echo "❌ Missing workflow: ${workflow}"
            return 1
        fi
    done
    
    return 0
}

# Main compliance validation
main() {
    echo "🚀 AI Development Standards - Repository Compliance Validation"
    echo "Repository: ${REPO_OWNER}/${REPO_NAME}"
    echo ""
    
    local compliance_score=0
    local max_score=100
    
    # Test branch protection (40% of score)
    if validate_branch_protection "main"; then
        compliance_score=$((compliance_score + 40))
    fi
    
    # Test workflows (30% of score) 
    if validate_workflows; then
        compliance_score=$((compliance_score + 30))
    fi
    
    # Test auto-healing infrastructure (30% of score)
    if [[ -f "scripts/auto-healing-commons.sh" ]] && npm run test:auto-healing &>/dev/null; then
        echo "✅ Auto-healing infrastructure operational"
        compliance_score=$((compliance_score + 30))
    else
        echo "❌ Auto-healing infrastructure issues"
    fi
    
    echo ""
    echo "📊 Compliance Score: ${compliance_score}/${max_score}"
    
    if [[ ${compliance_score} -ge 80 ]]; then
        echo "🎉 Repository meets AI Development Standards compliance requirements!"
        auto_log_outcome "auto-validate-repository-settings" "success" "Compliance score: ${compliance_score}/${max_score}"
        return 0
    else
        echo "⚠️  Repository needs compliance improvements"
        auto_log_outcome "auto-validate-repository-settings" "failure" "Compliance score: ${compliance_score}/${max_score}"
        return 1
    fi
}

# Execute main function
main "$@"

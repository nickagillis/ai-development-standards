#!/bin/bash

# Repository Compliance Verification Script
# Checks current repository configuration against ai-development-standards
#
# Usage: ./scripts/verify-repository-compliance.sh

set -e

# Configuration
REPO_OWNER="nickagillis"
REPO_NAME="ai-development-standards"
PROTECTED_BRANCH="main"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_check() {
    echo -e "${BLUE}🔍 Checking: $1${NC}"
}

echo "🔍 Repository Compliance Verification"
echo "====================================="
echo ""

# Initialize counters
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# Function to increment counters
pass_check() {
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
    log_success "$1"
}

fail_check() {
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
    log_error "$1"
}

warn_check() {
    CHECKS_WARNING=$((CHECKS_WARNING + 1))
    log_warning "$1"
}

# Check if GitHub CLI is available and authenticated
check_github_cli() {
    log_check "GitHub CLI authentication"
    
    if ! command -v gh &> /dev/null; then
        fail_check "GitHub CLI is not installed"
        return 1
    fi
    
    if ! gh auth status &> /dev/null; then
        fail_check "GitHub CLI is not authenticated"
        return 1
    fi
    
    pass_check "GitHub CLI is installed and authenticated"
}

# Check branch protection
check_branch_protection() {
    log_check "Branch protection for '$PROTECTED_BRANCH'"
    
    local protection_data=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/branches/$PROTECTED_BRANCH/protection" 2>/dev/null || echo "null")
    
    if [[ "$protection_data" == "null" ]]; then
        fail_check "Branch protection is not enabled"
        return 1
    fi
    
    pass_check "Branch protection is enabled"
    
    # Check specific protection rules
    log_check "Required pull request reviews"
    local pr_reviews=$(echo "$protection_data" | jq -r '.required_pull_request_reviews.required_approving_review_count // 0')
    if [[ "$pr_reviews" -ge 1 ]]; then
        pass_check "Pull request reviews required ($pr_reviews approvals)"
    else
        fail_check "Pull request reviews not properly configured"
    fi
    
    log_check "Admin enforcement"
    local enforce_admins=$(echo "$protection_data" | jq -r '.enforce_admins.enabled // false')
    if [[ "$enforce_admins" == "true" ]]; then
        pass_check "Admin enforcement is enabled"
    else
        fail_check "Admin enforcement is not enabled"
    fi
    
    log_check "Required status checks"
    local status_checks=$(echo "$protection_data" | jq -r '.required_status_checks.contexts[]? // empty' 2>/dev/null)
    
    if echo "$status_checks" | grep -q "validate-context"; then
        pass_check "Required status check 'validate-context' is configured"
    else
        warn_check "Status check 'validate-context' is not required"
    fi
    
    if echo "$status_checks" | grep -q "auto-healing-validation"; then
        pass_check "Required status check 'auto-healing-validation' is configured"
    else
        warn_check "Status check 'auto-healing-validation' is not required"
    fi
}

# Check repository settings
check_repository_settings() {
    log_check "Repository security settings"
    
    # Check vulnerability alerts
    local vuln_alerts=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/vulnerability-alerts" 2>/dev/null && echo "enabled" || echo "disabled")
    if [[ "$vuln_alerts" == "enabled" ]]; then
        pass_check "Vulnerability alerts are enabled"
    else
        warn_check "Vulnerability alerts are not enabled"
    fi
    
    # Check Actions permissions
    log_check "GitHub Actions permissions"
    local actions_perms=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/actions/permissions" 2>/dev/null || echo "null")
    
    if [[ "$actions_perms" != "null" ]]; then
        local actions_enabled=$(echo "$actions_perms" | jq -r '.enabled // false')
        if [[ "$actions_enabled" == "true" ]]; then
            pass_check "GitHub Actions are enabled"
        else
            warn_check "GitHub Actions are not enabled"
        fi
    else
        warn_check "Could not verify GitHub Actions permissions"
    fi
}

# Check workflow files
check_workflow_files() {
    log_check "Required workflow files"
    
    if [[ -f ".github/workflows/context-validation.yml" ]]; then
        pass_check "Context validation workflow exists"
    else
        fail_check "Context validation workflow is missing"
    fi
    
    if [[ -f ".github/workflows/auto-healing-compliance.yml" ]]; then
        pass_check "Auto-healing compliance workflow exists"
    else
        fail_check "Auto-healing compliance workflow is missing"
    fi
}

# Check package.json scripts
check_package_scripts() {
    log_check "Required npm scripts in package.json"
    
    if [[ -f "package.json" ]]; then
        local scripts=$(jq -r '.scripts | keys[]' package.json 2>/dev/null || echo "")
        
        if echo "$scripts" | grep -q "validate-context"; then
            pass_check "npm script 'validate-context' exists"
        else
            fail_check "npm script 'validate-context' is missing"
        fi
        
        if echo "$scripts" | grep -q "test:auto-healing"; then
            pass_check "npm script 'test:auto-healing' exists"
        else
            fail_check "npm script 'test:auto-healing' is missing"
        fi
        
        if echo "$scripts" | grep -q "validate-auto-healing"; then
            pass_check "npm script 'validate-auto-healing' exists"
        else
            fail_check "npm script 'validate-auto-healing' is missing"
        fi
    else
        fail_check "package.json not found"
    fi
}

# Test actual compliance by running scripts
test_compliance_scripts() {
    log_check "Testing compliance scripts"
    
    if command -v npm &> /dev/null; then
        # Test context validation
        if npm run validate-context &> /dev/null; then
            pass_check "Context validation script passes"
        else
            warn_check "Context validation script has issues"
        fi
        
        # Test unit tests
        if npm run test:unit &> /dev/null; then
            pass_check "Unit tests pass"
        else
            warn_check "Unit tests have issues"
        fi
    else
        warn_check "npm not available, skipping script tests"
    fi
}

# Generate compliance report
generate_report() {
    echo ""
    echo "📊 Compliance Report Summary"
    echo "============================"
    echo ""
    
    local total_checks=$((CHECKS_PASSED + CHECKS_FAILED + CHECKS_WARNING))
    local compliance_percentage=$(( (CHECKS_PASSED * 100) / total_checks ))
    
    echo "✅ Passed: $CHECKS_PASSED"
    echo "❌ Failed: $CHECKS_FAILED"
    echo "⚠️  Warnings: $CHECKS_WARNING"
    echo "📈 Compliance: $compliance_percentage%"
    echo ""
    
    if [[ $CHECKS_FAILED -eq 0 ]]; then
        log_success "🎉 Repository is fully compliant with ai-development-standards!"
    elif [[ $CHECKS_FAILED -le 2 ]]; then
        log_warning "🔧 Repository has minor compliance issues that should be addressed"
    else
        log_error "🚨 Repository has significant compliance issues requiring immediate attention"
        echo ""
        echo "To fix compliance issues, run:"
        echo "  ./scripts/setup-repository-compliance.sh"
        echo "  # or on Windows:"
        echo "  .\\scripts\\setup-repository-compliance.ps1"
    fi
    
    echo ""
    echo "For detailed setup instructions, see DEPLOYMENT.md"
}

# Main execution
main() {
    check_github_cli
    check_branch_protection
    check_repository_settings
    check_workflow_files
    check_package_scripts
    test_compliance_scripts
    generate_report
    
    # Exit with appropriate code
    if [[ $CHECKS_FAILED -gt 0 ]]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function
main "$@"
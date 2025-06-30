#!/bin/bash

# Automated Repository Self-Compliance Setup
# Sets up branch protection and repository settings per ai-development-standards
# 
# Prerequisites:
# - GitHub CLI installed (gh cli)
# - Admin access token with repo and admin:repo_hook scopes
#
# Usage: ./scripts/setup-repository-compliance.sh

set -e

echo "🛡️ Setting up AI Development Standards Repository Compliance"
echo "================================================================"

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

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    if ! command -v gh &> /dev/null; then
        log_error "GitHub CLI (gh) is not installed. Please install it first:"
        echo "  macOS: brew install gh"
        echo "  Ubuntu: sudo apt install gh"
        echo "  Windows: winget install GitHub.cli"
        exit 1
    fi
    
    if ! gh auth status &> /dev/null; then
        log_error "GitHub CLI is not authenticated. Run: gh auth login"
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Setup branch protection rules
setup_branch_protection() {
    log_info "Setting up branch protection for '$PROTECTED_BRANCH'..."
    
    # Create branch protection rule
    gh api \
        --method PUT \
        "/repos/$REPO_OWNER/$REPO_NAME/branches/$PROTECTED_BRANCH/protection" \
        --field required_status_checks='{"strict":true,"contexts":["validate-context","auto-healing-validation"]}' \
        --field enforce_admins=true \
        --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true}' \
        --field restrictions=null \
        --field allow_force_pushes=false \
        --field allow_deletions=false \
        --field block_creations=false \
        --field required_conversation_resolution=true \
        > /dev/null 2>&1
        
    if [ $? -eq 0 ]; then
        log_success "Branch protection configured"
    else
        log_error "Failed to configure branch protection"
        return 1
    fi
}

# Setup repository settings
setup_repository_settings() {
    log_info "Configuring repository settings..."
    
    # Enable vulnerability alerts
    gh api \
        --method PUT \
        "/repos/$REPO_OWNER/$REPO_NAME/vulnerability-alerts" \
        > /dev/null 2>&1
    
    # Enable automated security fixes
    gh api \
        --method PUT \
        "/repos/$REPO_OWNER/$REPO_NAME/automated-security-fixes" \
        > /dev/null 2>&1
    
    # Configure Actions permissions
    gh api \
        --method PUT \
        "/repos/$REPO_OWNER/$REPO_NAME/actions/permissions" \
        --field enabled=true \
        --field allowed_actions="all" \
        > /dev/null 2>&1
    
    # Configure workflow permissions
    gh api \
        --method PUT \
        "/repos/$REPO_OWNER/$REPO_NAME/actions/permissions/workflow" \
        --field default_workflow_permissions="write" \
        --field can_approve_pull_request_reviews=true \
        > /dev/null 2>&1
    
    log_success "Repository settings configured"
}

# Verify setup
verify_setup() {
    log_info "Verifying setup..."
    
    # Check branch protection
    local protection_status=$(gh api "/repos/$REPO_OWNER/$REPO_NAME/branches/$PROTECTED_BRANCH/protection" 2>/dev/null || echo "not_protected")
    
    if [[ "$protection_status" == "not_protected" ]]; then
        log_error "Branch protection verification failed"
        return 1
    else
        log_success "Branch protection verified"
    fi
    
    # Check if required status checks are configured
    local status_checks=$(echo "$protection_status" | jq -r '.required_status_checks.contexts[]' 2>/dev/null)
    
    if echo "$status_checks" | grep -q "validate-context" && echo "$status_checks" | grep -q "auto-healing-validation"; then
        log_success "Required status checks verified"
    else
        log_warning "Some required status checks may not be configured correctly"
    fi
    
    log_success "Repository compliance setup complete!"
}

# Test branch protection
test_branch_protection() {
    log_info "Testing branch protection (this should fail as expected)..."
    
    # Try to push directly to main (this should fail if protection is working)
    echo "test" > /tmp/test-protection-file
    
    local test_result="passed"
    
    # Note: In a real scenario, this would attempt to push to main
    # For safety, we'll just simulate the test
    log_warning "Direct push protection test skipped (would require actual push attempt)"
    log_info "To test manually: try 'git push origin main' directly - it should be rejected"
}

# Display post-setup instructions
display_instructions() {
    echo ""
    echo "🎉 Repository Compliance Setup Complete!"
    echo "========================================"
    echo ""
    echo "Next steps:"
    echo "1. Try creating a test PR to verify workflows pass"
    echo "2. Check that direct pushes to main are blocked"
    echo "3. Verify workflow emails stop failing"
    echo ""
    echo "Commands to test:"
    echo "  npm run validate-context"
    echo "  npm run test:auto-healing"
    echo "  npm run health-check-auto-healing"
    echo ""
    echo "Your repository now follows its own auto-healing standards! 🛡️"
}

# Main execution
main() {
    check_prerequisites
    setup_branch_protection
    setup_repository_settings
    verify_setup
    test_branch_protection
    display_instructions
}

# Run main function
main "$@"
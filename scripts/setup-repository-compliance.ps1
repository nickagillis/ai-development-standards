# Automated Repository Self-Compliance Setup (PowerShell)
# Sets up branch protection and repository settings per ai-development-standards
# 
# Prerequisites:
# - GitHub CLI installed (gh cli)
# - Admin access token with repo and admin:repo_hook scopes
#
# Usage: .\scripts\setup-repository-compliance.ps1

param(
    [string]$RepoOwner = "nickagillis",
    [string]$RepoName = "ai-development-standards",
    [string]$ProtectedBranch = "main"
)

Write-Host "🛡️ Setting up AI Development Standards Repository Compliance" -ForegroundColor Blue
Write-Host "================================================================" -ForegroundColor Blue

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Test-Prerequisites {
    Write-Info "Checking prerequisites..."
    
    # Check if GitHub CLI is installed
    try {
        $null = Get-Command gh -ErrorAction Stop
    }
    catch {
        Write-Error "GitHub CLI (gh) is not installed. Please install it first:"
        Write-Host "  Windows: winget install GitHub.cli"
        Write-Host "  Or download from: https://cli.github.com/"
        exit 1
    }
    
    # Check if GitHub CLI is authenticated
    try {
        gh auth status 2>$null
        if ($LASTEXITCODE -ne 0) {
            throw "Not authenticated"
        }
    }
    catch {
        Write-Error "GitHub CLI is not authenticated. Run: gh auth login"
        exit 1
    }
    
    Write-Success "Prerequisites check passed"
}

function Set-BranchProtection {
    Write-Info "Setting up branch protection for '$ProtectedBranch'..."
    
    $protectionConfig = @{
        required_status_checks = @{
            strict = $true
            contexts = @("validate-context", "auto-healing-validation")
        }
        enforce_admins = $true
        required_pull_request_reviews = @{
            required_approving_review_count = 1
            dismiss_stale_reviews = $true
        }
        restrictions = $null
        allow_force_pushes = $false
        allow_deletions = $false
        block_creations = $false
        required_conversation_resolution = $true
    } | ConvertTo-Json -Depth 10
    
    try {
        $result = gh api --method PUT "/repos/$RepoOwner/$RepoName/branches/$ProtectedBranch/protection" --input - 2>$null <<< $protectionConfig
        Write-Success "Branch protection configured"
    }
    catch {
        Write-Error "Failed to configure branch protection: $_"
        return $false
    }
    
    return $true
}

function Set-RepositorySettings {
    Write-Info "Configuring repository settings..."
    
    try {
        # Enable vulnerability alerts
        gh api --method PUT "/repos/$RepoOwner/$RepoName/vulnerability-alerts" 2>$null
        
        # Enable automated security fixes
        gh api --method PUT "/repos/$RepoOwner/$RepoName/automated-security-fixes" 2>$null
        
        # Configure Actions permissions
        gh api --method PUT "/repos/$RepoOwner/$RepoName/actions/permissions" --field enabled=true --field allowed_actions="all" 2>$null
        
        # Configure workflow permissions
        gh api --method PUT "/repos/$RepoOwner/$RepoName/actions/permissions/workflow" --field default_workflow_permissions="write" --field can_approve_pull_request_reviews=true 2>$null
        
        Write-Success "Repository settings configured"
        return $true
    }
    catch {
        Write-Warning "Some repository settings may not have been configured correctly: $_"
        return $false
    }
}

function Test-Setup {
    Write-Info "Verifying setup..."
    
    try {
        $protection = gh api "/repos/$RepoOwner/$RepoName/branches/$ProtectedBranch/protection" 2>$null | ConvertFrom-Json
        
        if ($protection) {
            Write-Success "Branch protection verified"
            
            $requiredChecks = $protection.required_status_checks.contexts
            if ($requiredChecks -contains "validate-context" -and $requiredChecks -contains "auto-healing-validation") {
                Write-Success "Required status checks verified"
            }
            else {
                Write-Warning "Some required status checks may not be configured correctly"
            }
        }
        else {
            Write-Error "Branch protection verification failed"
            return $false
        }
    }
    catch {
        Write-Error "Setup verification failed: $_"
        return $false
    }
    
    Write-Success "Repository compliance setup complete!"
    return $true
}

function Show-Instructions {
    Write-Host ""
    Write-Host "🎉 Repository Compliance Setup Complete!" -ForegroundColor Green
    Write-Host "========================================"
    Write-Host ""
    Write-Host "Next steps:"
    Write-Host "1. Try creating a test PR to verify workflows pass"
    Write-Host "2. Check that direct pushes to main are blocked"
    Write-Host "3. Verify workflow emails stop failing"
    Write-Host ""
    Write-Host "Commands to test:"
    Write-Host "  npm run validate-context"
    Write-Host "  npm run test:auto-healing"
    Write-Host "  npm run health-check-auto-healing"
    Write-Host ""
    Write-Host "Your repository now follows its own auto-healing standards! 🛡️" -ForegroundColor Green
}

# Main execution
function Main {
    Test-Prerequisites
    
    $success = $true
    $success = $success -and (Set-BranchProtection)
    $success = $success -and (Set-RepositorySettings)
    $success = $success -and (Test-Setup)
    
    if ($success) {
        Show-Instructions
    }
    else {
        Write-Error "Setup completed with errors. Please check the output above."
        exit 1
    }
}

# Run main function
Main
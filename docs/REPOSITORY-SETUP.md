# 🔧 Repository Setup Guide - Auto-Healing Compliance

## **MANDATORY: Setup Guide for Self-Compliance**

Any repository using AI Development Standards **MUST** follow them automatically. This guide provides step-by-step instructions to achieve full self-compliance.

---

## 🚨 **CRITICAL: GitHub Repository Settings**

### **1. Enable Branch Protection (MANDATORY)**

**Navigate to**: `Repository Settings → Branches → Add rule`

**Branch name pattern**: `main` (or `master`)

**Required settings**:
```yaml
✅ Require a pull request before merging
  ✅ Require approvals: 1
  ✅ Dismiss stale PR approvals when new commits are pushed
  ✅ Require review from code owners (if CODEOWNERS file exists)

✅ Require status checks to pass before merging
  ✅ Require branches to be up to date before merging
  ✅ Required status checks:
      - Auto-Healing Compliance Check / auto-healing-validation
      - Any additional CI checks you have

✅ Require conversation resolution before merging

✅ Include administrators
   ⚠️ CRITICAL: This prevents violations by repo maintainers!

✅ Allow force pushes: OFF
✅ Allow deletions: OFF
```

### **2. Required GitHub Actions Workflow**

**File**: `.github/workflows/auto-healing-compliance.yml`

This repository includes a complete workflow template. Copy it to your repository:

```bash
# Copy the workflow file
mkdir -p .github/workflows
cp .github/workflows/auto-healing-compliance.yml your-repo/.github/workflows/
```

**The workflow automatically**:
- ✅ Runs `npm run test:auto-healing` on every PR
- ✅ Validates compliance with auto-healing standards
- ✅ Detects direct commits to main branch (violations)
- ✅ Logs collaboration sessions automatically
- ✅ Generates compliance reports in GitHub UI

---

## 📋 **AUTO-HEALING INFRASTRUCTURE SETUP**

### **1. Required Files**

**Copy these files to your repository**:
```bash
# Core auto-healing infrastructure
cp scripts/auto-healing-commons.sh your-repo/scripts/
cp scripts/test-auto-healing-integration.sh your-repo/scripts/

# Documentation
cp docs/AUTO-HEALING-STANDARDS.md your-repo/docs/
cp docs/REPOSITORY-SETUP.md your-repo/docs/
```

### **2. Required npm Scripts**

**Add to your `package.json`**:
```json
{
  "scripts": {
    "test:auto-healing": "bash scripts/test-auto-healing-integration.sh",
    "health-check-auto-healing": "npm run test:auto-healing && npm run health-check",
    "pre-merge-auto-healing": "npm run test:auto-healing && npm run pre-merge-validation",
    "validate-auto-healing": "source scripts/auto-healing-commons.sh && validate_auto_healing_compliance",
    "log-collaboration": "node scripts/log-collaboration-session.js"
  }
}
```

### **3. Required Directory Structure**

```
your-repo/
├── .github/
│   └── workflows/
│       └── auto-healing-compliance.yml    # Automated compliance checking
├── scripts/
│   ├── auto-healing-commons.sh            # Core auto-healing functions
│   └── test-auto-healing-integration.sh   # Workflow validation
├── docs/
│   ├── AUTO-HEALING-STANDARDS.md          # Standards documentation
│   └── REPOSITORY-SETUP.md                # This guide
├── logs/
│   ├── collaboration-sessions/            # Community Wisdom Engine data
│   └── auto-healing/                      # Improvement suggestions
├── HANDOFF-SUMMARY.md                     # Cross-session continuity
└── QUICK-HANDOFF-STATUS.md               # Immediate status
```

---

## ✅ **VALIDATION CHECKLIST**

### **Repository Settings Validation**
- [ ] **Branch protection enabled** on main/master branch
- [ ] **Required status checks** including `Auto-Healing Compliance Check`
- [ ] **Admin inclusion** in branch protection (no exceptions!)
- [ ] **Force push disabled** and deletions disabled
- [ ] **PR requirements** configured (approvals, conversation resolution)

### **Auto-Healing Infrastructure Validation**
- [ ] **Auto-healing commons script** present and executable
- [ ] **Integration test script** present and executable
- [ ] **npm scripts** configured for auto-healing commands
- [ ] **GitHub Actions workflow** configured and active
- [ ] **Documentation** present and up-to-date

### **Functional Validation**
```bash
# Test auto-healing functionality
npm run test:auto-healing                  # Should pass all validation tests
npm run validate-auto-healing              # Should validate compliance

# Test GitHub Actions (create a test PR)
git checkout -b test-compliance
echo "Test compliance" > test-file.txt
git add test-file.txt
git commit -m "test: validate auto-healing compliance"
git push origin test-compliance
# Create PR and verify GitHub Actions run successfully
```

---

## 🎯 **COMPLIANCE VERIFICATION**

### **Green Light Indicators**
- ✅ **GitHub Actions pass** on every PR
- ✅ **Branch protection prevents** direct commits to main
- ✅ **Auto-healing tests pass** (`npm run test:auto-healing`)
- ✅ **Compliance validation succeeds** (`npm run validate-auto-healing`)
- ✅ **Handoff documents** auto-update for high-impact changes

### **Red Flag Indicators**
- ❌ **Direct commits to main** possible (branch protection not configured)
- ❌ **GitHub Actions failing** or not configured
- ❌ **Auto-healing tests fail** - infrastructure not properly set up
- ❌ **Missing required files** - auto-healing commons or test scripts
- ❌ **npm scripts not working** - commands return errors

---

## 🔧 **TROUBLESHOOTING**

### **Branch Protection Not Working**
**Problem**: Can still commit directly to main
**Solution**: 
1. Verify admin inclusion is enabled in branch protection
2. Check that status checks are required and configured
3. Ensure GitHub Actions workflow name matches required checks

### **GitHub Actions Failing**
**Problem**: Auto-healing compliance workflow fails
**Solutions**:
1. Check that `npm run test:auto-healing` works locally
2. Verify all required files are present in repository
3. Ensure npm dependencies are properly configured
4. Check workflow file syntax and required permissions

### **Auto-Healing Commands Not Working**
**Problem**: `npm run test:auto-healing` returns errors
**Solutions**:
1. Verify `scripts/auto-healing-commons.sh` is present and executable
2. Check that `scripts/test-auto-healing-integration.sh` exists
3. Ensure required npm packages are installed
4. Run `chmod +x scripts/*.sh` to make scripts executable

### **Missing Documentation**
**Problem**: Required handoff or standards documentation missing
**Solutions**:
1. Copy template files from this repository
2. Customize templates for your specific project
3. Ensure documentation follows size guidelines (< 500 lines)
4. Update documentation regularly via auto-healing or manual updates

---

## 📊 **COMPLIANCE MONITORING**

### **Regular Health Checks**
```bash
# Daily validation (recommended)
npm run health-check-auto-healing

# Before every release
npm run pre-merge-auto-healing

# Manual compliance verification
npm run validate-auto-healing
```

### **GitHub Actions Monitoring**
- **Check GitHub Actions tab** regularly for failed workflows
- **Review compliance reports** in PR summary sections
- **Monitor direct commit detection** warnings in workflow outputs
- **Validate session logging** for collaboration commits

### **Community Wisdom Tracking**
- **Review `logs/collaboration-sessions/`** for captured session data
- **Check `logs/auto-healing/`** for improvement suggestions
- **Monitor handoff document** updates and accuracy
- **Track compliance trends** over time

---

## 🎭 **LEARNING FROM OUR EXAMPLE**

### **Our Compliance Journey**
This repository made **8 direct commits to main** while building compliance infrastructure. This demonstrates:

- ✅ **Why automation is essential** - Even conscious effort fails without enforcement
- ✅ **Value of transparency** - Honest reporting builds trust and improves standards
- ✅ **Self-healing effectiveness** - Our violations provide perfect Community Wisdom data
- ✅ **Process improvement** - Each violation strengthens our understanding

### **Lessons for Your Repository**
1. **Set up branch protection FIRST** - Before making any commits
2. **Test your workflow** with a small PR before major development
3. **Monitor compliance regularly** - Don't wait for violations to discover issues
4. **Be transparent** about your compliance journey - it helps everyone learn

---

## 🚀 **ADVANCED CONFIGURATION**

### **Custom Validation Rules**
```bash
# Add custom validation to auto-healing-commons.sh
validate_project_specific_compliance() {
    # Add your specific requirements here
    local issues=()
    
    # Example: Check for required project files
    if [[ ! -f "PROJECT-SPECIFIC-FILE.md" ]]; then
        issues+=("Missing project-specific documentation")
    fi
    
    # Report issues following standard pattern
    if [[ "${#issues[@]}" -gt 0 ]]; then
        echo "[AUTO-HEALING] ⚠️ Project-specific compliance issues:"
        for issue in "${issues[@]}"; do
            echo "  - $issue"
        done
        return 1
    fi
    
    return 0
}
```

### **Enhanced GitHub Actions**
```yaml
# Add to .github/workflows/auto-healing-compliance.yml
- name: Custom Project Validation
  run: |
    # Add your project-specific validation here
    npm run validate-project-requirements
    npm run check-project-standards
```

### **Automated Reporting**
```bash
# Add to your scripts for enhanced monitoring
generate_compliance_report() {
    echo "## Repository Compliance Report" > compliance-report.md
    echo "Generated: $(date)" >> compliance-report.md
    echo "" >> compliance-report.md
    
    # Add compliance status checks
    npm run validate-auto-healing >> compliance-report.md
    
    # Add any additional reporting
}
```

---

## 💡 **BEST PRACTICES**

### **Setup Process**
1. **Configure branch protection FIRST** - Before any development
2. **Test with small changes** - Validate the workflow with simple PRs
3. **Document customizations** - Keep track of project-specific configurations
4. **Train your team** - Ensure everyone understands the compliance requirements

### **Ongoing Maintenance**
- **Review compliance weekly** - Check GitHub Actions and validation results
- **Update documentation regularly** - Keep handoff and standards docs current
- **Monitor Community Wisdom** - Learn from session logs and improvement suggestions
- **Share experiences** - Contribute back to the community with lessons learned

### **Continuous Improvement**
- **Track compliance metrics** - Monitor violations and improvement trends
- **Enhance validation rules** - Add project-specific requirements as needed
- **Update workflows** - Improve GitHub Actions based on experience
- **Share insights** - Help other repositories achieve compliance

---

*Remember: The goal is not perfection from day one, but continuous improvement through automated enforcement and transparent learning.*

**Setup Status**: COMPLETE when all validation checks pass ✅

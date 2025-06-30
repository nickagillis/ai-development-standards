# 🛠️ Scripts Directory - Repository Automation Tools

This directory contains automation scripts for setting up and maintaining repository compliance with AI Development Standards.

## 🚀 Quick Start - Repository Self-Compliance

### **One-Command Setup**

**Unix/Linux/macOS:**
```bash
npm run setup-repository
```

**Windows:**
```bash
npm run setup-repository-windows
```

**Verify Setup:**
```bash
npm run verify-compliance
```

---

## 📋 Available Scripts

### **🛡️ Repository Compliance**

| Script | Platform | Purpose |
|--------|----------|---------|
| `setup-repository-compliance.sh` | Unix/Linux/macOS | Automated repository protection setup |
| `setup-repository-compliance.ps1` | Windows PowerShell | Windows version of repository setup |
| `verify-repository-compliance.sh` | Unix/Linux/macOS | Verify current compliance status |

### **🧪 Testing & Validation**

| Script | Purpose |
|--------|---------|
| `test-auto-healing-integration.sh` | Complete auto-healing workflow testing |
| `validate-context.js` | Context window optimization validation |
| `validate-standards.js` | General standards compliance validation |
| `pre-merge-validation.js` | Pre-merge checks and validation |

### **🤖 AI Collaboration**

| Script | Purpose |
|--------|---------|
| `collaboration-logger-core.js` | Log AI collaboration sessions |
| `community-wisdom-engine-core.js` | Community wisdom analysis engine |
| `auto-healing-commons.sh` | Shared auto-healing utilities |

---

## 🔧 Detailed Usage

### **Repository Setup (First Time)**

1. **Ensure Prerequisites:**
   ```bash
   # Install GitHub CLI
   # macOS: brew install gh
   # Ubuntu: sudo apt install gh
   # Windows: winget install GitHub.cli
   
   # Authenticate
   gh auth login
   ```

2. **Run Setup:**
   ```bash
   # Automated setup
   npm run setup-repository
   
   # Or manual setup
   ./scripts/setup-repository-compliance.sh
   ```

3. **Verify Installation:**
   ```bash
   npm run verify-compliance
   ```

### **What the Setup Script Does**

✅ **Branch Protection Rules:**
- Requires pull request reviews (1 approval minimum)
- Requires status checks to pass: `validate-context`, `auto-healing-validation`
- Enforces rules for administrators
- Prevents force pushes and deletions
- Requires conversation resolution

✅ **Repository Security:**
- Enables vulnerability alerts
- Enables automated security fixes
- Configures GitHub Actions permissions
- Sets up workflow permissions

✅ **Verification:**
- Tests all protection rules
- Validates status check configuration
- Provides compliance report

---

## 📊 Compliance Verification

### **Check Current Status**
```bash
npm run verify-compliance
```

### **Sample Output**
```
🔍 Repository Compliance Verification
=====================================

🔍 Checking: GitHub CLI authentication
✅ GitHub CLI is installed and authenticated

🔍 Checking: Branch protection for 'main'
✅ Branch protection is enabled
✅ Pull request reviews required (1 approvals)
✅ Admin enforcement is enabled
✅ Required status check 'validate-context' is configured
✅ Required status check 'auto-healing-validation' is configured

📊 Compliance Report Summary
============================
✅ Passed: 12
❌ Failed: 0
⚠️  Warnings: 1
📈 Compliance: 95%

🎉 Repository is fully compliant with ai-development-standards!
```

---

## 🔄 Workflow Integration

### **npm Scripts Integration**

```json
{
  "scripts": {
    "setup-repository": "bash scripts/setup-repository-compliance.sh",
    "verify-compliance": "bash scripts/verify-repository-compliance.sh",
    "test:auto-healing": "bash scripts/test-auto-healing-integration.sh"
  }
}
```

### **GitHub Actions Integration**

The setup scripts configure your repository to work with these workflows:
- `.github/workflows/context-validation.yml`
- `.github/workflows/auto-healing-compliance.yml`

---

## 🐛 Troubleshooting

### **Common Issues**

**1. GitHub CLI Not Authenticated**
```bash
gh auth login
# Follow the prompts to authenticate
```

**2. Insufficient Permissions**
```bash
# Ensure your token has these scopes:
# - repo (full repository access)
# - admin:repo_hook (repository administration)
# - workflow (GitHub Actions)
```

**3. Branch Protection Already Exists**
```bash
# The script will update existing protection rules
# No manual intervention needed
```

**4. Status Checks Not Found**
```bash
# Status checks are created when workflows run
# Push a commit or create a PR to trigger them
```

### **Manual Verification**

If automated verification fails, check manually:

1. **Branch Protection:** GitHub → Settings → Branches
2. **Actions Permissions:** GitHub → Settings → Actions → General
3. **Security Alerts:** GitHub → Settings → Security & analysis

---

## 🎯 Best Practices

### **Before Running Scripts**
- ✅ Ensure you have admin access to the repository
- ✅ Install and authenticate GitHub CLI
- ✅ Read the script output carefully
- ✅ Verify changes in GitHub UI after completion

### **After Setup**
- ✅ Test with a sample PR to verify workflows work
- ✅ Try pushing directly to main (should be blocked)
- ✅ Check that workflow failure emails stop
- ✅ Document any custom requirements in your team's docs

### **Maintenance**
- ✅ Run `npm run verify-compliance` periodically
- ✅ Update scripts when adding new workflows
- ✅ Keep GitHub CLI updated: `gh extension upgrade --all`

---

## 📚 Related Documentation

- **[DEPLOYMENT.md](../DEPLOYMENT.md)** - Complete deployment guide
- **[README.md](../README.md)** - Main project documentation  
- **[AUTO-HEALING-STANDARDS.md](../docs/AUTO-HEALING-STANDARDS.md)** - Auto-healing requirements
- **[HANDOFF-STANDARDS.md](../docs/HANDOFF-STANDARDS.md)** - Session handoff standards

---

## 🤝 Contributing

When adding new scripts:

1. **Follow naming convention:** `action-description.sh` or `action-description.js`
2. **Add npm script:** Update `package.json` with appropriate command
3. **Include documentation:** Add to this README
4. **Test thoroughly:** Verify on multiple platforms when possible
5. **Use error handling:** Include proper exit codes and error messages

---

## 🎉 Success!

Once setup is complete, your repository will:
- ✅ **Enforce branch-based development**
- ✅ **Require status checks before merge**  
- ✅ **Block direct commits to main**
- ✅ **Generate compliance reports**
- ✅ **Practice what it preaches**

**Your AI Development Standards repository is now self-compliant!** 🛡️
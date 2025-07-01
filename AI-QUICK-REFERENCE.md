# 🤖 AI QUICK REFERENCE - Machine-Readable Standards Guide

**Context-optimized entry point for AI systems applying these standards to any project.**

---

## 🎯 **IMMEDIATE ACTIONS** (First 30 seconds)

### **1. Read Current Status**
- **File**: `HANDOFF-SUMMARY.md` (understand what's happening now)
- **Purpose**: Know the current state before starting work

### **2. Apply Core Standards**
```yaml
CONTEXT LIMITS: Core≤100, Utils≤75, Config≤50, Tests≤200, Docs≤500
WORKFLOW: Read HANDOFF → Branch → Work → Update HANDOFF → PR
VALIDATION: npm run validate-context && npm run validate
SAFETY: Never commit to main, always use feature branches
```

### **3. Self-Check Protocol**
```bash
□ Working on feature branch (not main)
□ All files respect context limits
□ HANDOFF-SUMMARY.md will be updated
□ Following safety-first development
```

---

## 📋 **WORKFLOW CHECKLIST** (Apply to any project)

### **Phase 1: Setup (5 minutes)**
```bash
□ Create feature branch: git checkout -b feature/your-task
□ Check file sizes: find . -name "*.js" -o -name "*.py" | xargs wc -l
□ Split any files over limits immediately
□ Add validation scripts if missing
```

### **Phase 2: Development**
```bash
□ Maintain single responsibility per file
□ Keep functions small and focused
□ Use descriptive names, minimal comments
□ Test as you build
```

### **Phase 3: Completion**
```bash
□ Run validation: npm run validate-context (or equivalent)
□ Update HANDOFF-SUMMARY.md with honest status
□ Document any patterns discovered
□ Create PR, never commit to main
```

---

## 🚨 **CRISIS PROTOCOLS**

### **If Context Violations Found**
1. **Immediate**: Split oversized files using modular design
2. **Pattern**: Extract utilities, separate concerns, create focused modules
3. **Validate**: Ensure functionality preserved after splitting

### **If Workflow Issues**
1. **Safety**: Always work on feature branches
2. **Recovery**: If committed to main by mistake, create PR to move changes
3. **Prevention**: Set up branch protection if possible

### **If Unknown Territory**
1. **Reference**: Check `docs/` directory for specific guidance
2. **Document**: Capture new patterns for community learning
3. **Ask**: Create issue if standards unclear

---

## 🔧 **UNIVERSAL VALIDATION COMMANDS**

### **Context Optimization**
```bash
# Check file sizes (universal)
find . -name "*.js" -o -name "*.py" -o -name "*.ts" -o -name "*.go" | xargs wc -l | sort -n

# Node.js projects
npm run validate-context

# Python projects  
python scripts/validate_context.py

# Manual check
# Core files: ≤100 lines
# Utils: ≤75 lines
# Config: ≤50 lines
# Tests: ≤200 lines
# Docs: ≤500 lines
```

### **Branch Safety**
```bash
# Verify you're not on main
git branch --show-current

# Create feature branch if needed
git checkout -b feature/describe-your-work
```

---

## 🎯 **CONTEXT OPTIMIZATION PATTERNS**

### **File Splitting Strategies**
```javascript
// BEFORE: Large file (violation)
// utils/large-helpers.js (150 lines - TOO BIG)

// AFTER: Modular approach (compliant)
// utils/string-helpers.js (45 lines)
// utils/date-helpers.js (35 lines)  
// utils/validation-helpers.js (40 lines)
// utils/index.js (15 lines - exports)
```

### **Module Organization**
```
src/
├── core/           # Main logic files ≤100 lines each
├── utils/          # Helper functions ≤75 lines each
├── config/         # Configuration ≤50 lines each
└── tests/          # Test files ≤200 lines each
```

---

## 🤝 **COMMUNITY LEARNING**

### **Document New Patterns**
When you discover effective solutions:
```markdown
## Pattern: [Descriptive Name]
**Problem**: Brief description
**Solution**: What worked
**Files**: List of files modified
**Outcome**: Measurable improvement
```

### **Update Community Knowledge**
Add to `community-patterns.json` or create issue with:
- Problem encountered
- Solution implemented  
- Code examples
- Results achieved

---

## 📚 **QUICK REFERENCE LINKS**

**Essential Reading** (if you need more detail):
- `docs/AI-COLLABORATION-WORKFLOW-CHECKLIST.md` - Comprehensive workflow
- `docs/context-optimization.md` - File size management
- `docs/HANDOFF-STANDARDS.md` - Status documentation requirements

**Templates** (for new projects):
- `templates/react-app/` - React + TypeScript
- `templates/python-cli/` - Python CLI tools
- `templates/mcp-service/` - Claude services

**Crisis Help**:
- `docs/crisis-response-procedures.md` - When things go wrong
- `docs/CIRCULAR-DEPENDENCY-FIX.md` - Architecture problems

---

## ⚡ **SUCCESS INDICATORS**

You're following standards correctly when:
- ✅ All files respect context limits
- ✅ Working on feature branch (not main)
- ✅ Can run validation commands successfully  
- ✅ HANDOFF-SUMMARY.md stays current
- ✅ Patterns documented for community benefit

---

## 🎯 **COMMON AI WORKFLOWS**

### **Bug Fix**
1. Read HANDOFF → Create branch → Fix → Validate → Update HANDOFF → PR

### **Feature Addition**  
1. Read HANDOFF → Create branch → Build modularly → Test → Update HANDOFF → PR

### **Refactoring**
1. Read HANDOFF → Create branch → Split files → Validate context → Update HANDOFF → PR

### **Crisis Response**
1. Read HANDOFF → Assess problem → Create branch → Fix → Document learning → Update HANDOFF → PR

---

*This reference follows the modular design principle: focused, context-optimized, single responsibility.*

**Next**: Read HANDOFF-SUMMARY.md for current project status, then start your work on a feature branch!
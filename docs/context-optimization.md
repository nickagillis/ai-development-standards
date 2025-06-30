# Context Optimization Guidelines

## 🧠 Overview

These guidelines ensure AI development projects remain within Claude Desktop context limits while maintaining high code quality and enabling effective recursive MCP workflows.

### **Core Principle: Small, Focused, Composable**
- **Small**: Each file serves a single, clear purpose
- **Focused**: Minimal cognitive load per module
- **Composable**: Modules work together seamlessly

## 📏 File Size Guidelines

### **Hard Limits**
```
Critical Files (core logic):     ≤ 100 lines
Utility Modules:                 ≤ 75 lines
Configuration Files:             ≤ 50 lines
Documentation Sections:          ≤ 500 lines
Example/Demo Files:              ≤ 150 lines
```

### **Soft Limits (Review Required)**
```
Integration Modules:             ≤ 200 lines (break into sub-modules)
Complex Algorithms:              ≤ 150 lines (extract helpers)
Test Files:                      ≤ 200 lines (group related tests)
Readme/Documentation:            ≤ 1000 lines (split into sections)
```

### **Context Budget Management**
```
Single Module Analysis:          1,000-2,000 tokens
Multi-Module Analysis:           3,000-5,000 tokens
Project Overview:                5,000-8,000 tokens
Refactoring Session:             8,000-12,000 tokens
```

## 🏗️ Modular Design Patterns

### **1. Core-Extensions Pattern**
```javascript
// core/monitor.js (< 75 lines)
class WorkspaceMonitor {
  constructor(config) {
    this.config = config;
    this.extensions = new Map();
  }
  
  use(extension) {
    this.extensions.set(extension.name, extension);
  }
}

// extensions/conflict-detection.js (< 100 lines)
class ConflictDetectionExtension {
  constructor(options) {
    this.options = options;
  }
  
  analyze(data) {
    // Focused conflict detection logic
  }
}
```

### **2. Service-Interface Pattern**
```javascript
// interfaces/mcp-service.js (< 50 lines)
class McpService {
  async connect() { throw new Error('Not implemented'); }
  async analyze() { throw new Error('Not implemented'); }
  async disconnect() { throw new Error('Not implemented'); }
}

// services/claude-desktop-mcp.js (< 100 lines)
class ClaudeDesktopMcp extends McpService {
  // Focused MCP implementation
}
```

### **3. Event-Driven Composition**
```javascript
// core/event-hub.js (< 50 lines)
class EventHub extends EventEmitter {
  constructor() {
    super();
    this.services = new Map();
  }
  
  register(service) {
    this.services.set(service.name, service);
    service.setEventHub(this);
  }
}

// services/conflict-detector.js (< 75 lines)
class ConflictDetector {
  setEventHub(hub) {
    this.events = hub;
    hub.on('file:changed', this.checkConflicts.bind(this));
  }
}
```

## 📚 Documentation Strategies

### **1. Hierarchical Documentation**
```
docs/
├── quick-start.md          # Getting started (< 500 lines)
├── core-concepts.md        # Key concepts (< 400 lines)
├── api/
│   ├── overview.md         # API summary (< 300 lines)
│   ├── authentication.md  # Auth details (< 200 lines)
│   └── endpoints.md        # Endpoint specs (< 300 lines)
└── examples/
    ├── basic-usage.md      # Simple examples (< 300 lines)
    └── advanced-usage.md   # Complex examples (< 400 lines)
```

### **2. Progressive Disclosure**
```markdown
# Quick Start (Level 1)
Basic setup and first example

## Basic Usage (Level 2)
Common patterns and configurations

### Advanced Features (Level 3)
Complex scenarios and customization

#### Expert Tips (Level 4)
Optimization and troubleshooting
```

### **3. Cross-Reference Linking**
```markdown
<!-- Instead of duplicating content -->
For authentication details, see [Authentication Guide](./auth.md)
For examples, see [Examples Collection](../examples/)
```

## 🧪 Testing Strategies

### **1. Module-Focused Tests**
```javascript
// tests/conflict-detector.test.js (< 150 lines)
describe('ConflictDetector', () => {
  // Only test conflict detection
  // No integration concerns
});

// tests/integration/full-workflow.test.js (< 200 lines)
describe('Full Workflow Integration', () => {
  // Test module interactions
  // Higher-level scenarios
});
```

### **2. Behavior-Driven Test Organization**
```javascript
// Group related behaviors, not implementation details
describe('When multiple developers edit the same file', () => {
  describe('and they are on the same team', () => {
    test('should suggest communication', () => {});
  });
  
  describe('and they are on different teams', () => {
    test('should suggest coordination meeting', () => {});
  });
});
```

## 🔄 Claude Desktop Optimization

### **1. MCP-Friendly Structure**
```
src/
├── core/           # Essential functionality (< 75 lines each)
├── mcp/            # MCP integration modules (< 100 lines each)
├── services/       # Business logic services (< 100 lines each)
├── utils/          # Helper functions (< 50 lines each)
└── config/         # Configuration management (< 50 lines each)
```

### **2. Recursive Analysis Patterns**
```javascript
// mcp/analysis-coordinator.js (< 100 lines)
class AnalysisCoordinator {
  async analyzeModule(modulePath) {
    // Analyze single module
    // Report patterns to Claude
  }
  
  async coordinateAnalysis(modules) {
    // Orchestrate multi-module analysis
    // Manage context boundaries
  }
}
```

### **3. Progressive Enhancement**
```javascript
// Start simple
class BasicMonitor {
  // Core functionality only
}

// Add features progressively
class EnhancedMonitor extends BasicMonitor {
  // Add conflict detection
}

class AdvancedMonitor extends EnhancedMonitor {
  // Add MCP integration
}
```

## 🛠️ Refactoring Guidelines

### **When to Split a File**
- **> 100 lines** for core logic
- **Multiple responsibilities** detected
- **Context overflow** during AI analysis
- **High cognitive complexity** (> 10)

### **How to Split Effectively**

1. **Extract by Responsibility**
```javascript
// Before: large-service.js (200 lines)
// After:
core/service.js           // Core logic (75 lines)
validation/validators.js  // Input validation (50 lines)
utils/helpers.js         // Helper functions (40 lines)
config/service-config.js // Configuration (35 lines)
```

2. **Extract by Interface**
```javascript
// Before: complex-api.js (300 lines)
// After:
api/routes.js         // Route definitions (60 lines)
api/handlers.js       // Request handlers (80 lines)
api/middleware.js     // Middleware stack (50 lines)
api/validation.js     // Input validation (45 lines)
api/responses.js      // Response formatting (40 lines)
```

3. **Extract by Domain**
```javascript
// Before: workspace-monitor.js (400 lines)
// After:
conflict/detector.js     // Conflict detection (90 lines)
collab/analyzer.js       // Collaboration analysis (85 lines)
notify/channels.js       // Notification system (70 lines)
metrics/collector.js     // Metrics collection (65 lines)
```

## 📊 Monitoring Context Health

### **Automated Validation**
```javascript
// scripts/validate-context.js
const contextRules = {
  maxFileSize: 100,           // lines
  maxTokensPerFile: 2000,     // estimated tokens
  maxDocumentationSize: 500,   // lines
  maxExampleSize: 150         // lines
};

function validateContextHealth(projectPath) {
  // Check all files against rules
  // Report violations
  // Suggest refactoring
}
```

### **Context Metrics Dashboard**
```javascript
// Monitor project context health
const metrics = {
  filesOverLimit: 3,
  averageFileSize: 67,
  largestFile: { path: 'services/complex.js', lines: 134 },
  contextUtilization: '68%',
  recommendations: [
    'Split services/complex.js into 2 modules',
    'Extract utils from core/monitor.js'
  ]
};
```

## 🚀 Implementation Checklist

### **Project Setup**
- [ ] Configure file size limits in linting
- [ ] Set up context validation scripts
- [ ] Create modular project structure
- [ ] Establish progressive documentation

### **Development Workflow**
- [ ] Review file sizes during development
- [ ] Split files before they reach limits
- [ ] Test module boundaries regularly
- [ ] Validate context health before commits

### **Claude Desktop Integration**
- [ ] Ensure MCP modules are < 100 lines
- [ ] Test recursive analysis workflows
- [ ] Optimize for Claude's pattern recognition
- [ ] Monitor MCP performance metrics

---

**Context optimization is not about writing less code—it's about writing more focused, maintainable, and AI-analyzable code.** 🧠✨
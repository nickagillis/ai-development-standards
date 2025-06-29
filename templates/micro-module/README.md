# Micro-Module Template

## 🎯 Purpose

This template creates focused, single-responsibility modules optimized for Claude Desktop analysis and recursive MCP workflows.

## 📁 Template Structure

```
micro-module/
├── index.js          # Main module export (< 100 lines)
├── config.js         # Configuration management (< 50 lines)
├── utils.js          # Helper functions (< 75 lines)
├── types.js          # Type definitions/validation (< 50 lines)
├── README.md         # Module documentation (< 300 lines)
├── test.js           # Focused tests (< 150 lines)
└── examples.js       # Usage examples (< 100 lines)
```

## 🚀 Quick Start

```bash
# Create new micro-module
cp -r templates/micro-module/ src/modules/my-new-module/
cd src/modules/my-new-module/

# Customize for your use case
vim index.js          # Implement core functionality
vim config.js         # Configure module settings
vim test.js          # Add tests
vim README.md        # Document purpose and usage
```

## 🧩 Design Patterns

### **Single Responsibility Principle**
- One clear purpose per module
- Minimal external dependencies
- Focused API surface

### **Composability**
- Event-driven interfaces
- Dependency injection support
- Plugin-friendly architecture

### **Claude Desktop Optimization**
- < 100 lines core logic
- Clear input/output contracts
- Self-documenting code

## 📝 Module Checklist

- [ ] Core functionality < 100 lines
- [ ] Single, clear responsibility
- [ ] Configurable through config.js
- [ ] Comprehensive test coverage
- [ ] Usage examples provided
- [ ] Documentation complete
- [ ] Dependencies minimized
- [ ] Error handling included

## 🔧 Customization Guide

1. **Replace placeholder names** in all files
2. **Implement core logic** in index.js
3. **Configure settings** in config.js
4. **Add comprehensive tests** in test.js
5. **Provide usage examples** in examples.js
6. **Document thoroughly** in README.md

## 📚 Related Templates

- [MCP Integration Module](../mcp-integration/) - For Claude Desktop MCP features
- [Event Service Module](../event-service/) - For event-driven architecture
- [Utility Module](../utility-module/) - For helper functions

---

**Small modules, big impact. Perfect for Claude Desktop recursive analysis.** 🧠✨
# Documentation Standards for AI Development

## 📏 Size and Scope Guidelines

### **Context Window Considerations**

When working with AI systems (including Claude Desktop), documentation must respect context window limitations:

- **Single File Limit**: Maximum 8,000 lines or 150KB per file
- **AI Processing Limit**: Keep individual documents under 100KB for optimal AI analysis
- **Iteration Approach**: Build large documentation incrementally, not all at once

### **Modular Documentation Architecture**

```
docs/
├── README.md                    # Overview and quick start (< 50KB)
├── architecture/
│   ├── overview.md             # High-level system design
│   ├── components.md           # Individual component details
│   └── data-flow.md           # System interactions
├── guides/
│   ├── installation.md        # Setup instructions
│   ├── configuration.md       # Config reference
│   └── integration.md         # Integration examples
├── api/
│   ├── rest-api.md            # REST endpoints
│   ├── websocket-api.md       # WebSocket events
│   └── client-sdk.md          # Client libraries
├── advanced/
│   ├── custom-algorithms.md   # Advanced customization
│   ├── ml-integration.md      # Machine learning features
│   └── scaling.md             # Performance and scaling
└── troubleshooting/
    ├── common-issues.md       # FAQ and fixes
    ├── debugging.md           # Debug procedures
    └── performance.md         # Performance optimization
```

### **Documentation Development Process**

1. **Start Small**: Create core documentation file (< 50KB)
2. **Identify Breakout Topics**: When approaching size limits, split into focused files
3. **Cross-Reference**: Use clear linking between related documents
4. **Iterative Enhancement**: Build documentation incrementally
5. **AI-Friendly Structure**: Keep each file focused on single topics for better AI analysis

### **File Size Monitoring**

```bash
# Check documentation file sizes
find docs/ -name "*.md" -exec wc -c {} + | sort -n

# Alert if files exceed limits
find docs/ -name "*.md" -size +150k -exec echo "WARNING: {} exceeds size limit" \;
```

### **Template Structure**

Each documentation file should follow this template:

```markdown
# [Topic Name]

## Quick Summary (TL;DR)
[1-2 sentences explaining the core purpose]

## Table of Contents
[Auto-generated or manual TOC]

## Core Content
[Main documentation content]

## Related Documentation
- [Link to related file 1](./related-file-1.md)
- [Link to related file 2](./related-file-2.md)

## Next Steps
[Clear call-to-action for what to read/do next]
```

### **AI Development Specific Guidelines**

- **Context-Aware Writing**: Consider how AI will parse and reference the content
- **Searchable Structure**: Use clear headings and consistent terminology
- **Example-Heavy**: Include practical code examples in every section
- **Cross-Platform**: Document works across different AI development environments

---

**This approach ensures documentation remains maintainable, AI-friendly, and useful at scale.**
# Architecture Requirements

## 🏗️ Core Architecture Standards

Every AI-developed project must follow these fundamental requirements, optimized for Claude Desktop and sustainable context management:

### **Modular Design with Single Responsibility**
- Each module/file has ONE clear purpose
- Functions are small and focused (≤50 lines typically)
- Classes have single, well-defined responsibilities
- Easy to understand, test, and modify independently
- **Context-Optimized**: Core modules ≤ 100 lines for Claude Desktop analysis

### **Clear Separation of Concerns**
```
data/           # Database access, API calls, file I/O
business/       # Core logic, calculations, validations  
presentation/   # UI components, API endpoints, formatting
```

### **Configuration-Driven Development**
- Environment variables for all settings
- Configuration files for complex settings (≤ 50 lines each)
- No hardcoded values in business logic
- Easy to deploy across environments

### **MCP-Friendly File Structure**
- Descriptive file and folder names
- Logical organization that AI can navigate
- README files explaining complex modules (≤ 300 lines each)
- Clear entry points and interfaces

### **Production-Ready Error Handling**
- Try-catch blocks around all external calls
- Meaningful error messages with context
- Logging for debugging and monitoring
- Graceful degradation when possible

## 🧠 Context Optimization

### **File Size Guidelines**
```
Core Logic Files:        ≤ 100 lines
Utility Modules:         ≤ 75 lines
Configuration Files:     ≤ 50 lines
Test Files:              ≤ 200 lines
Documentation Sections:  ≤ 500 lines
Example/Demo Files:      ≤ 150 lines
Integration Modules:     ≤ 200 lines (split if larger)
```

### **Context Management Principles**
- **Micro-Module Architecture**: Break large files into focused components
- **Progressive Enhancement**: Start simple, add complexity incrementally
- **Token Awareness**: Estimate ~4 characters per token, keep modules under 2000 tokens
- **Claude Desktop Optimization**: Enable recursive analysis and pattern recognition

### **Validation Requirements**
- All projects must pass context validation: `npm run validate-context`
- Files exceeding limits require refactoring using modular design patterns
- Context health monitoring integrated into CI/CD pipeline
- Regular context optimization reviews

## 🛡️ Safety-First Development

### **Branch-Based Development**
- **NEVER** commit directly to main branch
- Create feature branches for all changes
- Use pull requests with required reviews
- Automated testing before merge

### **Security Validation**
- Validate ALL external dependencies
- Input sanitization and validation by default
- Environment variable protection
- No secrets in code or logs

### **Documentation & Testing**
- README for every module (focused, ≤ 300 lines)
- Inline comments for complex logic
- Unit tests for business logic (≤ 200 lines per test file)
- Integration tests for critical paths

## 📁 Standard Project Structure

```
project-name/
├── README.md                 # Project overview (≤ 500 lines)
├── package.json             # Dependencies and scripts
├── .env.example             # Environment template
├── .gitignore              # Git exclusions
├── src/
│   ├── config/             # Configuration management
│   │   ├── index.js        # Main config (≤ 50 lines)
│   │   └── validation.js   # Config validation (≤ 75 lines)
│   ├── core/               # Core business logic
│   │   ├── service.js      # Main service (≤ 100 lines)
│   │   └── processor.js    # Data processing (≤ 100 lines)
│   ├── data/               # Database, APIs, file access
│   │   ├── repository.js   # Data access (≤ 100 lines)
│   │   └── adapters/       # External service adapters (≤ 75 lines each)
│   ├── presentation/       # UI, API routes, formatting
│   │   ├── routes.js       # API routes (≤ 100 lines)
│   │   └── middleware.js   # Request middleware (≤ 75 lines)
│   ├── utils/              # Shared utilities
│   │   ├── logger.js       # Logging utility (≤ 50 lines)
│   │   └── helpers.js      # Helper functions (≤ 75 lines)
│   └── index.js            # Application entry point (≤ 50 lines)
├── tests/
│   ├── unit/               # Unit tests (≤ 200 lines each)
│   └── integration/        # Integration tests (≤ 200 lines each)
├── docs/
│   ├── api.md              # API documentation (≤ 400 lines)
│   ├── setup.md            # Setup guide (≤ 300 lines)
│   └── deployment.md       # Deployment guide (≤ 400 lines)
└── scripts/
    ├── setup.sh            # Environment setup
    ├── build.js            # Build orchestrator (≤ 50 lines)
    └── deploy.js           # Deployment script (≤ 75 lines)
```

## 🎯 Quality Gates

Before any code is considered complete:

### **✅ Architecture Checklist**
- [ ] Follows modular design principles
- [ ] Clear separation of concerns
- [ ] Configuration-driven settings
- [ ] MCP-friendly structure
- [ ] Production error handling
- [ ] **Context optimization validated**

### **✅ Safety Checklist**  
- [ ] Developed in feature branch
- [ ] All dependencies validated
- [ ] Input validation implemented
- [ ] Documentation complete
- [ ] Tests written and passing
- [ ] **Context validation passed**

### **✅ Production Readiness**
- [ ] Environment variables documented
- [ ] Error handling covers edge cases
- [ ] Logging implemented appropriately
- [ ] Performance considerations addressed
- [ ] Security review completed
- [ ] **File sizes within context limits**

### **✅ Context Health**
- [ ] No files exceed size guidelines
- [ ] Modular architecture implemented
- [ ] Progressive enhancement applied
- [ ] Claude Desktop optimization verified

## 🚀 Scalability Considerations

### **For Small Projects (MVP/Demo)**
- Focus on modularity and clarity
- Basic error handling and validation
- Simple configuration management
- **Use micro-module templates**

### **For Medium Projects (Production)**
- Add comprehensive testing
- Implement monitoring and logging
- Database optimization
- API rate limiting and caching
- **Context validation in CI/CD**

### **For Large Projects (Enterprise)**
- Microservices architecture with context boundaries
- Advanced monitoring and alerting
- Load balancing and scaling
- Compliance and audit requirements
- **Automated context health monitoring**

## 🔄 Claude Desktop Integration

### **Recursive Analysis Optimization**
- **File Size Limits**: Enable Claude to analyze entire modules in single context
- **Pattern Recognition**: Modular structure enhances pattern detection
- **Self-Improvement**: Claude can suggest optimizations for individual modules
- **MCP Efficiency**: Smaller modules improve MCP request/response cycles

### **Context-Aware Development**
- **Progressive Enhancement**: Build features incrementally within context limits
- **Modular Composition**: Combine micro-modules for complex functionality
- **Validation Integration**: Context health checks in development workflow
- **Recursive Learning**: Claude learns from modular patterns across projects

---

**These standards ensure every AI-built project is maintainable, scalable, production-ready, and optimized for Claude Desktop recursive analysis from day one.** ✨🧠
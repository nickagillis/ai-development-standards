/**
 * Context Optimization Validation Script
 * 
 * Validates project files against context optimization guidelines:
 * - File size limits
 * - Token estimation
 * - Module boundaries
 * - Documentation chunking
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Context optimization rules
 */
const CONTEXT_RULES = {
  // File size limits (lines)
  maxFileSize: {
    'core': 100,        // Core logic files
    'utility': 75,      // Utility modules
    'config': 50,       // Configuration files
    'test': 200,        // Test files
    'docs': 500,        // Documentation files
    'example': 150,     // Example/demo files
    'integration': 200, // Integration modules
    'default': 100      // Default limit
  },
  
  // Token estimation (rough)
  maxTokensPerFile: {
    'core': 2000,
    'utility': 1500,
    'config': 1000,
    'test': 4000,
    'docs': 10000,
    'example': 3000,
    'default': 2000
  },
  
  // File patterns
  patterns: {
    'core': ['**/core/**/*.js', '**/src/**/index.js'],
    'utility': ['**/utils/**/*.js', '**/helpers/**/*.js'],
    'config': ['**/config/**/*.js', '**/*config.js'],
    'test': ['**/test/**/*.js', '**/*.test.js', '**/*.spec.js'],
    'docs': ['**/*.md', '**/docs/**/*'],
    'example': ['**/examples/**/*.js', '**/demo/**/*.js'],
    'integration': ['**/integrations/**/*.js', '**/mcp/**/*.js']
  }
};

/**
 * Context validation results
 */
class ContextValidationResults {
  constructor() {
    this.totalFiles = 0;
    this.violations = [];
    this.warnings = [];
    this.suggestions = [];
    this.metrics = {
      averageFileSize: 0,
      largestFile: { path: '', lines: 0 },
      totalLines: 0,
      estimatedTokens: 0
    };
  }
  
  addViolation(file, rule, actual, limit) {
    this.violations.push({
      file,
      rule,
      actual,
      limit,
      severity: 'error'
    });
  }
  
  addWarning(file, rule, actual, limit) {
    this.warnings.push({
      file,
      rule,
      actual,
      limit,
      severity: 'warning'
    });
  }
  
  addSuggestion(message, file = null) {
    this.suggestions.push({ message, file });
  }
  
  isValid() {
    return this.violations.length === 0;
  }
  
  getScore() {
    const totalIssues = this.violations.length + (this.warnings.length * 0.5);
    const maxScore = 100;
    const penalty = Math.min(totalIssues * 5, maxScore);
    return Math.max(0, maxScore - penalty);
  }
}

/**
 * Main context validator
 */
class ContextValidator {
  constructor(options = {}) {
    this.options = {
      rootPath: options.rootPath || process.cwd(),
      strictMode: options.strictMode || false,
      excludePatterns: options.excludePatterns || [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/.git/**'
      ]
    };
    this.results = new ContextValidationResults();
  }
  
  /**
   * Validate entire project
   */
  async validateProject() {
    console.log('🧠 Validating Context Optimization...');
    
    try {
      const files = await this.discoverFiles();
      
      for (const filePath of files) {
        await this.validateFile(filePath);
      }
      
      this.calculateMetrics();
      this.generateSuggestions();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Context validation failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Discover all files to validate
   */
  async discoverFiles() {
    const files = [];
    
    async function scanDirectory(dirPath) {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!shouldExclude(fullPath)) {
            await scanDirectory(fullPath);
          }
        } else if (entry.isFile()) {
          if (shouldInclude(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    }
    
    const shouldExclude = (filePath) => {
      return this.options.excludePatterns.some(pattern => {
        return filePath.includes(pattern.replace('**/', '').replace('/**', ''));
      });
    };
    
    const shouldInclude = (filePath) => {
      const ext = path.extname(filePath);
      return ['.js', '.md', '.json', '.ts', '.jsx', '.tsx'].includes(ext);
    };
    
    await scanDirectory(this.options.rootPath);
    return files;
  }
  
  /**
   * Validate individual file
   */
  async validateFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').length;
      const fileType = this.determineFileType(filePath);
      
      this.results.totalFiles++;
      
      // Check file size limits
      const sizeLimit = CONTEXT_RULES.maxFileSize[fileType] || CONTEXT_RULES.maxFileSize.default;
      if (lines > sizeLimit) {
        if (this.options.strictMode || lines > sizeLimit * 1.5) {
          this.results.addViolation(filePath, 'file_size', lines, sizeLimit);
        } else {
          this.results.addWarning(filePath, 'file_size', lines, sizeLimit);
        }
      }
      
      // Estimate tokens
      const estimatedTokens = this.estimateTokens(content);
      const tokenLimit = CONTEXT_RULES.maxTokensPerFile[fileType] || CONTEXT_RULES.maxTokensPerFile.default;
      
      if (estimatedTokens > tokenLimit) {
        this.results.addWarning(filePath, 'token_count', estimatedTokens, tokenLimit);
      }
      
      // Update metrics
      this.results.metrics.totalLines += lines;
      this.results.metrics.estimatedTokens += estimatedTokens;
      
      if (lines > this.results.metrics.largestFile.lines) {
        this.results.metrics.largestFile = { path: filePath, lines };
      }
      
    } catch (error) {
      console.warn(`⚠️ Could not validate ${filePath}: ${error.message}`);
    }
  }
  
  /**
   * Determine file type from path
   */
  determineFileType(filePath) {
    const relativePath = path.relative(this.options.rootPath, filePath);
    
    for (const [type, patterns] of Object.entries(CONTEXT_RULES.patterns)) {
      for (const pattern of patterns) {
        const simplePattern = pattern.replace('**/', '').replace('*', '');
        if (relativePath.includes(simplePattern)) {
          return type;
        }
      }
    }
    
    return 'default';
  }
  
  /**
   * Estimate tokens from content
   */
  estimateTokens(content) {
    // Rough estimation: ~4 characters per token
    // Adjust for code vs documentation
    const baseTokens = Math.ceil(content.length / 4);
    
    // Code files tend to be more token-dense
    if (content.includes('function') || content.includes('class') || content.includes('const')) {
      return Math.ceil(baseTokens * 1.2);
    }
    
    return baseTokens;
  }
  
  /**
   * Calculate summary metrics
   */
  calculateMetrics() {
    if (this.results.totalFiles > 0) {
      this.results.metrics.averageFileSize = Math.round(
        this.results.metrics.totalLines / this.results.totalFiles
      );
    }
  }
  
  /**
   * Generate improvement suggestions
   */
  generateSuggestions() {
    // Suggest splitting large files
    const largeFiles = this.results.violations.filter(v => v.rule === 'file_size');
    if (largeFiles.length > 0) {
      this.results.addSuggestion(
        `Split ${largeFiles.length} oversized files using modular design patterns`
      );
    }
    
    // Suggest documentation restructuring
    const largeDocs = this.results.warnings.filter(v => 
      v.rule === 'file_size' && v.file.endsWith('.md')
    );
    if (largeDocs.length > 0) {
      this.results.addSuggestion(
        'Break large documentation into focused sections with cross-references'
      );
    }
    
    // Suggest progressive enhancement
    if (this.results.metrics.averageFileSize > 80) {
      this.results.addSuggestion(
        'Consider implementing progressive enhancement pattern for complex modules'
      );
    }
    
    // Context utilization suggestions
    const utilizationRate = (this.results.metrics.estimatedTokens / (this.results.totalFiles * 2000)) * 100;
    if (utilizationRate > 70) {
      this.results.addSuggestion(
        'High context utilization detected - consider micro-module architecture'
      );
    }
  }
}

/**
 * Generate context optimization report
 */
function generateReport(results) {
  console.log('\n📊 CONTEXT OPTIMIZATION REPORT');
  console.log('═'.repeat(50));
  
  // Overall score
  const score = results.getScore();
  const scoreIcon = score >= 90 ? '🏆' : score >= 70 ? '✅' : score >= 50 ? '⚠️' : '❌';
  console.log(`${scoreIcon} Overall Score: ${score}/100`);
  
  // Summary metrics
  console.log('\n📈 METRICS:');
  console.log(`   📁 Total Files: ${results.totalFiles}`);
  console.log(`   📏 Average File Size: ${results.metrics.averageFileSize} lines`);
  console.log(`   📄 Largest File: ${results.metrics.largestFile.lines} lines (${path.basename(results.metrics.largestFile.path)})`);
  console.log(`   🧮 Estimated Tokens: ${results.metrics.estimatedTokens.toLocaleString()}`);
  
  // Violations
  if (results.violations.length > 0) {
    console.log('\n❌ VIOLATIONS:');
    results.violations.forEach(violation => {
      console.log(`   ${path.basename(violation.file)}: ${violation.actual} > ${violation.limit} ${violation.rule}`);
    });
  }
  
  // Warnings
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.warnings.slice(0, 5).forEach(warning => {
      console.log(`   ${path.basename(warning.file)}: ${warning.actual} > ${warning.limit} ${warning.rule}`);
    });
    if (results.warnings.length > 5) {
      console.log(`   ... and ${results.warnings.length - 5} more`);
    }
  }
  
  // Suggestions
  if (results.suggestions.length > 0) {
    console.log('\n💡 SUGGESTIONS:');
    results.suggestions.forEach(suggestion => {
      console.log(`   • ${suggestion.message}`);
    });
  }
  
  // Status
  console.log('\n' + '═'.repeat(50));
  if (results.isValid()) {
    console.log('✅ Context optimization standards met!');
  } else {
    console.log('❌ Context optimization violations found');
    console.log('💡 Run with --fix flag to get specific refactoring suggestions');
  }
  
  return results.isValid();
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    rootPath: args[0] || process.cwd(),
    strictMode: args.includes('--strict'),
    fixMode: args.includes('--fix')
  };
  
  const validator = new ContextValidator(options);
  
  validator.validateProject()
    .then(results => {
      const isValid = generateReport(results);
      
      if (options.fixMode) {
        console.log('\n🔧 REFACTORING SUGGESTIONS:');
        // Add specific refactoring suggestions here
      }
      
      process.exit(isValid ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  ContextValidator,
  ContextValidationResults,
  CONTEXT_RULES,
  generateReport
};
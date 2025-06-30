#!/usr/bin/env node

/**
 * Pre-Merge Validation Script
 * 
 * Validates repository against AI Development Standards before merge
 * Prevents context optimization violations from entering main branch
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// Import validation modules
const ContextValidator = require('./validate-context');
const { CONTEXT_RULES } = require('../src/validation/config');

class PreMergeValidator {
  constructor(options = {}) {
    this.options = {
      strict: options.strict || false,
      failOnWarnings: options.failOnWarnings || false,
      ...options
    };
    this.violations = [];
    this.warnings = [];
  }

  /**
   * Run complete pre-merge validation
   */
  async validate() {
    console.log('🔍 Running Pre-Merge Validation...');
    console.log('=' .repeat(50));

    try {
      // 1. Context optimization validation
      await this.validateContextOptimization();
      
      // 2. Code quality checks
      await this.validateCodeQuality();
      
      // 3. Security validation
      await this.validateSecurity();
      
      // 4. Documentation validation
      await this.validateDocumentation();
      
      // 5. Test coverage validation
      await this.validateTestCoverage();
      
      // Generate final report
      return this.generateReport();
      
    } catch (error) {
      console.error('❌ Pre-merge validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Validate context optimization compliance
   */
  async validateContextOptimization() {
    console.log('\n🧠 Context Optimization Validation');
    
    const validator = new ContextValidator({
      rootPath: process.cwd(),
      strictMode: this.options.strict
    });
    
    const results = await validator.validateProject();
    
    if (results.violations.length > 0) {
      console.log(`❌ Found ${results.violations.length} context violations:`);
      results.violations.forEach(violation => {
        console.log(`   ${path.basename(violation.file)}: ${violation.actual} > ${violation.limit} lines`);
        this.violations.push({
          type: 'context',
          file: violation.file,
          message: `File exceeds ${violation.rule} limit (${violation.actual}/${violation.limit})`,
          severity: 'error'
        });
      });
    }
    
    if (results.warnings.length > 0) {
      console.log(`⚠️  Found ${results.warnings.length} context warnings:`);
      results.warnings.forEach(warning => {
        console.log(`   ${path.basename(warning.file)}: ${warning.actual} > ${warning.limit} ${warning.rule}`);
        this.warnings.push({
          type: 'context',
          file: warning.file,
          message: `File approaching ${warning.rule} limit (${warning.actual}/${warning.limit})`,
          severity: 'warning'
        });
      });
    }
    
    const score = results.getScore();
    console.log(`📊 Context Health Score: ${score}/100`);
    
    if (score < 80) {
      this.violations.push({
        type: 'context_health',
        message: `Context health score too low: ${score}/100 (minimum: 80)`,
        severity: 'error'
      });
    }
  }

  /**
   * Validate code quality standards
   */
  async validateCodeQuality() {
    console.log('\n🔧 Code Quality Validation');
    
    try {
      // Run linting if available
      if (await this.hasCommand('npm run lint')) {
        console.log('   Running ESLint...');
        const lintResult = execSync('npm run lint', { encoding: 'utf8' });
        console.log('   ✅ Linting passed');
      }
      
      // Check for TODO/FIXME comments in production files
      await this.checkForTodoComments();
      
      // Validate function complexity
      await this.validateComplexity();
      
    } catch (error) {
      this.violations.push({
        type: 'code_quality',
        message: `Code quality check failed: ${error.message}`,
        severity: 'error'
      });
    }
  }

  /**
   * Validate security compliance
   */
  async validateSecurity() {
    console.log('\n🔒 Security Validation');
    
    try {
      // Check for exposed secrets
      await this.scanForSecrets();
      
      // Validate dependency security
      if (await this.hasCommand('npm audit')) {
        console.log('   Running security audit...');
        const auditResult = execSync('npm audit --audit-level moderate', { encoding: 'utf8' });
        console.log('   ✅ Security audit passed');
      }
      
    } catch (error) {
      if (error.message.includes('vulnerabilities')) {
        this.violations.push({
          type: 'security',
          message: 'Security vulnerabilities found in dependencies',
          severity: 'error'
        });
      } else {
        this.warnings.push({
          type: 'security',
          message: `Security check warning: ${error.message}`,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Validate documentation requirements
   */
  async validateDocumentation() {
    console.log('\n📚 Documentation Validation');
    
    const requiredDocs = ['README.md'];
    const missingDocs = [];
    
    for (const doc of requiredDocs) {
      try {
        await fs.access(doc);
        console.log(`   ✅ ${doc} exists`);
      } catch {
        missingDocs.push(doc);
      }
    }
    
    if (missingDocs.length > 0) {
      this.violations.push({
        type: 'documentation',
        message: `Missing required documentation: ${missingDocs.join(', ')}`,
        severity: 'error'
      });
    }
    
    // Check for undocumented functions in new files
    await this.validateFunctionDocumentation();
  }

  /**
   * Validate test coverage
   */
  async validateTestCoverage() {
    console.log('\n🧪 Test Coverage Validation');
    
    try {
      if (await this.hasCommand('npm test')) {
        console.log('   Running tests...');
        const testResult = execSync('npm test', { encoding: 'utf8' });
        console.log('   ✅ Tests passed');
        
        // Extract coverage if available
        const coverageMatch = testResult.match(/All files\s+\|\s+(\d+\.?\d*)/);
        if (coverageMatch) {
          const coverage = parseFloat(coverageMatch[1]);
          console.log(`   📊 Test Coverage: ${coverage}%`);
          
          if (coverage < 70) {
            this.warnings.push({
              type: 'test_coverage',
              message: `Low test coverage: ${coverage}% (recommended: >70%)`,
              severity: 'warning'
            });
          }
        }
      }
    } catch (error) {
      this.violations.push({
        type: 'testing',
        message: `Tests failed: ${error.message}`,
        severity: 'error'
      });
    }
  }

  /**
   * Check for TODO/FIXME comments
   */
  async checkForTodoComments() {
    const files = await this.getSourceFiles();
    let todoCount = 0;
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const todos = content.match(/\/\*\*?.*?(TODO|FIXME|XXX).*?\*\//gi) || [];
      todoCount += todos.length;
      
      if (todos.length > 0) {
        this.warnings.push({
          type: 'code_quality',
          file,
          message: `Contains ${todos.length} TODO/FIXME comments`,
          severity: 'warning'
        });
      }
    }
    
    if (todoCount > 10) {
      this.violations.push({
        type: 'code_quality',
        message: `Too many TODO comments: ${todoCount} (maximum: 10)`,
        severity: 'error'
      });
    }
  }

  /**
   * Scan for exposed secrets
   */
  async scanForSecrets() {
    const files = await this.getSourceFiles();
    const secretPatterns = [
      /password\s*[=:]\s*["'][^"']+["']/i,
      /api[_-]?key\s*[=:]\s*["'][^"']+["']/i,
      /secret\s*[=:]\s*["'][^"']+["']/i,
      /token\s*[=:]\s*["'][^"']+["']/i
    ];
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      
      for (const pattern of secretPatterns) {
        if (pattern.test(content)) {
          this.violations.push({
            type: 'security',
            file,
            message: 'Potential hardcoded secret detected',
            severity: 'error'
          });
        }
      }
    }
  }

  /**
   * Validate function documentation
   */
  async validateFunctionDocumentation() {
    const files = await this.getSourceFiles();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      
      // Find function declarations
      const functions = content.match(/(?:function\s+\w+|const\s+\w+\s*=\s*(?:async\s+)?function|const\s+\w+\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/g) || [];
      
      // Check for JSDoc comments
      const docComments = content.match(/\/\*\*[\s\S]*?\*\//g) || [];
      
      if (functions.length > docComments.length) {
        this.warnings.push({
          type: 'documentation',
          file,
          message: `${functions.length} functions but only ${docComments.length} documented`,
          severity: 'warning'
        });
      }
    }
  }

  /**
   * Generate final validation report
   */
  generateReport() {
    console.log('\n📋 PRE-MERGE VALIDATION REPORT');
    console.log('=' .repeat(50));
    
    const totalIssues = this.violations.length + this.warnings.length;
    const passed = this.violations.length === 0 && (!this.options.failOnWarnings || this.warnings.length === 0);
    
    if (passed) {
      console.log('✅ All validations passed!');
    } else {
      console.log('❌ Validation failed!');
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   Violations: ${this.violations.length}`);
    console.log(`   Warnings: ${this.warnings.length}`);
    console.log(`   Total Issues: ${totalIssues}`);
    
    if (this.violations.length > 0) {
      console.log('\n❌ VIOLATIONS (must fix):');
      this.violations.forEach((violation, index) => {
        console.log(`   ${index + 1}. [${violation.type}] ${violation.message}`);
        if (violation.file) {
          console.log(`      File: ${path.basename(violation.file)}`);
        }
      });
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS (should fix):');
      this.warnings.slice(0, 5).forEach((warning, index) => {
        console.log(`   ${index + 1}. [${warning.type}] ${warning.message}`);
        if (warning.file) {
          console.log(`      File: ${path.basename(warning.file)}`);
        }
      });
      
      if (this.warnings.length > 5) {
        console.log(`   ... and ${this.warnings.length - 5} more warnings`);
      }
    }
    
    console.log('\n' + '=' .repeat(50));
    
    if (!passed) {
      console.log('🛑 MERGE BLOCKED - Fix violations before merging');
      console.log('💡 Run individual validation commands for detailed analysis:');
      console.log('   npm run validate-context-v2');
      console.log('   npm run full-analysis');
    } else {
      console.log('🚀 Ready to merge!');
    }
    
    return {
      passed,
      violations: this.violations,
      warnings: this.warnings,
      totalIssues
    };
  }

  // Helper methods
  async hasCommand(command) {
    try {
      execSync(`which ${command.split(' ')[0]}`, { stdio: 'ignore' });
      return true;
    } catch {
      return false;
    }
  }

  async getSourceFiles() {
    const extensions = ['.js', '.ts', '.jsx', '.tsx'];
    const files = [];
    
    async function scanDir(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
          await scanDir(fullPath);
        } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
          files.push(fullPath);
        }
      }
    }
    
    await scanDir(process.cwd());
    return files;
  }

  async validateComplexity() {
    // Basic complexity check - count nested blocks
    const files = await this.getSourceFiles();
    
    for (const file of files) {
      const content = await fs.readFile(file, 'utf8');
      const lines = content.split('\n');
      
      let maxNesting = 0;
      let currentNesting = 0;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.includes('{')) currentNesting++;
        if (trimmed.includes('}')) currentNesting--;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      
      if (maxNesting > 6) {
        this.warnings.push({
          type: 'complexity',
          file,
          message: `High nesting level: ${maxNesting} (recommended: <6)`,
          severity: 'warning'
        });
      }
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    strict: args.includes('--strict'),
    failOnWarnings: args.includes('--fail-on-warnings')
  };
  
  const validator = new PreMergeValidator(options);
  
  validator.validate()
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Pre-merge validation crashed:', error.message);
      process.exit(1);
    });
}

module.exports = PreMergeValidator;
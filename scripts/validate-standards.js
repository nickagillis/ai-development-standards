const fs = require('fs');
const path = require('path');
const { ContextValidator } = require('./validate-context');

class StandardsValidator {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      errors: []
    };
  }

  async validateAll() {
    console.log('🧪 Validating AI Development Standards...\n');
    
    await this.validateDocumentation();
    await this.validateTemplates();
    await this.validateConfigurations();
    await this.validateCommunityWisdomEngine();
    await this.validateContextOptimization();
    
    this.printResults();
  }

  async validateDocumentation() {
    console.log('📚 Validating Documentation...');
    
    // Check all required markdown files exist
    const requiredFiles = [
      'README.md',
      'architecture/requirements.md',
      'architecture/memory-patterns.md',
      'architecture/modular-design.md',
      'checklists/pre-development.md',
      'checklists/code-review.md',
      'checklists/merge-readiness.md',
      'docs/security.md',
      'docs/experimental-dependencies.md',
      'docs/future-roadmap.md',
      'docs/how-to-use.md',
      'docs/standards-validation.md',
      'docs/validation-framework.md',
      'docs/community-wisdom-engine.md',
      'docs/context-optimization.md',
      'docs/handoff-instructions.md'
    ];
    
    for (const file of requiredFiles) {
      this.checkFileExists(file);
    }
    
    // Check template files
    const templateFiles = [
      'templates/node-api/README.md',
      'templates/micro-module/README.md'
    ];
    
    for (const file of templateFiles) {
      this.checkFileExists(file);
    }
  }

  async validateTemplates() {
    console.log('🏗️ Validating Templates...');
    
    // Check if template directories exist
    const templateDirs = [
      'templates/node-api',
      'templates/micro-module'
    ];
    
    for (const dir of templateDirs) {
      if (fs.existsSync(dir)) {
        this.pass(`Template directory exists: ${dir}`);
        
        // Check for README in template
        const readmePath = path.join(dir, 'README.md');
        if (fs.existsSync(readmePath)) {
          this.pass(`Template has README: ${dir}`);
        } else {
          this.fail(`Template missing README: ${dir}`);
        }
        
        // Check micro-module template completeness
        if (dir === 'templates/micro-module') {
          const requiredFiles = ['index.js', 'config.js', 'utils.js', 'test.js'];
          for (const file of requiredFiles) {
            const filePath = path.join(dir, file);
            if (fs.existsSync(filePath)) {
              this.pass(`Micro-module template has ${file}`);
            } else {
              this.fail(`Micro-module template missing ${file}`);
            }
          }
        }
      } else {
        this.fail(`Template directory missing: ${dir}`);
      }
    }
  }

  async validateConfigurations() {
    console.log('⚙️ Validating Configurations...');
    
    // Check if any JSON files in the repo are valid
    const jsonFiles = this.findJsonFiles('.');
    
    for (const file of jsonFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        JSON.parse(content);
        this.pass(`Valid JSON: ${file}`);
      } catch (error) {
        this.fail(`Invalid JSON in ${file}: ${error.message}`);
      }
    }
  }

  async validateCommunityWisdomEngine() {
    console.log('🧠 Validating Community Wisdom Engine...');
    
    // Check if community wisdom engine documentation exists
    const communityWisdomFile = 'docs/community-wisdom-engine.md';
    this.checkFileExists(communityWisdomFile);
    
    // Validate Red Zone classification in experimental dependencies
    const expDepFile = 'docs/experimental-dependencies.md';
    if (fs.existsSync(expDepFile)) {
      const content = fs.readFileSync(expDepFile, 'utf8');
      if (content.includes('Community Wisdom Engine') && content.includes('Red Zone')) {
        this.pass('Community Wisdom Engine properly classified as Red Zone');
      } else {
        this.fail('Community Wisdom Engine missing Red Zone classification');
      }
    } else {
      this.fail('Experimental dependencies documentation missing');
    }
    
    // Check README integration
    if (fs.existsSync('README.md')) {
      const readmeContent = fs.readFileSync('README.md', 'utf8');
      if (readmeContent.includes('v1.5') && readmeContent.includes('Community Wisdom')) {
        this.pass('README.md properly updated for v1.5 with Community Wisdom Engine');
      } else {
        this.fail('README.md missing v1.5 or Community Wisdom Engine references');
      }
    }
  }

  async validateContextOptimization() {
    console.log('🧠 Validating Context Optimization Framework...');
    
    try {
      // Check if context optimization files exist
      this.checkFileExists('docs/context-optimization.md');
      this.checkFileExists('architecture/modular-design.md');
      this.checkFileExists('scripts/validate-context.js');
      
      // Run context validation on the standards repository itself
      const contextValidator = new ContextValidator({
        rootPath: process.cwd(),
        strictMode: false
      });
      
      const contextResults = await contextValidator.validateProject();
      
      if (contextResults.isValid()) {
        this.pass('Context optimization standards met');
        this.pass(`Context health score: ${contextResults.getScore()}/100`);
      } else {
        this.fail(`Context violations found: ${contextResults.violations.length} files exceed limits`);
        
        // Show top violations
        const topViolations = contextResults.violations.slice(0, 3);
        for (const violation of topViolations) {
          this.fail(`${path.basename(violation.file)}: ${violation.actual} > ${violation.limit} lines`);
        }
      }
      
      // Check context health metrics
      if (contextResults.metrics.averageFileSize <= 80) {
        this.pass(`Good average file size: ${contextResults.metrics.averageFileSize} lines`);
      } else {
        this.fail(`High average file size: ${contextResults.metrics.averageFileSize} lines`);
      }
      
      // Check for context optimization in README
      if (fs.existsSync('README.md')) {
        const readmeContent = fs.readFileSync('README.md', 'utf8');
        if (readmeContent.includes('Context Optimization') || readmeContent.includes('context optimization')) {
          this.pass('README.md includes context optimization documentation');
        } else {
          this.fail('README.md missing context optimization references');
        }
      }
      
    } catch (error) {
      this.fail(`Context validation failed: ${error.message}`);
    }
  }

  findJsonFiles(dir) {
    const jsonFiles = [];
    
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        jsonFiles.push(...this.findJsonFiles(filePath));
      } else if (file.endsWith('.json')) {
        jsonFiles.push(filePath);
      }
    }
    
    return jsonFiles;
  }

  checkFileExists(filePath) {
    if (fs.existsSync(filePath)) {
      this.pass(`File exists: ${filePath}`);
    } else {
      this.fail(`Missing file: ${filePath}`);
    }
  }

  pass(message) {
    console.log(`  ✅ ${message}`);
    this.results.passed++;
  }

  fail(message) {
    console.log(`  ❌ ${message}`);
    this.results.failed++;
    this.results.errors.push(message);
  }

  printResults() {
    console.log('\n📊 Validation Results:');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\n🚨 Errors to fix:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
      
      console.log('\n💡 Next steps:');
      console.log('  1. Review the failed validations above');
      console.log('  2. Create missing files or fix issues');
      console.log('  3. Run validation again: npm run validate');
      console.log('  4. For context issues: npm run validate-context');
      
      process.exit(1);
    } else {
      console.log('\n🎉 All standards validated successfully!');
      console.log('\n✅ Your AI development standards are ready to use.');
      console.log('\n🧠 Community Wisdom Engine: Red Zone experimental dependency properly integrated');
      console.log('\n🧠 Context Optimization: Framework validated and ready for use');
      console.log('\n🚀 Ready to apply these standards to workspace monitoring project!');
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new StandardsValidator();
  validator.validateAll().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = StandardsValidator;

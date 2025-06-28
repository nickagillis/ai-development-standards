const fs = require('fs');
const path = require('path');

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
    
    this.printResults();
  }

  async validateDocumentation() {
    console.log('📚 Validating Documentation...');
    
    // Check all required markdown files exist
    const requiredFiles = [
      'README.md',
      'architecture/requirements.md',
      'architecture/memory-patterns.md',
      'checklists/pre-development.md',
      'checklists/code-review.md',
      'docs/security.md',
      'docs/experimental-dependencies.md',
      'docs/future-roadmap.md',
      'docs/how-to-use.md',
      'docs/standards-validation.md'
    ];
    
    for (const file of requiredFiles) {
      this.checkFileExists(file);
    }
    
    // Check template files
    const templateFiles = [
      'templates/node-api/README.md'
    ];
    
    for (const file of templateFiles) {
      this.checkFileExists(file);
    }
  }

  async validateTemplates() {
    console.log('🏗️ Validating Templates...');
    
    // Check if template directories exist
    const templateDirs = [
      'templates/node-api'
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
      console.log('  3. Run validation again: node scripts/validate-standards.js');
      
      process.exit(1);
    } else {
      console.log('\n🎉 All standards validated successfully!');
      console.log('\n✅ Your AI development standards are ready to use.');
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

/**
 * Core Context Validator
 * 
 * Main validation engine for context optimization
 */

const fs = require('fs').promises;
const path = require('path');
const { CONTEXT_RULES } = require('./config');
const ContextValidationResults = require('./results');
const FileDiscovery = require('./file-discovery');

class ContextValidator {
  constructor(options) {
    this.options = options;
    this.results = new ContextValidationResults();
    this.fileDiscovery = new FileDiscovery(options);
  }
  
  /**
   * Validate entire project
   */
  async validateProject() {
    console.log('🧠 Validating Context Optimization...');
    
    try {
      const files = await this.fileDiscovery.discoverFiles();
      
      for (const filePath of files) {
        await this.validateFile(filePath);
      }
      
      this.results.calculateMetrics();
      this.generateSuggestions();
      
      return this.results;
      
    } catch (error) {
      console.error('❌ Context validation failed:', error.message);
      throw error;
    }
  }
  
  /**
   * Validate individual file
   */
  async validateFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').length;
      const fileType = this.determineFileType(filePath);
      const tokens = this.estimateTokens(content);
      
      this.results.updateMetrics(filePath, lines, tokens);
      this.checkFileSize(filePath, fileType, lines);
      this.checkTokenCount(filePath, fileType, tokens);
      
    } catch (error) {
      console.warn(`⚠️ Could not validate ${filePath}: ${error.message}`);
    }
  }
  
  /**
   * Check file size against limits
   */
  checkFileSize(filePath, fileType, lines) {
    const limit = CONTEXT_RULES.maxFileSize[fileType] || CONTEXT_RULES.maxFileSize.default;
    
    if (lines > limit) {
      if (this.options.strictMode || lines > limit * 1.5) {
        this.results.addViolation(filePath, 'file_size', lines, limit);
      } else {
        this.results.addWarning(filePath, 'file_size', lines, limit);
      }
    }
  }
  
  /**
   * Check token count against limits
   */
  checkTokenCount(filePath, fileType, tokens) {
    const limit = CONTEXT_RULES.maxTokensPerFile[fileType] || CONTEXT_RULES.maxTokensPerFile.default;
    
    if (tokens > limit) {
      this.results.addWarning(filePath, 'token_count', tokens, limit);
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
   * Estimate token count from content
   */
  estimateTokens(content) {
    const baseTokens = Math.ceil(content.length / 4);
    
    // Code files are more token-dense
    if (content.includes('function') || content.includes('class') || content.includes('const')) {
      return Math.ceil(baseTokens * 1.2);
    }
    
    return baseTokens;
  }
  
  /**
   * Generate improvement suggestions
   */
  generateSuggestions() {
    const largeFiles = this.results.violations.filter(v => v.rule === 'file_size');
    if (largeFiles.length > 0) {
      this.results.addSuggestion(
        `Split ${largeFiles.length} oversized files using modular design patterns`
      );
    }
    
    const largeDocs = this.results.warnings.filter(v => 
      v.rule === 'file_size' && v.file.endsWith('.md')
    );
    if (largeDocs.length > 0) {
      this.results.addSuggestion(
        'Break large documentation into focused sections with cross-references'
      );
    }
    
    if (this.results.metrics.averageFileSize > 80) {
      this.results.addSuggestion(
        'Consider implementing progressive enhancement pattern for complex modules'
      );
    }
  }
}

module.exports = ContextValidator;
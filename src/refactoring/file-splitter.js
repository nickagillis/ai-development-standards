/**
 * Automated File Splitter
 * 
 * Suggests and optionally implements file splitting for oversized modules
 */

const fs = require('fs').promises;
const path = require('path');

class FileSplitter {
  constructor(options = {}) {
    this.options = {
      dryRun: options.dryRun !== false,
      backupOriginal: options.backupOriginal !== false,
      ...options
    };
  }
  
  /**
   * Analyze file and suggest splitting strategies
   */
  async analyzeFile(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const analysis = this.analyzeContent(content);
    
    return {
      filePath,
      currentLines: content.split('\n').length,
      analysis,
      suggestions: this.generateSplittingSuggestions(analysis)
    };
  }
  
  /**
   * Analyze content structure
   */
  analyzeContent(content) {
    const lines = content.split('\n');
    const classes = this.findClasses(content);
    const functions = this.findFunctions(content);
    const imports = this.findImports(content);
    const exports = this.findExports(content);
    
    return {
      totalLines: lines.length,
      classes,
      functions,
      imports,
      exports,
      complexity: this.calculateComplexity(content)
    };
  }
  
  /**
   * Find class definitions
   */
  findClasses(content) {
    const classRegex = /class\s+(\w+)\s*(?:extends\s+\w+)?\s*\{/g;
    const classes = [];
    let match;
    
    while ((match = classRegex.exec(content)) !== null) {
      classes.push({
        name: match[1],
        startLine: content.substring(0, match.index).split('\n').length,
        type: 'class'
      });
    }
    
    return classes;
  }
  
  /**
   * Find function definitions
   */
  findFunctions(content) {
    const functionRegex = /(?:function\s+(\w+)|const\s+(\w+)\s*=\s*(?:async\s+)?function|const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>)/g;
    const functions = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      const name = match[1] || match[2] || match[3];
      functions.push({
        name,
        startLine: content.substring(0, match.index).split('\n').length,
        type: 'function'
      });
    }
    
    return functions;
  }
  
  /**
   * Find import statements
   */
  findImports(content) {
    const importRegex = /^(?:const\s+.*=\s*require\(|import\s+.*from\s+).*$/gm;
    return content.match(importRegex) || [];
  }
  
  /**
   * Find export statements
   */
  findExports(content) {
    const exportRegex = /^(?:module\.exports|exports\.|export\s+).*$/gm;
    return content.match(exportRegex) || [];
  }
  
  /**
   * Calculate complexity score
   */
  calculateComplexity(content) {
    const cyclomaticIndicators = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /catch\s*\(/g,
      /case\s+.*:/g,
      /&&|\|\|/g
    ];
    
    let complexity = 1; // Base complexity
    cyclomaticIndicators.forEach(regex => {
      const matches = content.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }
  
  /**
   * Generate splitting suggestions
   */
  generateSplittingSuggestions(analysis) {
    const suggestions = [];
    
    // Suggest class extraction
    if (analysis.classes.length > 1) {
      suggestions.push({
        type: 'extract_classes',
        description: `Extract ${analysis.classes.length} classes into separate files`,
        files: analysis.classes.map(cls => `${cls.name.toLowerCase()}.js`)
      });
    }
    
    // Suggest utility extraction
    if (analysis.functions.length > 5) {
      suggestions.push({
        type: 'extract_utilities',
        description: 'Extract utility functions into separate module',
        files: ['utils.js']
      });
    }
    
    // Suggest configuration extraction
    if (analysis.complexity > 15) {
      suggestions.push({
        type: 'extract_config',
        description: 'Extract configuration into separate module',
        files: ['config.js']
      });
    }
    
    return suggestions;
  }
  
  /**
   * Generate refactoring plan
   */
  generateRefactoringPlan(analysis) {
    return {
      originalFile: analysis.filePath,
      targetFiles: this.calculateTargetFiles(analysis),
      dependencies: this.analyzeDependencies(analysis),
      steps: this.generateRefactoringSteps(analysis)
    };
  }
}

module.exports = FileSplitter;
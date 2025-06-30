/**
 * Code Complexity Analyzer
 * 
 * Analyzes code complexity to identify refactoring opportunities
 */

class ComplexityAnalyzer {
  constructor() {
    this.thresholds = {
      cyclomatic: 10,     // McCabe complexity threshold
      cognitive: 15,      // Cognitive complexity threshold
      nesting: 4,         // Maximum nesting depth
      functions: 8        // Functions per file
    };
  }
  
  /**
   * Analyze file complexity
   */
  analyze(content, filePath) {
    const metrics = {
      filePath,
      cyclomatic: this.calculateCyclomaticComplexity(content),
      cognitive: this.calculateCognitiveComplexity(content),
      nesting: this.calculateMaxNesting(content),
      functions: this.countFunctions(content),
      lines: content.split('\n').length
    };
    
    return {
      ...metrics,
      score: this.calculateComplexityScore(metrics),
      issues: this.identifyIssues(metrics),
      suggestions: this.generateSuggestions(metrics)
    };
  }
  
  /**
   * Calculate cyclomatic complexity
   */
  calculateCyclomaticComplexity(content) {
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bwhile\s*\(/g,
      /\bfor\s*\(/g,
      /\bdo\s*\{/g,
      /\bcatch\s*\(/g,
      /\bcase\s+.*:/g,
      /\&\&|\|\|/g,
      /\?\s*.*\s*:/g
    ];
    
    let complexity = 1; // Base complexity
    patterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    });
    
    return complexity;
  }
  
  /**
   * Calculate cognitive complexity (simplified)
   */
  calculateCognitiveComplexity(content) {
    const lines = content.split('\n');
    let cognitive = 0;
    let nestingLevel = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      // Increment nesting
      if (trimmed.includes('{')) {
        nestingLevel++;
      }
      
      // Decrement nesting
      if (trimmed.includes('}')) {
        nestingLevel = Math.max(0, nestingLevel - 1);
      }
      
      // Add cognitive load based on control structures
      if (/\b(if|while|for|switch)\b/.test(trimmed)) {
        cognitive += 1 + nestingLevel;
      }
      
      if (/\b(catch|finally)\b/.test(trimmed)) {
        cognitive += 1;
      }
    });
    
    return cognitive;
  }
  
  /**
   * Calculate maximum nesting depth
   */
  calculateMaxNesting(content) {
    const lines = content.split('\n');
    let maxNesting = 0;
    let currentNesting = 0;
    
    lines.forEach(line => {
      const trimmed = line.trim();
      
      if (trimmed.includes('{')) {
        currentNesting++;
        maxNesting = Math.max(maxNesting, currentNesting);
      }
      
      if (trimmed.includes('}')) {
        currentNesting = Math.max(0, currentNesting - 1);
      }
    });
    
    return maxNesting;
  }
  
  /**
   * Count functions in file
   */
  countFunctions(content) {
    const functionPatterns = [
      /function\s+\w+/g,
      /const\s+\w+\s*=\s*function/g,
      /const\s+\w+\s*=\s*\([^)]*\)\s*=>/g,
      /\w+\s*\([^)]*\)\s*\{/g
    ];
    
    let count = 0;
    functionPatterns.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        count += matches.length;
      }
    });
    
    return count;
  }
  
  /**
   * Calculate overall complexity score
   */
  calculateComplexityScore(metrics) {
    let score = 0;
    
    // Cyclomatic complexity penalty
    if (metrics.cyclomatic > this.thresholds.cyclomatic) {
      score += (metrics.cyclomatic - this.thresholds.cyclomatic) * 2;
    }
    
    // Cognitive complexity penalty
    if (metrics.cognitive > this.thresholds.cognitive) {
      score += (metrics.cognitive - this.thresholds.cognitive) * 1.5;
    }
    
    // Nesting penalty
    if (metrics.nesting > this.thresholds.nesting) {
      score += (metrics.nesting - this.thresholds.nesting) * 3;
    }
    
    // Function count penalty
    if (metrics.functions > this.thresholds.functions) {
      score += (metrics.functions - this.thresholds.functions) * 1;
    }
    
    return Math.round(score);
  }
  
  /**
   * Identify complexity issues
   */
  identifyIssues(metrics) {
    const issues = [];
    
    if (metrics.cyclomatic > this.thresholds.cyclomatic) {
      issues.push({
        type: 'cyclomatic_complexity',
        severity: 'warning',
        message: `Cyclomatic complexity (${metrics.cyclomatic}) exceeds threshold (${this.thresholds.cyclomatic})`
      });
    }
    
    if (metrics.cognitive > this.thresholds.cognitive) {
      issues.push({
        type: 'cognitive_complexity',
        severity: 'warning',
        message: `Cognitive complexity (${metrics.cognitive}) exceeds threshold (${this.thresholds.cognitive})`
      });
    }
    
    if (metrics.nesting > this.thresholds.nesting) {
      issues.push({
        type: 'deep_nesting',
        severity: 'error',
        message: `Nesting depth (${metrics.nesting}) exceeds threshold (${this.thresholds.nesting})`
      });
    }
    
    return issues;
  }
  
  /**
   * Generate improvement suggestions
   */
  generateSuggestions(metrics) {
    const suggestions = [];
    
    if (metrics.score > 10) {
      suggestions.push('Consider breaking this file into smaller, focused modules');
    }
    
    if (metrics.functions > this.thresholds.functions) {
      suggestions.push('Extract utility functions into separate modules');
    }
    
    if (metrics.nesting > this.thresholds.nesting) {
      suggestions.push('Reduce nesting by extracting complex logic into functions');
    }
    
    return suggestions;
  }
}

module.exports = ComplexityAnalyzer;
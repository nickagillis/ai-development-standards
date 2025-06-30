/**
 * Context Validation Results
 * 
 * Manages validation results, scoring, and reporting
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
  
  /**
   * Add a critical violation
   */
  addViolation(file, rule, actual, limit) {
    this.violations.push({
      file,
      rule,
      actual,
      limit,
      severity: 'error'
    });
  }
  
  /**
   * Add a warning
   */
  addWarning(file, rule, actual, limit) {
    this.warnings.push({
      file,
      rule,
      actual,
      limit,
      severity: 'warning'
    });
  }
  
  /**
   * Add improvement suggestion
   */
  addSuggestion(message, file = null) {
    this.suggestions.push({ message, file });
  }
  
  /**
   * Check if validation passed
   */
  isValid() {
    return this.violations.length === 0;
  }
  
  /**
   * Calculate context health score (0-100)
   */
  getScore() {
    const totalIssues = this.violations.length + (this.warnings.length * 0.5);
    const maxScore = 100;
    const penalty = Math.min(totalIssues * 5, maxScore);
    return Math.max(0, maxScore - penalty);
  }
  
  /**
   * Calculate summary metrics
   */
  calculateMetrics() {
    if (this.totalFiles > 0) {
      this.metrics.averageFileSize = Math.round(
        this.metrics.totalLines / this.totalFiles
      );
    }
  }
  
  /**
   * Update file metrics
   */
  updateMetrics(filePath, lines, tokens) {
    this.totalFiles++;
    this.metrics.totalLines += lines;
    this.metrics.estimatedTokens += tokens;
    
    if (lines > this.metrics.largestFile.lines) {
      this.metrics.largestFile = { path: filePath, lines };
    }
  }
}

module.exports = ContextValidationResults;
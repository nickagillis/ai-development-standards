#!/usr/bin/env node

/**
 * Automated File Refactoring Tool
 * 
 * Analyzes oversized files and provides refactoring guidance
 */

const FileSplitter = require('../src/refactoring/file-splitter');
const ComplexityAnalyzer = require('../src/analysis/complexity-analyzer');
const { CONTEXT_RULES } = require('../src/validation/config');
const fs = require('fs').promises;
const path = require('path');

class RefactoringTool {
  constructor(options = {}) {
    this.options = {
      dryRun: true,
      includeAnalysis: true,
      outputReport: true,
      ...options
    };
    
    this.fileSplitter = new FileSplitter(this.options);
    this.complexityAnalyzer = new ComplexityAnalyzer();
  }
  
  /**
   * Analyze project and suggest refactoring
   */
  async analyzeProject(rootPath = process.cwd()) {
    console.log('🔧 Analyzing project for refactoring opportunities...');
    
    const oversizedFiles = await this.findOversizedFiles(rootPath);
    const analysisResults = [];
    
    for (const filePath of oversizedFiles) {
      console.log(`   Analyzing: ${path.relative(rootPath, filePath)}`);
      
      const content = await fs.readFile(filePath, 'utf8');
      const splittingAnalysis = await this.fileSplitter.analyzeFile(filePath);
      const complexityAnalysis = this.complexityAnalyzer.analyze(content, filePath);
      
      analysisResults.push({
        filePath,
        splitting: splittingAnalysis,
        complexity: complexityAnalysis,
        refactoringPlan: this.generateRefactoringPlan(splittingAnalysis, complexityAnalysis)
      });
    }
    
    if (this.options.outputReport) {
      await this.generateReport(analysisResults);
    }
    
    return analysisResults;
  }
  
  /**
   * Find files that exceed size limits
   */
  async findOversizedFiles(rootPath) {
    const files = [];
    
    await this.scanDirectory(rootPath, files);
    
    const oversized = [];
    for (const filePath of files) {
      const content = await fs.readFile(filePath, 'utf8');
      const lines = content.split('\n').length;
      const fileType = this.determineFileType(filePath, rootPath);
      const limit = CONTEXT_RULES.maxFileSize[fileType] || CONTEXT_RULES.maxFileSize.default;
      
      if (lines > limit) {
        oversized.push(filePath);
      }
    }
    
    return oversized;
  }
  
  /**
   * Scan directory for relevant files
   */
  async scanDirectory(dirPath, files) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        if (!this.shouldExcludeDirectory(fullPath)) {
          await this.scanDirectory(fullPath, files);
        }
      } else if (entry.isFile()) {
        if (this.shouldIncludeFile(fullPath)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  /**
   * Determine file type for validation rules
   */
  determineFileType(filePath, rootPath) {
    const relativePath = path.relative(rootPath, filePath);
    
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
   * Generate comprehensive refactoring plan
   */
  generateRefactoringPlan(splittingAnalysis, complexityAnalysis) {
    const plan = {
      priority: this.calculateRefactoringPriority(splittingAnalysis, complexityAnalysis),
      strategies: [],
      estimatedEffort: this.estimateRefactoringEffort(splittingAnalysis, complexityAnalysis),
      benefits: this.calculateRefactoringBenefits(splittingAnalysis, complexityAnalysis)
    };
    
    // Add splitting strategies
    splittingAnalysis.suggestions.forEach(suggestion => {
      plan.strategies.push({
        type: 'splitting',
        description: suggestion.description,
        files: suggestion.files,
        effort: this.estimateStrategyEffort(suggestion)
      });
    });
    
    // Add complexity reduction strategies
    complexityAnalysis.suggestions.forEach(suggestion => {
      plan.strategies.push({
        type: 'complexity',
        description: suggestion,
        effort: 'medium'
      });
    });
    
    return plan;
  }
  
  /**
   * Calculate refactoring priority
   */
  calculateRefactoringPriority(splittingAnalysis, complexityAnalysis) {
    let score = 0;
    
    // Size penalty
    if (splittingAnalysis.currentLines > 200) {
      score += (splittingAnalysis.currentLines - 200) / 50;
    }
    
    // Complexity penalty
    score += complexityAnalysis.score / 5;
    
    if (score >= 10) return 'critical';
    if (score >= 5) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
  
  /**
   * Estimate refactoring effort
   */
  estimateRefactoringEffort(splittingAnalysis, complexityAnalysis) {
    const baseEffort = Math.ceil(splittingAnalysis.currentLines / 100);
    const complexityMultiplier = Math.max(1, complexityAnalysis.score / 10);
    
    const hours = Math.ceil(baseEffort * complexityMultiplier);
    
    if (hours <= 2) return 'low';
    if (hours <= 8) return 'medium';
    if (hours <= 16) return 'high';
    return 'very high';
  }
  
  /**
   * Calculate refactoring benefits
   */
  calculateRefactoringBenefits(splittingAnalysis, complexityAnalysis) {
    return {
      contextOptimization: Math.round((splittingAnalysis.currentLines / 100) * 10) / 10,
      maintainabilityImprovement: complexityAnalysis.score > 5 ? 'high' : 'medium',
      testabilityImprovement: splittingAnalysis.analysis.functions.length > 5 ? 'high' : 'medium',
      reuseabilityImprovement: 'medium'
    };
  }
  
  /**
   * Generate refactoring report
   */
  async generateReport(analysisResults) {
    const report = this.buildReport(analysisResults);
    
    console.log(report);
    
    if (this.options.outputReport) {
      await fs.writeFile('refactoring-report.md', report);
      console.log('\n📄 Detailed report saved to refactoring-report.md');
    }
  }
  
  /**
   * Build formatted report
   */
  buildReport(analysisResults) {
    let report = '# 🔧 Refactoring Analysis Report\n\n';
    
    report += `**Generated:** ${new Date().toISOString()}\n`;
    report += `**Files Analyzed:** ${analysisResults.length}\n\n`;
    
    // Summary
    const priorityCounts = analysisResults.reduce((acc, result) => {
      const priority = result.refactoringPlan.priority;
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});
    
    report += '## 📊 Summary\n\n';
    Object.entries(priorityCounts).forEach(([priority, count]) => {
      const icon = priority === 'critical' ? '🔴' : priority === 'high' ? '🟡' : '🟢';
      report += `- ${icon} **${priority.charAt(0).toUpperCase() + priority.slice(1)}**: ${count} files\n`;
    });
    
    // Detailed analysis
    report += '\n## 📋 Detailed Analysis\n\n';
    
    analysisResults.forEach((result, index) => {
      const fileName = path.basename(result.filePath);
      const priority = result.refactoringPlan.priority;
      const effort = result.refactoringPlan.estimatedEffort;
      
      report += `### ${index + 1}. ${fileName}\n\n`;
      report += `**Priority:** ${priority} | **Effort:** ${effort} | **Lines:** ${result.splitting.currentLines}\n\n`;
      
      report += '**Refactoring Strategies:**\n';
      result.refactoringPlan.strategies.forEach(strategy => {
        report += `- ${strategy.description}\n`;
      });
      
      if (result.complexity.issues.length > 0) {
        report += '\n**Complexity Issues:**\n';
        result.complexity.issues.forEach(issue => {
          report += `- ${issue.message}\n`;
        });
      }
      
      report += '\n---\n\n';
    });
    
    return report;
  }
  
  shouldExcludeDirectory(dirPath) {
    const excludePatterns = ['node_modules', '.git', 'dist', 'build'];
    return excludePatterns.some(pattern => dirPath.includes(pattern));
  }
  
  shouldIncludeFile(filePath) {
    const includeExtensions = ['.js', '.ts', '.jsx', '.tsx'];
    return includeExtensions.some(ext => filePath.endsWith(ext));
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--apply'),
    outputReport: !args.includes('--no-report')
  };
  
  const tool = new RefactoringTool(options);
  const rootPath = args[0] || process.cwd();
  
  tool.analyzeProject(rootPath)
    .then(results => {
      console.log(`\n✅ Analysis complete! Found ${results.length} files needing refactoring.`);
      if (options.dryRun) {
        console.log('💡 Run with --apply to implement suggestions.');
      }
    })
    .catch(error => {
      console.error('❌ Refactoring analysis failed:', error.message);
      process.exit(1);
    });
}

module.exports = RefactoringTool;
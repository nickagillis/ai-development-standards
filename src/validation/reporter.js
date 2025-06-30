/**
 * Context Validation Reporter
 * 
 * Generates comprehensive validation reports
 */

const path = require('path');

/**
 * Generate context optimization report
 */
function generateReport(results) {
  console.log('\n📊 CONTEXT OPTIMIZATION REPORT');
  console.log('═'.repeat(50));
  
  generateScoreSection(results);
  generateMetricsSection(results);
  generateViolationsSection(results);
  generateWarningsSection(results);
  generateSuggestionsSection(results);
  generateStatusSection(results);
  
  return results.isValid();
}

/**
 * Generate score section
 */
function generateScoreSection(results) {
  const score = results.getScore();
  const scoreIcon = getScoreIcon(score);
  console.log(`${scoreIcon} Overall Score: ${score}/100`);
}

/**
 * Generate metrics section
 */
function generateMetricsSection(results) {
  console.log('\n📈 METRICS:');
  console.log(`   📁 Total Files: ${results.totalFiles}`);
  console.log(`   📏 Average File Size: ${results.metrics.averageFileSize} lines`);
  console.log(`   📄 Largest File: ${results.metrics.largestFile.lines} lines (${path.basename(results.metrics.largestFile.path)})`);
  console.log(`   🧮 Estimated Tokens: ${results.metrics.estimatedTokens.toLocaleString()}`);
}

/**
 * Generate violations section
 */
function generateViolationsSection(results) {
  if (results.violations.length > 0) {
    console.log('\n❌ VIOLATIONS:');
    results.violations.forEach(violation => {
      console.log(`   ${path.basename(violation.file)}: ${violation.actual} > ${violation.limit} ${violation.rule}`);
    });
  }
}

/**
 * Generate warnings section
 */
function generateWarningsSection(results) {
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.warnings.slice(0, 5).forEach(warning => {
      console.log(`   ${path.basename(warning.file)}: ${warning.actual} > ${warning.limit} ${warning.rule}`);
    });
    if (results.warnings.length > 5) {
      console.log(`   ... and ${results.warnings.length - 5} more`);
    }
  }
}

/**
 * Generate suggestions section
 */
function generateSuggestionsSection(results) {
  if (results.suggestions.length > 0) {
    console.log('\n💡 SUGGESTIONS:');
    results.suggestions.forEach(suggestion => {
      console.log(`   • ${suggestion.message}`);
    });
  }
}

/**
 * Generate status section
 */
function generateStatusSection(results) {
  console.log('\n' + '═'.repeat(50));
  if (results.isValid()) {
    console.log('✅ Context optimization standards met!');
  } else {
    console.log('❌ Context optimization violations found');
    console.log('💡 Run with --fix flag to get specific refactoring suggestions');
  }
}

/**
 * Get score icon based on score value
 */
function getScoreIcon(score) {
  if (score >= 90) return '🏆';
  if (score >= 70) return '✅';
  if (score >= 50) return '⚠️';
  return '❌';
}

module.exports = {
  generateReport
};
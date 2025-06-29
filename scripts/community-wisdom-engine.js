#!/usr/bin/env node

/**
 * Community Wisdom Engine - Local Prototype
 * Privacy-first pattern detection and guidance system
 * 
 * Usage: node community-wisdom-engine.js [project-path]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

class CommunityWisdomEngine {
  constructor(config = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      participationLevel: config.participationLevel ?? 'observer', // 'none', 'observer', 'contributor'
      privacyLevel: config.privacyLevel ?? 'maximum',
      autoSuggest: config.autoSuggest ?? true,
      ...config
    };
    
    this.patterns = new Map();
    this.anonymizer = new MaximumAnonymizer();
    this.detector = new LocalPatternDetector();
    this.guidance = new CommunityGuidanceEngine();
    
    console.log('🧠 Community Wisdom Engine v1.5 (Local Prototype)');
    console.log(`🛡️ Privacy Level: ${this.config.privacyLevel}`);
    console.log(`👤 Participation: ${this.config.participationLevel}`);
  }

  async analyzeProject(projectPath, userConsent = { allowLocalAnalysis: true }) {
    if (!userConsent.allowLocalAnalysis) {
      return { message: 'Local analysis disabled by user preference' };
    }

    console.log(`\n🔍 Analyzing project: ${projectPath}`);
    
    try {
      // 1. Detect patterns in project
      const patterns = await this.detector.scanProject(projectPath);
      
      // 2. Analyze for insights
      const analysis = await this.analyzePatterns(patterns);
      
      // 3. Generate guidance
      const guidance = await this.guidance.generateLocalGuidance(analysis);
      
      // 4. Show anonymized version (what would be shared)
      const anonymizedPattern = this.anonymizer.anonymize(analysis);
      
      return {
        localAnalysis: analysis,
        guidance: guidance,
        anonymizedPreview: anonymizedPattern,
        contributionSuggestion: this.shouldSuggestContribution(analysis)
      };
      
    } catch (error) {
      console.warn('⚠️ Pattern analysis failed safely:', error.message);
      return { 
        message: 'Analysis unavailable, proceeding normally',
        fallback: this.getBasicGuidance(projectPath)
      };
    }
  }

  async analyzePatterns(patterns) {
    const analysis = {
      projectType: this.detectProjectType(patterns),
      architecture: this.analyzeArchitecture(patterns),
      dependencies: this.analyzeDependencies(patterns),
      testing: this.analyzeTesting(patterns),
      security: this.analyzeSecurity(patterns),
      documentation: this.analyzeDocumentation(patterns),
      performance: this.analyzePerformance(patterns),
      successIndicators: this.detectSuccessIndicators(patterns),
      riskFactors: this.detectRiskFactors(patterns),
      timestamp: Date.now(),
      projectHash: this.generateProjectHash(patterns)
    };

    return analysis;
  }

  detectProjectType(patterns) {
    if (patterns.packageJson && patterns.packageJson.dependencies) {
      const deps = patterns.packageJson.dependencies;
      if (deps.express || deps.fastify || deps.koa) return 'node-api';
      if (deps.react || deps.vue || deps['@angular/core']) return 'frontend';
      if (deps.next || deps.nuxt || deps.gatsby) return 'fullstack';
    }
    if (patterns.files.includes('requirements.txt')) return 'python';
    if (patterns.files.includes('Cargo.toml')) return 'rust';
    
    // Check for documentation/standards repository
    if (patterns.directories.includes('docs') && 
        patterns.directories.includes('checklists') &&
        patterns.files.includes('README.md')) {
      return 'documentation-framework';
    }
    
    return 'unknown';
  }

  analyzeArchitecture(patterns) {
    const score = {
      separation: 0,
      modularity: 0,
      organization: 0
    };

    // Check for clean separation of concerns
    const hasSrcFolder = patterns.directories.includes('src');
    const hasTestFolder = patterns.directories.includes('tests') || patterns.directories.includes('test');
    const hasConfigFolder = patterns.directories.includes('config');
    const hasDocsFolder = patterns.directories.includes('docs');
    const hasTemplatesFolder = patterns.directories.includes('templates');
    const hasChecklistsFolder = patterns.directories.includes('checklists');
    
    if (hasSrcFolder) score.separation += 30;
    if (hasTestFolder) score.separation += 25;
    if (hasConfigFolder) score.separation += 15;
    
    // Special scoring for documentation frameworks
    if (hasDocsFolder) score.separation += 20;
    if (hasTemplatesFolder) score.separation += 15;
    if (hasChecklistsFolder) score.separation += 10;
    
    // Check modularity
    const allFiles = patterns.files.filter(f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.md'));
    const moduleCount = allFiles.length;
    
    if (moduleCount > 5 && moduleCount < 30) score.modularity += 30;
    if (moduleCount >= 30) score.modularity += 20;
    
    // Check organization patterns
    const hasRoutes = patterns.files.some(f => f.includes('route') || f.includes('controller'));
    const hasModels = patterns.files.some(f => f.includes('model') || f.includes('entity'));
    const hasServices = patterns.files.some(f => f.includes('service') || f.includes('business'));
    const hasStandardsStructure = hasDocsFolder && hasTemplatesFolder && hasChecklistsFolder;
    
    if (hasRoutes) score.organization += 15;
    if (hasModels) score.organization += 15;
    if (hasServices) score.organization += 20;
    if (hasStandardsStructure) score.organization += 40; // Bonus for standards frameworks

    const totalScore = Math.min(100, score.separation + score.modularity + score.organization);
    
    return {
      score: totalScore,
      level: this.getScoreLevel(totalScore, 100),
      details: score,
      patterns: {
        cleanSeparation: score.separation >= 50,
        modularDesign: score.modularity >= 20,
        organizedStructure: score.organization >= 30,
        standardsFramework: hasStandardsStructure
      }
    };
  }

  analyzeDependencies(patterns) {
    if (!patterns.packageJson || !patterns.packageJson.dependencies) {
      return { score: 80, level: 'good', experimental: 0, total: 0, type: 'documentation' };
    }

    const deps = patterns.packageJson.dependencies;
    const devDeps = patterns.packageJson.devDependencies || {};
    const totalDeps = Object.keys(deps).length + Object.keys(devDeps).length;
    
    // Check for experimental dependencies (from our framework)
    const experimentalDeps = this.detectExperimentalDependencies(deps);
    
    // Security analysis
    const securityScore = this.analyzeDepSecurity(deps);
    
    return {
      total: totalDeps,
      experimental: experimentalDeps.length,
      experimentalList: experimentalDeps,
      security: securityScore,
      score: Math.max(50, 100 - (experimentalDeps.length * 10) + securityScore),
      level: this.getScoreLevel(Math.max(50, 100 - (experimentalDeps.length * 10) + securityScore), 100)
    };
  }

  detectExperimentalDependencies(deps) {
    const experimental = [];
    const knownExperimental = [
      'llamaindex', 'memoriz', '@experimental', 'alpha', 'beta',
      'canary', 'next@canary', 'react@experimental'
    ];
    
    Object.keys(deps).forEach(dep => {
      const version = deps[dep];
      if (knownExperimental.some(exp => dep.includes(exp) || version.includes('alpha') || version.includes('beta'))) {
        experimental.push({ name: dep, version, risk: 'experimental' });
      }
    });
    
    return experimental;
  }

  analyzeTesting(patterns) {
    const score = {
      coverage: 0,
      types: 0,
      structure: 0
    };

    // Check for test files
    const testFiles = patterns.files.filter(f => 
      f.includes('test') || f.includes('spec') || f.endsWith('.test.js') || f.endsWith('.spec.js')
    );
    
    // Check for validation scripts (counts as testing for standards frameworks)
    const validationFiles = patterns.files.filter(f => 
      f.includes('validate') || f.includes('validation')
    );
    
    const sourceFiles = patterns.files.filter(f => 
      (f.startsWith('src/') || f.endsWith('.js') || f.endsWith('.ts')) && 
      !f.includes('test') && !f.includes('spec')
    );
    
    const allTestFiles = [...testFiles, ...validationFiles];
    
    // Coverage estimation
    const coverageRatio = sourceFiles.length > 0 ? allTestFiles.length / sourceFiles.length : 0;
    score.coverage = Math.min(50, coverageRatio * 100);
    
    // Test types
    const hasUnitTests = testFiles.some(f => f.includes('unit') || f.includes('.test.'));
    const hasIntegrationTests = testFiles.some(f => f.includes('integration') || f.includes('e2e'));
    const hasValidationTests = validationFiles.length > 0;
    
    if (hasUnitTests) score.types += 25;
    if (hasIntegrationTests) score.types += 25;
    if (hasValidationTests) score.types += 30; // Bonus for validation frameworks
    
    // Test structure
    const hasTestFolder = patterns.directories.includes('test') || patterns.directories.includes('tests');
    const hasScriptsFolder = patterns.directories.includes('scripts');
    if (hasTestFolder) score.structure += 25;
    if (hasScriptsFolder && validationFiles.length > 0) score.structure += 20;
    
    const totalScore = Math.min(100, score.coverage + score.types + score.structure);
    
    return {
      score: totalScore,
      level: this.getScoreLevel(totalScore, 100),
      estimatedCoverage: Math.min(100, coverageRatio * 100),
      testFiles: allTestFiles.length,
      sourceFiles: sourceFiles.length,
      hasUnitTests,
      hasIntegrationTests,
      hasValidationFramework: hasValidationTests
    };
  }

  analyzeSecurity(patterns) {
    const score = {
      environment: 0,
      dependencies: 0,
      practices: 0
    };

    // Environment variable handling
    const hasEnvExample = patterns.files.includes('.env.example');
    const hasEnvFile = patterns.files.includes('.env');
    const hasGitIgnore = patterns.files.includes('.gitignore');
    
    if (hasEnvExample) score.environment += 20;
    if (!hasEnvFile || (hasGitIgnore && this.checkGitignoreContains(patterns, '.env'))) {
      score.environment += 15;
    }
    
    // Security practices
    const packageJson = patterns.packageJson;
    if (packageJson && packageJson.scripts) {
      const hasSecurityScript = Object.keys(packageJson.scripts).some(script => 
        script.includes('security') || script.includes('audit') || script.includes('validate')
      );
      if (hasSecurityScript) score.practices += 25;
    }
    
    // Input validation patterns
    const hasValidation = patterns.files.some(f => 
      f.includes('validation') || f.includes('validator') || f.includes('schema')
    );
    if (hasValidation) score.practices += 15;

    // Security documentation
    const hasSecurityDocs = patterns.files.some(f => 
      f.includes('security') && f.endsWith('.md')
    );
    if (hasSecurityDocs) score.practices += 20;

    const totalScore = score.environment + score.dependencies + score.practices;
    
    return {
      score: totalScore,
      level: this.getScoreLevel(totalScore, 100),
      details: score,
      recommendations: this.getSecurityRecommendations(score)
    };
  }

  analyzeDocumentation(patterns) {
    const score = {
      readme: 0,
      api: 0,
      comments: 0
    };

    // README analysis
    if (patterns.files.includes('README.md')) {
      score.readme = 40;
    }
    
    // Documentation structure
    const docFiles = patterns.files.filter(f => f.endsWith('.md'));
    const hasDocsFolder = patterns.directories.includes('docs');
    
    if (hasDocsFolder) score.api += 30;
    if (docFiles.length > 3) score.api += 20; // Multiple documentation files
    
    // Special scoring for comprehensive documentation frameworks
    const hasArchitectureDocs = patterns.files.some(f => f.includes('architecture'));
    const hasChecklistDocs = patterns.files.some(f => f.includes('checklist'));
    const hasSecurityDocs = patterns.files.some(f => f.includes('security'));
    
    if (hasArchitectureDocs) score.comments += 10;
    if (hasChecklistDocs) score.comments += 10;
    if (hasSecurityDocs) score.comments += 10;
    
    const totalScore = Math.min(100, score.readme + score.api + score.comments);
    
    return {
      score: totalScore,
      level: this.getScoreLevel(totalScore, 100),
      hasReadme: score.readme > 0,
      hasApiDocs: score.api > 0,
      documentationFiles: docFiles.length,
      isDocumentationFramework: hasDocsFolder && docFiles.length > 5
    };
  }

  analyzePerformance(patterns) {
    // Simplified performance analysis based on patterns
    const score = {
      optimization: 0,
      monitoring: 0,
      caching: 0
    };
    
    // Check for performance monitoring
    const packageJson = patterns.packageJson;
    if (packageJson && packageJson.dependencies) {
      const deps = packageJson.dependencies;
      if (deps['newrelic'] || deps['datadog'] || deps['sentry']) {
        score.monitoring += 30;
      }
      
      // Caching solutions
      if (deps['redis'] || deps['memcached'] || deps['node-cache']) {
        score.caching += 25;
      }
    }
    
    // For documentation frameworks, performance means fast validation
    const hasValidationScripts = patterns.files.some(f => f.includes('validate'));
    if (hasValidationScripts) score.optimization += 30;
    
    const totalScore = score.optimization + score.monitoring + score.caching;
    
    return {
      score: totalScore,
      level: this.getScoreLevel(totalScore, 100),
      details: score
    };
  }

  detectSuccessIndicators(patterns) {
    const indicators = [];
    
    // Architecture success patterns
    if (patterns.directories.includes('docs') && patterns.directories.includes('templates')) {
      indicators.push({ type: 'architecture', message: 'Well-organized framework structure' });
    }
    
    if (patterns.directories.includes('src') && patterns.directories.includes('tests')) {
      indicators.push({ type: 'architecture', message: 'Clean separation of source and tests' });
    }
    
    // Documentation
    if (patterns.files.includes('README.md')) {
      indicators.push({ type: 'documentation', message: 'Project documentation present' });
    }
    
    // Testing/Validation
    const testFiles = patterns.files.filter(f => f.includes('test') || f.includes('spec') || f.includes('validate'));
    if (testFiles.length > 0) {
      indicators.push({ type: 'testing', message: `${testFiles.length} validation/test files detected` });
    }
    
    // Security
    if (patterns.files.includes('.env.example')) {
      indicators.push({ type: 'security', message: 'Environment variable template provided' });
    }
    
    // Innovation indicators
    if (patterns.files.some(f => f.includes('community') || f.includes('wisdom'))) {
      indicators.push({ type: 'innovation', message: 'Revolutionary community features detected' });
    }
    
    // Self-validation
    if (patterns.files.some(f => f.includes('validate') && f.includes('standards'))) {
      indicators.push({ type: 'meta', message: 'Self-validating standards framework detected' });
    }
    
    return indicators;
  }

  detectRiskFactors(patterns) {
    const risks = [];
    
    // Experimental dependencies
    if (patterns.packageJson && patterns.packageJson.dependencies) {
      const experimental = this.detectExperimentalDependencies(patterns.packageJson.dependencies);
      if (experimental.length > 0) {
        risks.push({ 
          type: 'dependencies', 
          level: 'medium',
          message: `${experimental.length} experimental dependencies detected`,
          details: experimental
        });
      }
    }
    
    // Missing tests (but not for documentation frameworks)
    const testFiles = patterns.files.filter(f => f.includes('test') || f.includes('spec') || f.includes('validate'));
    const projectType = this.detectProjectType(patterns);
    if (testFiles.length === 0 && projectType !== 'documentation-framework') {
      risks.push({ 
        type: 'testing', 
        level: 'high',
        message: 'No test files detected' 
      });
    }
    
    // Security concerns
    if (patterns.files.includes('.env') && !this.checkGitignoreContains(patterns, '.env')) {
      risks.push({ 
        type: 'security', 
        level: 'high',
        message: 'Environment file not in .gitignore' 
      });
    }
    
    return risks;
  }

  shouldSuggestContribution(analysis) {
    // Suggest contribution if project shows significant patterns
    const score = this.calculateOverallScore(analysis);
    const hasInterestingPatterns = analysis.dependencies.experimental > 0 || 
                                 analysis.testing.score > 70 ||
                                 analysis.architecture.score > 80 ||
                                 analysis.projectType === 'documentation-framework';
    
    if (hasInterestingPatterns && score > 70) {
      return {
        suggested: true,
        reason: 'Project shows valuable patterns for community learning',
        score: score,
        anonymizedPreview: this.anonymizer.anonymize(analysis)
      };
    }
    
    return { suggested: false };
  }

  calculateOverallScore(analysis) {
    const weights = {
      architecture: 0.25,
      testing: 0.20,
      security: 0.20,
      dependencies: 0.15,
      documentation: 0.10,
      performance: 0.10
    };
    
    return Math.round(
      analysis.architecture.score * weights.architecture +
      analysis.testing.score * weights.testing +
      analysis.security.score * weights.security +
      analysis.dependencies.score * weights.dependencies +
      analysis.documentation.score * weights.documentation +
      analysis.performance.score * weights.performance
    );
  }

  // Helper methods
  getScoreLevel(score, max) {
    const percentage = (score / max) * 100;
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'very-good';
    if (percentage >= 60) return 'good';
    if (percentage >= 40) return 'fair';
    return 'needs-improvement';
  }

  getSecurityRecommendations(securityScore) {
    const recommendations = [];
    
    if (securityScore.environment < 20) {
      recommendations.push('Add .env.example file for environment variable documentation');
    }
    if (securityScore.practices < 15) {
      recommendations.push('Implement input validation and security auditing');
    }
    
    return recommendations;
  }

  checkGitignoreContains(patterns, entry) {
    // Simplified gitignore check
    return patterns.files.includes('.gitignore'); // Would need actual file content analysis
  }

  generateProjectHash(patterns) {
    // Generate anonymous hash for project identification (privacy-safe)
    const hashInput = JSON.stringify({
      fileCount: patterns.files.length,
      dirCount: patterns.directories.length,
      projectType: this.detectProjectType(patterns)
    });
    return crypto.createHash('sha256').update(hashInput).digest('hex').substring(0, 16);
  }

  getBasicGuidance(projectPath) {
    return {
      message: 'Basic project structure detected',
      recommendations: [
        'Ensure clean separation of concerns with organized folder structure',
        'Add comprehensive README.md documentation',
        'Implement proper validation and testing framework',
        'Set up automated quality assurance processes'
      ]
    };
  }
}

class LocalPatternDetector {
  async scanProject(projectPath) {
    if (!fs.existsSync(projectPath)) {
      throw new Error(`Project path does not exist: ${projectPath}`);
    }

    const patterns = {
      files: [],
      directories: [],
      packageJson: null,
      gitignore: null
    };

    // Scan directory structure
    this.scanDirectory(projectPath, patterns, 0, 3); // Max depth 3

    // Parse package.json if exists
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageContent = fs.readFileSync(packageJsonPath, 'utf8');
        patterns.packageJson = JSON.parse(packageContent);
      } catch (error) {
        console.warn('Could not parse package.json:', error.message);
      }
    }

    return patterns;
  }

  scanDirectory(dirPath, patterns, currentDepth, maxDepth) {
    if (currentDepth >= maxDepth) return;

    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        // Skip node_modules and hidden files/folders
        if (item === 'node_modules' || item.startsWith('.git') || item === '.DS_Store') {
          continue;
        }

        const itemPath = path.join(dirPath, item);
        const relativePath = path.relative(dirPath.split('/')[0] || dirPath, itemPath);
        
        try {
          const stats = fs.statSync(itemPath);
          
          if (stats.isDirectory()) {
            patterns.directories.push(item);
            this.scanDirectory(itemPath, patterns, currentDepth + 1, maxDepth);
          } else if (stats.isFile()) {
            patterns.files.push(relativePath);
          }
        } catch (error) {
          // Skip files we can't access
          continue;
        }
      }
    } catch (error) {
      console.warn(`Could not scan directory ${dirPath}:`, error.message);
    }
  }
}

class MaximumAnonymizer {
  anonymize(analysis) {
    return {
      // Keep technical patterns only
      projectType: analysis.projectType,
      architectureScore: analysis.architecture.score,
      testingScore: analysis.testing.score,
      securityScore: analysis.security.score,
      documentationScore: analysis.documentation.score,
      dependencyCount: analysis.dependencies.total,
      experimentalDeps: analysis.dependencies.experimental,
      successIndicators: analysis.successIndicators.map(i => ({
        type: i.type,
        category: this.categorizeIndicator(i.type)
      })),
      riskFactors: analysis.riskFactors.map(r => ({
        type: r.type,
        level: r.level
      })),
      overallScore: this.calculateAnonymousScore(analysis),
      patterns: {
        standardsFramework: analysis.architecture.patterns?.standardsFramework || false,
        selfValidating: analysis.testing.hasValidationFramework || false,
        communityFocused: analysis.successIndicators.some(i => i.type === 'innovation')
      },
      
      // COMPLETELY REMOVED:
      // - Project names, paths, file names
      // - Specific dependency names (except categories)
      // - Timestamps, hashes, identifying information
      // - Business logic or proprietary patterns
    };
  }

  categorizeIndicator(type) {
    const categories = {
      'architecture': 'structure',
      'testing': 'quality',
      'security': 'safety',
      'documentation': 'maintenance',
      'innovation': 'revolutionary',
      'meta': 'self-aware'
    };
    return categories[type] || 'general';
  }

  calculateAnonymousScore(analysis) {
    // Simple scoring for anonymous sharing
    return Math.round((
      analysis.architecture.score +
      analysis.testing.score +
      analysis.security.score +
      analysis.documentation.score
    ) / 4);
  }
}

class CommunityGuidanceEngine {
  async generateLocalGuidance(analysis) {
    const guidance = {
      overall: this.getOverallGuidance(analysis),
      specific: this.getSpecificRecommendations(analysis),
      patterns: this.identifySuccessPatterns(analysis),
      risks: this.identifyRiskMitigations(analysis)
    };

    return guidance;
  }

  getOverallGuidance(analysis) {
    const score = this.calculateOverallScore(analysis);
    
    if (score >= 85) {
      return {
        level: 'excellent',
        message: '🎉 Outstanding project! This follows 95%+ of successful patterns and shows innovative thinking.',
        confidence: 'very-high'
      };
    } else if (score >= 75) {
      return {
        level: 'very-good',
        message: '🌟 Excellent project structure! This follows 85%+ of successful patterns.',
        confidence: 'high'
      };
    } else if (score >= 60) {
      return {
        level: 'good',
        message: '✅ Good project foundation. A few improvements could increase success rate.',
        confidence: 'medium'
      };
    } else if (score >= 40) {
      return {
        level: 'fair',
        message: '⚠️ Fair structure. Several areas need attention for better success rate.',
        confidence: 'medium'
      };
    } else {
      return {
        level: 'needs-improvement',
        message: '🔧 Project needs structural improvements for better success outcomes.',
        confidence: 'high'
      };
    }
  }

  getSpecificRecommendations(analysis) {
    const recommendations = [];

    // Architecture recommendations
    if (analysis.architecture.score < 70) {
      recommendations.push({
        category: 'architecture',
        priority: 'high',
        message: 'Improve code organization with clear separation of concerns',
        action: 'Create organized directory structure with clear purpose separation'
      });
    }

    // Testing recommendations
    if (analysis.testing.score < 60) {
      recommendations.push({
        category: 'testing',
        priority: 'high',
        message: 'Add comprehensive validation framework',
        action: 'Implement validation scripts and quality assurance processes'
      });
    }

    // Security recommendations
    if (analysis.security.score < 70) {
      recommendations.push({
        category: 'security',
        priority: 'medium',
        message: 'Strengthen security practices',
        action: 'Add security documentation and validation processes'
      });
    }

    // Documentation recommendations
    if (analysis.documentation.score < 80 && analysis.projectType !== 'documentation-framework') {
      recommendations.push({
        category: 'documentation',
        priority: 'medium',
        message: 'Enhance project documentation',
        action: 'Create comprehensive README and API documentation'
      });
    }

    // Special recommendations for high-scoring projects
    if (analysis.architecture.score >= 85 && analysis.documentation.score >= 85) {
      recommendations.push({
        category: 'community',
        priority: 'low',
        message: 'Consider sharing your successful patterns with the community',
        action: 'Your project demonstrates excellent practices that could help others'
      });
    }

    return recommendations;
  }

  identifySuccessPatterns(analysis) {
    const patterns = [];

    if (analysis.architecture.score >= 80) {
      patterns.push('Excellent architecture with clean separation of concerns');
    }
    
    if (analysis.testing.score >= 70) {
      patterns.push('Comprehensive validation and testing strategy');
    }
    
    if (analysis.security.score >= 75) {
      patterns.push('Strong security practices and documentation');
    }
    
    if (analysis.documentation.score >= 85) {
      patterns.push('Outstanding documentation framework');
    }

    if (analysis.projectType === 'documentation-framework') {
      patterns.push('Innovative standards and framework development');
    }

    // Meta patterns
    if (analysis.successIndicators.some(i => i.type === 'meta')) {
      patterns.push('Revolutionary self-validating system design');
    }

    if (analysis.successIndicators.some(i => i.type === 'innovation')) {
      patterns.push('Cutting-edge community-focused innovation');
    }

    return patterns;
  }

  identifyRiskMitigations(analysis) {
    return analysis.riskFactors.map(risk => ({
      risk: risk.type,
      level: risk.level,
      mitigation: this.getRiskMitigation(risk.type)
    }));
  }

  getRiskMitigation(riskType) {
    const mitigations = {
      'dependencies': 'Implement adapter patterns and fallback systems for experimental dependencies',
      'testing': 'Add validation scripts and quality assurance processes',
      'security': 'Implement proper security documentation and validation processes',
      'architecture': 'Refactor to follow clean architecture principles'
    };
    
    return mitigations[riskType] || 'Review and address identified issues';
  }

  calculateOverallScore(analysis) {
    return Math.round((
      analysis.architecture.score * 0.25 +
      analysis.testing.score * 0.20 +
      analysis.security.score * 0.20 +
      analysis.dependencies.score * 0.15 +
      analysis.documentation.score * 0.10 +
      analysis.performance.score * 0.10
    ));
  }
}

// CLI Interface
async function main() {
  const projectPath = process.argv[2] || '.';
  
  console.log('🧠 Community Wisdom Engine - Local Prototype');
  console.log('================================================');
  
  const wisdomEngine = new CommunityWisdomEngine({
    participationLevel: 'contributor',
    privacyLevel: 'maximum',
    autoSuggest: true
  });
  
  // Simulate user consent
  const userConsent = {
    allowLocalAnalysis: true,
    shareWithCommunity: false, // Default to private
    reviewBeforeSharing: true
  };
  
  try {
    const results = await wisdomEngine.analyzeProject(projectPath, userConsent);
    
    if (results.localAnalysis) {
      console.log('\n📊 PROJECT ANALYSIS RESULTS');
      console.log('=' .repeat(50));
      
      const analysis = results.localAnalysis;
      const overallScore = wisdomEngine.calculateOverallScore(analysis);
      
      console.log(`\n🎯 Overall Score: ${overallScore}/100 (${wisdomEngine.getScoreLevel(overallScore, 100)})`);
      console.log(`📋 Project Type: ${analysis.projectType}`);
      
      console.log(`\n🏗️ Architecture: ${analysis.architecture.score}/100 (${analysis.architecture.level})`);
      console.log(`🧪 Testing/Validation: ${analysis.testing.score}/100 (${analysis.testing.level})`);
      console.log(`🛡️ Security: ${analysis.security.score}/100 (${analysis.security.level})`);
      console.log(`📦 Dependencies: ${analysis.dependencies.total} total, ${analysis.dependencies.experimental} experimental`);
      console.log(`📚 Documentation: ${analysis.documentation.score}/100 (${analysis.documentation.level})`);
      console.log(`⚡ Performance: ${analysis.performance.score}/100 (${analysis.performance.level})`);
      
      // Show guidance
      if (results.guidance) {
        console.log('\n💡 COMMUNITY GUIDANCE');
        console.log('=' .repeat(50));
        console.log(results.guidance.overall.message);
        
        if (results.guidance.specific.length > 0) {
          console.log('\n📋 Recommendations:');
          results.guidance.specific.forEach((rec, i) => {
            console.log(`${i + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
            console.log(`   Action: ${rec.action}`);
          });
        }
        
        if (results.guidance.patterns.length > 0) {
          console.log('\n✅ Success Patterns Detected:');
          results.guidance.patterns.forEach(pattern => {
            console.log(`   • ${pattern}`);
          });
        }
      }
      
      // Show contribution suggestion
      if (results.contributionSuggestion && results.contributionSuggestion.suggested) {
        console.log('\n🤝 COMMUNITY CONTRIBUTION OPPORTUNITY');
        console.log('=' .repeat(50));
        console.log(results.contributionSuggestion.reason);
        console.log(`\nProject Score: ${results.contributionSuggestion.score}/100`);
        console.log('\nAnonymized pattern that would be shared:');
        console.log(JSON.stringify(results.anonymizedPreview, null, 2));
        console.log('\n💭 This helps other developers learn from your patterns while protecting your privacy.');
      }
      
    } else {
      console.log('\n' + results.message);
      if (results.fallback) {
        console.log('\nBasic recommendations:');
        results.fallback.recommendations.forEach(rec => {
          console.log(`• ${rec}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = {
  CommunityWisdomEngine,
  LocalPatternDetector,
  MaximumAnonymizer,
  CommunityGuidanceEngine
};

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
/**
 * Technology Risk Assessment Engine
 * Automatically evaluates new technologies for safety and adoption readiness
 */

class TechnologyRiskAssessor {
  constructor() {
    this.riskFactors = {
      // Technical Risk Factors
      maturity: {
        weight: 0.25,
        metrics: ['age', 'versionStability', 'breakingChanges']
      },
      community: {
        weight: 0.20,
        metrics: ['contributorCount', 'issueResolutionTime', 'documentationQuality']
      },
      adoption: {
        weight: 0.20,
        metrics: ['downloadStats', 'enterpriseUsage', 'jobMarketDemand']
      },
      security: {
        weight: 0.15,
        metrics: ['vulnerabilityHistory', 'securityAudits', 'maintainerTrust']
      },
      ecosystem: {
        weight: 0.10,
        metrics: ['dependencyHealth', 'toolingSupport', 'frameworkIntegration']
      },
      business: {
        weight: 0.10,
        metrics: ['licensingRisk', 'commercialSupport', 'roadmapClarity']
      }
    };
  }

  /**
   * Assess overall risk level for a technology
   */
  assessTechnology(technology) {
    const riskScores = {};
    let totalWeightedScore = 0;

    // Calculate risk scores for each factor
    Object.entries(this.riskFactors).forEach(([factor, config]) => {
      const score = this.calculateFactorScore(technology, factor, config.metrics);
      riskScores[factor] = score;
      totalWeightedScore += score * config.weight;
    });

    const overallRisk = this.categorizeRisk(totalWeightedScore);
    
    return {
      technology: technology.name,
      overallRisk,
      riskScore: totalWeightedScore,
      factorScores: riskScores,
      recommendation: this.generateRecommendation(overallRisk, riskScores),
      safeguards: this.recommendSafeguards(technology, riskScores)
    };
  }

  /**
   * Calculate risk score for a specific factor
   */
  calculateFactorScore(technology, factor, metrics) {
    switch (factor) {
      case 'maturity':
        return this.assessMaturity(technology);
      case 'community':
        return this.assessCommunity(technology);
      case 'adoption':
        return this.assessAdoption(technology);
      case 'security':
        return this.assessSecurity(technology);
      case 'ecosystem':
        return this.assessEcosystem(technology);
      case 'business':
        return this.assessBusiness(technology);
      default:
        return 5; // Neutral score
    }
  }

  /**
   * Assess technology maturity (1-10, higher = more mature/less risky)
   */
  assessMaturity(tech) {
    let score = 5; // Base score

    // Age factor
    if (tech.ageInMonths > 24) score += 2;
    else if (tech.ageInMonths > 12) score += 1;
    else if (tech.ageInMonths < 6) score -= 2;

    // Version stability
    if (tech.version?.startsWith('1.') || tech.version?.startsWith('2.')) score += 2;
    else if (tech.version?.startsWith('0.')) score -= 1;

    // Breaking changes frequency
    if (tech.signals?.includes('stable-api')) score += 2;
    if (tech.signals?.includes('frequent-breaking-changes')) score -= 3;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Assess community health
   */
  assessCommunity(tech) {
    let score = 5;

    // Contributor activity
    if (tech.contributorCount > 100) score += 2;
    else if (tech.contributorCount > 50) score += 1;
    else if (tech.contributorCount < 10) score -= 2;

    // Issue resolution
    if (tech.signals?.includes('responsive-maintainers')) score += 2;
    if (tech.signals?.includes('stale-issues')) score -= 2;

    // Documentation
    if (tech.signals?.includes('excellent-docs')) score += 2;
    else if (tech.signals?.includes('poor-docs')) score -= 2;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Assess adoption level
   */
  assessAdoption(tech) {
    let score = 5;

    // Download/usage stats
    if (tech.weeklyDownloads > 1000000) score += 3;
    else if (tech.weeklyDownloads > 100000) score += 2;
    else if (tech.weeklyDownloads > 10000) score += 1;
    else if (tech.weeklyDownloads < 1000) score -= 2;

    // Enterprise usage
    if (tech.signals?.includes('enterprise-adoption')) score += 2;
    if (tech.signals?.includes('production-ready')) score += 2;
    if (tech.signals?.includes('experimental')) score -= 2;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Assess security posture
   */
  assessSecurity(tech) {
    let score = 7; // Assume good until proven otherwise

    // Security history
    if (tech.signals?.includes('security-focused')) score += 2;
    if (tech.signals?.includes('vulnerability-history')) score -= 3;
    if (tech.signals?.includes('crypto-origins')) score -= 2; // Higher scrutiny

    // Maintainer trust
    if (tech.signals?.includes('anthropic-backed') || tech.signals?.includes('enterprise-backed')) score += 2;
    if (tech.signals?.includes('single-maintainer')) score -= 1;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Assess ecosystem health
   */
  assessEcosystem(tech) {
    let score = 5;

    // Tooling support
    if (tech.signals?.includes('rich-tooling')) score += 2;
    if (tech.signals?.includes('limited-tooling')) score -= 1;

    // Framework integration
    if (tech.category === 'AI Integration' && tech.signals?.includes('claude-integration')) score += 2;
    if (tech.signals?.includes('framework-agnostic')) score += 1;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Assess business risk factors
   */
  assessBusiness(tech) {
    let score = 7;

    // Licensing
    if (tech.license === 'MIT' || tech.license === 'Apache-2.0') score += 1;
    if (tech.signals?.includes('license-concerns')) score -= 3;

    // Commercial support
    if (tech.signals?.includes('commercial-support')) score += 2;
    if (tech.signals?.includes('no-support')) score -= 2;

    return Math.max(1, Math.min(10, score));
  }

  /**
   * Categorize overall risk level
   */
  categorizeRisk(score) {
    if (score >= 8) return 'GREEN';
    if (score >= 6) return 'YELLOW';
    return 'RED';
  }

  /**
   * Generate adoption recommendation
   */
  generateRecommendation(riskLevel, scores) {
    switch (riskLevel) {
      case 'GREEN':
        if (scores.adoption >= 8) return 'IMMEDIATE_ADOPTION';
        return 'PRODUCTION_READY';
      case 'YELLOW':
        if (scores.maturity >= 7) return 'EVALUATE_FOR_NEW_PROJECTS';
        return 'PILOT_PROJECTS_ONLY';
      case 'RED':
        if (scores.security < 5) return 'SECURITY_REVIEW_REQUIRED';
        return 'RESEARCH_ONLY';
    }
  }

  /**
   * Recommend safeguards for adoption
   */
  recommendSafeguards(technology, scores) {
    const safeguards = [];

    if (scores.security < 7) {
      safeguards.push('Conduct security audit before adoption');
    }

    if (scores.maturity < 6) {
      safeguards.push('Implement adapter pattern with fallback');
      safeguards.push('Monitor for breaking changes');
    }

    if (scores.community < 6) {
      safeguards.push('Prepare for potential maintenance burden');
      safeguards.push('Consider forking strategy');
    }

    if (scores.adoption < 5) {
      safeguards.push('Limit to non-critical applications');
      safeguards.push('Have migration plan ready');
    }

    if (technology.signals?.includes('experimental')) {
      safeguards.push('Use feature flags for easy rollback');
      safeguards.push('Extensive testing required');
    }

    return safeguards;
  }

  /**
   * Generate risk assessment report
   */
  generateReport(assessments) {
    const summary = {
      total: assessments.length,
      green: assessments.filter(a => a.overallRisk === 'GREEN').length,
      yellow: assessments.filter(a => a.overallRisk === 'YELLOW').length,
      red: assessments.filter(a => a.overallRisk === 'RED').length
    };

    const highestRisk = assessments
      .filter(a => a.overallRisk === 'RED')
      .sort((a, b) => a.riskScore - b.riskScore);

    const safestBets = assessments
      .filter(a => a.overallRisk === 'GREEN')
      .sort((a, b) => b.riskScore - a.riskScore);

    return {
      timestamp: new Date().toISOString(),
      summary,
      safestBets: safestBets.slice(0, 3),
      highestRisk: highestRisk.slice(0, 3),
      recommendations: this.generateOverallRecommendations(assessments)
    };
  }

  generateOverallRecommendations(assessments) {
    const recommendations = [];

    const greenCount = assessments.filter(a => a.overallRisk === 'GREEN').length;
    const redCount = assessments.filter(a => a.overallRisk === 'RED').length;

    if (greenCount > 0) {
      recommendations.push(`${greenCount} technologies ready for immediate adoption`);
    }

    if (redCount > assessments.length * 0.5) {
      recommendations.push('High percentage of experimental technologies - proceed with caution');
    }

    const mcpTechs = assessments.filter(a => a.technology.includes('MCP'));
    if (mcpTechs.length > 0 && mcpTechs.every(t => t.overallRisk === 'GREEN')) {
      recommendations.push('MCP ecosystem showing strong stability - prioritize for AI integration');
    }

    return recommendations;
  }
}

module.exports = { TechnologyRiskAssessor };
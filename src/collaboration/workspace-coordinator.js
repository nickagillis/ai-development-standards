/**
 * Workspace Coordination System
 * Single responsibility: Coordinate development across team members
 * Intelligent workflow optimization and conflict prevention
 */

const { getConfig } = require('../config/wisdom-engine.config');
const { DuplicateWorkDetector } = require('./duplicate-work-detector');
const { Logger } = require('../utils/logger');
const { ErrorHandler } = require('../utils/error-handler');

class WorkspaceCoordinator {
  constructor(mcpClient = null) {
    this.config = getConfig();
    this.duplicateDetector = new DuplicateWorkDetector(mcpClient);
    this.logger = new Logger('WorkspaceCoordinator');
    this.errorHandler = new ErrorHandler();
    this.mcpClient = mcpClient;
  }

  /**
   * Coordinate new development work
   */
  async coordinateNewWork(workRequest) {
    try {
      this.logger.info('Coordinating new development work', {
        type: workRequest.type,
        author: workRequest.author
      });

      const coordination = {
        status: 'analyzing',
        workRequest,
        duplicateAnalysis: null,
        workspaceStatus: null,
        coordination: null,
        recommendations: []
      };

      // Check for duplicate work
      coordination.duplicateAnalysis = await this.duplicateDetector.checkForDuplicateWork(workRequest);
      
      // Analyze current workspace status
      coordination.workspaceStatus = await this.analyzeWorkspaceStatus(workRequest);
      
      // Generate coordination plan
      coordination.coordination = this.generateCoordinationPlan(
        coordination.duplicateAnalysis,
        coordination.workspaceStatus
      );
      
      // Compile final recommendations
      coordination.recommendations = this.compileRecommendations(
        coordination.duplicateAnalysis,
        coordination.workspaceStatus,
        coordination.coordination
      );
      
      coordination.status = 'completed';
      
      return coordination;
    } catch (error) {
      return this.errorHandler.handleError(error, 'Workspace coordination failed', {
        fallback: this.getBasicCoordinationFallback(workRequest)
      });
    }
  }

  /**
   * Analyze current workspace status
   */
  async analyzeWorkspaceStatus(workRequest) {
    try {
      const status = {
        activeWork: [],
        resourceContention: [],
        teamCapacity: 'unknown',
        criticalPaths: [],
        blockers: []
      };

      // Get current active work
      status.activeWork = await this.getCurrentActiveWork(workRequest.owner, workRequest.repo);
      
      // Analyze resource contention
      status.resourceContention = this.analyzeResourceContention(workRequest, status.activeWork);
      
      // Identify critical paths
      status.criticalPaths = this.identifyCriticalPaths(status.activeWork);
      
      // Find potential blockers
      status.blockers = this.identifyPotentialBlockers(workRequest, status.activeWork);
      
      return status;
    } catch (error) {
      this.logger.warn(`Failed to analyze workspace status: ${error.message}`);
      return {
        activeWork: [],
        resourceContention: [],
        teamCapacity: 'unknown',
        criticalPaths: [],
        blockers: []
      };
    }
  }

  /**
   * Get current active development work
   */
  async getCurrentActiveWork(owner, repo) {
    try {
      const activeWork = [];
      
      // Get open pull requests
      if (this.mcpClient?.listPullRequests) {
        const openPRs = await this.mcpClient.listPullRequests({
          owner,
          repo,
          state: 'open',
          sort: 'updated',
          direction: 'desc'
        });
        
        activeWork.push(...openPRs.map(pr => ({
          type: 'pull_request',
          id: pr.number,
          title: pr.title,
          author: pr.user?.login,
          branch: pr.head?.ref,
          files: [], // Would need separate call to get files
          created_at: pr.created_at,
          updated_at: pr.updated_at,
          priority: this.assessWorkPriority(pr)
        })));
      }
      
      // Get open issues assigned to people
      if (this.mcpClient?.listIssues) {
        const assignedIssues = await this.mcpClient.listIssues({
          owner,
          repo,
          state: 'open',
          sort: 'updated',
          direction: 'desc'
        });
        
        const workingIssues = assignedIssues.filter(issue => 
          issue.assignees && issue.assignees.length > 0
        );
        
        activeWork.push(...workingIssues.map(issue => ({
          type: 'issue',
          id: issue.number,
          title: issue.title,
          author: issue.user?.login,
          assignees: issue.assignees?.map(a => a.login) || [],
          labels: issue.labels?.map(l => l.name) || [],
          created_at: issue.created_at,
          updated_at: issue.updated_at,
          priority: this.assessWorkPriority(issue)
        })));
      }
      
      return activeWork;
    } catch (error) {
      this.logger.debug(`Failed to get active work: ${error.message}`);
      return [];
    }
  }

  /**
   * Assess work priority based on labels and metadata
   */
  assessWorkPriority(workItem) {
    const title = (workItem.title || '').toLowerCase();
    const labels = workItem.labels?.map(l => (typeof l === 'string' ? l : l.name)?.toLowerCase()) || [];
    
    // High priority indicators
    if (labels.includes('urgent') || labels.includes('critical') || labels.includes('hotfix')) {
      return 'high';
    }
    
    if (title.includes('security') || title.includes('critical') || title.includes('urgent')) {
      return 'high';
    }
    
    // Medium priority indicators
    if (labels.includes('important') || labels.includes('feature') || labels.includes('enhancement')) {
      return 'medium';
    }
    
    // Low priority indicators
    if (labels.includes('documentation') || labels.includes('cleanup') || labels.includes('refactor')) {
      return 'low';
    }
    
    return 'medium'; // Default
  }

  /**
   * Analyze resource contention
   */
  analyzeResourceContention(workRequest, activeWork) {
    const contention = [];
    
    // Check for same author working on multiple things
    const authorWork = activeWork.filter(work => 
      work.author === workRequest.author || 
      (work.assignees && work.assignees.includes(workRequest.author))
    );
    
    if (authorWork.length > 2) {
      contention.push({
        type: 'author_overload',
        severity: 'medium',
        message: `${workRequest.author} has ${authorWork.length} active work items`,
        recommendation: 'Consider prioritizing or delegating existing work'
      });
    }
    
    // Check for file/area conflicts
    const proposedFiles = workRequest.files || [];
    const conflictingWork = activeWork.filter(work => {
      const workFiles = work.files || [];
      return proposedFiles.some(file => workFiles.includes(file));
    });
    
    if (conflictingWork.length > 0) {
      contention.push({
        type: 'file_conflict',
        severity: 'high',
        message: 'Proposed work may conflict with active development',
        conflictingWork: conflictingWork.map(w => ({ id: w.id, title: w.title, author: w.author })),
        recommendation: 'Coordinate with conflicting work authors before proceeding'
      });
    }
    
    return contention;
  }

  /**
   * Identify critical paths in current work
   */
  identifyCriticalPaths(activeWork) {
    const criticalPaths = [];
    
    // High priority work creates critical paths
    const highPriorityWork = activeWork.filter(work => work.priority === 'high');
    
    if (highPriorityWork.length > 0) {
      criticalPaths.push({
        type: 'high_priority_blocking',
        message: `${highPriorityWork.length} high-priority items may block other work`,
        work: highPriorityWork.map(w => ({ id: w.id, title: w.title, author: w.author }))
      });
    }
    
    // Architecture/infrastructure work blocks other development
    const architectureWork = activeWork.filter(work => {
      const title = work.title.toLowerCase();
      return title.includes('architecture') || 
             title.includes('infrastructure') || 
             title.includes('framework') ||
             title.includes('config') ||
             title.includes('setup');
    });
    
    if (architectureWork.length > 0) {
      criticalPaths.push({
        type: 'architecture_dependency',
        message: 'Architecture work may block feature development',
        work: architectureWork.map(w => ({ id: w.id, title: w.title, author: w.author }))
      });
    }
    
    return criticalPaths;
  }

  /**
   * Identify potential blockers for new work
   */
  identifyPotentialBlockers(workRequest, activeWork) {
    const blockers = [];
    
    // Check for dependency conflicts
    if (workRequest.dependencies && workRequest.dependencies.length > 0) {
      const dependencyWork = activeWork.filter(work => {
        const title = work.title.toLowerCase();
        return workRequest.dependencies.some(dep => title.includes(dep.toLowerCase()));
      });
      
      if (dependencyWork.length > 0) {
        blockers.push({
          type: 'dependency_conflict',
          severity: 'medium',
          message: 'Active work on dependencies detected',
          blockingWork: dependencyWork.map(w => ({ id: w.id, title: w.title, author: w.author })),
          recommendation: 'Wait for dependency work to complete or coordinate changes'
        });
      }
    }
    
    // Check for merge conflicts potential
    const coreSystemWork = activeWork.filter(work => {
      const title = work.title.toLowerCase();
      return title.includes('core') || 
             title.includes('base') ||
             title.includes('foundation') ||
             title.includes('engine');
    });
    
    if (coreSystemWork.length > 0 && workRequest.scope === 'major') {
      blockers.push({
        type: 'merge_conflict_risk',
        severity: 'medium',
        message: 'Core system changes may cause merge conflicts',
        blockingWork: coreSystemWork.map(w => ({ id: w.id, title: w.title, author: w.author })),
        recommendation: 'Coordinate closely with core system developers'
      });
    }
    
    return blockers;
  }

  /**
   * Generate coordination plan
   */
  generateCoordinationPlan(duplicateAnalysis, workspaceStatus) {
    const plan = {
      strategy: 'proceed',
      coordination: [],
      timing: 'immediate',
      dependencies: [],
      risks: []
    };
    
    // Adjust strategy based on duplicate analysis
    if (duplicateAnalysis.duplicateRisk === 'high') {
      plan.strategy = 'coordinate_first';
      plan.timing = 'delayed';
      plan.coordination.push({
        type: 'duplicate_resolution',
        action: 'Contact authors of similar work before proceeding',
        priority: 'high'
      });
    }
    
    // Add workspace-based coordination
    workspaceStatus.resourceContention.forEach(contention => {
      if (contention.severity === 'high') {
        plan.coordination.push({
          type: 'resource_coordination',
          action: contention.recommendation,
          priority: contention.severity
        });
      }
    });
    
    // Add dependency coordination
    workspaceStatus.blockers.forEach(blocker => {
      plan.dependencies.push({
        type: blocker.type,
        description: blocker.message,
        mitigation: blocker.recommendation
      });
    });
    
    // Assess overall risks
    plan.risks = this.assessCoordinationRisks(duplicateAnalysis, workspaceStatus);
    
    return plan;
  }

  /**
   * Assess coordination risks
   */
  assessCoordinationRisks(duplicateAnalysis, workspaceStatus) {
    const risks = [];
    
    // Duplicate work risks
    if (duplicateAnalysis.duplicateRisk !== 'none') {
      risks.push({
        type: 'duplicate_work',
        level: duplicateAnalysis.duplicateRisk,
        description: 'Risk of duplicating existing efforts'
      });
    }
    
    // Resource contention risks
    const highContentions = workspaceStatus.resourceContention.filter(c => c.severity === 'high');
    if (highContentions.length > 0) {
      risks.push({
        type: 'resource_conflict',
        level: 'high',
        description: 'High risk of resource conflicts or merge issues'
      });
    }
    
    // Critical path risks
    if (workspaceStatus.criticalPaths.length > 0) {
      risks.push({
        type: 'blocking_dependency',
        level: 'medium',
        description: 'May be blocked by critical path work'
      });
    }
    
    return risks;
  }

  /**
   * Compile final recommendations
   */
  compileRecommendations(duplicateAnalysis, workspaceStatus, coordinationPlan) {
    const recommendations = [];
    
    // Add duplicate work recommendations
    if (duplicateAnalysis.recommendations) {
      recommendations.push(...duplicateAnalysis.recommendations);
    }
    
    // Add workspace recommendations
    if (coordinationPlan.strategy === 'coordinate_first') {
      recommendations.unshift({
        priority: 'high',
        action: 'COORDINATE FIRST - Required before proceeding',
        reasoning: 'Multiple coordination issues detected',
        nextSteps: coordinationPlan.coordination.map(c => c.action)
      });
    }
    
    // Add timing recommendations
    if (coordinationPlan.timing === 'delayed') {
      recommendations.push({
        priority: 'medium',
        action: 'DELAY START - Wait for coordination',
        reasoning: 'Optimal timing requires coordination completion',
        nextSteps: ['Complete coordination activities', 'Re-assess workspace status']
      });
    }
    
    // Add collaboration opportunities
    if (duplicateAnalysis.collaborationOpportunities) {
      duplicateAnalysis.collaborationOpportunities.forEach(opp => {
        recommendations.push({
          priority: 'low',
          action: `COLLABORATE - ${opp.suggestion}`,
          reasoning: 'Collaboration opportunity identified',
          nextSteps: ['Reach out to potential collaborators']
        });
      });
    }
    
    return recommendations;
  }

  /**
   * Get basic coordination fallback
   */
  getBasicCoordinationFallback(workRequest) {
    return {
      status: 'fallback',
      message: 'Advanced coordination unavailable, using basic guidance',
      recommendations: [
        {
          priority: 'medium',
          action: 'MANUAL COORDINATION - Check for conflicts manually',
          reasoning: 'Automated coordination unavailable',
          nextSteps: [
            'Review open pull requests for conflicts',
            'Check with team members about ongoing work',
            'Look for similar issues or branches'
          ]
        }
      ]
    };
  }
}

module.exports = { WorkspaceCoordinator };
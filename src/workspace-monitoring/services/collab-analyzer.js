/**
 * Collaboration Analysis Service
 * 
 * Purpose: Analyze team collaboration patterns and productivity
 * Architecture: Service-Interface pattern with analytics focus
 * Context: Optimized for team insights and recommendations
 */

const EventEmitter = require('events');

/**
 * CollabAnalyzer - Analyzes collaboration patterns
 * 
 * Tracks:
 * - Team member activity patterns
 * - File ownership and shared editing
 * - Communication needs and suggestions
 * - Productivity metrics
 */
class CollabAnalyzer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.name = 'collab-analyzer';
    this.config = {
      sessionTimeoutMs: 1800000, // 30 minutes
      teamSizeThreshold: 5,
      activityWindowMs: 86400000, // 24 hours
      ...options
    };
    
    this.teamMembers = new Map(); // member -> activity data
    this.fileOwnership = new Map(); // file -> primary contributors
    this.collaborationMetrics = {
      totalSessions: 0,
      averageSessionLength: 0,
      hotFiles: [],
      communicationSuggestions: []
    };
    
    this.eventHub = null;
  }
  
  /**
   * Connect to event hub
   * @param {EventHub} hub - Central event hub
   */
  setEventHub(hub) {
    this.eventHub = hub;
    
    // Listen for collaboration events
    hub.on('file:changed', this.trackFileActivity.bind(this));
    hub.on('editor:active', this.trackMemberActivity.bind(this));
    hub.on('conflict:detected', this.analyzeConflictPattern.bind(this));
  }
  
  /**
   * Initialize collaboration analysis
   */
  async initialize() {
    this.startAnalysisTimer();
    this.emit('collab-analyzer:ready');
  }
  
  /**
   * Track file activity for ownership analysis
   * @param {Object} data - File change data
   */
  trackFileActivity(data) {
    const { filePath, editor, timestamp, changeType } = data;
    
    if (!filePath || !editor) {
      return;
    }
    
    this.updateFileOwnership(filePath, editor, changeType);
    this.updateMemberActivity(editor, 'file_edit', { filePath, timestamp });
  }
  
  /**
   * Track team member activity
   * @param {Object} data - Member activity data
   */
  trackMemberActivity(data) {
    const { editor, action, timestamp, filePath } = data;
    
    this.updateMemberActivity(editor, action, { filePath, timestamp });
  }
  
  /**
   * Analyze conflict patterns for collaboration insights
   * @param {Object} conflict - Conflict data
   */
  analyzeConflictPattern(conflict) {
    const { filePath, editors, type } = conflict;
    
    // Track files with frequent conflicts
    this.updateHotFiles(filePath);
    
    // Generate communication suggestions
    if (editors.length > 1) {
      this.generateCommunicationSuggestion(editors, filePath);
    }
  }
  
  /**
   * Update file ownership tracking
   * @param {string} filePath - File path
   * @param {string} editor - Editor making changes
   * @param {string} changeType - Type of change
   */
  updateFileOwnership(filePath, editor, changeType = 'edit') {
    if (!this.fileOwnership.has(filePath)) {
      this.fileOwnership.set(filePath, {
        contributors: new Map(),
        primaryOwner: null,
        lastActivity: null
      });
    }
    
    const ownership = this.fileOwnership.get(filePath);
    const contribution = ownership.contributors.get(editor) || { edits: 0, lastEdit: null };
    
    contribution.edits++;
    contribution.lastEdit = new Date().toISOString();
    ownership.contributors.set(editor, contribution);
    ownership.lastActivity = new Date().toISOString();
    
    // Determine primary owner
    this.updatePrimaryOwner(filePath);
  }
  
  /**
   * Update member activity tracking
   * @param {string} member - Team member identifier
   * @param {string} activity - Activity type
   * @param {Object} metadata - Activity metadata
   */
  updateMemberActivity(member, activity, metadata) {
    if (!this.teamMembers.has(member)) {
      this.teamMembers.set(member, {
        totalActivities: 0,
        lastActivity: null,
        files: new Set(),
        collaborations: new Set()
      });
    }
    
    const memberData = this.teamMembers.get(member);
    memberData.totalActivities++;
    memberData.lastActivity = metadata.timestamp || new Date().toISOString();
    
    if (metadata.filePath) {
      memberData.files.add(metadata.filePath);
    }
  }
  
  /**
   * Update primary owner for a file
   * @param {string} filePath - File path
   */
  updatePrimaryOwner(filePath) {
    const ownership = this.fileOwnership.get(filePath);
    
    if (!ownership || ownership.contributors.size === 0) {
      return;
    }
    
    let maxEdits = 0;
    let primaryOwner = null;
    
    for (const [contributor, data] of ownership.contributors) {
      if (data.edits > maxEdits) {
        maxEdits = data.edits;
        primaryOwner = contributor;
      }
    }
    
    ownership.primaryOwner = primaryOwner;
  }
  
  /**
   * Update hot files (frequently conflicted)
   * @param {string} filePath - File with conflict
   */
  updateHotFiles(filePath) {
    const hotFile = this.collaborationMetrics.hotFiles.find(f => f.path === filePath);
    
    if (hotFile) {
      hotFile.conflicts++;
      hotFile.lastConflict = new Date().toISOString();
    } else {
      this.collaborationMetrics.hotFiles.push({
        path: filePath,
        conflicts: 1,
        lastConflict: new Date().toISOString()
      });
    }
    
    // Keep only top 10 hot files
    this.collaborationMetrics.hotFiles
      .sort((a, b) => b.conflicts - a.conflicts)
      .splice(10);
  }
  
  /**
   * Generate communication suggestion
   * @param {Array} editors - Involved editors
   * @param {string} filePath - Conflicted file
   */
  generateCommunicationSuggestion(editors, filePath) {
    const suggestion = {
      id: `comm_${Date.now()}`,
      type: 'coordination_needed',
      participants: editors,
      subject: `Coordination needed for ${filePath}`,
      priority: editors.length > 2 ? 'high' : 'medium',
      timestamp: new Date().toISOString()
    };
    
    this.collaborationMetrics.communicationSuggestions.push(suggestion);
    
    if (this.eventHub) {
      this.eventHub.emit('collaboration:suggestion', suggestion);
    }
  }
  
  /**
   * Generate collaboration insights
   * @returns {Object} Collaboration analysis results
   */
  generateInsights() {
    return {
      teamSize: this.teamMembers.size,
      activeFiles: this.fileOwnership.size,
      hotFiles: this.collaborationMetrics.hotFiles.slice(0, 5),
      topContributors: this.getTopContributors(),
      communicationNeeds: this.collaborationMetrics.communicationSuggestions.length,
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Get top contributors
   * @returns {Array} Top contributing team members
   */
  getTopContributors() {
    return Array.from(this.teamMembers.entries())
      .map(([member, data]) => ({
        member,
        activities: data.totalActivities,
        files: data.files.size
      }))
      .sort((a, b) => b.activities - a.activities)
      .slice(0, 5);
  }
  
  /**
   * Start periodic analysis
   */
  startAnalysisTimer() {
    setInterval(() => {
      const insights = this.generateInsights();
      if (this.eventHub) {
        this.eventHub.emit('collaboration:insights', insights);
      }
    }, 300000); // Every 5 minutes
  }
  
  /**
   * Get current status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      name: this.name,
      teamMembers: this.teamMembers.size,
      trackedFiles: this.fileOwnership.size,
      insights: this.generateInsights()
    };
  }
  
  /**
   * Shutdown service
   */
  async shutdown() {
    this.teamMembers.clear();
    this.fileOwnership.clear();
    this.removeAllListeners();
  }
}

module.exports = { CollabAnalyzer };
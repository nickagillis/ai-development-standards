/**
 * Conflict Detection Service
 * 
 * Purpose: Detect potential merge conflicts and simultaneous editing
 * Architecture: Service-Interface pattern with event integration
 * Context: Optimized for real-time collaboration monitoring
 */

const EventEmitter = require('events');

/**
 * ConflictDetector - Monitors for editing conflicts
 * 
 * Detects:
 * - Multiple editors on same file
 * - Rapid consecutive changes
 * - Overlapping edit sessions
 * - Potential merge conflicts
 */
class ConflictDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.name = 'conflict-detector';
    this.config = {
      timeWindowMs: 300000, // 5 minutes
      maxSimultaneousEditors: 3,
      debounceMs: 1000,
      ...options
    };
    
    this.editingSessions = new Map(); // file -> { editors, lastEdit }
    this.conflictHistory = [];
    this.eventHub = null;
  }
  
  /**
   * Connect to event hub
   * @param {EventHub} hub - Central event hub
   */
  setEventHub(hub) {
    this.eventHub = hub;
    
    // Listen for file change events
    hub.on('file:changed', this.handleFileChange.bind(this));
    hub.on('editor:active', this.handleEditorActivity.bind(this));
  }
  
  /**
   * Initialize conflict detection
   */
  async initialize() {
    this.startCleanupTimer();
    this.emit('conflict-detector:ready');
  }
  
  /**
   * Handle file change events
   * @param {Object} data - File change data
   */
  handleFileChange(data) {
    const { filePath, editor, timestamp } = data;
    
    if (!filePath || !editor) {
      return;
    }
    
    this.trackEditingSession(filePath, editor, timestamp);
    this.checkForConflicts(filePath);
  }
  
  /**
   * Handle editor activity events
   * @param {Object} data - Editor activity data
   */
  handleEditorActivity(data) {
    const { filePath, editor, action, timestamp } = data;
    
    if (action === 'open') {
      this.trackEditingSession(filePath, editor, timestamp);
    } else if (action === 'close') {
      this.removeEditingSession(filePath, editor);
    }
  }
  
  /**
   * Track editing session for a file
   * @param {string} filePath - File being edited
   * @param {string} editor - Editor identifier
   * @param {string} timestamp - ISO timestamp
   */
  trackEditingSession(filePath, editor, timestamp) {
    const now = new Date(timestamp).getTime();
    
    if (!this.editingSessions.has(filePath)) {
      this.editingSessions.set(filePath, {
        editors: new Map(),
        lastEdit: now
      });
    }
    
    const session = this.editingSessions.get(filePath);
    session.editors.set(editor, now);
    session.lastEdit = now;
  }
  
  /**
   * Check for potential conflicts on a file
   * @param {string} filePath - File to check
   */
  checkForConflicts(filePath) {
    const session = this.editingSessions.get(filePath);
    
    if (!session) {
      return;
    }
    
    const activeEditors = this.getActiveEditors(session);
    
    if (activeEditors.length > this.config.maxSimultaneousEditors) {
      this.reportConflict(filePath, activeEditors, 'too_many_editors');
    } else if (activeEditors.length > 1) {
      this.reportConflict(filePath, activeEditors, 'simultaneous_editing');
    }
  }
  
  /**
   * Get currently active editors for a session
   * @param {Object} session - Editing session
   * @returns {Array} Active editor names
   */
  getActiveEditors(session) {
    const now = Date.now();
    const cutoff = now - this.config.timeWindowMs;
    
    return Array.from(session.editors.entries())
      .filter(([editor, lastActivity]) => lastActivity > cutoff)
      .map(([editor]) => editor);
  }
  
  /**
   * Report a detected conflict
   * @param {string} filePath - Conflicted file
   * @param {Array} editors - Involved editors
   * @param {string} type - Conflict type
   */
  reportConflict(filePath, editors, type) {
    const conflict = {
      id: this.generateConflictId(),
      filePath,
      editors,
      type,
      timestamp: new Date().toISOString(),
      resolved: false
    };
    
    this.conflictHistory.push(conflict);
    
    if (this.eventHub) {
      this.eventHub.emit('conflict:detected', conflict);
    }
    
    this.emit('conflict', conflict);
  }
  
  /**
   * Remove editing session when editor closes file
   * @param {string} filePath - File path
   * @param {string} editor - Editor identifier
   */
  removeEditingSession(filePath, editor) {
    const session = this.editingSessions.get(filePath);
    
    if (session) {
      session.editors.delete(editor);
      
      if (session.editors.size === 0) {
        this.editingSessions.delete(filePath);
      }
    }
  }
  
  /**
   * Start cleanup timer for old sessions
   */
  startCleanupTimer() {
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60000); // Cleanup every minute
  }
  
  /**
   * Clean up old editing sessions
   */
  cleanupOldSessions() {
    const now = Date.now();
    const cutoff = now - this.config.timeWindowMs;
    
    for (const [filePath, session] of this.editingSessions) {
      if (session.lastEdit < cutoff) {
        this.editingSessions.delete(filePath);
      }
    }
  }
  
  /**
   * Generate unique conflict ID
   * @returns {string} Unique identifier
   */
  generateConflictId() {
    return `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Get current status
   * @returns {Object} Service status
   */
  getStatus() {
    return {
      name: this.name,
      activeSessions: this.editingSessions.size,
      conflictCount: this.conflictHistory.length,
      config: this.config
    };
  }
  
  /**
   * Shutdown service
   */
  async shutdown() {
    this.editingSessions.clear();
    this.removeAllListeners();
  }
}

module.exports = { ConflictDetector };
/**
 * Workspace Monitoring Build Orchestrator
 * 
 * Purpose: Simple build coordination (replaces large build.js that was cut off)
 * Architecture: Lightweight orchestrator pattern
 * Context: Optimized for MCP and Claude Desktop integration
 */

const { WorkspaceMonitor } = require('../core/monitor');
const { ConflictDetector } = require('../services/conflict-detector');
const { CollabAnalyzer } = require('../services/collab-analyzer');
const { McpConnector } = require('../services/mcp-connector');
const { PatternLogger } = require('../services/pattern-logger');
const { SuccessTracker } = require('../services/success-tracker');
const { FileWatcher } = require('../utils/file-watcher');

/**
 * Build and configure complete workspace monitoring system
 * @param {Object} config - System configuration
 * @returns {WorkspaceMonitor} Configured monitor instance
 */
function buildWorkspaceMonitor(config = {}) {
  // Create main monitor
  const monitor = new WorkspaceMonitor(config);
  
  // Create and register core services
  const conflictDetector = new ConflictDetector(config.conflicts);
  const collabAnalyzer = new CollabAnalyzer(config.collaboration);
  const mcpConnector = new McpConnector(config.mcp);
  
  // Create and register wisdom services (eating our own dog food!)
  const patternLogger = new PatternLogger(config.patterns);
  const successTracker = new SuccessTracker(config.success);
  
  monitor.use(conflictDetector);
  monitor.use(collabAnalyzer);
  monitor.use(mcpConnector);
  monitor.use(patternLogger);
  monitor.use(successTracker);
  
  // Set up file watching
  const fileWatcher = new FileWatcher(config.monitoring);
  fileWatcher.on('file:changed', (data) => {
    monitor.eventHub.emit('file:changed', data);
  });
  
  // Emit our own success pattern!
  monitor.eventHub.emit('feature:completed', {
    name: 'workspace-monitoring-system',
    complexity: 'high',
    approach: 'context-optimized-modular-architecture',
    duration: 'single_session'
  });
  
  return monitor;
}

module.exports = { buildWorkspaceMonitor };

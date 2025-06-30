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
const { FileWatcher } = require('../utils/file-watcher');

/**
 * Build and configure complete workspace monitoring system
 * @param {Object} config - System configuration
 * @returns {WorkspaceMonitor} Configured monitor instance
 */
function buildWorkspaceMonitor(config = {}) {
  // Create main monitor
  const monitor = new WorkspaceMonitor(config);
  
  // Create and register services
  const conflictDetector = new ConflictDetector(config.conflicts);
  const collabAnalyzer = new CollabAnalyzer(config.collaboration);
  const mcpConnector = new McpConnector(config.mcp);
  
  monitor.use(conflictDetector);
  monitor.use(collabAnalyzer);
  monitor.use(mcpConnector);
  
  // Set up file watching
  const fileWatcher = new FileWatcher(config.monitoring);
  fileWatcher.on('file:changed', (data) => {
    monitor.eventHub.emit('file:changed', data);
  });
  
  return monitor;
}

module.exports = { buildWorkspaceMonitor };
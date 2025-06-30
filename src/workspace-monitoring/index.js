/**
 * Workspace Monitoring System - Main Entry Point
 * 
 * Purpose: Public API and easy initialization
 * Architecture: Simple facade pattern
 * Context: Optimized for external integration
 */

const { buildWorkspaceMonitor } = require('./scripts/build');
const { defaultConfig } = require('./config/workspace-config');

/**
 * Create and initialize workspace monitoring system
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Initialized monitor with utilities
 */
async function createWorkspaceMonitor(options = {}) {
  const config = { ...defaultConfig, ...options };
  
  try {
    const monitor = buildWorkspaceMonitor(config);
    await monitor.initialize();
    
    return {
      monitor,
      start: () => monitor.start(),
      stop: () => monitor.shutdown(),
      status: () => monitor.getStatus(),
      config: monitor.config
    };
    
  } catch (error) {
    throw new Error(`Failed to create workspace monitor: ${error.message}`);
  }
}

/**
 * Quick start with default configuration
 * @param {string} workspacePath - Path to workspace directory
 * @returns {Promise<Object>} Running monitor instance
 */
async function quickStart(workspacePath) {
  const monitor = await createWorkspaceMonitor({
    monitoring: { watchPath: workspacePath }
  });
  
  await monitor.start();
  return monitor;
}

// Export public API
module.exports = {
  createWorkspaceMonitor,
  quickStart,
  defaultConfig
};
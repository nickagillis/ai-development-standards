/**
 * File Watcher Utility
 * 
 * Purpose: Monitor file system changes with efficient event handling
 * Architecture: Utility module with event emission
 * Context: Optimized for workspace monitoring integration
 */

const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');

/**
 * FileWatcher - Efficient file system monitoring
 * 
 * Features:
 * - Recursive directory watching
 * - Configurable file filters
 * - Debounced change events
 * - Memory-efficient operation
 */
class FileWatcher extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.config = {
      extensions: ['.js', '.ts', '.md', '.json'],
      ignorePaths: ['node_modules', '.git', 'dist'],
      debounceMs: 500,
      maxFiles: 1000,
      ...options
    };
    
    this.watchers = new Map();
    this.debounceTimers = new Map();
    this.watchedFiles = new Set();
  }
  
  /**
   * Start watching a directory
   * @param {string} dirPath - Directory to watch
   */
  async watch(dirPath) {
    try {
      const resolvedPath = path.resolve(dirPath);
      
      if (this.watchers.has(resolvedPath)) {
        return; // Already watching
      }
      
      const watcher = fs.watch(resolvedPath, { recursive: true });
      this.watchers.set(resolvedPath, watcher);
      
      for await (const event of watcher) {
        this.handleFileEvent(event, resolvedPath);
      }
      
    } catch (error) {
      this.emit('error', { type: 'watch_failed', path: dirPath, error: error.message });
    }
  }
  
  /**
   * Handle file system events
   * @param {Object} event - File system event
   * @param {string} basePath - Base directory path
   */
  handleFileEvent(event, basePath) {
    const { eventType, filename } = event;
    
    if (!filename || !this.shouldWatch(filename)) {
      return;
    }
    
    const fullPath = path.join(basePath, filename);
    
    // Debounce rapid changes
    this.debounceEvent(fullPath, eventType);
  }
  
  /**
   * Check if file should be watched
   * @param {string} filename - File name to check
   * @returns {boolean} Should watch file
   */
  shouldWatch(filename) {
    // Check ignore patterns
    for (const ignorePath of this.config.ignorePaths) {
      if (filename.includes(ignorePath)) {
        return false;
      }
    }
    
    // Check file extensions
    const ext = path.extname(filename);
    return this.config.extensions.includes(ext);
  }
  
  /**
   * Debounce file events to prevent spam
   * @param {string} filePath - File path
   * @param {string} eventType - Event type
   */
  debounceEvent(filePath, eventType) {
    const debounceKey = `${filePath}:${eventType}`;
    
    // Clear existing timer
    if (this.debounceTimers.has(debounceKey)) {
      clearTimeout(this.debounceTimers.get(debounceKey));
    }
    
    // Set new timer
    const timer = setTimeout(() => {
      this.emitFileChange(filePath, eventType);
      this.debounceTimers.delete(debounceKey);
    }, this.config.debounceMs);
    
    this.debounceTimers.set(debounceKey, timer);
  }
  
  /**
   * Emit file change event
   * @param {string} filePath - File path
   * @param {string} eventType - Event type
   */
  emitFileChange(filePath, eventType) {
    const changeData = {
      filePath,
      eventType,
      timestamp: new Date().toISOString(),
      fileExtension: path.extname(filePath)
    };
    
    this.watchedFiles.add(filePath);
    
    // Limit tracked files to prevent memory issues
    if (this.watchedFiles.size > this.config.maxFiles) {
      const oldest = this.watchedFiles.values().next().value;
      this.watchedFiles.delete(oldest);
    }
    
    this.emit('file:changed', changeData);
  }
  
  /**
   * Stop watching a directory
   * @param {string} dirPath - Directory to stop watching
   */
  async unwatch(dirPath) {
    const resolvedPath = path.resolve(dirPath);
    const watcher = this.watchers.get(resolvedPath);
    
    if (watcher) {
      await watcher.close();
      this.watchers.delete(resolvedPath);
    }
  }
  
  /**
   * Stop all watchers
   */
  async stopAll() {
    for (const [path, watcher] of this.watchers) {
      await watcher.close();
    }
    
    this.watchers.clear();
    
    // Clear debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    
    this.debounceTimers.clear();
  }
  
  /**
   * Get current status
   * @returns {Object} Watcher status
   */
  getStatus() {
    return {
      watchedDirectories: this.watchers.size,
      trackedFiles: this.watchedFiles.size,
      pendingEvents: this.debounceTimers.size,
      config: this.config
    };
  }
}

module.exports = { FileWatcher };
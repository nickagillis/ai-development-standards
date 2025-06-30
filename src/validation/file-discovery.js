/**
 * File Discovery Utilities
 * 
 * Handles file system scanning and filtering
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Discover files for validation
 */
class FileDiscovery {
  constructor(options) {
    this.options = options;
  }
  
  /**
   * Scan directory recursively for files
   */
  async discoverFiles() {
    const files = [];
    await this.scanDirectory(this.options.rootPath, files);
    return files;
  }
  
  /**
   * Recursive directory scanning
   */
  async scanDirectory(dirPath, files) {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory()) {
          if (!this.shouldExclude(fullPath)) {
            await this.scanDirectory(fullPath, files);
          }
        } else if (entry.isFile()) {
          if (this.shouldInclude(fullPath)) {
            files.push(fullPath);
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️ Could not scan ${dirPath}: ${error.message}`);
    }
  }
  
  /**
   * Check if directory should be excluded
   */
  shouldExclude(filePath) {
    return this.options.excludePatterns.some(pattern => {
      const simplePattern = pattern.replace('**/', '').replace('/**', '');
      return filePath.includes(simplePattern);
    });
  }
  
  /**
   * Check if file should be included
   */
  shouldInclude(filePath) {
    const ext = path.extname(filePath);
    return this.options.includeExtensions.includes(ext);
  }
}

module.exports = FileDiscovery;
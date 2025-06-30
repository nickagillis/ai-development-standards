/**
 * Document Updater - Automated Documentation Updates
 * 
 * Purpose: Automatically update repository documents based on AI intelligence
 * Architecture: Template-driven document generation and Git integration
 * Context: Keep documentation current with latest AI developments
 */

const { getLogger } = require('../../utils/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * DocumentUpdater - Automated documentation updates
 * 
 * Features:
 * - Template-based document generation
 * - Git integration for automated commits
 * - Diff generation and change tracking
 * - Safety checks and rollback capability
 */
class DocumentUpdater {
  constructor(options = {}) {
    this.name = 'document-updater';
    this.config = {
      repositoryRoot: process.cwd(),
      documentsToUpdate: [
        'README.md',
        'docs/experimental-dependencies.md',
        'architecture/emerging-technologies.md'
      ],
      backupDirectory: '.backup',
      templates: {
        'README.md': 'templates/readme-template.md',
        'emerging-tech-section': 'templates/emerging-tech-section.md'
      },
      autoCommit: process.env.NODE_ENV === 'production',
      commitMessage: 'docs: automated update from AI intelligence system',
      ...options
    };
    
    this.logger = getLogger('DocumentUpdater');
  }
  
  /**
   * Update documents based on intelligence data
   * @param {Array} developments - AI developments to incorporate
   * @returns {Object} Update results
   */
  async updateDocuments(developments) {
    this.logger.info('🔄 Starting automated document updates...');
    
    const results = {
      updated: [],
      failed: [],
      skipped: [],
      changesDetected: false
    };
    
    try {
      // Create backup before any changes
      await this.createBackup();
      
      // Process each document
      for (const documentPath of this.config.documentsToUpdate) {
        try {
          const updateResult = await this.updateDocument(documentPath, developments);
          
          if (updateResult.changed) {
            results.updated.push({
              path: documentPath,
              changes: updateResult.changes,
              newContent: updateResult.newContent
            });
            results.changesDetected = true;
          } else {
            results.skipped.push(documentPath);
          }
          
        } catch (error) {
          this.logger.error(`Failed to update ${documentPath}:`, error.message);
          results.failed.push({ path: documentPath, error: error.message });
        }
      }
      
      // Commit changes if enabled and changes detected
      if (this.config.autoCommit && results.changesDetected) {
        await this.commitChanges(results.updated);
      }
      
    } catch (error) {
      this.logger.error('Document update process failed:', error.message);
      await this.restoreBackup();
      throw error;
    }
    
    return results;
  }
  
  /**
   * Update a specific document
   * @param {string} documentPath - Path to document
   * @param {Array} developments - AI developments
   * @returns {Object} Update result
   */
  async updateDocument(documentPath, developments) {
    const fullPath = path.join(this.config.repositoryRoot, documentPath);
    
    try {
      // Read current content
      const currentContent = await fs.readFile(fullPath, 'utf8');
      
      // Generate new content based on document type
      const newContent = await this.generateUpdatedContent(documentPath, currentContent, developments);
      
      // Check if content actually changed
      if (currentContent === newContent) {
        return { changed: false };
      }
      
      // Write updated content
      await fs.writeFile(fullPath, newContent, 'utf8');
      
      const changes = this.generateDiff(currentContent, newContent);
      
      this.logger.info(`✅ Updated ${documentPath}`);
      
      return {
        changed: true,
        changes: changes,
        newContent: newContent
      };
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        this.logger.warn(`Document not found: ${documentPath}`);
        return { changed: false };
      }
      throw error;
    }
  }
  
  /**
   * Generate updated content for a document
   * @param {string} documentPath - Path to document
   * @param {string} currentContent - Current document content
   * @param {Array} developments - AI developments
   * @returns {string} Updated content
   */
  async generateUpdatedContent(documentPath, currentContent, developments) {
    const fileName = path.basename(documentPath);
    
    switch (fileName) {
      case 'README.md':
        return this.updateReadme(currentContent, developments);
        
      case 'experimental-dependencies.md':
        return this.updateExperimentalDependencies(currentContent, developments);
        
      case 'emerging-technologies.md':
        return this.updateEmergingTechnologies(currentContent, developments);
        
      default:
        this.logger.warn(`No update strategy for ${fileName}`);
        return currentContent;
    }
  }
  
  /**
   * Update README.md with latest developments
   * @param {string} content - Current README content
   * @param {Array} developments - AI developments
   * @returns {string} Updated content
   */
  updateReadme(content, developments) {
    // Find and update "Latest AI Developments" section
    const sectionStart = '## 🔬 Latest AI Developments';
    const nextSectionPattern = /\n## /;
    
    const sectionIndex = content.indexOf(sectionStart);
    if (sectionIndex === -1) {
      // Add new section before final section
      const finalSectionIndex = content.lastIndexOf('\n## ');
      if (finalSectionIndex > 0) {
        const latestSection = this.generateLatestDevelopmentsSection(developments);
        return content.slice(0, finalSectionIndex) + '\n' + latestSection + '\n' + content.slice(finalSectionIndex);
      }
      return content;
    }
    
    // Replace existing section
    const nextSectionIndex = content.search(nextSectionPattern, sectionIndex + 1);
    const endIndex = nextSectionIndex > 0 ? nextSectionIndex : content.length;
    
    const latestSection = this.generateLatestDevelopmentsSection(developments);
    
    return content.slice(0, sectionIndex) + latestSection + content.slice(endIndex);
  }
  
  /**
   * Generate latest developments section
   * @param {Array} developments - AI developments
   * @returns {string} Section content
   */
  generateLatestDevelopmentsSection(developments) {
    const recent = developments.slice(0, 5); // Top 5 recent developments
    const updated = new Date().toLocaleDateString();
    
    let section = `## 🔬 Latest AI Developments\n\n`;
    section += `*Last updated: ${updated}*\n\n`;
    
    if (recent.length === 0) {
      section += 'No recent developments detected.\n';
      return section;
    }
    
    recent.forEach(dev => {
      section += `### ${dev.title}\n\n`;
      section += `**Source:** ${dev.source}\n`;
      section += `**Category:** ${dev.category}\n`;
      if (dev.impact_indicators && dev.impact_indicators.length > 0) {
        section += `**Impact:** ${dev.impact_indicators.join(', ')}\n`;
      }
      section += `\n${dev.content.substring(0, 200)}...\n\n`;
      section += `[Learn more](${dev.url})\n\n`;
    });
    
    return section;
  }
  
  /**
   * Create backup of current documents
   */
  async createBackup() {
    const backupDir = path.join(this.config.repositoryRoot, this.config.backupDirectory);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}`);
    
    try {
      await fs.mkdir(backupPath, { recursive: true });
      
      for (const docPath of this.config.documentsToUpdate) {
        const fullPath = path.join(this.config.repositoryRoot, docPath);
        const backupFilePath = path.join(backupPath, path.basename(docPath));
        
        try {
          await fs.copyFile(fullPath, backupFilePath);
        } catch (error) {
          if (error.code !== 'ENOENT') {
            throw error;
          }
        }
      }
      
      this.logger.debug(`Created backup at ${backupPath}`);
      
    } catch (error) {
      this.logger.error('Failed to create backup:', error.message);
      throw error;
    }
  }
  
  /**
   * Generate simple diff between old and new content
   * @param {string} oldContent - Original content
   * @param {string} newContent - Updated content
   * @returns {Array} Changes summary
   */
  generateDiff(oldContent, newContent) {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    
    const changes = {
      linesAdded: Math.max(0, newLines.length - oldLines.length),
      linesRemoved: Math.max(0, oldLines.length - newLines.length),
      linesModified: 0
    };
    
    // Simple change detection
    const minLength = Math.min(oldLines.length, newLines.length);
    for (let i = 0; i < minLength; i++) {
      if (oldLines[i] !== newLines[i]) {
        changes.linesModified++;
      }
    }
    
    return changes;
  }
  
  /**
   * Get update status
   * @returns {Object} Current status
   */
  getStatus() {
    return {
      name: this.name,
      documentsTracked: this.config.documentsToUpdate.length,
      autoCommit: this.config.autoCommit,
      lastUpdate: this.lastUpdate || null
    };
  }
}

module.exports = { DocumentUpdater };
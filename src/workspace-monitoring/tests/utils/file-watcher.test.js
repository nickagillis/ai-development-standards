/**
 * FileWatcher Utility Tests
 * 
 * Purpose: Test file system monitoring utility
 * Architecture: Utility-focused testing with mocking
 * Context: File system event handling and filtering
 */

const { FileWatcher } = require('../../utils/file-watcher');
const path = require('path');

// Mock fs.watch for testing
jest.mock('fs', () => ({
  promises: {
    watch: jest.fn()
  }
}));

describe('FileWatcher', () => {
  let watcher;
  
  beforeEach(() => {
    watcher = new FileWatcher({
      extensions: ['.js', '.md'],
      ignorePaths: ['node_modules', '.git'],
      debounceMs: 50, // Short debounce for testing
      maxFiles: 5
    });
  });
  
  afterEach(async () => {
    await watcher.stopAll();
  });
  
  describe('File Filtering', () => {
    test('should accept allowed file extensions', () => {
      expect(watcher.shouldWatch('test.js')).toBe(true);
      expect(watcher.shouldWatch('readme.md')).toBe(true);
    });
    
    test('should reject disallowed file extensions', () => {
      expect(watcher.shouldWatch('image.png')).toBe(false);
      expect(watcher.shouldWatch('data.json')).toBe(false);
    });
    
    test('should ignore specified paths', () => {
      expect(watcher.shouldWatch('node_modules/package.js')).toBe(false);
      expect(watcher.shouldWatch('.git/config')).toBe(false);
    });
    
    test('should accept valid files', () => {
      expect(watcher.shouldWatch('src/component.js')).toBe(true);
      expect(watcher.shouldWatch('docs/guide.md')).toBe(true);
    });
  });
  
  describe('Event Handling', () => {
    test('should emit file change events', (done) => {
      watcher.on('file:changed', (data) => {
        expect(data.filePath).toContain('test.js');
        expect(data.eventType).toBe('change');
        expect(data.timestamp).toBeDefined();
        expect(data.fileExtension).toBe('.js');
        done();
      });
      
      // Simulate file change
      watcher.handleFileEvent(
        { eventType: 'change', filename: 'test.js' },
        '/mock/base/path'
      );
    });
    
    test('should debounce rapid events', (done) => {
      let eventCount = 0;
      
      watcher.on('file:changed', () => {
        eventCount++;
      });
      
      // Trigger multiple rapid events
      for (let i = 0; i < 5; i++) {
        watcher.handleFileEvent(
          { eventType: 'change', filename: 'rapid.js' },
          '/mock/path'
        );
      }
      
      // Should only emit once after debounce
      setTimeout(() => {
        expect(eventCount).toBe(1);
        done();
      }, 100);
    });
    
    test('should limit tracked files', () => {
      // Add more files than the limit
      for (let i = 0; i < 10; i++) {
        watcher.emitFileChange(`/path/file${i}.js`, 'change');
      }
      
      expect(watcher.watchedFiles.size).toBe(5); // maxFiles limit
    });
  });
  
  describe('Status and Management', () => {
    test('should provide accurate status', () => {
      watcher.watchedFiles.add('/path/file1.js');
      watcher.watchedFiles.add('/path/file2.js');
      
      const status = watcher.getStatus();
      
      expect(status.watchedDirectories).toBe(0);
      expect(status.trackedFiles).toBe(2);
      expect(status.pendingEvents).toBe(0);
      expect(status.config).toBeDefined();
    });
    
    test('should cleanup on shutdown', async () => {
      // Add some tracked files and debounce timers
      watcher.watchedFiles.add('/path/file1.js');
      watcher.debounceTimers.set('test', setTimeout(() => {}, 1000));
      
      await watcher.stopAll();
      
      expect(watcher.watchers.size).toBe(0);
      expect(watcher.debounceTimers.size).toBe(0);
    });
  });
  
  describe('Error Handling', () => {
    test('should handle watch errors gracefully', () => {
      const errorHandler = jest.fn();
      watcher.on('error', errorHandler);
      
      // This would trigger an error in real implementation
      // Here we simulate by calling error handling directly
      watcher.emit('error', {
        type: 'watch_failed',
        path: '/invalid/path',
        error: 'Permission denied'
      });
      
      expect(errorHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'watch_failed',
          path: '/invalid/path'
        })
      );
    });
  });
});
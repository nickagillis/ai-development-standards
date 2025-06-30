/**
 * ConflictDetector Service Tests
 * 
 * Purpose: Test conflict detection functionality
 * Architecture: Behavior-driven test scenarios
 * Context: Real-world collaboration conflict scenarios
 */

const { ConflictDetector } = require('../../services/conflict-detector');
const { EventHub } = require('../../core/event-hub');

describe('ConflictDetector', () => {
  let detector;
  let eventHub;
  
  beforeEach(() => {
    detector = new ConflictDetector({
      timeWindowMs: 5000, // 5 seconds for testing
      maxSimultaneousEditors: 2
    });
    
    eventHub = new EventHub();
    detector.setEventHub(eventHub);
  });
  
  afterEach(async () => {
    await detector.shutdown();
  });
  
  describe('Conflict Detection', () => {
    test('should detect simultaneous editing conflict', () => {
      const conflictHandler = jest.fn();
      detector.on('conflict', conflictHandler);
      
      const timestamp = new Date().toISOString();
      
      // Two editors edit same file
      detector.handleFileChange({
        filePath: 'shared.js',
        editor: 'alice',
        timestamp
      });
      
      detector.handleFileChange({
        filePath: 'shared.js',
        editor: 'bob',
        timestamp
      });
      
      expect(conflictHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          filePath: 'shared.js',
          editors: expect.arrayContaining(['alice', 'bob']),
          type: 'simultaneous_editing'
        })
      );
    });
    
    test('should detect too many editors conflict', () => {
      const conflictHandler = jest.fn();
      detector.on('conflict', conflictHandler);
      
      const timestamp = new Date().toISOString();
      
      // Three editors edit same file (exceeds limit of 2)
      ['alice', 'bob', 'charlie'].forEach(editor => {
        detector.handleFileChange({
          filePath: 'popular.js',
          editor,
          timestamp
        });
      });
      
      expect(conflictHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'too_many_editors',
          editors: expect.arrayContaining(['alice', 'bob', 'charlie'])
        })
      );
    });
    
    test('should not detect conflict for single editor', () => {
      const conflictHandler = jest.fn();
      detector.on('conflict', conflictHandler);
      
      detector.handleFileChange({
        filePath: 'solo.js',
        editor: 'alice',
        timestamp: new Date().toISOString()
      });
      
      expect(conflictHandler).not.toHaveBeenCalled();
    });
  });
  
  describe('Session Management', () => {
    test('should track editing sessions', () => {
      const timestamp = new Date().toISOString();
      
      detector.trackEditingSession('test.js', 'alice', timestamp);
      
      expect(detector.editingSessions.has('test.js')).toBe(true);
      
      const session = detector.editingSessions.get('test.js');
      expect(session.editors.has('alice')).toBe(true);
    });
    
    test('should remove editing sessions', () => {
      const timestamp = new Date().toISOString();
      
      detector.trackEditingSession('test.js', 'alice', timestamp);
      detector.removeEditingSession('test.js', 'alice');
      
      expect(detector.editingSessions.has('test.js')).toBe(false);
    });
    
    test('should cleanup old sessions', () => {
      const oldTimestamp = new Date(Date.now() - 10000).toISOString();
      
      detector.trackEditingSession('old.js', 'alice', oldTimestamp);
      detector.cleanupOldSessions();
      
      expect(detector.editingSessions.has('old.js')).toBe(false);
    });
  });
  
  describe('Status and Metrics', () => {
    test('should provide accurate status', () => {
      const timestamp = new Date().toISOString();
      
      detector.trackEditingSession('file1.js', 'alice', timestamp);
      detector.trackEditingSession('file2.js', 'bob', timestamp);
      
      const status = detector.getStatus();
      
      expect(status.name).toBe('conflict-detector');
      expect(status.activeSessions).toBe(2);
      expect(status.conflictCount).toBe(0);
    });
    
    test('should track conflict history', () => {
      const conflictHandler = jest.fn();
      detector.on('conflict', conflictHandler);
      
      const timestamp = new Date().toISOString();
      
      // Generate conflict
      detector.handleFileChange({ filePath: 'conflict.js', editor: 'alice', timestamp });
      detector.handleFileChange({ filePath: 'conflict.js', editor: 'bob', timestamp });
      
      expect(detector.conflictHistory.length).toBe(1);
      expect(detector.conflictHistory[0].resolved).toBe(false);
    });
  });
});
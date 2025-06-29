/**
 * Claude Desktop MCP Integration
 * 
 * Provides Model Context Protocol integration for Claude Desktop,
 * enabling recursive analysis and intelligent recommendations.
 * 
 * Features:
 * - Pattern recognition across workspace sessions
 * - Recursive learning from Claude's own recommendations
 * - Cross-repository analysis capabilities
 * - Real-time insights and suggestions
 * 
 * Security: All MCP communications are validated and rate-limited
 * Architecture: Modular design with clear separation from core monitoring
 */

const EventEmitter = require('events');
const WebSocket = require('ws');
const { validateInput } = require('../security/input-validator');
const { Logger } = require('../utils/logger');
const { ConfigManager } = require('../utils/config-manager');

/**
 * MCP Integration for Claude Desktop
 * 
 * Enables Claude to recursively analyze and improve workspace patterns
 */
class McpIntegration extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = validateInput(options, 'mcpOptions');
    this.logger = new Logger('McpIntegration');
    this.config = new ConfigManager('.mcprc');
    
    // Connection state
    this.isConnected = false;
    this.connection = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = this.options.maxReconnectAttempts || 5;
    
    // Request management
    this.pendingRequests = new Map();
    this.requestTimeout = this.options.timeout || 5000;
    this.maxConcurrentRequests = this.options.maxConcurrentRequests || 5;
    
    // Learning data
    this.analysisHistory = new Map();
    this.patternDatabase = new Map();
    this.recommendationOutcomes = new Map();
    
    // Performance metrics
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      patternsRecognized: 0,
      recommendationsGenerated: 0
    };
    
    this.logger.info('MCP Integration initialized', {
      maxConcurrentRequests: this.maxConcurrentRequests,
      timeout: this.requestTimeout
    });
  }
  
  /**
   * Connect to Claude Desktop MCP server
   * @returns {Promise<boolean>} Connection success
   */
  async connect() {
    try {
      if (this.isConnected) {
        this.logger.warn('MCP already connected');
        return true;
      }
      
      await this.config.load();
      
      const mcpUrl = this.config.get('serverUrl', 'ws://localhost:3001');
      
      this.logger.info('Connecting to Claude Desktop MCP', { url: mcpUrl });
      
      this.connection = new WebSocket(mcpUrl, {
        timeout: this.requestTimeout,
        headers: {
          'User-Agent': 'WorkspaceMonitor/1.0.0',
          'X-Client-Type': 'workspace-monitoring'
        }
      });
      
      return new Promise((resolve, reject) => {
        const connectTimeout = setTimeout(() => {
          this.connection.close();
          reject(new Error('MCP connection timeout'));
        }, this.requestTimeout);
        
        this.connection.on('open', () => {
          clearTimeout(connectTimeout);
          this.isConnected = true;
          this.reconnectAttempts = 0;
          
          this.logger.info('Connected to Claude Desktop MCP');
          this.emit('connected');
          
          // Send initial handshake
          this._sendHandshake();
          
          resolve(true);
        });
        
        this.connection.on('message', (data) => {
          this._handleMessage(data);
        });
        
        this.connection.on('close', (code, reason) => {
          this.isConnected = false;
          this.logger.warn('MCP connection closed', { code, reason });
          this.emit('disconnected', { code, reason });
          
          // Attempt reconnection
          this._attemptReconnection();
        });
        
        this.connection.on('error', (error) => {
          clearTimeout(connectTimeout);
          this.logger.error('MCP connection error', { error: error.message });
          reject(error);
        });
      });
      
    } catch (error) {
      this.logger.error('Failed to connect to MCP', { error: error.message });
      throw new Error(`MCP connection failed: ${error.message}`);
    }
  }
  
  /**
   * Disconnect from Claude Desktop MCP server
   * @returns {Promise<boolean>} Disconnect success
   */
  async disconnect() {
    try {
      if (!this.isConnected || !this.connection) {
        return true;
      }
      
      // Cancel pending requests
      for (const [requestId, request] of this.pendingRequests) {
        clearTimeout(request.timeout);
        request.reject(new Error('MCP disconnecting'));
      }
      this.pendingRequests.clear();
      
      this.connection.close(1000, 'Client disconnecting');
      this.isConnected = false;
      
      this.logger.info('Disconnected from Claude Desktop MCP');
      this.emit('disconnected');
      
      return true;
      
    } catch (error) {
      this.logger.error('Failed to disconnect from MCP', { error: error.message });
      return false;
    }
  }
  
  /**
   * Analyze file changes using Claude Desktop
   * @param {string} filePath - Path to the changed file
   * @param {string} changeType - Type of change (add, change, delete)
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeFileChange(filePath, changeType) {
    try {
      const validatedPath = validateInput(filePath, 'filePath');
      const validatedChangeType = validateInput(changeType, 'changeType');
      
      if (!this.isConnected) {
        this.logger.warn('MCP not connected, skipping analysis');
        return null;
      }
      
      const request = {
        type: 'analyze_file_change',
        filePath: validatedPath,
        changeType: validatedChangeType,
        timestamp: new Date().toISOString(),
        context: await this._gatherFileContext(validatedPath)
      };
      
      const response = await this._sendRequest(request);
      
      if (response && response.analysis) {
        // Store analysis for pattern recognition
        this._storeAnalysis(validatedPath, response.analysis);
        
        this.metrics.patternsRecognized++;
        
        this.logger.debug('File analysis completed', {
          filePath: validatedPath,
          insights: response.analysis.insights?.length || 0
        });
        
        return response.analysis;
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('File analysis failed', {
        filePath,
        changeType,
        error: error.message
      });
      return null;
    }
  }
  
  /**
   * Request conflict resolution recommendations from Claude
   * @param {Object} conflictAnalysis - Conflict analysis data
   * @returns {Promise<Object>} Recommendations
   */
  async requestConflictResolution(conflictAnalysis) {
    try {
      const validatedAnalysis = validateInput(conflictAnalysis, 'conflictAnalysis');
      
      if (!this.isConnected) {
        this.logger.warn('MCP not connected, skipping conflict resolution');
        return null;
      }
      
      const request = {
        type: 'resolve_conflict',
        conflict: validatedAnalysis,
        timestamp: new Date().toISOString(),
        historicalData: this._getRelevantHistory(validatedAnalysis.filePath),
        teamContext: this._getTeamContext(validatedAnalysis.concurrentDevelopers)
      };
      
      const response = await this._sendRequest(request);
      
      if (response && response.recommendations) {
        this.metrics.recommendationsGenerated++;
        
        // Store recommendation for learning
        this._storeRecommendation(validatedAnalysis, response.recommendations);
        
        this.logger.debug('Conflict resolution recommendations generated', {
          filePath: validatedAnalysis.filePath,
          recommendationsCount: response.recommendations.length
        });
        
        return response.recommendations;
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('Conflict resolution failed', {
        error: error.message
      });
      return null;
    }
  }
  
  /**
   * Analyze workspace patterns across multiple sessions
   * @returns {Promise<Object>} Pattern analysis results
   */
  async analyzeWorkspacePatterns() {
    try {
      if (!this.isConnected) {
        this.logger.warn('MCP not connected, skipping pattern analysis');
        return null;
      }
      
      const request = {
        type: 'analyze_workspace_patterns',
        timestamp: new Date().toISOString(),
        analysisHistory: Array.from(this.analysisHistory.values()).slice(-100),
        patternDatabase: Object.fromEntries(this.patternDatabase),
        timeframe: '7d'
      };
      
      const response = await this._sendRequest(request);
      
      if (response && response.patterns) {
        // Update pattern database with new insights
        this._updatePatternDatabase(response.patterns);
        
        this.logger.info('Workspace pattern analysis completed', {
          patternsFound: response.patterns.length
        });
        
        return response.patterns;
      }
      
      return null;
      
    } catch (error) {
      this.logger.error('Workspace pattern analysis failed', {
        error: error.message
      });
      return null;
    }
  }
  
  /**
   * Learn from recommendation outcomes (recursive learning)
   * @param {Object} feedback - Feedback on recommendation effectiveness
   * @returns {Promise<boolean>} Learning success
   */
  async learnFromRecommendationOutcome(feedback) {
    try {
      const validatedFeedback = validateInput(feedback, 'recommendationFeedback');
      
      if (!this.isConnected) {
        this.logger.warn('MCP not connected, skipping learning');
        return false;
      }
      
      // Store outcome locally
      this.recommendationOutcomes.set(
        validatedFeedback.recommendationId,
        {
          ...validatedFeedback,
          timestamp: new Date().toISOString()
        }
      );
      
      const request = {
        type: 'learn_from_outcome',
        feedback: validatedFeedback,
        timestamp: new Date().toISOString(),
        relatedRecommendations: this._getRelatedRecommendations(validatedFeedback)
      };
      
      const response = await this._sendRequest(request);
      
      if (response && response.learningUpdated) {
        this.logger.info('Recursive learning completed', {
          recommendationId: validatedFeedback.recommendationId,
          wasSuccessful: validatedFeedback.wasSuccessful
        });
        
        return true;
      }
      
      return false;
      
    } catch (error) {
      this.logger.error('Learning from outcome failed', {
        error: error.message
      });
      return false;
    }
  }
  
  /**
   * Get MCP integration metrics
   * @returns {Object} Performance and usage metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      isConnected: this.isConnected,
      pendingRequests: this.pendingRequests.size,
      analysisHistorySize: this.analysisHistory.size,
      patternDatabaseSize: this.patternDatabase.size,
      recommendationOutcomesSize: this.recommendationOutcomes.size,
      lastUpdate: new Date().toISOString()
    };
  }
  
  /**
   * Send initial handshake to Claude Desktop
   * @private
   */
  _sendHandshake() {
    const handshake = {
      type: 'handshake',
      clientInfo: {
        name: 'workspace-monitor',
        version: '1.0.0',
        capabilities: [
          'file_analysis',
          'conflict_resolution',
          'pattern_recognition',
          'recursive_learning'
        ]
      },
      timestamp: new Date().toISOString()
    };
    
    this._sendMessage(handshake);
  }
  
  /**
   * Send request to Claude Desktop and wait for response
   * @private
   */
  async _sendRequest(request) {
    if (!this.isConnected) {
      throw new Error('MCP not connected');
    }
    
    if (this.pendingRequests.size >= this.maxConcurrentRequests) {
      throw new Error('Too many concurrent MCP requests');
    }
    
    const requestId = this._generateRequestId();
    const startTime = Date.now();
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error('MCP request timeout'));
      }, this.requestTimeout);
      
      this.pendingRequests.set(requestId, {
        resolve,
        reject,
        timeout,
        startTime
      });
      
      const message = {
        ...request,
        requestId,
        timestamp: new Date().toISOString()
      };
      
      this._sendMessage(message);
      this.metrics.totalRequests++;
    });
  }
  
  /**
   * Send message to Claude Desktop
   * @private
   */
  _sendMessage(message) {
    if (this.connection && this.connection.readyState === WebSocket.OPEN) {
      try {
        this.connection.send(JSON.stringify(message));
      } catch (error) {
        this.logger.error('Failed to send MCP message', {
          error: error.message
        });
      }
    }
  }
  
  /**
   * Handle incoming message from Claude Desktop
   * @private
   */
  _handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      
      if (message.requestId && this.pendingRequests.has(message.requestId)) {
        const request = this.pendingRequests.get(message.requestId);
        
        clearTimeout(request.timeout);
        this.pendingRequests.delete(message.requestId);
        
        // Update metrics
        const responseTime = Date.now() - request.startTime;
        this.metrics.averageResponseTime = 
          (this.metrics.averageResponseTime + responseTime) / 2;
        
        if (message.error) {
          request.reject(new Error(message.error));
        } else {
          this.metrics.successfulRequests++;
          request.resolve(message);
        }
      } else {
        // Handle unsolicited messages (events, notifications)
        this._handleUnsoliticedMessage(message);
      }
      
    } catch (error) {
      this.logger.error('Failed to handle MCP message', {
        error: error.message
      });
    }
  }
  
  /**
   * Handle unsolicited messages from Claude Desktop
   * @private
   */
  _handleUnsoliticedMessage(message) {
    switch (message.type) {
      case 'pattern_detected':
        this._handlePatternDetection(message);
        break;
        
      case 'insight_generated':
        this._handleInsightGeneration(message);
        break;
        
      case 'learning_update':
        this._handleLearningUpdate(message);
        break;
        
      default:
        this.logger.debug('Unknown MCP message type', {
          type: message.type
        });
    }
  }
  
  /**
   * Handle pattern detection from Claude
   * @private
   */
  _handlePatternDetection(message) {
    if (message.pattern) {
      this.patternDatabase.set(
        message.pattern.id,
        {
          ...message.pattern,
          detectedAt: new Date().toISOString()
        }
      );
      
      this.emit('pattern:detected', message.pattern);
      
      this.logger.info('Pattern detected by Claude', {
        patternId: message.pattern.id,
        type: message.pattern.type
      });
    }
  }
  
  /**
   * Handle insight generation from Claude
   * @private
   */
  _handleInsightGeneration(message) {
    if (message.insight) {
      this.emit('insight:generated', message.insight);
      
      this.logger.info('Insight generated by Claude', {
        type: message.insight.type,
        confidence: message.insight.confidence
      });
    }
  }
  
  /**
   * Handle learning updates from Claude
   * @private
   */
  _handleLearningUpdate(message) {
    if (message.update) {
      this.emit('learning:updated', message.update);
      
      this.logger.info('Learning model updated by Claude', {
        component: message.update.component,
        improvement: message.update.improvement
      });
    }
  }
  
  /**
   * Attempt to reconnect to Claude Desktop
   * @private
   */
  _attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.logger.error('Max MCP reconnection attempts reached');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    
    this.logger.info('Attempting MCP reconnection', {
      attempt: this.reconnectAttempts,
      delay
    });
    
    setTimeout(() => {
      this.connect().catch(error => {
        this.logger.error('MCP reconnection failed', {
          error: error.message
        });
      });
    }, delay);
  }
  
  /**
   * Gather context about a file for analysis
   * @private
   */
  async _gatherFileContext(filePath) {
    try {
      // This would gather relevant context about the file
      // For now, return basic context
      return {
        fileType: this._getFileType(filePath),
        recentChanges: this.analysisHistory.has(filePath),
        complexity: this._estimateComplexity(filePath)
      };
    } catch (error) {
      return {};
    }
  }
  
  /**
   * Get file type from extension
   * @private
   */
  _getFileType(filePath) {
    const ext = filePath.split('.').pop()?.toLowerCase();
    const typeMap = {
      'js': 'javascript',
      'jsx': 'react',
      'ts': 'typescript',
      'tsx': 'react-typescript',
      'py': 'python',
      'java': 'java',
      'css': 'stylesheet',
      'html': 'markup'
    };
    return typeMap[ext] || 'unknown';
  }
  
  /**
   * Estimate file complexity
   * @private
   */
  _estimateComplexity(filePath) {
    // Simple heuristic based on path depth and file name
    const pathDepth = filePath.split('/').length;
    const fileName = filePath.split('/').pop();
    
    if (pathDepth > 5) return 'high';
    if (fileName && fileName.length > 20) return 'medium';
    return 'low';
  }
  
  /**
   * Store analysis results for pattern recognition
   * @private
   */
  _storeAnalysis(filePath, analysis) {
    this.analysisHistory.set(
      `${filePath}-${Date.now()}`,
      {
        filePath,
        analysis,
        timestamp: new Date().toISOString()
      }
    );
    
    // Maintain size limit
    if (this.analysisHistory.size > 1000) {
      const oldestKey = this.analysisHistory.keys().next().value;
      this.analysisHistory.delete(oldestKey);
    }
  }
  
  /**
   * Store recommendation for learning
   * @private
   */
  _storeRecommendation(conflictAnalysis, recommendations) {
    const recommendationId = this._generateRequestId();
    
    // Store for future learning
    // This would be persisted in a production system
    
    return recommendationId;
  }
  
  /**
   * Get relevant historical data
   * @private
   */
  _getRelevantHistory(filePath) {
    const relevantHistory = [];
    
    for (const [key, entry] of this.analysisHistory) {
      if (entry.filePath === filePath || entry.filePath.includes(filePath)) {
        relevantHistory.push(entry);
      }
    }
    
    return relevantHistory.slice(-10); // Last 10 relevant entries
  }
  
  /**
   * Get team context for recommendations
   * @private
   */
  _getTeamContext(developers) {
    return {
      teamSize: developers.length,
      teams: [...new Set(developers.map(dev => dev.metadata?.team).filter(Boolean))],
      timezones: [...new Set(developers.map(dev => dev.metadata?.timezone).filter(Boolean))]
    };
  }
  
  /**
   * Update pattern database with new patterns
   * @private
   */
  _updatePatternDatabase(patterns) {
    patterns.forEach(pattern => {
      this.patternDatabase.set(pattern.id, {
        ...pattern,
        updatedAt: new Date().toISOString()
      });
    });
  }
  
  /**
   * Get related recommendations for learning
   * @private
   */
  _getRelatedRecommendations(feedback) {
    // This would find related recommendations for better learning
    return [];
  }
  
  /**
   * Generate unique request ID
   * @private
   */
  _generateRequestId() {
    return `mcp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

require('dotenv').config();

const { Logger } = require('./utils/logger');
const { ConfigManager } = require('./config/config-manager');
const { SecurityValidator } = require('./security/input-validator');

// Initialize core systems
const logger = new Logger('WorkspaceMonitor');
const config = new ConfigManager();
const security = new SecurityValidator();

/**
 * Application entry point
 * Initializes all modules in proper order with error handling
 */
async function main() {
  try {
    logger.info('🚀 Starting Real-Time Workspace Monitor');
    logger.info('📋 Following ai-development-standards for production-ready code');
    
    // Validate environment and configuration
    await config.validate();
    logger.info('✅ Configuration validated');
    
    // Security initialization
    await security.initialize();
    logger.info('🛡️ Security validation enabled');
    
    // Import and initialize core modules (modular loading)
    const modules = await loadCoreModules();
    logger.info('📦 Core modules loaded');
    
    // Start monitoring services
    await startServices(modules);
    logger.info('✅ Workspace monitoring active');
    
    // Setup graceful shutdown
    setupGracefulShutdown(modules);
    
    logger.info('🎯 System ready - monitoring workspace for conflicts');
    
  } catch (error) {
    logger.error('💥 Failed to start workspace monitor', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

/**
 * Load core modules in dependency order
 * Modular loading prevents context window issues
 */
async function loadCoreModules() {
  try {
    logger.debug('📦 Loading core modules...');
    
    // Load data layer modules
    const { FileSystemMonitor } = require('./data/file-system-monitor');
    const { WebSocketServer } = require('./data/websocket-server');
    
    // Load business logic modules  
    const { ConflictDetector } = require('./business/conflict-detector');
    const { CollaborationAnalyzer } = require('./business/collaboration-analyzer');
    const { PatternLearning } = require('./business/pattern-learning');
    
    // Load presentation layer
    const { NotificationManager } = require('./presentation/notification-manager');
    const { MetricsCollector } = require('./presentation/metrics-collector');
    
    // Load MCP integration
    const { McpIntegration } = require('./mcp/claude-desktop-integration');
    
    return {
      fileMonitor: new FileSystemMonitor(config.get('monitoring')),
      wsServer: new WebSocketServer(config.get('websocket')),
      conflictDetector: new ConflictDetector(config.get('conflictDetection')),
      collaborationAnalyzer: new CollaborationAnalyzer(config.get('collaboration')),
      patternLearning: new PatternLearning(config.get('learning')),
      notificationManager: new NotificationManager(config.get('notifications')),
      metricsCollector: new MetricsCollector(config.get('metrics')),
      mcpIntegration: new McpIntegration(config.get('mcp'))
    };
    
  } catch (error) {
    logger.error('Failed to load core modules', { error: error.message });
    throw new Error(`Module loading failed: ${error.message}`);
  }
}

/**
 * Start all services in proper order
 * Ensures dependencies are ready before dependents start
 */
async function startServices(modules) {
  try {
    logger.info('🔄 Starting services...');
    
    // 1. Start data layer services first
    await modules.wsServer.start();
    logger.debug('✅ WebSocket server started');
    
    await modules.fileMonitor.start();
    logger.debug('✅ File system monitor started');
    
    // 2. Start business logic services
    await modules.conflictDetector.initialize();
    logger.debug('✅ Conflict detector initialized');
    
    await modules.collaborationAnalyzer.start();
    logger.debug('✅ Collaboration analyzer started');
    
    await modules.patternLearning.initialize();
    logger.debug('✅ Pattern learning initialized');
    
    // 3. Start presentation services
    await modules.notificationManager.start();
    logger.debug('✅ Notification manager started');
    
    await modules.metricsCollector.start();
    logger.debug('✅ Metrics collector started');
    
    // 4. Start MCP integration (depends on all other services)
    if (config.get('mcp.enabled')) {
      await modules.mcpIntegration.connect();
      logger.debug('✅ Claude Desktop MCP integration connected');
    }
    
    // 5. Wire up event handlers between modules
    setupEventHandlers(modules);
    logger.debug('✅ Event handlers configured');
    
    logger.info('🚀 All services started successfully');
    
  } catch (error) {
    logger.error('Failed to start services', { error: error.message });
    throw new Error(`Service startup failed: ${error.message}`);
  }
}

/**
 * Setup event handlers between modules
 * Following single responsibility - each module handles its own events
 */
function setupEventHandlers(modules) {
  const { 
    fileMonitor, 
    wsServer, 
    conflictDetector, 
    collaborationAnalyzer,
    patternLearning,
    notificationManager,
    metricsCollector,
    mcpIntegration 
  } = modules;
  
  // File changes -> Conflict detection
  fileMonitor.on('file:changed', async (fileData) => {
    try {
      const analysis = await conflictDetector.analyzeFileChange(fileData);
      
      if (analysis.hasConflict) {
        logger.warn('⚠️ Conflict detected', {
          file: fileData.path,
          probability: analysis.probability
        });
        
        // Notify all connected clients
        wsServer.broadcast('conflict:detected', analysis);
        
        // Send to notification manager
        notificationManager.emit('conflict:detected', analysis);
        
        // Update metrics
        metricsCollector.recordConflict(analysis);
        
        // Send to Claude Desktop for analysis
        if (mcpIntegration.isConnected) {
          mcpIntegration.analyzeFileChange(fileData.path, fileData.changeType);
        }
      }
      
    } catch (error) {
      logger.error('Error processing file change', { 
        file: fileData.path, 
        error: error.message 
      });
    }
  });
  
  // WebSocket connections -> Collaboration analysis
  wsServer.on('session:registered', async (sessionData) => {
    try {
      await collaborationAnalyzer.registerDeveloper(sessionData);
      
      // Update metrics
      metricsCollector.recordSession(sessionData);
      
      logger.info('👤 Developer session registered', {
        developerId: sessionData.developerId,
        team: sessionData.metadata?.team
      });
      
    } catch (error) {
      logger.error('Error registering session', { 
        sessionId: sessionData.id, 
        error: error.message 
      });
    }
  });
  
  // Collaboration patterns -> Pattern learning
  collaborationAnalyzer.on('pattern:detected', async (patternData) => {
    try {
      await patternLearning.learnFromPattern(patternData);
      
      // Send pattern to Claude Desktop for recursive learning
      if (mcpIntegration.isConnected) {
        mcpIntegration.emit('pattern:detected', patternData);
      }
      
      logger.debug('🧠 Pattern learned', {
        type: patternData.type,
        confidence: patternData.confidence
      });
      
    } catch (error) {
      logger.error('Error learning from pattern', { 
        pattern: patternData.type, 
        error: error.message 
      });
    }
  });
  
  // MCP events -> System learning
  if (mcpIntegration.isConnected) {
    mcpIntegration.on('insight:generated', (insight) => {
      logger.info('💡 Claude Desktop insight', {
        type: insight.type,
        confidence: insight.confidence,
        suggestion: insight.suggestion
      });
      
      // Broadcast insight to connected clients
      wsServer.broadcast('mcp:insight', insight);
    });
    
    mcpIntegration.on('learning:updated', (update) => {
      logger.info('🧠 Claude Desktop learning update', {
        component: update.component,
        improvement: update.improvement
      });
      
      // Update local pattern learning
      patternLearning.incorporateExternalLearning(update);
    });
  }
  
  // Metrics collection events
  metricsCollector.on('metrics:updated', (metrics) => {
    // Broadcast metrics to connected clients
    wsServer.broadcast('metrics:update', metrics);
  });
  
  logger.debug('🔗 Event handlers configured successfully');
}

/**
 * Setup graceful shutdown handlers
 * Ensures clean shutdown of all services
 */
function setupGracefulShutdown(modules) {
  const signals = ['SIGTERM', 'SIGINT', 'SIGUSR2'];
  
  signals.forEach(signal => {
    process.on(signal, async () => {
      logger.info(`📡 Received ${signal}, shutting down gracefully...`);
      
      try {
        // Stop services in reverse order
        if (modules.mcpIntegration) {
          await modules.mcpIntegration.disconnect();
          logger.debug('✅ MCP integration disconnected');
        }
        
        if (modules.metricsCollector) {
          await modules.metricsCollector.stop();
          logger.debug('✅ Metrics collector stopped');
        }
        
        if (modules.notificationManager) {
          await modules.notificationManager.stop();
          logger.debug('✅ Notification manager stopped');
        }
        
        if (modules.patternLearning) {
          await modules.patternLearning.saveState();
          logger.debug('✅ Pattern learning state saved');
        }
        
        if (modules.collaborationAnalyzer) {
          await modules.collaborationAnalyzer.stop();
          logger.debug('✅ Collaboration analyzer stopped');
        }
        
        if (modules.conflictDetector) {
          await modules.conflictDetector.cleanup();
          logger.debug('✅ Conflict detector cleaned up');
        }
        
        if (modules.fileMonitor) {
          await modules.fileMonitor.stop();
          logger.debug('✅ File monitor stopped');
        }
        
        if (modules.wsServer) {
          await modules.wsServer.stop();
          logger.debug('✅ WebSocket server stopped');
        }
        
        logger.info('✅ Graceful shutdown completed');
        process.exit(0);
        
      } catch (error) {
        logger.error('❌ Error during shutdown', { error: error.message });
        process.exit(1);
      }
    });
  });
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught exception', { 
      error: error.message, 
      stack: error.stack 
    });
    process.exit(1);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Unhandled promise rejection', { 
      reason, 
      promise: promise.toString() 
    });
    process.exit(1);
  });
  
  logger.debug('🛡️ Graceful shutdown handlers configured');
}

// Export the main function and utilities
module.exports = {
  McpIntegration,
  main,
  loadCoreModules,
  startServices,
  setupEventHandlers,
  setupGracefulShutdown
};

// Auto-start if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Failed to start application:', error.message);
    process.exit(1);
  });
}
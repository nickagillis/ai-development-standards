/**
 * Simple Demo - Real-time Workspace Monitoring
 * 
 * A concise demonstration of the core capabilities
 * Perfect for testing and quick evaluation
 */

const { RealTimeWorkspaceMonitor } = require('../real-time-monitor');
const path = require('path');

/**
 * Simple demo showing conflict prevention in action
 */
async function runSimpleDemo() {
  console.log('🔥 REAL-TIME WORKSPACE MONITORING DEMO');
  console.log('=====================================');
  console.log('🎯 Goal: Prevent conflicts BEFORE they happen!\n');
  
  try {
    // 1. Initialize monitor
    console.log('📡 Initializing workspace monitor...');
    const monitor = new RealTimeWorkspaceMonitor({
      workspacePath: process.cwd(),
      websocketPort: 8080,
      conflictThreshold: 0.7
    });
    
    // 2. Set up conflict detection
    monitor.on('conflict:detected', (analysis) => {
      console.log('\n🚨 CONFLICT ALERT!');
      console.log('─'.repeat(40));
      console.log(`📁 File: ${analysis.filePath}`);
      console.log(`⚠️  Risk Level: ${Math.round(analysis.probability * 100)}%`);
      console.log(`👥 Concurrent Developers: ${analysis.concurrentDevelopers.length}`);
      
      if (analysis.suggestions && analysis.suggestions.length > 0) {
        console.log('\n💡 Smart Suggestions:');
        analysis.suggestions.slice(0, 2).forEach((suggestion, index) => {
          console.log(`   ${index + 1}. ${suggestion.title}`);
          console.log(`      → ${suggestion.description}`);
        });
      }
      console.log('─'.repeat(40));
    });
    
    // 3. Start monitoring
    console.log('🚀 Starting real-time monitoring...');
    await monitor.startMonitoring();
    console.log('✅ Workspace monitoring is now ACTIVE!\n');
    
    // 4. Register some developers
    console.log('👥 Registering development team...');
    
    const alice = await monitor.registerDeveloperSession('alice', {
      team: 'frontend',
      skills: ['react', 'typescript']
    });
    console.log('   ✅ Alice (Frontend) registered');
    
    const bob = await monitor.registerDeveloperSession('bob', {
      team: 'backend',
      skills: ['node', 'database']
    });
    console.log('   ✅ Bob (Backend) registered\n');
    
    // 5. Simulate collaborative work
    console.log('💻 Simulating collaborative development...');
    
    // Alice starts working on a shared component
    console.log('\n📝 Alice starts editing UserProfile.jsx...');
    const analysis1 = await monitor.reportFileActivity(
      alice,
      './src/components/UserProfile.jsx',
      'edit'
    );
    console.log(`   Risk assessment: ${Math.round(analysis1.probability * 100)}% (Safe)`);
    
    // Wait a moment, then Bob also works on the same file
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('\n📝 Bob also starts editing UserProfile.jsx...');
    const analysis2 = await monitor.reportFileActivity(
      bob,
      './src/components/UserProfile.jsx',
      'edit'
    );
    
    if (analysis2.hasConflict) {
      console.log('   🎯 CONFLICT DETECTED! Alert sent to team.');
    } else {
      console.log(`   Risk assessment: ${Math.round(analysis2.probability * 100)}%`);
    }
    
    // 6. Show workspace status
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const status = monitor.getWorkspaceStatus();
    console.log('\n📊 Current Workspace Status:');
    console.log('─'.repeat(30));
    console.log(`👥 Active Developers: ${status.activeSessions}`);
    console.log(`📁 Files Monitored: ${status.filesMonitored}`);
    console.log(`🚨 Conflicts Detected: ${status.metrics.conflictsDetected}`);
    console.log(`✅ Conflicts Prevented: ${status.metrics.conflictsPrevented}`);
    console.log(`⚡ Avg Detection Time: ${status.metrics.averageDetectionTime}ms`);
    
    if (status.metrics.conflictsDetected > 0) {
      const preventionRate = Math.round(
        (status.metrics.conflictsPrevented / status.metrics.conflictsDetected) * 100
      );
      console.log(`🎯 Prevention Success Rate: ${preventionRate}%`);
    }
    
    // 7. Demonstrate learning capability
    console.log('\n🧠 Demonstrating machine learning...');
    
    // System learns from a successful coordination
    await monitor.collaborationAnalyzer.learnFromSuccess(
      './src/components/UserProfile.jsx',
      ['alice', 'bob'],
      'pair-programming',
      {
        outcome: 'successful',
        satisfaction: 'high',
        timeToCoordinate: '5 minutes'
      }
    );
    console.log('   ✅ Learned from successful pair programming session');
    
    // Get learning statistics
    const stats = monitor.conflictDetector.getStatistics();
    console.log('   📈 Learning Progress:');
    console.log(`      Accuracy: ${Math.round(stats.accuracy * 100)}%`);
    console.log(`      Analyses: ${stats.totalAnalyses}`);
    console.log(`      Patterns: ${stats.patternCount}`);
    
    // 8. Clean shutdown
    console.log('\n🏁 Demo completed successfully!');
    console.log('\n🎉 Key Benefits Demonstrated:');
    console.log('   • Real-time conflict detection');
    console.log('   • Intelligent risk assessment');
    console.log('   • Smart collaboration suggestions');
    console.log('   • Machine learning from outcomes');
    console.log('   • Sub-second response times');
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Check out integration examples');
    console.log('   2. Set up VS Code extension');
    console.log('   3. Configure Slack notifications');
    console.log('   4. Deploy to your team environment');
    
    // Cleanup
    setTimeout(async () => {
      await monitor.stopMonitoring();
      console.log('\n👋 Workspace monitoring stopped. Demo complete!');
      process.exit(0);
    }, 2000);
    
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('   • Check that port 8080 is available');
    console.error('   • Verify Node.js version >= 16.0.0');
    console.error('   • Run "npm install" to install dependencies');
    console.error('   • Check the troubleshooting guide for more help');
    process.exit(1);
  }
}

// Export for testing
module.exports = { runSimpleDemo };

// Run demo if called directly
if (require.main === module) {
  runSimpleDemo();
}
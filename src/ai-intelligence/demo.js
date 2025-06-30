/**
 * AI Intelligence System Demo
 * 
 * Purpose: Demonstrate the AI intelligence monitoring system in action
 * Architecture: Simple demo script for students and evaluation
 * Context: Show how the system tracks and analyzes AI developments
 */

const { createAIIntelligence, quickStartForStudents } = require('./index');
const { getLogger } = require('../utils/logger');

/**
 * Run a comprehensive demo of the AI intelligence system
 */
async function runFullDemo() {
  const logger = getLogger('Demo');
  
  console.log('🧠 AI Intelligence System - Full Demo');
  console.log('==========================================\n');
  
  // Demo 1: Basic system creation
  console.log('🛠️ Creating AI Intelligence System...');
  
  const intelligence = await createAIIntelligence({
    environment: 'development',
    sources: {
      openai: true,
      github: false,  // Skip for demo
      anthropic: false,
      industry: false
    },
    learning: {
      enableTutorials: true,
      explainAnalysis: true
    }
  });
  
  console.log('✅ System created successfully\n');
  
  // Demo 2: Perform a scan
  console.log('🔍 Performing intelligence scan...');
  
  await intelligence.scan();
  
  console.log('✅ Scan completed\n');
  
  // Demo 3: Generate report
  console.log('📈 Generating intelligence report...');
  
  const report = intelligence.generateReport();
  
  console.log('Generated report with:');
  console.log(`- ${report.developments.recent.length} recent developments`);
  console.log(`- ${report.developments.highImpact.length} high-impact items`);
  console.log(`- ${report.developments.urgent.length} urgent alerts`);
  console.log('');
  
  // Demo 4: Show sample development
  if (report.developments.recent.length > 0) {
    const sample = report.developments.recent[0];
    console.log('📊 Sample Development Detected:');
    console.log(`Title: ${sample.title}`);
    console.log(`Source: ${sample.source}`);
    console.log(`Relevance Score: ${sample.relevanceScore?.toFixed(2) || 'N/A'}`);
    console.log(`Impact Score: ${sample.impactScore?.toFixed(2) || 'N/A'}`);
    console.log('');
  }
  
  // Demo 5: System status
  console.log('📊 System Status:');
  const status = intelligence.getStatus();
  console.log(JSON.stringify(status, null, 2));
  console.log('');
  
  await intelligence.stop();
  
  console.log('✨ Demo completed successfully!');
  
  return report;
}

/**
 * Demo for students at different levels
 */
async function runStudentDemo() {
  console.log('🎓 AI Intelligence System - Student Demo');
  console.log('===========================================\n');
  
  // Beginner level demo
  console.log('🔰 Beginner Level Demo:');
  
  const beginnerSystem = await quickStartForStudents('beginner');
  
  console.log('\n📚 Tutorial Available:');
  const tutorial = beginnerSystem.tutorial();
  console.log(`- ${tutorial.title}`);
  tutorial.sections.forEach(section => {
    console.log(`  - ${section.title}`);
  });
  
  await beginnerSystem.scan();
  const beginnerReport = beginnerSystem.generateReport();
  
  console.log(`\n📈 Found ${beginnerReport.developments.recent.length} developments`);
  
  await beginnerSystem.stop();
  
  // Advanced level demo
  console.log('\n🚀 Advanced Level Demo:');
  
  const advancedSystem = await quickStartForStudents('advanced');
  
  await advancedSystem.scan();
  const advancedReport = advancedSystem.generateReport();
  
  console.log('\n🔬 Advanced Analysis:');
  if (advancedReport.developments.recent.length > 0) {
    const dev = advancedReport.developments.recent[0];
    console.log(`Development: ${dev.title}`);
    console.log(`Analysis Scores:`);
    console.log(`  - Relevance: ${(dev.relevanceScore * 100).toFixed(1)}%`);
    console.log(`  - Impact: ${(dev.impactScore * 100).toFixed(1)}%`);
    console.log(`  - Urgency: ${(dev.urgencyScore * 100).toFixed(1)}%`);
  }
  
  await advancedSystem.stop();
  
  console.log('\n✨ Student demo completed!');
}

/**
 * Demo simulating a real-world scenario
 */
async function runScenarioDemo() {
  console.log('🌍 AI Intelligence System - Real-World Scenario');
  console.log('==================================================\n');
  
  console.log('Scenario: Your team needs to stay current with OpenAI developments');
  console.log('You\'ve set up the AI Intelligence System to monitor automatically.\n');
  
  const intelligence = await createAIIntelligence({
    environment: 'production',
    sources: {
      openai: true,
      anthropic: false,
      github: false,
      industry: false
    },
    automation: {
      autoGenerateAlerts: true,
      autoCreatePRs: false  // Manual review for demo
    }
  });
  
  console.log('🔄 Starting continuous monitoring...');
  console.log('(In real usage, this would run continuously)\n');
  
  // Simulate a scan
  await intelligence.scan();
  
  const report = intelligence.generateReport();
  
  console.log('🚨 ALERT: New developments detected!');
  console.log('');
  
  report.developments.recent.forEach((dev, index) => {
    console.log(`${index + 1}. ${dev.title}`);
    console.log(`   Source: ${dev.source}`);
    console.log(`   Impact: ${dev.impactScore > 0.8 ? 'HIGH' : dev.impactScore > 0.5 ? 'MEDIUM' : 'LOW'}`);
    console.log('');
  });
  
  if (report.recommendations.length > 0) {
    console.log('📈 Recommended Actions:');
    report.recommendations.forEach(rec => {
      console.log(`- ${rec.description}`);
    });
  }
  
  await intelligence.stop();
  
  console.log('\n✨ Scenario demo completed!');
  console.log('In a real deployment, the system would generate PRs or alerts for your team.');
}

// Export demos
module.exports = {
  runFullDemo,
  runStudentDemo,
  runScenarioDemo
};

// Run appropriate demo if called directly
if (require.main === module) {
  const demoType = process.argv[2] || 'full';
  
  switch (demoType) {
    case 'student':
      runStudentDemo().catch(console.error);
      break;
    case 'scenario':
      runScenarioDemo().catch(console.error);
      break;
    default:
      runFullDemo().catch(console.error);
      break;
  }
}

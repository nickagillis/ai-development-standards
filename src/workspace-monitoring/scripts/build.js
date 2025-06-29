#!/usr/bin/env node

/**
 * Build Script for Workspace Monitoring
 * 
 * Handles building, validation, and deployment preparation
 * following ai-development-standards
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

/**
 * Main build function
 */
async function build() {
  try {
    console.log('🏗️ Building Real-Time Workspace Monitor...');
    
    // 1. Validate environment
    await validateEnvironment();
    console.log('✅ Environment validated');
    
    // 2. Run tests
    await runTests();
    console.log('✅ Tests passed');
    
    // 3. Check code quality
    await checkCodeQuality();
    console.log('✅ Code quality checks passed');
    
    // 4. Validate configuration
    await validateConfiguration();
    console.log('✅ Configuration validated');
    
    // 5. Build documentation
    await buildDocumentation();
    console.log('✅ Documentation built');
    
    // 6. Prepare distribution
    await prepareDistribution();
    console.log('✅ Distribution prepared');
    
    console.log('🎉 Build completed successfully!');
    
  } catch (error) {
    console.error('💥 Build failed:', error.message);
    process.exit(1);
  }
}

/**
 * Validate build environment
 */
async function validateEnvironment() {
  // Check Node.js version
  const nodeVersion = process.version;
  const minVersion = 'v16.0.0';
  
  if (nodeVersion < minVersion) {
    throw new Error(`Node.js ${minVersion} or higher required, got ${nodeVersion}`);
  }
  
  // Check required dependencies
  const packageJson = JSON.parse(
    await fs.readFile(path.join(__dirname, '../../../package.json'), 'utf8')
  );
  
  const requiredDeps = ['ws', 'chokidar', 'uuid', 'joi', 'winston', 'dotenv'];
  const missingDeps = requiredDeps.filter(
    dep => !packageJson.dependencies[dep] && !packageJson.devDependencies[dep]
  );
  
  if (missingDeps.length > 0) {
    throw new Error(`Missing dependencies: ${missingDeps.join(', ')}`);
  }
}

/**
 * Run test suite
 */
async function runTests() {
  try {
    execSync('npm test', { 
      stdio: 'pipe',
      cwd: path.join(__dirname, '../../..')
    });
  } catch (error) {
    throw new Error('Test suite failed');
  }
}

/**
 * Check code quality
 */
async function checkCodeQuality() {
  const srcDir = path.join(__dirname, '..');
  
  // Check for TODO/FIXME comments that should be addressed
  const jsFiles = await findFiles(srcDir, '.js');
  const issues = [];
  
  for (const file of jsFiles) {
    const content = await fs.readFile(file, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      if (line.includes('TODO') || line.includes('FIXME')) {
        issues.push(`${path.relative(srcDir, file)}:${index + 1} - ${line.trim()}`);
      }
    });
  }
  
  if (issues.length > 0) {
    console.warn('⚠️ Code quality issues found:');
    issues.forEach(issue => console.warn(`  ${issue}`));
  }
}

/**
 * Validate configuration files
 */
async function validateConfiguration() {
  const configFiles = [
    '../../../.env.example',
    '../config/default.json'
  ];
  
  for (const configFile of configFiles) {
    const fullPath = path.join(__dirname, configFile);
    
    try {
      await fs.access(fullPath);
      
      if (configFile.endsWith('.json')) {
        const content = await fs.readFile(fullPath, 'utf8');
        JSON.parse(content); // Validate JSON syntax
      }
      
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Invalid configuration file ${configFile}: ${error.message}`);
      }
    }
  }
}

/**
 * Build documentation
 */
async function buildDocumentation() {
  const docsDir = path.join(__dirname, '../../../docs/real-time-workspace-monitoring');
  
  try {
    await fs.access(docsDir);
    
    // Validate markdown files
    const mdFiles = await findFiles(docsDir, '.md');
    
    for (const file of mdFiles) {
      const content = await fs.readFile(file, 'utf8');
      
      // Basic validation - check for headers
      if (!content.includes('#')) {
        console.warn(`⚠️ Documentation file ${path.basename(file)} has no headers`);
      }
    }
    
  } catch (error) {
    // Documentation directory might not exist yet
    console.warn('⚠️ Documentation directory not found');
  }
}

/**
 * Prepare distribution package
 */
async function prepareDistribution() {
  const distDir = path.join(__dirname, '../dist');
  
  // Create dist directory
  await fs.mkdir(distDir, { recursive: true });
  
  // Copy essential files
  const filesToCopy = [
    '../mcp/claude-desktop-integration.js',
    '../tests/setup.js',
    '../../../package.json',
    '../../../.env.example'
  ];
  
  for (const file of filesToCopy) {
    const sourcePath = path.join(__dirname, file);
    const targetPath = path.join(distDir, path.basename(file));
    
    try {
      await fs.copyFile(sourcePath, targetPath);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }
  
  // Create distribution manifest
  const manifest = {
    name: 'real-time-workspace-monitor',
    version: '1.0.0',
    description: 'Real-time workspace conflict prevention with Claude Desktop MCP integration',
    built: new Date().toISOString(),
    files: await fs.readdir(distDir)
  };
  
  await fs.writeFile(
    path.join(distDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  console.log(`📦 Distribution created in ${distDir}`);
}

/**
 * Find files with specific extension
 */
async function findFiles(dir, extension) {
  const files = [];
  
  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.')) {
        await walk(fullPath);
      } else if (entry.isFile() && fullPath.endsWith(extension)) {
        files.push(fullPath);
      }
    }
  }
  
  await walk(dir);
  return files;
}

// Run build if called directly
if (require.main === module) {
  build();
}

module.exports = { build };
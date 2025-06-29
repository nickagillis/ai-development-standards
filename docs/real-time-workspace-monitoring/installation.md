# Installation Guide

## 📋 Prerequisites

### Required Software

```bash
# Check your versions
node --version    # Requires >= 16.0.0
npm --version     # Requires >= 8.0.0
git --version     # Any recent version
```

### Optional but Recommended

- **Claude Desktop** - For MCP integration and recursive analysis
- **VS Code** - For editor integration
- **Slack/Teams/Discord** - For team notifications
- **Docker** - For containerized deployment

## 🚀 Installation Methods

### Method 1: NPM Package (Recommended)

```bash
# Install from npm (when published)
npm install @ai-dev-standards/workspace-monitoring

# Or install globally for CLI usage
npm install -g @ai-dev-standards/workspace-monitoring
```

### Method 2: From Source Repository

```bash
# Clone the repository
git clone https://github.com/nickagillis/ai-development-standards.git
cd ai-development-standards/src/workspace-monitoring

# Install dependencies
npm install

# Validate installation
npm run validate
```

### Method 3: Docker Container

```bash
# Pull the official image
docker pull aidevstandards/workspace-monitoring:latest

# Or build from source
docker build -t workspace-monitor .

# Run container
docker run -p 8080:8080 -v $(pwd):/workspace workspace-monitor
```

## ⚙️ Initial Configuration

### 1. Basic Configuration File

```bash
# Copy example configuration
cp .workspacemonitorrc.example .workspacemonitorrc

# Edit with your settings
vim .workspacemonitorrc
```

### 2. Environment Variables

```bash
# Create environment file
cat > .env << EOF
WORKSPACE_MONITOR_PORT=8080
WORKSPACE_PATH=$(pwd)
NODE_ENV=development
LOG_LEVEL=info
EOF
```

### 3. Validate Installation

```bash
# Test all components
npm run validate

# Expected output:
# ✅ Configuration valid
# ✅ Dependencies installed
# ✅ Tests passing
# ✅ Server starts successfully
# ✅ WebSocket connections work
# ✅ File monitoring active
```

## 🔧 Server Setup

### Basic Server

```javascript
// server.js
const { RealTimeWorkspaceMonitor } = require('@ai-dev-standards/workspace-monitoring');

async function startServer() {
  const monitor = new RealTimeWorkspaceMonitor({
    workspacePath: process.cwd(),
    websocketPort: 8080,
    conflictThreshold: 0.7
  });
  
  // Set up event handlers
  monitor.on('monitoring:started', () => {
    console.log('🔥 Real-time conflict prevention is active!');
  });
  
  monitor.on('conflict:detected', (analysis) => {
    console.log(`🚨 Conflict detected: ${analysis.filePath}`);
    console.log(`Risk: ${Math.round(analysis.probability * 100)}%`);
  });
  
  // Start monitoring
  await monitor.startMonitoring();
  
  return monitor;
}

startServer().catch(console.error);
```

### Run the Server

```bash
# Development mode
node server.js

# Production mode
NODE_ENV=production node server.js

# With PM2 process manager
npm install -g pm2
pm2 start server.js --name "workspace-monitor"
```

## 🌐 Client Setup

### Browser Client

```html
<!DOCTYPE html>
<html>
<head>
  <title>Workspace Monitor</title>
</head>
<body>
  <div id="status">Connecting...</div>
  
  <script src="./client/workspace-monitor-client.js"></script>
  <script>
    const client = new WorkspaceMonitorClient({
      serverUrl: 'ws://localhost:8080',
      developerId: 'your-developer-id'
    });
    
    client.initialize().then(() => {
      document.getElementById('status').textContent = '✅ Connected';
      
      // Conflict notifications appear automatically!
      client.on('conflict:detected', (analysis) => {
        console.log('Conflict prevented!', analysis);
      });
    });
  </script>
</body>
</html>
```

### Node.js Client

```javascript
const { WorkspaceMonitorClient } = require('@ai-dev-standards/workspace-monitoring/client');

const client = new WorkspaceMonitorClient({
  serverUrl: 'ws://localhost:8080',
  developerId: 'backend-service'
});

await client.initialize();
console.log('Connected to workspace monitor');

// Report file activity
await client.reportFileActivity('./src/api/users.js', 'edit');
```

## 🔌 Integration Setup

### VS Code Extension

```bash
# Install from VS Code marketplace (when published)
code --install-extension ai-dev-standards.workspace-monitoring

# Or install from VSIX file
code --install-extension workspace-monitoring.vsix
```

### Claude Desktop MCP

```json
// ~/.claude_desktop_config.json
{
  "mcpServers": {
    "workspace-monitor": {
      "command": "node",
      "args": ["/path/to/workspace-monitoring/mcp-server.js"],
      "env": {
        "WORKSPACE_MONITOR_URL": "ws://localhost:8080"
      }
    }
  }
}
```

### Slack Integration

```bash
# Set up Slack webhook
export SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
export SLACK_CHANNEL="#dev-coordination"

# Update configuration
echo '{
  "collaboration": {
    "communicationChannels": {
      "slack": {
        "enabled": true,
        "webhook": "'$SLACK_WEBHOOK_URL'",
        "channel": "'$SLACK_CHANNEL'"
      }
    }
  }
}' >> .workspacemonitorrc
```

## 🐳 Docker Deployment

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  workspace-monitor:
    image: aidevstandards/workspace-monitoring:latest
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - WORKSPACE_PATH=/workspace
    volumes:
      - ./:/workspace:ro
      - ./logs:/app/logs
    restart: unless-stopped
  
  redis:
    image: redis:alpine
    restart: unless-stopped
  
  postgres:
    image: postgres:13
    environment:
      POSTGRES_DB: workspace_monitor
      POSTGRES_USER: monitor
      POSTGRES_PASSWORD: secure_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs workspace-monitor
```

## ☁️ Cloud Deployment

### AWS EC2

```bash
# Launch EC2 instance with user data
aws ec2 run-instances \
  --image-id ami-0abcdef1234567890 \
  --instance-type t3.small \
  --key-name your-key-pair \
  --security-group-ids sg-903004f8 \
  --user-data file://install-script.sh
```

### Heroku

```bash
# Create Heroku app
heroku create your-workspace-monitor

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set WORKSPACE_MONITOR_PORT=\$PORT

# Deploy
git push heroku main
```

### DigitalOcean

```bash
# Create droplet with Docker
doctl compute droplet create workspace-monitor \
  --image docker-20-04 \
  --size s-1vcpu-1gb \
  --region nyc1 \
  --ssh-keys your-ssh-key-id

# Deploy with Docker
scp docker-compose.yml root@your-droplet-ip:/root/
ssh root@your-droplet-ip "cd /root && docker-compose up -d"
```

## 🔍 Verification

### Health Check

```bash
# Check server health
curl http://localhost:8080/health

# Expected response:
# {
#   "status": "healthy",
#   "timestamp": "2024-01-01T00:00:00Z",
#   "version": "1.0.0"
# }
```

### WebSocket Test

```bash
# Install wscat for testing
npm install -g wscat

# Test WebSocket connection
wscat -c ws://localhost:8080

# Send test message
{"type": "ping"}

# Expected response
{"type": "pong"}
```

### Full System Test

```bash
# Run comprehensive test suite
npm run test:integration

# Test specific components
npm run test:websocket
npm run test:conflict-detection
npm run test:mcp-integration
```

## 🔧 Troubleshooting Installation

### Common Issues

**Port Already in Use**
```bash
# Find process using port 8080
lsof -i :8080

# Kill process
kill -9 <PID>

# Or use different port
WORKSPACE_MONITOR_PORT=8081 node server.js
```

**Permission Denied**
```bash
# Fix file permissions
chmod +x ./scripts/*
sudo chown -R $USER:$USER ./logs

# Run without sudo
npm config set unsafe-perm true
```

**Module Not Found**
```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Getting Help

- 📖 **Documentation**: Check [troubleshooting guide](./operations/troubleshooting.md)
- 🐛 **Issues**: Report bugs on [GitHub](https://github.com/nickagillis/ai-development-standards/issues)
- 💬 **Discussions**: Join community discussions
- 📧 **Support**: Contact for enterprise support

## ✅ Next Steps

After successful installation:

1. **[Configure the system](./configuration.md)** - Set up monitoring rules and integrations
2. **[Try the examples](./examples.md)** - Run working code examples
3. **[Set up integrations](./integrations/)** - Connect with your tools
4. **[Deploy to production](./operations/deployment.md)** - Scale for your team

---

**Installation complete! Your workspace monitoring system is ready to prevent conflicts.** 🚀
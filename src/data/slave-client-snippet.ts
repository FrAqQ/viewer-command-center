
export const slaveCode = `// slave.js - Basic Slave Client for Viewer Network
const axios = require('axios');
const os = require('os');
const osUtils = require('os-utils');
const cron = require('node-cron');
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// ==== CONFIGURATION ====
// Replace these with your own values
const slaveConfig = {
  name: 'Slave-01',
  id: '', // Will be assigned by the master on first connection
  hostname: os.hostname(), 
};

// Master server configuration
const masterConfig = {
  url: 'https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook',
  apiKey: 'YOUR_API_SECRET_KEY' // IMPORTANT: Replace this with your actual API key
};

// Update interval in milliseconds
const updateInterval = 30000; // 30 seconds
const commandCheckInterval = 15000; // 15 seconds

// ==== SUPABASE CONNECTION ====
const supabaseUrl = 'https://qdxpxqdewqrbvlsajeeo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeHB4cWRld3FyYnZsc2FqZWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NzM0MDMsImV4cCI6MjA1MzI0OTQwM30.-wnDf1hMWOow3O1kbcTfC3mw59h-5SsmdFGhp5bKgUE';

const supabase = createClient(supabaseUrl, supabaseKey);

// ==== STATE MANAGEMENT ====
const state = {
  viewers: [],
  cpu: 0,
  ram: 0,
};

// ==== UTILITY FUNCTIONS ====

// Get system metrics
async function getSystemMetrics() {
  return new Promise((resolve) => {
    osUtils.cpuUsage(function(cpuUsage) {
      state.cpu = Math.round(cpuUsage * 100);
      state.ram = Math.round((1 - (os.freemem() / os.totalmem())) * 100);
      resolve({
        cpu: state.cpu,
        ram: state.ram,
        instances: state.viewers.length
      });
    });
  });
}

// Send status update to master
async function sendStatusUpdate() {
  try {
    const metrics = await getSystemMetrics();
    
    const response = await axios.post(masterConfig.url, {
      id: slaveConfig.id,
      name: slaveConfig.name,
      hostname: slaveConfig.hostname,
      ip: getLocalIpAddress(),
      status: 'online',
      metrics
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': masterConfig.apiKey // Send API key with each request
      }
    });
    
    // If this is the first connection, save the ID assigned by the master
    if (response.data && response.data.id && !slaveConfig.id) {
      slaveConfig.id = response.data.id;
      console.log(\`Registered with master. Assigned ID: \${slaveConfig.id}\`);
    }
    
    console.log(\`Status update sent. CPU: \${metrics.cpu}%, RAM: \${metrics.ram}%, Instances: \${metrics.instances}\`);
  } catch (err) {
    console.error('Failed to send status update:', err.message);
  }
}

// Get local IP address
function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const devName in interfaces) {
    const iface = interfaces[devName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        return alias.address;
      }
    }
  }
  return '127.0.0.1';
}

// ==== VIEWER MANAGEMENT ====
async function startViewer(url, proxyConfig = null) {
  try {
    const viewerId = \`viewer-\${Date.now()}\`;
    console.log(\`Starting viewer for \${url}\`);
    
    let launchOptions = {};
    
    // Configure proxy if provided
    if (proxyConfig) {
      let proxyUrl = \`http://\${proxyConfig.address}:\${proxyConfig.port}\`;
      if (proxyConfig.username && proxyConfig.password) {
        proxyUrl = \`http://\${proxyConfig.username}:\${proxyConfig.password}@\${proxyConfig.address}:\${proxyConfig.port}\`;
      }
      
      launchOptions = {
        proxy: {
          server: proxyUrl
        }
      };
    }
    
    // Launch browser
    const browser = await chromium.launch({
      headless: true,
      ...launchOptions
    });
    
    // Create a new page
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Navigate to the URL
    await page.goto(url, { waitUntil: 'networkidle' });
    
    // Add to state
    state.viewers.push({
      id: viewerId,
      browser,
      page,
      url,
      startTime: new Date(),
      proxy: proxyConfig
    });
    
    // Report success
    console.log(\`Viewer \${viewerId} started successfully\`);
    return viewerId;
  } catch (err) {
    console.error('Error starting viewer:', err.message);
    return null;
  }
}

async function stopViewer(viewerId) {
  try {
    const viewerIndex = state.viewers.findIndex(v => v.id === viewerId);
    
    if (viewerIndex === -1) {
      console.warn(\`Viewer \${viewerId} not found\`);
      return false;
    }
    
    const viewer = state.viewers[viewerIndex];
    
    // Close browser
    await viewer.browser.close();
    
    // Remove from state
    state.viewers.splice(viewerIndex, 1);
    
    console.log(\`Viewer \${viewerId} stopped\`);
    return true;
  } catch (err) {
    console.error(\`Error stopping viewer \${viewerId}:\`, err.message);
    return false;
  }
}

async function stopAllViewers() {
  const viewerIds = [...state.viewers.map(v => v.id)];
  let results = [];
  
  for (const id of viewerIds) {
    results.push(await stopViewer(id));
  }
  
  return results;
}

// ==== COMMAND HANDLING ====
async function checkForCommands() {
  if (!slaveConfig.id) return; // Skip if not registered
  
  try {
    // Query for commands for this slave
    const { data: commands, error } = await supabase
      .from('commands')
      .select('*')
      .eq('status', 'pending')
      .or('target.eq.' + slaveConfig.id + ',target.eq.' + slaveConfig.hostname + ',target.eq.all');
    
    if (error) {
      throw error;
    }
    
    if (!commands || commands.length === 0) {
      // No commands to process
      return;
    }
    
    console.log(\`Received \${commands.length} commands to process\`);
    
    // Process each command
    for (const command of commands) {
      await processCommand(command);
    }
  } catch (err) {
    console.error('Error checking for commands:', err.message);
  }
}

async function processCommand(command) {
  console.log(\`Processing command: \${command.type}, ID: \${command.id}\`);
  
  try {
    let result = null;
    
    switch (command.type) {
      case 'spawn':
        if (!command.payload || !command.payload.url) {
          throw new Error('Spawn command requires URL');
        }
        result = await startViewer(
          command.payload.url, 
          command.payload.proxy || null
        );
        break;
        
      case 'stop':
        if (command.payload && command.payload.viewerId) {
          // Stop specific viewer
          result = await stopViewer(command.payload.viewerId);
        } else {
          // Stop all viewers
          result = await stopAllViewers();
        }
        break;
        
      case 'update_proxy':
        // Implement proxy updating...
        result = { message: 'Proxy update not implemented yet' };
        break;
        
      default:
        console.warn(\`Unknown command type: \${command.type}\`);
        result = { error: \`Unknown command type: \${command.type}\` };
    }
    
    // Mark command as executed
    await supabase
      .from('commands')
      .update({
        status: 'executed'
      })
      .eq('id', command.id);
    
    console.log(\`Command \${command.id} executed with result:\`, result);
    
    // Log command completion
    await supabase
      .from('logs')
      .insert({
        level: 'info',
        source: slaveConfig.hostname,
        message: \`Command \${command.id} (\${command.type}) executed successfully\`,
        details: { command, result }
      });
      
  } catch (err) {
    console.error(\`Error processing command \${command.id}:\`, err.message);
    
    // Mark command as failed
    await supabase
      .from('commands')
      .update({
        status: 'failed'
      })
      .eq('id', command.id);
    
    // Log error
    await supabase
      .from('logs')
      .insert({
        level: 'error',
        source: slaveConfig.hostname,
        message: \`Command \${command.id} (\${command.type}) failed: \${err.message}\`,
        details: { command, error: err.message }
      });
  }
}

// ==== INITIALIZATION ====
async function init() {
  console.log(\`Starting slave node: \${slaveConfig.name} on \${slaveConfig.hostname}\`);
  
  // Send initial status update
  await sendStatusUpdate();
  
  // Set up regular status updates
  setInterval(sendStatusUpdate, updateInterval);
  
  // Set up command checking
  setInterval(checkForCommands, commandCheckInterval);
  
  console.log('Slave node initialized and running');
}

// Start the slave node
init().catch(err => {
  console.error('Failed to initialize slave:', err);
});
`;

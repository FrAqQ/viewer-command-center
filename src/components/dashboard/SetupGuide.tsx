
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, Code, Terminal, Server, Download, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const SetupGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState('setup');
  
  const webhookUrl = 'https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook';
  const supabaseUrl = 'https://qdxpxqdewqrbvlsajeeo.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeHB4cWRld3FyYnZsc2FqZWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NzM0MDMsImV4cCI6MjA1MzI0OTQwM30.-wnDf1hMWOow3O1kbcTfC3mw59h-5SsmdFGhp5bKgUE';
  
  const handleCopy = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  const installationCode = `# Update system and install required packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential

# Install Node.js via NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \\. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \\. "$NVM_DIR/bash_completion"
nvm install 20
nvm use 20

# Install PM2 for process management
npm install -g pm2

# Create project directory
mkdir -p ~/viewer-slave
cd ~/viewer-slave

# Download dependencies
npm init -y
npm install axios @supabase/supabase-js playwright os-utils node-cron`;

  const slaveCode = `// slave.js - Basic Slave Client for Viewer Network
const axios = require('axios');
const os = require('os');
const osUtils = require('os-utils');
const cron = require('node-cron');
const { createClient } = require('@supabase/supabase-js');

// Configuration
const slaveConfig = {
  name: 'Slave-01', // Change this to your slave name
  hostname: os.hostname(),
  ip: '0.0.0.0', // Will be updated on start
  webhookUrl: '${webhookUrl}',
  supabaseUrl: '${supabaseUrl}',
  supabaseKey: '${supabaseKey}',
  updateInterval: 10, // seconds
  commandCheckInterval: 5 // seconds
};

// Initialize Supabase client
const supabase = createClient(slaveConfig.supabaseUrl, slaveConfig.supabaseKey);

// Get public IP address
async function getPublicIp() {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error fetching public IP:', error.message);
    return '127.0.0.1';
  }
}

// Get system metrics
function getSystemMetrics() {
  return new Promise((resolve) => {
    osUtils.cpuUsage((cpuUsage) => {
      resolve({
        cpu: parseFloat((cpuUsage * 100).toFixed(1)),
        ram: parseFloat(((1 - osUtils.freememPercentage()) * 100).toFixed(1)),
        instances: 0 // This will be updated with actual viewer count
      });
    });
  });
}

// Update slave status
async function updateStatus() {
  try {
    const metrics = await getSystemMetrics();
    
    // Count active viewers for this slave
    const { data: viewersData, error: viewersError } = await supabase
      .from('viewers')
      .select('count')
      .eq('slave_id', slaveConfig.id)
      .eq('status', 'running');
      
    if (!viewersError && viewersData) {
      metrics.instances = viewersData.length || 0;
    }
    
    const payload = {
      name: slaveConfig.name,
      hostname: slaveConfig.hostname,
      ip: slaveConfig.ip,
      id: slaveConfig.id, // If we have an ID from Supabase
      status: 'online',
      metrics
    };
    
    const response = await axios.post(slaveConfig.webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.id) {
      // Store the slave ID returned by Supabase
      slaveConfig.id = response.data.id;
      console.log(\`Status updated successfully. Slave ID: \${slaveConfig.id}\`);
    } else {
      console.log('Status updated successfully');
    }
  } catch (error) {
    console.error('Error updating status:', error.message);
  }
}

// Check for pending commands
async function checkCommands() {
  if (!slaveConfig.id) return; // Skip if we don't have an ID yet
  
  try {
    // Get pending commands for this slave
    const { data: commands, error } = await supabase
      .from('commands')
      .select('*')
      .eq('status', 'pending')
      .or(\`target.eq.\${slaveConfig.id},target.eq.\${slaveConfig.hostname},target.eq.all\`);
    
    if (error) {
      console.error('Error fetching commands:', error.message);
      return;
    }
    
    if (!commands || commands.length === 0) return;
    
    // Process each command
    for (const command of commands) {
      console.log(\`Processing command: \${command.type}\`);
      
      // Handle the command based on type
      switch (command.type) {
        case 'spawn':
          // In a real implementation, you would start a viewer instance
          console.log(\`Would spawn viewer for URL: \${command.payload?.url}\`);
          break;
        
        case 'stop':
          // In a real implementation, you would stop a viewer instance
          console.log(\`Would stop viewer with ID: \${command.payload?.viewerId}\`);
          break;
          
        case 'reconnect':
          // Just update our status again
          await updateStatus();
          break;
          
        case 'update_proxy':
          // In a real implementation, you would update a proxy for a viewer
          console.log(\`Would update proxy for viewer: \${command.payload?.viewerId}\`);
          break;
          
        case 'custom':
          // Handle custom commands
          console.log(\`Custom command: \${JSON.stringify(command.payload)}\`);
          break;
          
        default:
          console.log(\`Unknown command type: \${command.type}\`);
      }
      
      // Mark command as executed
      await supabase
        .from('commands')
        .update({ status: 'executed' })
        .eq('id', command.id);
      
      // Log the execution
      await supabase
        .from('logs')
        .insert({
          level: 'info',
          source: slaveConfig.hostname,
          message: \`Command \${command.type} executed\`,
          details: { commandId: command.id, payload: command.payload }
        });
    }
    
  } catch (error) {
    console.error('Error processing commands:', error.message);
  }
}

// Startup sequence
async function start() {
  console.log('Slave client starting...');
  console.log(\`Hostname: \${slaveConfig.hostname}\`);
  
  // Get public IP
  slaveConfig.ip = await getPublicIp();
  console.log(\`Public IP: \${slaveConfig.ip}\`);
  
  // Send initial status update
  await updateStatus();
  
  // Setup regular status updates
  cron.schedule(\`*/${slaveConfig.updateInterval} * * * * *\`, updateStatus);
  
  // Setup command checking
  cron.schedule(\`*/${slaveConfig.commandCheckInterval} * * * * *\`, checkCommands);
  
  console.log('Slave client running');
}

// Start the slave client
start().catch(console.error);`;

  const cronSetup = `# Edit your crontab
crontab -e

# Add this line to restart the slave client on reboot
@reboot cd ~/viewer-slave && pm2 start slave.js --name viewer-slave && pm2 save
`;

  const startCommands = `# Start the slave manually
cd ~/viewer-slave
node slave.js

# OR using PM2 for persistence
cd ~/viewer-slave
pm2 start slave.js --name viewer-slave
pm2 save
`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slave Setup Guide</CardTitle>
        <CardDescription>
          Follow these steps to set up a new slave server for your viewer network
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="setup">
              <Server className="h-4 w-4 mr-1" />
              Setup
            </TabsTrigger>
            <TabsTrigger value="code">
              <Code className="h-4 w-4 mr-1" />
              Code
            </TabsTrigger>
            <TabsTrigger value="run">
              <Terminal className="h-4 w-4 mr-1" />
              Running
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">1. Prerequisites</h3>
              <p className="text-sm text-muted-foreground">
                You need a Linux server (Ubuntu recommended) with root access.
              </p>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">2. Installation</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Run the following commands to set up the environment:
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-60">
                  {installationCode}
                </pre>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(installationCode, "Installation commands copied to clipboard")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">3. Configuration</h3>
              <p className="text-sm text-muted-foreground">
                You'll need these connection details for your slave:
              </p>
              <div className="grid grid-cols-1 gap-2 mt-2">
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm font-mono">Webhook URL:</span>
                  <div className="flex items-center">
                    <span className="text-sm font-mono truncate max-w-[200px]">{webhookUrl}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="ml-2" 
                      onClick={() => handleCopy(webhookUrl, "Webhook URL copied to clipboard")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm font-mono">Supabase URL:</span>
                  <div className="flex items-center">
                    <span className="text-sm font-mono truncate max-w-[200px]">{supabaseUrl}</span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="ml-2" 
                      onClick={() => handleCopy(supabaseUrl, "Supabase URL copied to clipboard")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between bg-muted p-2 rounded-md">
                  <span className="text-sm font-mono">Anon Key:</span>
                  <div className="flex items-center">
                    <span className="text-sm font-mono truncate max-w-[200px]">
                      {supabaseKey.substring(0, 10)}...{supabaseKey.substring(supabaseKey.length - 5)}
                    </span>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="ml-2" 
                      onClick={() => handleCopy(supabaseKey, "Supabase key copied to clipboard")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Slave Client Code</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Create a file called <code className="bg-muted p-1 rounded">slave.js</code> in your project directory:
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto max-h-[400px]">
                  {slaveCode}
                </pre>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(slaveCode, "Slave client code copied to clipboard")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              
              <p className="text-sm text-muted-foreground mt-4">
                <strong>Important:</strong> Make sure to modify the <code className="bg-muted p-1 rounded">slaveConfig.name</code> value 
                to a unique name for your slave server.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="run" className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-medium">Running Your Slave</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Run the slave client using Node.js or PM2 (recommended):
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {startCommands}
                </pre>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(startCommands, "Start commands copied to clipboard")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Auto-start on Reboot</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Add a crontab entry to auto-start the slave on reboot:
              </p>
              <div className="relative">
                <pre className="bg-muted p-4 rounded-md text-sm overflow-auto">
                  {cronSetup}
                </pre>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="absolute top-2 right-2"
                  onClick={() => handleCopy(cronSetup, "Crontab setup copied to clipboard")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-medium">Monitor Your Slave</h3>
              <p className="text-sm text-muted-foreground">
                Once running, your slave will appear in the dashboard automatically.
                You can use PM2 to monitor the process:
              </p>
              <pre className="bg-muted p-4 rounded-md text-sm mt-2">
                pm2 logs viewer-slave
                pm2 monit
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={() => window.open('https://playwright.dev/docs/intro', '_blank')}>
          <ExternalLink className="h-4 w-4 mr-1" />
          Playwright Documentation
        </Button>
        <Button variant="outline" className="ml-2" onClick={() => window.open('https://github.com/Unitech/pm2', '_blank')}>
          <ExternalLink className="h-4 w-4 mr-1" />
          PM2 Documentation
        </Button>
        <Button variant="default" className="ml-auto" onClick={() => setActiveTab('code')}>
          <Download className="h-4 w-4 mr-1" />
          Get Slave Code
        </Button>
      </CardFooter>
    </Card>
  );
};

export default SetupGuide;


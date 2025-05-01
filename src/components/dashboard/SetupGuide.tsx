
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Check, Copy, Terminal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';

const SetupGuide: React.FC = () => {
  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slave Setup Guide</CardTitle>
        <CardDescription>
          How to configure and connect slave servers to your network
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs defaultValue="nodejs">
          <TabsList className="mb-4">
            <TabsTrigger value="nodejs">Node.js Script</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="api">API Reference</TabsTrigger>
          </TabsList>
          
          <TabsContent value="nodejs" className="space-y-4">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Server Requirements</AlertTitle>
              <AlertDescription>
                Install Node.js 18+ and the following packages:
                <code className="block bg-muted p-2 rounded mt-2">
                  npm install @supabase/supabase-js axios playwright
                </code>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Basic Slave Script Structure</h3>
              <pre className="bg-muted p-4 rounded text-xs overflow-auto">
{`// slave.js
const { chromium } = require('playwright');
const axios = require('axios');

const SUPABASE_URL = 'https://qdxpxqdewqrbvlsajeeo.supabase.co';
const SLAVE_ID = 'slave-' + Math.random().toString(36).substring(2, 9);
const SLAVE_NAME = 'MySlaveServer';
const SLAVE_HOSTNAME = 'server1.example.com';
const SLAVE_IP = '192.168.1.100';

// Register with master
async function registerSlave() {
  try {
    const response = await axios.post(
      'https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook',
      {
        action: 'register',
        slave: {
          id: SLAVE_ID,
          name: SLAVE_NAME,
          hostname: SLAVE_HOSTNAME,
          ip: SLAVE_IP,
          metrics: {
            cpu: 0,
            ram: 0,
            instances: 0
          }
        }
      }
    );
    console.log('Slave registered:', response.data);
    return response.data.slave.id;
  } catch (error) {
    console.error('Failed to register slave:', error);
    throw error;
  }
}

// Update metrics periodically
function startMetricsReporter(slaveId) {
  setInterval(async () => {
    const metrics = {
      cpu: Math.floor(Math.random() * 100),
      ram: Math.floor(Math.random() * 100),
      instances: activeInstances.length
    };
    
    try {
      await axios.post(
        'https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook',
        {
          action: 'update',
          slaveId,
          metrics
        }
      );
    } catch (error) {
      console.error('Failed to update metrics:', error);
    }
  }, 10000); // Every 10 seconds
}

// Poll for commands
function startCommandPoller(slaveId) {
  setInterval(async () => {
    try {
      const response = await axios.post(
        'https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook',
        {
          action: 'fetch_commands',
          slaveId
        }
      );
      
      const commands = response.data.commands || [];
      for (const command of commands) {
        processCommand(command);
      }
    } catch (error) {
      console.error('Failed to fetch commands:', error);
    }
  }, 5000); // Every 5 seconds
}

// Main function
async function main() {
  const slaveId = await registerSlave();
  startMetricsReporter(slaveId);
  startCommandPoller(slaveId);
}

main();`}
              </pre>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => copyToClipboard(document.querySelector('pre')?.textContent || '', 'Code copied to clipboard')}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Code
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="config" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Connection Settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Webhook URL</p>
                    <div className="flex items-center">
                      <code className="bg-muted px-2 py-1 rounded text-xs flex-1">
                        https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => copyToClipboard('https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook', 'Webhook URL copied')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Supabase URL</p>
                    <div className="flex items-center">
                      <code className="bg-muted px-2 py-1 rounded text-xs flex-1">
                        https://qdxpxqdewqrbvlsajeeo.supabase.co
                      </code>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => copyToClipboard('https://qdxpxqdewqrbvlsajeeo.supabase.co', 'Supabase URL copied')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-2">
                <h3 className="text-sm font-medium mb-2">System Requirements</h3>
                <ul className="space-y-1">
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-status-success" />
                    <span className="text-sm">Node.js 18 or higher</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-status-success" />
                    <span className="text-sm">2GB+ RAM for browser instances</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-status-success" />
                    <span className="text-sm">Stable internet connection</span>
                  </li>
                  <li className="flex items-center">
                    <Check className="h-4 w-4 mr-2 text-status-success" />
                    <span className="text-sm">Linux recommended (Ubuntu 20.04+)</span>
                  </li>
                </ul>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="api" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Webhook API Actions</h3>
                <div className="rounded-md border">
                  <div className="p-3 border-b">
                    <div className="font-mono text-sm">register</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Register a new slave with the master server
                    </p>
                  </div>
                  
                  <div className="p-3 border-b">
                    <div className="font-mono text-sm">update</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Update slave metrics (CPU, RAM, instances)
                    </p>
                  </div>
                  
                  <div className="p-3 border-b">
                    <div className="font-mono text-sm">fetch_commands</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Retrieve pending commands for the slave
                    </p>
                  </div>
                  
                  <div className="p-3 border-b">
                    <div className="font-mono text-sm">update_command</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mark command as executed or failed
                    </p>
                  </div>
                  
                  <div className="p-3 border-b">
                    <div className="font-mono text-sm">add_log</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add a log entry to the master server
                    </p>
                  </div>
                  
                  <div className="p-3">
                    <div className="font-mono text-sm">update_viewer</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Update viewer instance status
                    </p>
                  </div>
                </div>
              </div>
              
              <Alert>
                <AlertTitle>Command Types</AlertTitle>
                <AlertDescription className="text-sm">
                  <p className="mb-2">Slaves should handle these command types:</p>
                  <ul className="list-disc pl-5 space-y-1 text-xs">
                    <li><strong>spawn</strong> - Start a new viewer instance</li>
                    <li><strong>stop</strong> - Stop a running viewer instance</li>
                    <li><strong>update_proxy</strong> - Change proxy for a viewer</li>
                    <li><strong>reconnect</strong> - Force reconnect to channel</li>
                    <li><strong>custom</strong> - Custom commands with special payload</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SetupGuide;

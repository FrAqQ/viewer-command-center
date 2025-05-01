
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const SetupGuide = () => {
  const [copied, setCopied] = useState<Record<string, boolean>>({});
  
  const webhookUrl = 'https://qdxpxqdewqrbvlsajeeo.functions.supabase.co/slave-webhook';
  
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied({...copied, [key]: true});
    toast.success('Copied to clipboard!');
    
    setTimeout(() => {
      setCopied((prev) => ({...prev, [key]: false}));
    }, 2000);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup Guide</CardTitle>
        <CardDescription>
          Instructions for connecting and configuring slave servers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="webhook">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="webhook">Webhook Setup</TabsTrigger>
            <TabsTrigger value="register">Registration</TabsTrigger>
            <TabsTrigger value="examples">Example Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="webhook">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Webhook URL</h3>
                <p className="text-muted-foreground mb-2">
                  Use this URL to communicate with the master server. The webhook accepts POST requests with JSON payloads.
                </p>
                <div className="flex items-center bg-muted rounded-md p-3 mb-2">
                  <code className="text-sm flex-1 overflow-auto">{webhookUrl}</code>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleCopy(webhookUrl, 'webhook')} 
                    className="ml-2"
                  >
                    {copied['webhook'] ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  This webhook does not require authentication and accepts the following actions: 
                  <code className="mx-1">register</code>,
                  <code className="mx-1">update</code>,
                  <code className="mx-1">fetch_commands</code>,
                  <code className="mx-1">update_command</code>,
                  <code className="mx-1">update_viewer</code>,
                  <code className="mx-1">add_log</code>, and
                  <code className="mx-1">check_proxy</code>.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="register">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Registration Payload</h3>
                <p className="text-muted-foreground mb-2">
                  Use this format to register a new slave server with the master:
                </p>
                <div className="bg-muted rounded-md p-3 mb-2">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
{`{
  "action": "register",
  "slave": {
    "name": "Slave 01",
    "hostname": "server-hostname",
    "ip": "192.168.1.100",
    "status": "online",
    "metrics": {
      "cpu": 15.2,
      "ram": 48.7,
      "instances": 3
    }
  }
}`}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(`{
  "action": "register",
  "slave": {
    "name": "Slave 01",
    "hostname": "server-hostname",
    "ip": "192.168.1.100",
    "status": "online", 
    "metrics": {
      "cpu": 15.2,
      "ram": 48.7,
      "instances": 3
    }
  }
}`, 'register')} 
                    className="mt-2"
                  >
                    {copied['register'] ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  After successful registration, the slave server will receive its ID which should be used for future communications.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Update Metrics Payload</h3>
                <p className="text-muted-foreground mb-2">
                  Send system metrics using this format:
                </p>
                <div className="bg-muted rounded-md p-3 mb-2">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
{`{
  "action": "update",
  "slaveId": "slave-id-here",
  "hostname": "server-hostname", 
  "metrics": {
    "cpu": 25.6,
    "ram": 42.1,
    "instances": 5
  }
}`}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(`{
  "action": "update",
  "slaveId": "slave-id-here", 
  "hostname": "server-hostname",
  "metrics": {
    "cpu": 25.6,
    "ram": 42.1,
    "instances": 5
  }
}`, 'update')} 
                    className="mt-2"
                  >
                    {copied['update'] ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy JSON
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  You can identify the slave either by its ID or hostname. Send updates every 10-30 seconds for accurate monitoring.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="examples">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Fetch Commands Example</h3>
                <div className="bg-muted rounded-md p-3 mb-2">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
{`// Fetch pending commands
async function fetchPendingCommands(hostname) {
  const response = await fetch("${webhookUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "fetch_commands",
      hostname: hostname
    })
  });
  
  const data = await response.json();
  return data.commands;
}`}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(`// Fetch pending commands
async function fetchPendingCommands(hostname) {
  const response = await fetch("${webhookUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "fetch_commands",
      hostname: hostname
    })
  });
  
  const data = await response.json();
  return data.commands;
}`, 'fetch')} 
                    className="mt-2"
                  >
                    {copied['fetch'] ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Function
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-2">Log Events Example</h3>
                <div className="bg-muted rounded-md p-3 mb-2">
                  <pre className="text-sm overflow-auto whitespace-pre-wrap">
{`// Log an event
async function logEvent(level, message, details = {}) {
  await fetch("${webhookUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "add_log",
      log: {
        level: level, // 'info', 'warning', or 'error'
        source: "Slave: " + hostname,
        message: message,
        details: details
      }
    })
  });
}`}
                  </pre>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleCopy(`// Log an event
async function logEvent(level, message, details = {}) {
  await fetch("${webhookUrl}", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      action: "add_log",
      log: {
        level: level, // 'info', 'warning', or 'error'
        source: "Slave: " + hostname,
        message: message,
        details: details
      }
    })
  });
}`, 'log')} 
                    className="mt-2"
                  >
                    {copied['log'] ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        Copy Function
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SetupGuide;

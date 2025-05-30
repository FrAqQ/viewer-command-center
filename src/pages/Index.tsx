
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import StatusDashboard from '@/components/dashboard/StatusDashboard';
import SlaveStatusCard from '@/components/dashboard/SlaveStatusCard';
import ViewerStatusTable from '@/components/dashboard/ViewerStatusTable';
import LogsPanel from '@/components/dashboard/LogsPanel';
import CommandPanel from '@/components/dashboard/CommandPanel';
import { useAppContext } from '@/context/AppContext';
import { Command } from '@/types';
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Key, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase, canStartViewers, logViewerUsage } from '@/integrations/supabase/client';

const Index = () => {
  const { slaves, viewers, logs, addCommand, updateSlave, removeViewer, clearLogs } = useAppContext();
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Filter out duplicate slave entries to prevent multiple displays
  const uniqueSlaves = slaves.reduce((acc, current) => {
    const isDuplicate = acc.find((item) => item.id === current.id);
    if (!isDuplicate && current && current.name && current.id && current.hostname && current.ip && current.lastSeen) {
      return [...acc, current];
    }
    return acc;
  }, [] as typeof slaves);
  
  // Fetch API key from localStorage and user from Supabase when component mounts
  useEffect(() => {
    const storedKey = localStorage.getItem('slaveApiKey');
    if (storedKey) {
      setApiKey(storedKey);
    }

    // Get current user
    const fetchUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        setUserId(data.user.id);
      }
    };

    fetchUser();
  }, []);
  
  const handleReconnectSlave = (id: string) => {
    // In a real application, this would send a reconnect signal to the slave
    const slave = slaves.find(s => s.id === id);
    if (!slave) return;
    
    const reconnectCommand: Command = {
      id: `cmd-${Date.now()}`,
      type: 'reconnect',
      target: id,
      payload: {},
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    
    addCommand(reconnectCommand);
    
    // Simulate reconnection response
    setTimeout(() => {
      if (slave.status !== 'online') {
        updateSlave(id, { 
          status: 'online', 
          lastSeen: new Date().toISOString(),
          metrics: {
            ...slave.metrics,
            cpu: Math.floor(Math.random() * 50),
            ram: Math.floor(Math.random() * 50)
          }
        });
        toast.success(`Reconnected to ${slave.name}`);
      }
    }, 2000);
  };
  
  const handleStopViewer = async (id: string) => {
    removeViewer(id);
  };

  const handleStartViewer = async (command: Command) => {
    // Check if user can start more viewers based on their plan
    if (userId) {
      const canStart = await canStartViewers(userId);
      
      if (!canStart) {
        toast.error("You've reached your viewer limit. Please upgrade your plan for more viewers.");
        return null;
      }
      
      // Log the viewer usage
      await logViewerUsage(userId, 1);
    }
    
    // Proceed with adding the command
    const commandId = `cmd-${Date.now()}`;
    
    const viewerCommand: Command = {
      ...command,
      id: commandId,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    
    addCommand(viewerCommand);
    return commandId;
  };
  
  const generateApiKey = () => {
    // Generate a random API key (for demo purposes)
    const randomKey = Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
    setApiKey(randomKey);
    
    // Store in localStorage for convenience
    localStorage.setItem('slaveApiKey', randomKey);
    
    toast.success("API key generated. Make sure to set it as a secret in your Supabase Edge Function settings.");
  };
  
  const copyApiKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
            <p className="text-muted-foreground mb-6">Monitor and control your viewer network</p>
          </div>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Key className="h-4 w-4 mr-2" />
                Manage API Key
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>API Key Management</DialogTitle>
                <DialogDescription>
                  Generate and manage API keys for secure slave authentication.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="apikey">API Key</Label>
                  <div className="flex space-x-2">
                    <Input 
                      id="apikey" 
                      value={apiKey} 
                      type={showApiKey ? "text" : "password"}
                      placeholder="No API key generated"
                      readOnly
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? "Hide" : "Show"}
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button variant="outline" onClick={generateApiKey}>
                    Generate New Key
                  </Button>
                  <Button variant="secondary" onClick={copyApiKey} disabled={!apiKey}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Key
                  </Button>
                </div>
                
                <Alert className="mt-2">
                  <AlertDescription className="text-sm">
                    After generating a new API key, make sure to:
                    <ul className="list-disc pl-4 mt-2">
                      <li>Add it to your Supabase edge function secrets with name <code>API_SECRET_KEY</code></li>
                      <li>Update all your slave clients with this key</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
              
              <DialogFooter>
                <Button onClick={() => toast.success("Remember to update your Supabase secrets")}>
                  Done
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <StatusDashboard />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {uniqueSlaves.map((slave) => (
            <SlaveStatusCard key={slave.id} slave={slave} onReconnect={handleReconnectSlave} />
          ))}
        </div>
        
        <div className="pt-2">
          <h2 className="text-xl font-bold mb-4">Active Viewers</h2>
          <ViewerStatusTable viewers={viewers} onStopViewer={handleStopViewer} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LogsPanel logs={logs} onClearLogs={clearLogs} />
          <CommandPanel slaves={uniqueSlaves} onCommand={handleStartViewer} />
        </div>
      </div>
    </Layout>
  );
};

export default Index;

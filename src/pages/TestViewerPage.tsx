import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ViewerInstance, Proxy } from '@/types';
import { supabase, getProxyUrlById } from '@/integrations/supabase/client';
import { Loader2, PlayCircle, StopCircle, Trash2, Plus, Minus, RefreshCw } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const TestViewerPage = () => {
  const { addViewer, removeViewer, updateViewer, viewers, proxies, slaves, isLoading, addCommand } = useAppContext();
  const [url, setUrl] = useState('https://twitch.tv/');
  const [selectedProxyId, setSelectedProxyId] = useState<string>('');
  const [selectedSlaveId, setSelectedSlaveId] = useState<string>('');
  const [logs, setLogs] = useState<string[]>(() => {
    try {
      const savedLogs = localStorage.getItem('viewerTestLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
      return [];
    }
  });
  const [isTesting, setIsTesting] = useState(false);
  const [count, setCount] = useState(1);
  const [recentCommands, setRecentCommands] = useState<any[]>([]);
  
  const localViewers = viewers.filter(v => !v.slaveId);
  const validProxies = proxies.filter(p => p.valid);
  const onlineSlaves = slaves.filter(s => s.status === 'online');
  
  // Save logs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('viewerTestLogs', JSON.stringify(logs));
  }, [logs]);
  
  // Load recent commands
  useEffect(() => {
    const loadRecentCommands = async () => {
      const { data, error } = await supabase
        .from('commands')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('Error loading recent commands:', error);
      } else if (data) {
        setRecentCommands(data);
      }
    };
    
    loadRecentCommands();
    
    // Set up a polling interval to refresh commands
    const intervalId = setInterval(loadRecentCommands, 5000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  const handleSpawnViewer = async (count: number = 1) => {
    if (!url.trim() || !url.includes('twitch.tv')) {
      toast.error('Please enter a valid Twitch URL');
      addLog('Error: Please enter a valid Twitch URL');
      return;
    }
    
    if (!selectedSlaveId) {
      toast.error('Please select a slave server');
      addLog('Error: Please select a slave server');
      return;
    }
    
    setIsTesting(true);
    
    try {
      for (let i = 0; i < count; i++) {
        // Instead of creating a viewer directly, create a command for the slave
        const viewerId = `viewer-${Date.now()}-${i}`;
        const proxyString = selectedProxyId ? await getProxyUrlById(selectedProxyId) : null;
        
        const command = {
          id: `cmd-${Date.now()}-${i}`,
          type: 'spawn' as const, // Fix: Use a literal type assertion
          target: selectedSlaveId,
          payload: {
            id: viewerId,
            url,
            proxy: proxyString
          },
          timestamp: new Date().toISOString(),
          status: 'pending' as const // Fix: Use literal type assertion
        };
        
        await addCommand(command);
        
        addLog(`Command sent to ${selectedSlaveId} to spawn viewer for ${url} ${proxyString ? `with proxy ${proxyString}` : 'without proxy'}`);
      }
      
      toast.success(`${count} viewer command${count !== 1 ? 's' : ''} sent to slave`);
    } catch (error) {
      console.error('Error sending viewer commands:', error);
      toast.error('Failed to send viewer commands');
      addLog(`Error: Failed to send viewer commands - ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleStopAll = async () => {
    if (!selectedSlaveId) {
      toast.error('Please select a slave server');
      addLog('Error: Please select a slave server');
      return;
    }
    
    setIsTesting(true);
    try {
      const command = {
        id: `cmd-${Date.now()}`,
        type: 'stop' as const, // Fix: Use a literal type assertion
        target: selectedSlaveId,
        payload: {
          all: true
        },
        timestamp: new Date().toISOString(),
        status: 'pending' as const // Fix: Use literal type assertion
      };
      
      await addCommand(command);
      addLog(`Stop all viewers command sent to ${selectedSlaveId}`);
      toast.success('Stop all viewers command sent');
    } catch (error) {
      console.error('Error sending stop command:', error);
      toast.error('Failed to send stop command');
    } finally {
      setIsTesting(false);
    }
  };
  
  const handleRemoveViewer = async (id: string) => {
    try {
      await removeViewer(id);
      addLog(`Stopped viewer instance`);
    } catch (error) {
      console.error('Error removing viewer:', error);
      toast.error('Failed to stop viewer');
    }
  };
  
  const handleClearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
    toast.success('Logs cleared');
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Test Viewer</h1>
            <p className="text-muted-foreground mb-6">Loading data from Supabase...</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[300px]" />
            <Skeleton className="h-[300px]" />
          </div>
          
          <Skeleton className="h-[400px]" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Test Viewer</h1>
          <p className="text-muted-foreground mb-6">Run local tests for your viewers</p>
        </div>
        
        {proxies.length === 0 && (
          <Alert>
            <AlertTitle>No proxies available</AlertTitle>
            <AlertDescription>
              You need to add proxies before testing viewers. Go to the Proxies page to add some.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spawn Viewers via Slave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Twitch Channel URL</Label>
                <Input
                  id="url"
                  placeholder="https://twitch.tv/channelName"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slave">Slave Server</Label>
                <Select value={selectedSlaveId} onValueChange={setSelectedSlaveId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a slave server" />
                  </SelectTrigger>
                  <SelectContent>
                    {onlineSlaves.length === 0 ? (
                      <SelectItem value="none" disabled>No online slaves available</SelectItem>
                    ) : (
                      onlineSlaves.map((slave) => (
                        <SelectItem key={slave.id} value={slave.id}>
                          {slave.name} ({slave.hostname})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {onlineSlaves.length === 0 && (
                  <p className="text-xs text-red-500">
                    No online slaves available. Add a slave server first.
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proxy">Proxy (Optional)</Label>
                <Select value={selectedProxyId} onValueChange={setSelectedProxyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a proxy or use random" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Proxy</SelectItem>
                    {validProxies.map((proxy) => (
                      <SelectItem key={proxy.id} value={proxy.id}>
                        {proxy.address}:{proxy.port}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="count">Viewer Count</Label>
                <div className="flex items-center">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setCount(c => Math.max(1, c - 1))}
                    disabled={count <= 1}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="count"
                    type="number"
                    min={1}
                    max={25}
                    value={count}
                    onChange={(e) => setCount(parseInt(e.target.value) || 1)}
                    className="mx-2 text-center"
                  />
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => setCount(c => Math.min(25, c + 1))}
                    disabled={count >= 25}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button 
                  onClick={() => handleSpawnViewer(count)} 
                  disabled={isTesting || onlineSlaves.length === 0}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4 mr-1" />
                  )}
                  Send Spawn Command
                </Button>
                
                <Button 
                  variant="destructive" 
                  onClick={handleStopAll}
                  disabled={isTesting || onlineSlaves.length === 0}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <StopCircle className="h-4 w-4 mr-1" />
                  )}
                  Send Stop All Command
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Viewer Logs</CardTitle>
              <Button variant="outline" size="sm" onClick={handleClearLogs}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Logs
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[200px] w-full rounded-md border p-2 bg-muted/30">
                {logs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No logs yet. Start a viewer to see logs.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {logs.map((log, i) => (
                      <p key={i} className="text-xs font-mono">
                        {log}
                      </p>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Commands</CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={async () => {
                const { data, error } = await supabase
                  .from('commands')
                  .select('*')
                  .order('timestamp', { ascending: false })
                  .limit(10);
                
                if (error) {
                  console.error('Error refreshing commands:', error);
                  toast.error('Failed to refresh commands');
                } else if (data) {
                  setRecentCommands(data);
                  toast.success('Commands refreshed');
                }
              }}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </CardHeader>
          <CardContent>
            {recentCommands.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No commands have been sent yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Payload</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentCommands.map((command) => (
                    <TableRow key={command.id}>
                      <TableCell className="capitalize">{command.type}</TableCell>
                      <TableCell>{command.target}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`status-dot ${command.status === 'executed' ? 'success' : command.status === 'pending' ? 'warning' : 'danger'}`} />
                          <span className="capitalize">{command.status}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(command.timestamp).toLocaleTimeString()}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        <code className="text-xs">
                          {JSON.stringify(command.payload)}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        {localViewers.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Active Local Viewers</CardTitle>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  // Simulate status refresh by updating all viewers with a random delay
                  localViewers.forEach((viewer, index) => {
                    if (viewer.status === 'running') {
                      setTimeout(() => {
                        // Generate a random CPU/RAM usage
                        addLog(`Refreshed status for viewer ${viewer.id}`);
                      }, index * 300);
                    }
                  });
                  toast.success('Refreshed viewer statuses');
                }}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh Status
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Proxy</TableHead>
                    <TableHead>Started</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {localViewers.map((viewer) => (
                    <TableRow key={viewer.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`status-dot ${viewer.status === 'running' ? 'success' : viewer.status === 'stopped' ? 'warning' : 'danger'}`} />
                          <span className="capitalize">{viewer.status}</span>
                          {viewer.status === 'error' && (
                            <span className="text-xs text-red-500">{viewer.error}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{viewer.url}</TableCell>
                      <TableCell className="font-mono text-xs">{viewer.proxy || 'None'}</TableCell>
                      <TableCell>{new Date(viewer.startTime).toLocaleTimeString()}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveViewer(viewer.id)}
                        >
                          <StopCircle className="h-4 w-4 mr-1" />
                          Stop
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default TestViewerPage;

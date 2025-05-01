
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ViewerInstance, Proxy } from '@/types';
import { useApp } from '@/context/AppContext';
import { PlayCircle, Plus, Minus, StopCircle, Loader2, Trash2, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const TestViewerPage = () => {
  const { addViewer, removeViewer, updateViewer, viewers, proxies, isLoading } = useApp();
  const [url, setUrl] = useState('https://twitch.tv/');
  const [selectedProxyId, setSelectedProxyId] = useState<string>('');
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
  
  const localViewers = viewers.filter(v => !v.slaveId);
  const validProxies = proxies.filter(p => p.valid);
  
  // Save logs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('viewerTestLogs', JSON.stringify(logs));
  }, [logs]);
  
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  const getSelectedProxy = (): Proxy | undefined => {
    if (selectedProxyId) {
      return proxies.find(p => p.id === selectedProxyId);
    }
    return undefined;
  };
  
  const handleSpawnViewer = async (count: number = 1) => {
    if (!url.trim() || !url.includes('twitch.tv')) {
      toast.error('Please enter a valid Twitch URL');
      addLog('Error: Please enter a valid Twitch URL');
      return;
    }
    
    setIsTesting(true);
    
    try {
      for (let i = 0; i < count; i++) {
        let proxyString: string | undefined = undefined;
        let proxyToUse: Proxy | undefined = undefined;
        
        if (selectedProxyId) {
          proxyToUse = getSelectedProxy();
        } else if (validProxies.length > 0) {
          // Choose a random proxy if none selected
          proxyToUse = validProxies[Math.floor(Math.random() * validProxies.length)];
        }
        
        if (proxyToUse) {
          proxyString = proxyToUse.username && proxyToUse.password ? 
            `${proxyToUse.address}:${proxyToUse.port}:${proxyToUse.username}:${proxyToUse.password}` : 
            `${proxyToUse.address}:${proxyToUse.port}`;
        }
        
        const viewer: ViewerInstance = {
          id: `local-${Date.now()}-${i}`,
          url,
          proxy: proxyString,
          status: 'running',
          startTime: new Date().toISOString(),
        };
        
        await addViewer(viewer);
        
        addLog(`Spawned viewer for ${url} ${proxyToUse ? `with proxy ${proxyToUse.address}:${proxyToUse.port}` : 'without proxy'}`);
        
        // Simulate random outcomes for testing
        simulateViewerOutcome(viewer.id);
      }
    } catch (error) {
      console.error('Error spawning viewers:', error);
      toast.error('Failed to spawn viewers');
      addLog(`Error: Failed to spawn viewers - ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };
  
  const simulateViewerOutcome = (viewerId: string) => {
    // Simulate some random outcomes for testing
    setTimeout(() => {
      const outcome = Math.random();
      
      if (outcome < 0.1) {
        // 10% chance of error
        updateViewer(viewerId, { status: 'error', error: 'Connection refused' });
        addLog(`Error: Failed to connect to ${url} (Connection refused)`);
        toast.error(`Viewer connection failed: Connection refused`);
      } else if (outcome < 0.2) {
        // 10% chance of authentication error
        updateViewer(viewerId, { status: 'error', error: 'Authentication failed' });
        addLog(`Error: Authentication failed for ${url}`);
        toast.error(`Viewer authentication failed`);
      } else if (outcome < 0.3) {
        // 10% chance of timeout
        updateViewer(viewerId, { status: 'error', error: 'Connection timeout' });
        addLog(`Error: Timeout connecting to ${url}`);
        toast.error(`Viewer connection timeout`);
      }
      // The other 70% remain in 'running' status
    }, Math.random() * 5000 + 2000); // Random delay between 2-7 seconds
  };
  
  const handleStopAll = async () => {
    setIsTesting(true);
    try {
      for (const viewer of localViewers) {
        await removeViewer(viewer.id);
      }
      addLog(`Stopped all viewers`);
      toast.success('All viewers stopped');
    } catch (error) {
      console.error('Error stopping viewers:', error);
      toast.error('Failed to stop all viewers');
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
          <Alert variant="warning">
            <AlertTitle>No proxies available</AlertTitle>
            <AlertDescription>
              You need to add proxies before testing viewers. Go to the Proxies page to add some.
            </AlertDescription>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spawn Local Viewers</CardTitle>
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
                <Label htmlFor="proxy">Proxy (Optional)</Label>
                <Select value={selectedProxyId} onValueChange={setSelectedProxyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a proxy or use random" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Random Valid Proxy</SelectItem>
                    <SelectItem value="none">No Proxy</SelectItem>
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
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <PlayCircle className="h-4 w-4 mr-1" />
                  )}
                  Spawn Viewers
                </Button>
                
                {localViewers.length > 0 && (
                  <Button 
                    variant="destructive" 
                    onClick={handleStopAll}
                    disabled={isTesting}
                  >
                    {isTesting ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <StopCircle className="h-4 w-4 mr-1" />
                    )}
                    Stop All
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-muted-foreground mt-2">
                {localViewers.length > 0 ? (
                  <p>{localViewers.length} viewer{localViewers.length !== 1 ? 's' : ''} running locally</p>
                ) : (
                  <p>No active viewers</p>
                )}
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
            <CardTitle>Active Local Viewers</CardTitle>
            {localViewers.length > 0 && (
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
            )}
          </CardHeader>
          <CardContent>
            {localViewers.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No active viewers</p>
              </div>
            ) : (
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
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TestViewerPage;

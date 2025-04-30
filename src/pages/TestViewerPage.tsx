
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ViewerInstance } from '@/types';
import { useApp } from '@/context/AppContext';
import { PlayCircle, Plus, Minus, StopCircle, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const TestViewerPage = () => {
  const { addViewer, removeViewer, updateViewer, viewers, proxies, isLoading } = useApp();
  const [url, setUrl] = useState('https://twitch.tv/');
  const [logs, setLogs] = useState<string[]>(() => {
    try {
      const savedLogs = localStorage.getItem('viewerTestLogs');
      return savedLogs ? JSON.parse(savedLogs) : [];
    } catch (error) {
      console.error('Failed to load logs from localStorage:', error);
      return [];
    }
  });
  
  const localViewers = viewers.filter(v => !v.slaveId);
  
  // Save logs to localStorage when they change
  useEffect(() => {
    localStorage.setItem('viewerTestLogs', JSON.stringify(logs));
  }, [logs]);
  
  const addLog = (message: string) => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${message}`, ...prev]);
  };
  
  const handleSpawnViewer = (count: number = 1) => {
    if (!url.trim() || !url.includes('twitch.tv')) {
      addLog('Error: Please enter a valid Twitch URL');
      return;
    }
    
    for (let i = 0; i < count; i++) {
      const randomProxy = proxies.filter(p => p.valid)[Math.floor(Math.random() * proxies.filter(p => p.valid).length)];
      const proxyString = randomProxy ? 
        `${randomProxy.address}:${randomProxy.port}${randomProxy.username ? `:${randomProxy.username}:${randomProxy.password}` : ''}` : 
        undefined;
      
      const viewer: ViewerInstance = {
        id: `local-${Date.now()}-${i}`,
        url,
        proxy: proxyString,
        status: 'running',
        startTime: new Date().toISOString(),
      };
      
      addViewer(viewer);
      addLog(`Spawned viewer for ${url} ${proxyString ? `with proxy ${proxyString}` : 'without proxy'}`);
      
      // Simulate some random errors occasionally
      if (Math.random() < 0.2) {
        setTimeout(() => {
          updateViewer(viewer.id, { status: 'error', error: 'Connection refused' });
          addLog(`Error: Failed to connect to ${url} (Connection refused)`);
        }, Math.random() * 5000 + 1000);
      }
    }
  };
  
  const handleStopAll = () => {
    localViewers.forEach(viewer => {
      removeViewer(viewer.id);
    });
    addLog(`Stopped all viewers`);
  };
  
  const handleRemoveViewer = (id: string) => {
    removeViewer(id);
    addLog(`Stopped viewer instance`);
  };
  
  const handleClearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
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
              
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => handleSpawnViewer(1)}>
                  <PlayCircle className="h-4 w-4 mr-1" />
                  Spawn 1 Viewer
                </Button>
                
                <Button variant="outline" onClick={() => handleSpawnViewer(3)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add 3 Viewers
                </Button>
                
                <Button variant="outline" onClick={() => handleSpawnViewer(5)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add 5 Viewers
                </Button>
                
                {localViewers.length > 0 && (
                  <Button variant="destructive" onClick={handleStopAll}>
                    <StopCircle className="h-4 w-4 mr-1" />
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
          <CardHeader>
            <CardTitle>Active Local Viewers</CardTitle>
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

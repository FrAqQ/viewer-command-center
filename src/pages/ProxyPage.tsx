
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Proxy } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Check, X, Upload, Download, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const ProxyPage = () => {
  const { proxies, addProxy, updateProxy, removeProxy, importProxies, isLoading } = useAppContext();
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyText, setProxyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProxy, setNewProxy] = useState({ address: '', port: '', username: '', password: '' });
  const [testingProxies, setTestingProxies] = useState<string[]>([]);
  
  const validProxies = proxies.filter(proxy => proxy.valid);
  const invalidProxies = proxies.filter(proxy => !proxy.valid);
  
  const handleFetchProxies = async () => {
    if (!proxyUrl.trim()) {
      toast.error('Please enter a proxy URL');
      return;
    }
    
    setLoading(true);
    
    try {
      // Attempt to fetch proxies from URL
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch from URL: ${response.status} ${response.statusText}`);
      }
      
      const text = await response.text();
      setProxyText(text);
      toast.success('Proxies fetched successfully');
      
      // Import the fetched proxies
      importProxies(text);
    } catch (error) {
      console.error('Error fetching proxies:', error);
      toast.error(`Failed to fetch proxies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleImportFromText = () => {
    if (!proxyText.trim()) {
      toast.error('Please enter proxy data');
      return;
    }
    
    importProxies(proxyText);
    toast.success('Proxies imported successfully');
  };
  
  const handleToggleProxyStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateProxy(id, { valid: !currentStatus });
      toast.success(`Proxy marked as ${!currentStatus ? 'valid' : 'invalid'}`);
    } catch (error) {
      toast.error('Failed to update proxy status');
      console.error(error);
    }
  };
  
  const handleAddProxy = async () => {
    if (!newProxy.address || !newProxy.port) {
      toast.error('Address and port are required');
      return;
    }
    
    try {
      const proxy: Proxy = {
        id: `proxy-${Date.now()}`,
        address: newProxy.address,
        port: newProxy.port,
        username: newProxy.username,
        password: newProxy.password,
        valid: true,
        lastChecked: new Date().toISOString(),
        failCount: 0
      };
      
      await addProxy(proxy);
      setNewProxy({ address: '', port: '', username: '', password: '' });
      setShowAddDialog(false);
      toast.success('Proxy added successfully');
    } catch (error) {
      toast.error('Failed to add proxy');
      console.error(error);
    }
  };
  
  const handleRemoveProxy = async (id: string) => {
    try {
      await removeProxy(id);
      toast.success('Proxy removed');
    } catch (error) {
      toast.error('Failed to remove proxy');
      console.error(error);
    }
  };
  
  const handleExportProxies = () => {
    // Generate export text in format: ip:port:username:password
    const exportText = proxies
      .filter(proxy => proxy.valid)
      .map(proxy => {
        if (proxy.username && proxy.password) {
          return `${proxy.address}:${proxy.port}:${proxy.username}:${proxy.password}`;
        } else {
          return `${proxy.address}:${proxy.port}`;
        }
      })
      .join('\n');
    
    if (!exportText) {
      toast.error('No valid proxies to export');
      return;
    }
    
    // Create a blob and download it
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proxies-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Proxies exported successfully');
  };
  
  const handleTestAllProxies = async () => {
    if (proxies.length === 0) {
      toast.error('No proxies to test');
      return;
    }
    
    // Set all proxies to testing state
    const proxyIds = proxies.map(proxy => proxy.id);
    setTestingProxies(proxyIds);
    
    // Simulate testing proxies one by one
    for (const proxy of proxies) {
      // Simulate API call to test proxy
      const delay = Math.random() * 1000 + 500; // Random delay between 500ms and 1500ms
      await new Promise(resolve => setTimeout(resolve, delay));
      
      const isValid = Math.random() > 0.3; // 70% chance of success for demo
      const newFailCount = isValid ? 0 : proxy.failCount + 1;
      
      await updateProxy(proxy.id, {
        valid: isValid,
        lastChecked: new Date().toISOString(),
        failCount: newFailCount
      });
      
      // Remove from testing state
      setTestingProxies(prev => prev.filter(id => id !== proxy.id));
    }
    
    toast.success('All proxies tested');
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Proxy Management</h1>
            <p className="text-muted-foreground mb-6">Loading data from Supabase...</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
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
          <h1 className="text-2xl font-bold mb-2">Proxy Management</h1>
          <p className="text-muted-foreground mb-6">Configure and manage proxies for your viewer network</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Proxy Source</CardTitle>
              <CardDescription>Import proxies from a URL or paste them manually</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proxy-url">Proxy URL</Label>
                <div className="flex space-x-2">
                  <Input
                    id="proxy-url"
                    placeholder="https://example.com/proxies.txt"
                    value={proxyUrl}
                    onChange={(e) => setProxyUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleFetchProxies} 
                    disabled={loading} 
                    className="min-w-[100px]"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4 mr-1" />
                    )}
                    Fetch
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="proxy-text">Proxy List</Label>
                <Textarea
                  id="proxy-text"
                  placeholder="Format: ip:port:username:password (one per line)"
                  value={proxyText}
                  onChange={(e) => setProxyText(e.target.value)}
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Each line should be in one of the formats:
                  <br />
                  - ip:port
                  <br />
                  - ip:port:username:password
                </p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setProxyText('')}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button onClick={handleImportFromText} disabled={!proxyText.trim()}>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Proxy Statistics</CardTitle>
                <CardDescription>Current status and health metrics</CardDescription>
              </div>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Proxy
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Proxy</DialogTitle>
                    <DialogDescription>
                      Enter the details for the new proxy server
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proxy-address">Address</Label>
                        <Input
                          id="proxy-address"
                          placeholder="192.168.1.1"
                          value={newProxy.address}
                          onChange={(e) => setNewProxy({...newProxy, address: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proxy-port">Port</Label>
                        <Input
                          id="proxy-port"
                          placeholder="8080"
                          value={newProxy.port}
                          onChange={(e) => setNewProxy({...newProxy, port: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="proxy-username">Username (optional)</Label>
                        <Input
                          id="proxy-username"
                          placeholder="username"
                          value={newProxy.username}
                          onChange={(e) => setNewProxy({...newProxy, username: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="proxy-password">Password (optional)</Label>
                        <Input
                          id="proxy-password"
                          placeholder="password"
                          type="password"
                          value={newProxy.password}
                          onChange={(e) => setNewProxy({...newProxy, password: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddProxy}>Add Proxy</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-xl font-bold text-status-success">{validProxies.length}</div>
                  <p className="text-sm text-muted-foreground">Valid Proxies</p>
                </div>
                <div className="rounded-lg bg-muted p-3 text-center">
                  <div className="text-xl font-bold text-status-danger">{invalidProxies.length}</div>
                  <p className="text-sm text-muted-foreground">Invalid Proxies</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {proxies.length} proxies in total. Last checked {
                  proxies.length > 0 && proxies.some(p => p.lastChecked) 
                    ? new Date(Math.max(...proxies.filter(p => p.lastChecked).map(p => new Date(p.lastChecked!).getTime()))).toLocaleString() 
                    : 'never'
                }.
              </p>
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleTestAllProxies}
                disabled={testingProxies.length > 0 || proxies.length === 0}
              >
                {testingProxies.length > 0 ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Testing Proxies ({testingProxies.length})...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Test All Proxies
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        {proxies.length === 0 ? (
          <Alert>
            <AlertTitle>No proxies found</AlertTitle>
            <AlertDescription>
              Add proxies by pasting a list in the text area above or by adding them one by one.
            </AlertDescription>
          </Alert>
        ) : (
          <Tabs defaultValue="valid">
            <div className="flex justify-between items-center mb-2">
              <TabsList>
                <TabsTrigger value="valid">Valid Proxies</TabsTrigger>
                <TabsTrigger value="invalid">Invalid Proxies</TabsTrigger>
                <TabsTrigger value="all">All Proxies</TabsTrigger>
              </TabsList>
              <Button variant="outline" size="sm" onClick={handleExportProxies}>
                <Download className="h-4 w-4 mr-1" />
                Export List
              </Button>
            </div>
            
            <TabsContent value="valid">
              <ProxyTable 
                proxies={validProxies} 
                onToggleStatus={handleToggleProxyStatus} 
                onRemove={handleRemoveProxy} 
                testingIds={testingProxies}
              />
            </TabsContent>
            
            <TabsContent value="invalid">
              <ProxyTable 
                proxies={invalidProxies} 
                onToggleStatus={handleToggleProxyStatus} 
                onRemove={handleRemoveProxy} 
                testingIds={testingProxies}
              />
            </TabsContent>
            
            <TabsContent value="all">
              <ProxyTable 
                proxies={proxies} 
                onToggleStatus={handleToggleProxyStatus} 
                onRemove={handleRemoveProxy} 
                testingIds={testingProxies}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

interface ProxyTableProps {
  proxies: Proxy[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onRemove: (id: string) => void;
  testingIds: string[];
}

const ProxyTable: React.FC<ProxyTableProps> = ({ proxies, onToggleStatus, onRemove, testingIds }) => {
  if (proxies.length === 0) {
    return (
      <div className="border rounded-md p-8 text-center">
        <p className="text-muted-foreground">No proxies found</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Address</TableHead>
            <TableHead>Port</TableHead>
            <TableHead>Auth</TableHead>
            <TableHead>Failures</TableHead>
            <TableHead>Last Checked</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {proxies.map((proxy) => (
            <TableRow key={proxy.id} className={testingIds.includes(proxy.id) ? "opacity-70" : ""}>
              <TableCell>
                <div className="flex items-center">
                  {testingIds.includes(proxy.id) ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <span className={`status-dot ${proxy.valid ? 'success' : 'danger'}`} />
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{proxy.address}</TableCell>
              <TableCell>{proxy.port}</TableCell>
              <TableCell>{proxy.username && proxy.password ? 'Yes' : 'No'}</TableCell>
              <TableCell>{proxy.failCount}</TableCell>
              <TableCell>{proxy.lastChecked ? new Date(proxy.lastChecked).toLocaleString() : 'Never'}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onToggleStatus(proxy.id, proxy.valid)}
                    disabled={testingIds.includes(proxy.id)}
                    title={proxy.valid ? 'Mark as invalid' : 'Mark as valid'}
                  >
                    {proxy.valid ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onRemove(proxy.id)}
                    disabled={testingIds.includes(proxy.id)}
                    title="Remove proxy"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProxyPage;

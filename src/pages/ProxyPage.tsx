
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Proxy } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Check, X, Upload, Download, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const ProxyPage = () => {
  const { proxies, addProxy, updateProxy, removeProxy, importProxies } = useApp();
  const [proxyUrl, setProxyUrl] = useState('');
  const [proxyText, setProxyText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newProxy, setNewProxy] = useState({ address: '', port: '', username: '', password: '' });
  
  const validProxies = proxies.filter(proxy => proxy.valid);
  const invalidProxies = proxies.filter(proxy => !proxy.valid);
  
  const handleFetchProxies = () => {
    if (!proxyUrl.trim()) return;
    
    setLoading(true);
    
    // Simulate fetching proxies from URL
    setTimeout(() => {
      // In a real application, you would fetch proxies from the URL
      const sampleText = "185.199.228.220:7300:user1:pass1\n185.199.229.156:7300:user2:pass2\n185.199.231.45:8080:user3:pass3";
      setProxyText(sampleText);
      importProxies(sampleText);
      setLoading(false);
    }, 1500);
  };
  
  const handleImportFromText = () => {
    if (!proxyText.trim()) return;
    importProxies(proxyText);
  };
  
  const handleToggleProxyStatus = (id: string, currentStatus: boolean) => {
    updateProxy(id, { valid: !currentStatus });
  };
  
  const handleAddProxy = () => {
    if (!newProxy.address || !newProxy.port) return;
    
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
    
    addProxy(proxy);
    setNewProxy({ address: '', port: '', username: '', password: '' });
    setShowAddDialog(false);
  };
  
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
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setProxyText('')}>
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
              <Button onClick={handleImportFromText}>
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
                {proxies.length} proxies in total. Last checked {proxies.length > 0 ? new Date().toLocaleTimeString() : 'never'}.
              </p>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">
                <RefreshCw className="h-4 w-4 mr-1" />
                Test All Proxies
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <Tabs defaultValue="valid">
          <div className="flex justify-between items-center mb-2">
            <TabsList>
              <TabsTrigger value="valid">Valid Proxies</TabsTrigger>
              <TabsTrigger value="invalid">Invalid Proxies</TabsTrigger>
              <TabsTrigger value="all">All Proxies</TabsTrigger>
            </TabsList>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export List
            </Button>
          </div>
          
          <TabsContent value="valid">
            <ProxyTable 
              proxies={validProxies} 
              onToggleStatus={handleToggleProxyStatus} 
              onRemove={removeProxy} 
            />
          </TabsContent>
          
          <TabsContent value="invalid">
            <ProxyTable 
              proxies={invalidProxies} 
              onToggleStatus={handleToggleProxyStatus} 
              onRemove={removeProxy} 
            />
          </TabsContent>
          
          <TabsContent value="all">
            <ProxyTable 
              proxies={proxies} 
              onToggleStatus={handleToggleProxyStatus} 
              onRemove={removeProxy} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

interface ProxyTableProps {
  proxies: Proxy[];
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onRemove: (id: string) => void;
}

const ProxyTable: React.FC<ProxyTableProps> = ({ proxies, onToggleStatus, onRemove }) => {
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
            <TableRow key={proxy.id}>
              <TableCell>
                <span className={`status-dot ${proxy.valid ? 'success' : 'danger'}`} />
              </TableCell>
              <TableCell className="font-medium">{proxy.address}</TableCell>
              <TableCell>{proxy.port}</TableCell>
              <TableCell>{proxy.username && proxy.password ? 'Yes' : 'No'}</TableCell>
              <TableCell>{proxy.failCount}</TableCell>
              <TableCell>{proxy.lastChecked ? new Date(proxy.lastChecked).toLocaleTimeString() : 'Never'}</TableCell>
              <TableCell>
                <div className="flex space-x-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onToggleStatus(proxy.id, proxy.valid)}
                    title={proxy.valid ? 'Mark as invalid' : 'Mark as valid'}
                  >
                    {proxy.valid ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => onRemove(proxy.id)}
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

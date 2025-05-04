
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { SlaveServer } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Copy, Power, RefreshCw, Plus, Trash2, ServerCrash, Check, Loader2, Edit } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import SetupGuide from '@/components/dashboard/SetupGuide';
import SlaveEditDialog from '@/components/dashboard/SlaveEditDialog';

const SlavesPage = () => {
  const { slaves, updateSlave, removeSlave, isLoading } = useAppContext();
  const [open, setOpen] = useState(false);
  const [selectedSlave, setSelectedSlave] = useState<SlaveServer | undefined>(undefined);
  
  const onlineSlaves = slaves.filter(slave => slave.status === 'online').length;
  const offlineSlaves = slaves.filter(slave => slave.status === 'offline' || slave.status === 'error').length;
  
  const handleReconnect = (id: string) => {
    // In a real app this would make an API call to reconnect to the slave
    updateSlave(id, { status: 'online', lastSeen: new Date().toISOString() });
    toast.success("Reconnection successful");
  };
  
  const handleEditSlave = (slave: SlaveServer) => {
    setSelectedSlave(slave);
    setOpen(true);
  };
  
  const handleAddSlave = () => {
    setSelectedSlave(undefined);
    setOpen(true);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Slave Servers</h1>
            <p className="text-muted-foreground mb-6">Loading data from Supabase...</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-[200px]" />
            <Skeleton className="h-[200px] md:col-span-2" />
          </div>
          
          <Skeleton className="h-[400px]" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-2">
          <div>
            <h1 className="text-2xl font-bold mb-2">Slave Servers</h1>
            <p className="text-muted-foreground">Manage and monitor your distributed server network</p>
          </div>
          <Button onClick={handleAddSlave}>
            <Plus className="h-4 w-4 mr-1" />
            Add Slave
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Slave Status</CardTitle>
              <CardDescription>Overview of server status</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Online</span>
                  <span className="text-sm">{onlineSlaves}/{slaves.length}</span>
                </div>
                <Progress 
                  value={(onlineSlaves / Math.max(slaves.length, 1)) * 100} 
                  className="h-2 bg-muted" 
                  indicatorClassName="bg-status-success"
                />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Offline</span>
                  <span className="text-sm">{offlineSlaves}/{slaves.length}</span>
                </div>
                <Progress 
                  value={(offlineSlaves / Math.max(slaves.length, 1)) * 100} 
                  className="h-2 bg-muted" 
                  indicatorClassName="bg-status-danger"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Supabase Connection</CardTitle>
              <CardDescription>Ready to receive and send data to Supabase</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-status-success">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Connected to Supabase</span>
                </div>
                
                <div className="space-y-1">
                  <Label>Project ID</Label>
                  <div className="flex items-center">
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm flex-1">
                      qdxpxqdewqrbvlsajeeo
                    </code>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" onClick={() => {
                      navigator.clipboard.writeText("qdxpxqdewqrbvlsajeeo");
                      toast.success("Project ID copied to clipboard");
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <Label>Supabase URL</Label>
                  <div className="flex items-center">
                    <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm flex-1 overflow-auto">
                      https://qdxpxqdewqrbvlsajeeo.supabase.co
                    </code>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2" onClick={() => {
                      navigator.clipboard.writeText('https://qdxpxqdewqrbvlsajeeo.supabase.co');
                      toast.success("Supabase URL copied to clipboard");
                    }}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <SetupGuide />
        
        <Card>
          <CardHeader>
            <CardTitle>Slave Servers</CardTitle>
            <CardDescription>Manage your connected servers</CardDescription>
          </CardHeader>
          <CardContent>
            {slaves.length === 0 ? (
              <div className="text-center py-8">
                <ServerCrash className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No slave servers registered</p>
                <Button variant="outline" className="mt-4" onClick={handleAddSlave}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Your First Slave
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Hostname</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>CPU</TableHead>
                    <TableHead>RAM</TableHead>
                    <TableHead>Instances</TableHead>
                    <TableHead>Last Seen</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {slaves.map((slave) => (
                    <TableRow key={slave.id}>
                      <TableCell>
                        <span 
                          className={`status-dot ${
                            slave.status === 'online' ? 'success' : 
                            slave.status === 'error' ? 'danger' : 'warning'
                          }`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{slave.name}</TableCell>
                      <TableCell>{slave.hostname}</TableCell>
                      <TableCell>{slave.ip}</TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{slave.metrics.cpu}%</span>
                          </div>
                          <Progress
                            value={slave.metrics.cpu} 
                            className="h-1.5" 
                            indicatorClassName={
                              slave.metrics.cpu > 80 ? "bg-status-danger" : 
                              slave.metrics.cpu > 50 ? "bg-status-warning" : "bg-status-success"
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="w-24">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span>{slave.metrics.ram}%</span>
                          </div>
                          <Progress
                            value={slave.metrics.ram} 
                            className="h-1.5" 
                            indicatorClassName={
                              slave.metrics.ram > 80 ? "bg-status-danger" : 
                              slave.metrics.ram > 50 ? "bg-status-warning" : "bg-status-success"
                            }
                          />
                        </div>
                      </TableCell>
                      <TableCell>{slave.metrics.instances}</TableCell>
                      <TableCell className="text-xs">
                        {new Date(slave.lastSeen).toLocaleTimeString()}
                        <br />
                        <span className="text-muted-foreground">
                          {new Date(slave.lastSeen).toLocaleDateString()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleEditSlave(slave)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {slave.status !== 'online' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleReconnect(slave.id)}
                              title="Reconnect"
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          )}
                          {slave.status === 'online' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateSlave(slave.id, { status: 'offline' })}
                              title="Shutdown"
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-status-danger"
                            onClick={() => removeSlave(slave.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        
        <SlaveEditDialog 
          slave={selectedSlave} 
          open={open} 
          onOpenChange={setOpen}
        />
      </div>
    </Layout>
  );
};

export default SlavesPage;

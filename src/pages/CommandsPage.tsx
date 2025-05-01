import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, SlaveServer } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/sonner';
import { Terminal, Check, X, XCircle, Plus, Play, Filter, Trash2, Code } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const CommandsPage = () => {
  const { commands, slaves, addCommand, updateCommand, isLoading } = useApp();
  const [showNewCommandDialog, setShowNewCommandDialog] = useState(false);
  
  const pendingCommands = commands.filter(cmd => cmd.status === 'pending');
  const executedCommands = commands.filter(cmd => cmd.status === 'executed');
  const failedCommands = commands.filter(cmd => cmd.status === 'failed');
  
  const [newCommand, setNewCommand] = useState<{
    type: 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom';
    target: string;
    payload: string;
  }>({
    type: 'spawn',
    target: 'all',
    payload: '{}'
  });
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'executed': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'secondary';
    }
  };
  
  const handleSendCommand = () => {
    try {
      // Parse payload to ensure it's valid JSON
      let parsedPayload = {};
      
      if (newCommand.payload.trim()) {
        try {
          parsedPayload = JSON.parse(newCommand.payload);
        } catch (error) {
          throw new Error('Invalid JSON payload');
        }
      }
      
      // Create command object
      const command: Command = {
        id: `cmd-${Date.now()}`,
        type: newCommand.type,
        target: newCommand.target,
        payload: parsedPayload as Record<string, any>,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      
      // Add command to Supabase
      addCommand(command);
      
      // Reset form and close dialog
      setNewCommand({ type: 'spawn', target: 'all', payload: '{}' });
      setShowNewCommandDialog(false);
      
      toast.success('Command sent successfully');
    } catch (error) {
      console.error('Error sending command:', error);
      toast.error(`Failed to send command: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  const getDefaultPayload = (type: 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom') => {
    switch (type) {
      case 'spawn':
        return JSON.stringify({
          url: 'https://twitch.tv/channelName',
          useProxy: true,
          count: 1
        }, null, 2);
      case 'stop':
        return JSON.stringify({
          viewerId: 'all' // or specific viewerId
        }, null, 2);
      case 'update_proxy':
        return JSON.stringify({
          viewerId: '', // specific viewerId
          proxyId: '' // specific proxyId
        }, null, 2);
      case 'reconnect':
        return '{}'; // No specific payload needed
      case 'custom':
        return JSON.stringify({
          action: 'custom_action',
          params: {}
        }, null, 2);
      default:
        return '{}';
    }
  };
  
  const handleTypeChange = (type: 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom') => {
    setNewCommand(prev => ({
      ...prev,
      type,
      payload: getDefaultPayload(type)
    }));
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">Commands</h1>
            <p className="text-muted-foreground mb-6">Loading data from Supabase...</p>
          </div>
          
          <div className="grid grid-cols-1 gap-6">
            <Skeleton className="h-[400px]" />
            <Skeleton className="h-[400px]" />
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold mb-2">Commands</h1>
            <p className="text-muted-foreground">Manage and monitor commands to your slave network</p>
          </div>
          
          <Dialog open={showNewCommandDialog} onOpenChange={setShowNewCommandDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" />
                New Command
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Command</DialogTitle>
                <DialogDescription>
                  Send a command to one or all slave servers.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Command Type</Label>
                  <RadioGroup 
                    value={newCommand.type} 
                    onValueChange={(value) => handleTypeChange(value as any)}
                    className="flex flex-wrap gap-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="spawn" id="spawn" />
                      <Label htmlFor="spawn" className="cursor-pointer">Spawn</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="stop" id="stop" />
                      <Label htmlFor="stop" className="cursor-pointer">Stop</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="update_proxy" id="update_proxy" />
                      <Label htmlFor="update_proxy" className="cursor-pointer">Update Proxy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="reconnect" id="reconnect" />
                      <Label htmlFor="reconnect" className="cursor-pointer">Reconnect</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="cursor-pointer">Custom</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="target">Target</Label>
                  <Select
                    value={newCommand.target}
                    onValueChange={(value) => setNewCommand({ ...newCommand, target: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Slaves</SelectItem>
                      {slaves.map((slave) => (
                        <SelectItem key={slave.id} value={slave.id}>
                          {slave.name} ({slave.hostname})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="payload">Payload (JSON)</Label>
                  <Textarea
                    id="payload"
                    value={newCommand.payload}
                    onChange={(e) => setNewCommand({ ...newCommand, payload: e.target.value })}
                    rows={6}
                    className="font-mono text-sm"
                    placeholder="{}"
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowNewCommandDialog(false)}>Cancel</Button>
                <Button onClick={handleSendCommand}>Send Command</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Command Overview</CardTitle>
            <CardDescription>
              Summary of commands sent to your slave network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{pendingCommands.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <Terminal className="h-5 w-5 text-amber-500" />
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Executed</p>
                  <p className="text-2xl font-bold">{executedCommands.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <Check className="h-5 w-5 text-green-500" />
                </div>
              </div>
              
              <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Failed</p>
                  <p className="text-2xl font-bold">{failedCommands.length}</p>
                </div>
                <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <X className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Command History</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all">
              <div className="flex justify-between items-center mb-4">
                <TabsList>
                  <TabsTrigger value="all">
                    All Commands
                  </TabsTrigger>
                  <TabsTrigger value="pending">
                    Pending
                    {pendingCommands.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{pendingCommands.length}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="executed">
                    Executed
                  </TabsTrigger>
                  <TabsTrigger value="failed">
                    Failed
                    {failedCommands.length > 0 && (
                      <Badge variant="destructive" className="ml-2">{failedCommands.length}</Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="all">
                <CommandTable commands={commands} slaves={slaves} />
              </TabsContent>
              <TabsContent value="pending">
                <CommandTable commands={pendingCommands} slaves={slaves} />
              </TabsContent>
              <TabsContent value="executed">
                <CommandTable commands={executedCommands} slaves={slaves} />
              </TabsContent>
              <TabsContent value="failed">
                <CommandTable commands={failedCommands} slaves={slaves} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Command Templates</CardTitle>
            <CardDescription>
              Common command templates to help you get started quickly
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Spawn Viewers</CardTitle>
                    <Play className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent className="text-sm pb-2">
                  <p className="text-muted-foreground">Spawn multiple viewers on a target slave</p>
                  <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-auto">
                    {`{
  "url": "https://twitch.tv/channelName",
  "useProxy": true,
  "count": 5
}`}
                  </pre>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setNewCommand({
                        type: 'spawn',
                        target: 'all',
                        payload: JSON.stringify({
                          url: "https://twitch.tv/channelName",
                          useProxy: true,
                          count: 5
                        }, null, 2)
                      });
                      setShowNewCommandDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Stop All Viewers</CardTitle>
                    <XCircle className="h-4 w-4 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent className="text-sm pb-2">
                  <p className="text-muted-foreground">Stop all running viewers on a slave</p>
                  <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-auto">
                    {`{
  "viewerId": "all"
}`}
                  </pre>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setNewCommand({
                        type: 'stop',
                        target: 'all',
                        payload: JSON.stringify({
                          viewerId: "all"
                        }, null, 2)
                      });
                      setShowNewCommandDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Custom Command</CardTitle>
                    <Code className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="text-sm pb-2">
                  <p className="text-muted-foreground">Run a custom action on the slave</p>
                  <pre className="bg-muted p-2 rounded mt-2 text-xs overflow-auto">
                    {`{
  "action": "restart_browser",
  "params": {
    "timeout": 5000
  }
}`}
                  </pre>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setNewCommand({
                        type: 'custom',
                        target: 'all',
                        payload: JSON.stringify({
                          action: "restart_browser",
                          params: {
                            timeout: 5000
                          }
                        }, null, 2)
                      });
                      setShowNewCommandDialog(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Use Template
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

interface CommandTableProps {
  commands: Command[];
  slaves: SlaveServer[];
}

const CommandTable: React.FC<CommandTableProps> = ({ commands, slaves }) => {
  const getTargetName = (targetId: string) => {
    if (targetId === 'all') return 'All Slaves';
    
    const slave = slaves.find(s => s.id === targetId);
    return slave ? `${slave.name} (${slave.hostname})` : targetId;
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  if (commands.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md">
        <p className="text-muted-foreground">No commands found</p>
      </div>
    );
  }
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Target</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead>Payload</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {commands.map((command) => (
            <TableRow key={command.id}>
              <TableCell className="font-medium capitalize">{command.type}</TableCell>
              <TableCell>{getTargetName(command.target)}</TableCell>
              <TableCell>
                <Badge variant={command.status === 'pending' ? 'secondary' : command.status === 'executed' ? 'secondary' : 'destructive'}>
                  {command.status}
                </Badge>
              </TableCell>
              <TableCell>{formatTimestamp(command.timestamp)}</TableCell>
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Code className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Command Payload</DialogTitle>
                    </DialogHeader>
                    <pre className="bg-muted p-4 rounded-md overflow-auto max-h-[300px] text-sm font-mono">
                      {JSON.stringify(command.payload, null, 2)}
                    </pre>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CommandsPage;

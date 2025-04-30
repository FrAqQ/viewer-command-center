
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, PlayCircle, RefreshCw, Send, StopCircle } from 'lucide-react';
import { Command } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/sonner';

const CommandsPage = () => {
  const { slaves, commands, addCommand, updateCommand } = useApp();
  const [commandType, setCommandType] = useState<'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom'>('spawn');
  const [target, setTarget] = useState('all');
  const [url, setUrl] = useState('');
  const [viewerCount, setViewerCount] = useState(1);
  const [customCommand, setCustomCommand] = useState('');
  
  const handleSendCommand = () => {
    let payload: Record<string, any> = {};
    
    switch (commandType) {
      case 'spawn':
        if (!url.trim()) {
          toast.error("Please enter a valid URL");
          return;
        }
        payload = { url, count: viewerCount };
        break;
      case 'stop':
        payload = { all: true };
        break;
      case 'update_proxy':
        payload = { action: 'refresh' };
        break;
      case 'reconnect':
        payload = {};
        break;
      case 'custom':
        try {
          payload = JSON.parse(customCommand);
        } catch (e) {
          toast.error("Invalid JSON for custom command");
          return;
        }
        break;
    }
    
    const command: Command = {
      id: `cmd-${Date.now()}`,
      type: commandType,
      target,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    
    addCommand(command);
    toast.success(`Command sent to ${target === 'all' ? 'all slaves' : `slave ${target}`}`);
    
    // Simulate command execution after a delay
    setTimeout(() => {
      const success = Math.random() > 0.2; // 80% success rate for demo
      updateCommand(command.id, {
        status: success ? 'executed' : 'failed'
      });
      
      if (success) {
        toast.success(`Command ${command.id} executed successfully`);
      } else {
        toast.error(`Command ${command.id} failed to execute`);
      }
    }, 2000);
  };
  
  const getCommandStatusColor = (status: string) => {
    switch (status) {
      case 'executed':
        return 'bg-status-success text-white';
      case 'failed':
        return 'bg-status-danger text-white';
      default:
        return 'bg-status-warning text-foreground';
    }
  };
  
  const getCommandTypeIcon = (type: string) => {
    switch (type) {
      case 'spawn':
        return <PlayCircle className="h-4 w-4" />;
      case 'stop':
        return <StopCircle className="h-4 w-4" />;
      case 'update_proxy':
        return <RefreshCw className="h-4 w-4" />;
      case 'reconnect':
        return <CheckCircle2 className="h-4 w-4" />;
      default:
        return <Send className="h-4 w-4" />;
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Command Panel</h1>
          <p className="text-muted-foreground mb-6">Send commands to slave servers</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>New Command</CardTitle>
              <CardDescription>Configure and send commands to one or all slaves</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="command-type" className="text-sm font-medium">Command Type</label>
                  <Select 
                    onValueChange={(value: any) => setCommandType(value)} 
                    defaultValue={commandType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select command" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="spawn">Spawn Viewers</SelectItem>
                      <SelectItem value="stop">Stop Viewers</SelectItem>
                      <SelectItem value="update_proxy">Update Proxies</SelectItem>
                      <SelectItem value="reconnect">Force Reconnect</SelectItem>
                      <SelectItem value="custom">Custom Command</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="target" className="text-sm font-medium">Target Server</label>
                  <Select 
                    onValueChange={(value) => setTarget(value)} 
                    defaultValue={target}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Slaves</SelectItem>
                      {slaves.map((slave) => (
                        <SelectItem key={slave.id} value={slave.id} disabled={slave.status !== 'online'}>
                          {slave.name} {slave.status !== 'online' && '(Offline)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {commandType === 'spawn' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="url" className="text-sm font-medium">Twitch URL</label>
                    <Input
                      id="url"
                      placeholder="https://twitch.tv/channel"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="count" className="text-sm font-medium">Viewer Count</label>
                    <Input
                      id="count"
                      type="number"
                      min="1"
                      max="100"
                      value={viewerCount}
                      onChange={(e) => setViewerCount(Number(e.target.value))}
                    />
                  </div>
                </div>
              )}
              
              {commandType === 'custom' && (
                <div className="space-y-2">
                  <label htmlFor="custom" className="text-sm font-medium">Custom Command JSON</label>
                  <Textarea
                    id="custom"
                    placeholder='{"action": "custom_action", "params": {"key": "value"}}'
                    value={customCommand}
                    onChange={(e) => setCustomCommand(e.target.value)}
                    rows={5}
                  />
                </div>
              )}
              
              <Button className="w-full" onClick={handleSendCommand}>
                <Send className="h-4 w-4 mr-1" />
                Send Command
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Commands</CardTitle>
              <CardDescription>Status and details of recently executed commands</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="pending">Pending</TabsTrigger>
                  <TabsTrigger value="executed">Executed</TabsTrigger>
                  <TabsTrigger value="failed">Failed</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all">
                  <CommandsList commands={commands} />
                </TabsContent>
                
                <TabsContent value="pending">
                  <CommandsList commands={commands.filter(cmd => cmd.status === 'pending')} />
                </TabsContent>
                
                <TabsContent value="executed">
                  <CommandsList commands={commands.filter(cmd => cmd.status === 'executed')} />
                </TabsContent>
                
                <TabsContent value="failed">
                  <CommandsList commands={commands.filter(cmd => cmd.status === 'failed')} />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

interface CommandsListProps {
  commands: Command[];
}

const CommandsList: React.FC<CommandsListProps> = ({ commands }) => {
  if (commands.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No commands found</p>
      </div>
    );
  }
  
  const getTargetName = (target: string) => {
    return target === 'all' ? 'All Slaves' : `Slave ${target}`;
  };
  
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
              <TableCell>
                <div className="flex items-center gap-1.5">
                  {getCommandTypeIcon(command.type)}
                  <span className="capitalize">{command.type}</span>
                </div>
              </TableCell>
              <TableCell>{getTargetName(command.target)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={getCommandStatusColor(command.status)}>
                  {command.status}
                </Badge>
              </TableCell>
              <TableCell className="text-xs">
                {new Date(command.timestamp).toLocaleTimeString()}
              </TableCell>
              <TableCell>
                <code className="text-xs truncate block max-w-[150px]">
                  {JSON.stringify(command.payload)}
                </code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CommandsPage;

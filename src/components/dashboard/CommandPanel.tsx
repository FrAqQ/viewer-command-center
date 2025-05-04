
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlaveServer, Command } from '@/types';
import { useAppContext } from '@/context/AppContext';
import { PlayCircle, RefreshCw, StopCircle, Loader2 } from 'lucide-react';
import { getProxyUrlById, getRandomValidProxy } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface CommandPanelProps {
  slaves: SlaveServer[];
  onCommand?: (command: Command) => Promise<string | null>;
}

const CommandPanel: React.FC<CommandPanelProps> = ({ slaves, onCommand }) => {
  const { addCommand, proxies } = useAppContext();
  const [url, setUrl] = useState('');
  const [slaveId, setSlaveId] = useState<string>('all');
  const [viewerCount, setViewerCount] = useState(1);
  const [useRandomProxy, setUseRandomProxy] = useState(true);
  const [selectedProxyId, setSelectedProxyId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleSendCommand = async (type: 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom') => {
    if (type === 'spawn' && !url.trim()) {
      toast.error('Please enter a valid Twitch URL');
      return;
    }

    setIsLoading(true);
    
    try {
      let payload: Record<string, any> = {};
      
      switch (type) {
        case 'spawn':
          if (viewerCount > 0) {
            // Base payload
            payload = { 
              url, 
              count: viewerCount 
            };
            
            // If we're using proxies, add them to the payload
            if (useRandomProxy) {
              // Get a random valid proxy
              const randomProxy = await getRandomValidProxy();
              if (randomProxy) {
                payload.proxy = randomProxy;
              } else {
                toast.warning('No valid proxies found. Spawning viewers without proxy.');
              }
            } else if (selectedProxyId) {
              // Get the selected proxy
              const proxyUrl = await getProxyUrlById(selectedProxyId);
              if (proxyUrl) {
                payload.proxy = proxyUrl;
              }
            }
          }
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
          // Additional custom commands could be handled here
          payload = {};
          break;
      }
      
      const command: Command = {
        id: `cmd-${Date.now()}`,
        type,
        target: slaveId,
        payload,
        timestamp: new Date().toISOString(),
        status: 'pending',
      };
      
      // Use the onCommand prop if it exists, otherwise use addCommand from context
      if (onCommand) {
        await onCommand(command);
      } else {
        await addCommand(command);
      }
      
      toast.success(`Command "${type}" sent to ${slaveId === 'all' ? 'all slaves' : 'slave ' + slaveId}`);
    } catch (error) {
      console.error('Error sending command:', error);
      toast.error(`Failed to send command: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="col-span-1">
      <CardHeader>
        <CardTitle className="text-lg">Command Center</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="url" className="text-sm font-medium">Twitch URL</label>
          <Input
            id="url"
            placeholder="https://twitch.tv/channel"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>
        
        <div className="flex space-x-2 items-end">
          <div className="space-y-2 flex-1">
            <label htmlFor="server" className="text-sm font-medium">Target Server</label>
            <Select 
              value={slaveId}
              onValueChange={(value) => setSlaveId(value)} 
            >
              <SelectTrigger>
                <SelectValue placeholder="Select server" />
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
          
          <div className="space-y-2 w-24">
            <label htmlFor="count" className="text-sm font-medium">Count</label>
            <Input
              id="count"
              type="number"
              min="1"
              max="100"
              value={viewerCount}
              onChange={(e) => setViewerCount(Number(e.target.value))}
            />
          </div>
          
          <Button 
            className="h-10" 
            onClick={() => handleSendCommand('spawn')} 
            disabled={isLoading || !url}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <PlayCircle className="h-4 w-4 mr-1" />
            )}
            Start
          </Button>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Proxy Settings</label>
          <div className="flex space-x-2">
            <Button 
              variant={useRandomProxy ? "default" : "outline"}
              onClick={() => setUseRandomProxy(true)}
              className="flex-1"
            >
              Use Random Proxy
            </Button>
            <Button 
              variant={!useRandomProxy ? "default" : "outline"}
              onClick={() => setUseRandomProxy(false)}
              className="flex-1"
            >
              Select Specific Proxy
            </Button>
          </div>
          
          {!useRandomProxy && (
            <Select 
              value={selectedProxyId}
              onValueChange={setSelectedProxyId}
              disabled={useRandomProxy}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a proxy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Proxy</SelectItem>
                {proxies.filter(p => p.valid).map((proxy) => (
                  <SelectItem key={proxy.id} value={proxy.id}>
                    {proxy.address}:{proxy.port}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => handleSendCommand('stop')}
            disabled={isLoading}
          >
            <StopCircle className="h-4 w-4 mr-1" />
            Stop All
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => handleSendCommand('update_proxy')}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Rotate Proxies
          </Button>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => handleSendCommand('reconnect')}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommandPanel;

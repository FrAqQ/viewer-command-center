
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlaveServer, Command } from '@/types';
import { useApp } from '@/context/AppContext';
import { PlayCircle, RefreshCw, StopCircle } from 'lucide-react';
import { getProxyUrlById } from '@/integrations/supabase/client';

interface CommandPanelProps {
  slaves: SlaveServer[];
}

const CommandPanel: React.FC<CommandPanelProps> = ({ slaves }) => {
  const { addCommand } = useApp();
  const [url, setUrl] = useState('');
  const [slaveId, setSlaveId] = useState<string>('all');
  const [viewerCount, setViewerCount] = useState(1);
  
  const handleSendCommand = async (type: 'spawn' | 'stop' | 'update_proxy' | 'reconnect') => {
    let payload: Record<string, any> = {};
    
    switch (type) {
      case 'spawn':
        if (viewerCount > 0) {
          payload = { 
            url, 
            count: viewerCount 
          };
          
          // If we're spawning viewers and a proxy is selected, add it to the payload
          if (url && viewerCount > 0) {
            // We could select a random proxy here if needed
            // const randomProxy = await getRandomValidProxy();
            // if (randomProxy) payload.proxy = randomProxy;
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
    }
    
    const command: Command = {
      id: `cmd-${Date.now()}`,
      type,
      target: slaveId,
      payload,
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    
    await addCommand(command);
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
              onValueChange={(value) => setSlaveId(value)} 
              defaultValue="all"
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
            disabled={!url}
          >
            <PlayCircle className="h-4 w-4 mr-1" />
            Start
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button variant="outline" className="w-full" onClick={() => handleSendCommand('stop')}>
            <StopCircle className="h-4 w-4 mr-1" />
            Stop All
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleSendCommand('update_proxy')}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Rotate Proxies
          </Button>
          <Button variant="outline" className="w-full" onClick={() => handleSendCommand('reconnect')}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CommandPanel;

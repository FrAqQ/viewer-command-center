
import React from 'react';
import { SlaveServer } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, Power, Server } from 'lucide-react';

interface SlaveStatusCardProps {
  slave: SlaveServer;
  onReconnect: (id: string) => void;
}

const SlaveStatusCard: React.FC<SlaveStatusCardProps> = ({ slave, onReconnect }) => {
  const statusColor = 
    slave.status === 'online' ? 'success' :
    slave.status === 'error' ? 'danger' : 'warning';

  // CPU-Status Farbe basierend auf Auslastung
  const getCpuStatusColor = (value: number) => {
    if (value > 80) return 'bg-status-danger';
    if (value > 50) return 'bg-status-warning';
    return 'bg-status-success';
  };
  
  // RAM-Status Farbe basierend auf Auslastung
  const getRamStatusColor = (value: number) => {
    if (value > 80) return 'bg-status-danger';
    if (value > 50) return 'bg-status-warning';
    return 'bg-status-success';
  };
    
  const formatLastSeen = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.round(diffMs / 60000);
    
    if (diffMin < 1) return 'Just now';
    if (diffMin === 1) return '1 minute ago';
    if (diffMin < 60) return `${diffMin} minutes ago`;
    
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    return date.toLocaleDateString();
  };
  
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className={`status-dot ${statusColor}`} />
            <CardTitle className="text-sm font-medium">{slave.name}</CardTitle>
          </div>
          <CardDescription className="text-xs mt-1">
            {slave.hostname} ({slave.ip})
          </CardDescription>
        </div>
        <div className="flex space-x-1">
          {slave.status !== 'online' ? (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0" 
              onClick={() => onReconnect(slave.id)}
              title="Reconnect"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 w-8 p-0" 
              title="Server Online"
            >
              <Server className="h-4 w-4 text-status-success" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>CPU</span>
              <span>{slave.metrics.cpu}%</span>
            </div>
            <Progress 
              value={slave.metrics.cpu} 
              className="h-1" 
              indicatorClassName={getCpuStatusColor(slave.metrics.cpu)}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>RAM</span>
              <span>{slave.metrics.ram}%</span>
            </div>
            <Progress 
              value={slave.metrics.ram} 
              className="h-1" 
              indicatorClassName={getRamStatusColor(slave.metrics.ram)}
            />
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">
              Last seen: {formatLastSeen(slave.lastSeen)}
            </span>
            <span className="text-xs font-medium">
              {slave.metrics.instances} instances
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SlaveStatusCard;

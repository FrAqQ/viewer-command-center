
import React from 'react';
import Layout from '@/components/Layout';
import StatusDashboard from '@/components/dashboard/StatusDashboard';
import SlaveStatusCard from '@/components/dashboard/SlaveStatusCard';
import ViewerStatusTable from '@/components/dashboard/ViewerStatusTable';
import LogsPanel from '@/components/dashboard/LogsPanel';
import CommandPanel from '@/components/dashboard/CommandPanel';
import { useApp } from '@/context/AppContext';
import { Command } from '@/types';
import { toast } from '@/components/ui/sonner';

const Index = () => {
  const { slaves, viewers, logs, addCommand, updateSlave, removeViewer, clearLogs } = useApp();
  
  const handleReconnectSlave = (id: string) => {
    // In a real application, this would send a reconnect signal to the slave
    const slave = slaves.find(s => s.id === id);
    if (!slave) return;
    
    const reconnectCommand: Command = {
      id: `cmd-${Date.now()}`,
      type: 'reconnect',
      target: id,
      payload: {},
      timestamp: new Date().toISOString(),
      status: 'pending',
    };
    
    addCommand(reconnectCommand);
    
    // Simulate reconnection response
    setTimeout(() => {
      if (slave.status !== 'online') {
        updateSlave(id, { 
          status: 'online', 
          lastSeen: new Date().toISOString(),
          metrics: {
            ...slave.metrics,
            cpu: Math.floor(Math.random() * 50),
            ram: Math.floor(Math.random() * 50)
          }
        });
        toast.success(`Reconnected to ${slave.name}`);
      }
    }, 2000);
  };
  
  const handleStopViewer = (id: string) => {
    removeViewer(id);
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted-foreground mb-6">Monitor and control your viewer network</p>
        </div>
        
        <StatusDashboard />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {slaves.map((slave) => (
            <SlaveStatusCard key={slave.id} slave={slave} onReconnect={handleReconnectSlave} />
          ))}
        </div>
        
        <div className="pt-2">
          <h2 className="text-xl font-bold mb-4">Active Viewers</h2>
          <ViewerStatusTable viewers={viewers} onStopViewer={handleStopViewer} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LogsPanel logs={logs} onClearLogs={clearLogs} />
          <CommandPanel slaves={slaves} />
        </div>
      </div>
    </Layout>
  );
};

export default Index;

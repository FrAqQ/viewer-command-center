
import React from 'react';
import { useApp } from '@/context/AppContext';
import { Server, Monitor, Globe, AlertTriangle } from 'lucide-react';
import StatsCard from './StatsCard';

const StatusDashboard = () => {
  const { slaves, viewers, proxies, logs } = useApp();
  
  const activeSlaves = slaves.filter(slave => slave.status === 'online').length;
  const activeViewers = viewers.filter(viewer => viewer.status === 'running').length;
  const validProxies = proxies.filter(proxy => proxy.valid).length;
  const errors = logs.filter(log => log.level === 'error').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="Slaves Online" 
        value={`${activeSlaves}/${slaves.length}`} 
        icon={<Server className="h-4 w-4" />} 
        description="Active slave servers"
        trend={{ value: 100, positive: true }}
      />
      <StatsCard 
        title="Active Viewers" 
        value={activeViewers} 
        icon={<Monitor className="h-4 w-4" />} 
        description="Running viewer instances"
        trend={{ value: 20, positive: true }}
      />
      <StatsCard 
        title="Valid Proxies" 
        value={`${validProxies}/${proxies.length}`} 
        icon={<Globe className="h-4 w-4" />} 
        description="Working proxy connections"
        trend={{ value: 5, positive: false }}
      />
      <StatsCard 
        title="System Issues" 
        value={errors} 
        icon={<AlertTriangle className="h-4 w-4" />} 
        description="Errors in the last 24h"
        className={errors > 0 ? "border-status-danger border-2" : ""}
      />
    </div>
  );
};

export default StatusDashboard;

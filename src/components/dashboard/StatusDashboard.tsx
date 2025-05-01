
import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Server, Monitor, Globe, AlertTriangle } from 'lucide-react';
import StatsCard from './StatsCard';
import { Skeleton } from '@/components/ui/skeleton';

const StatusDashboard = () => {
  const { slaves, viewers, proxies, logs, isLoading } = useApp();
  
  const activeSlaves = slaves.filter(slave => slave.status === 'online').length;
  const activeViewers = viewers.filter(viewer => viewer.status === 'running').length;
  const validProxies = proxies.filter(proxy => proxy.valid).length;
  const errors = logs.filter(log => log.level === 'error').length;

  // Calculate trends based on last hour data (simulated in demo)
  const [trends, setTrends] = useState({
    slaves: { value: 0, positive: true },
    viewers: { value: 0, positive: true },
    proxies: { value: 0, positive: true }
  });

  useEffect(() => {
    // In a real app, we would calculate trends based on historical data from Supabase
    // For now, we'll use simulated trend data
    const calculateTrend = (current: number, total: number) => {
      if (total === 0) return { value: 0, positive: true };
      
      // Generate a pseudo-random trend for demo purposes
      // In reality, this would compare current values to historical data
      const trendValue = Math.floor(Math.random() * 20);
      
      // Determine if the trend is positive based on the ratio of active items
      const ratio = current / total;
      const isPositive = ratio > 0.5;
      
      return { value: trendValue, positive: isPositive };
    };
    
    setTrends({
      slaves: calculateTrend(activeSlaves, slaves.length),
      viewers: calculateTrend(activeViewers, viewers.length),
      proxies: calculateTrend(validProxies, proxies.length)
    });
  }, [activeSlaves, activeViewers, validProxies, slaves.length, viewers.length, proxies.length]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        title="Slaves Online" 
        value={`${activeSlaves}/${slaves.length}`} 
        icon={<Server className="h-4 w-4" />} 
        description="Active slave servers"
        trend={trends.slaves}
      />
      <StatsCard 
        title="Active Viewers" 
        value={`${activeViewers}/${viewers.length}`} 
        icon={<Monitor className="h-4 w-4" />} 
        description="Running viewer instances"
        trend={trends.viewers}
      />
      <StatsCard 
        title="Valid Proxies" 
        value={`${validProxies}/${proxies.length}`} 
        icon={<Globe className="h-4 w-4" />} 
        description="Working proxy connections"
        trend={trends.proxies}
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

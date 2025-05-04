
import React, { useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Server, Monitor, Globe, AlertTriangle, RefreshCw } from 'lucide-react';
import StatsCard from './StatsCard';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import GlobalErrorDisplay from './GlobalErrorDisplay';

const StatusDashboard = () => {
  const { slaves, viewers, proxies, logs, isLoading, resetToDefaults } = useApp();
  const [supabaseStatus, setSupabaseStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  
  const activeSlaves = slaves.filter(slave => slave.status === 'online').length;
  const activeViewers = viewers.filter(viewer => viewer.status === 'running').length;
  const validProxies = proxies.filter(proxy => proxy.valid).length;
  const errors = logs.filter(log => log.level === 'error').length;

  // Calculate trends based on last hour data
  const [trends, setTrends] = useState({
    slaves: { value: 0, positive: true },
    viewers: { value: 0, positive: true },
    proxies: { value: 0, positive: true }
  });

  // Check Supabase connection status
  useEffect(() => {
    const checkSupabaseStatus = async () => {
      try {
        const { supabase } = await import('@/integrations/supabase/client');
        
        // Simple ping to check connection
        const { data, error } = await supabase.from('slaves').select('count').limit(1);
        
        if (error) {
          console.error("Supabase connection error:", error);
          setSupabaseStatus('offline');
          toast.error("Supabase connection failed: " + error.message);
        } else {
          setSupabaseStatus('online');
        }
      } catch (err) {
        console.error("Failed to check Supabase status:", err);
        setSupabaseStatus('offline');
        toast.error("Failed to connect to Supabase");
      }
    };

    checkSupabaseStatus();
    
    // Check status periodically
    const interval = setInterval(checkSupabaseStatus, 60000); // Every minute
    
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Calculate trends based on historical data from Supabase
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

  // Handle fallback mode
  const handleFallbackMode = () => {
    resetToDefaults();
    toast.info("Switched to local storage fallback mode");
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    );
  }

  // Show connection error if Supabase is offline
  if (supabaseStatus === 'offline') {
    return (
      <div className="space-y-4">
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            Cannot connect to Supabase. The application is currently using local data.
          </AlertDescription>
          <div className="mt-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleFallbackMode}
              className="mr-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Reload with Mock Data
            </Button>
          </div>
        </Alert>
        
        {/* Still show the dashboard with local data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard 
            title="Slaves Online" 
            value={`${activeSlaves}/${slaves.length}`} 
            icon={<Server className="h-4 w-4" />} 
            description="Active slave servers"
            trend={trends.slaves}
            className="border-dashed"
          />
          <StatsCard 
            title="Active Viewers" 
            value={`${activeViewers}/${viewers.length}`} 
            icon={<Monitor className="h-4 w-4" />} 
            description="Running viewer instances"
            trend={trends.viewers}
            className="border-dashed"
          />
          <StatsCard 
            title="Valid Proxies" 
            value={`${validProxies}/${proxies.length}`} 
            icon={<Globe className="h-4 w-4" />} 
            description="Working proxy connections"
            trend={trends.proxies}
            className="border-dashed"
          />
          <StatsCard 
            title="System Issues" 
            value={errors} 
            icon={<AlertTriangle className="h-4 w-4" />} 
            description="Errors in the last 24h"
            className={errors > 0 ? "border-status-danger border-2 border-dashed" : "border-dashed"}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GlobalErrorDisplay />
      </div>
      
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
          onClick={() => document.querySelector('[data-dialog-trigger="global-errors"]')?.click()}
        />
      </div>
    </div>
  );
};

export default StatusDashboard;

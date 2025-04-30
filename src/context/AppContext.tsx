
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SlaveServer, Proxy, ViewerInstance, Command, LogEntry } from '../types';
import { mockSlaves, mockProxies, mockViewers, mockCommands, mockLogs } from '../data/mockData';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Json } from '@/integrations/supabase/types';

interface AppContextProps {
  slaves: SlaveServer[];
  proxies: Proxy[];
  viewers: ViewerInstance[];
  commands: Command[];
  logs: LogEntry[];
  addSlave: (slave: SlaveServer) => void;
  updateSlave: (id: string, data: Partial<SlaveServer>) => void;
  removeSlave: (id: string) => void;
  addProxy: (proxy: Proxy) => void;
  updateProxy: (id: string, data: Partial<Proxy>) => void;
  removeProxy: (id: string) => void;
  importProxies: (text: string) => void;
  addViewer: (viewer: ViewerInstance) => void;
  updateViewer: (id: string, data: Partial<ViewerInstance>) => void;
  removeViewer: (id: string) => void;
  addCommand: (command: Command) => void;
  updateCommand: (id: string, data: Partial<Command>) => void;
  addLog: (log: LogEntry) => void;
  clearLogs: () => void;
  resetToDefaults: () => void;
  isLoading: boolean;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Helper functions to load data from localStorage as fallback
const loadFromStorage = <T extends unknown>(key: string, defaultData: T): T => {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultData;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultData;
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage as fallback
  const [slaves, setSlaves] = useState<SlaveServer[]>(() => 
    loadFromStorage('slaves', mockSlaves));
  
  const [proxies, setProxies] = useState<Proxy[]>(() => 
    loadFromStorage('proxies', mockProxies));
  
  const [viewers, setViewers] = useState<ViewerInstance[]>(() => 
    loadFromStorage('viewers', mockViewers));
  
  const [commands, setCommands] = useState<Command[]>(() => 
    loadFromStorage('commands', mockCommands));
  
  const [logs, setLogs] = useState<LogEntry[]>(() => 
    loadFromStorage('logs', mockLogs));

  const [isLoading, setIsLoading] = useState(true);

  // Initial data load from Supabase
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load slaves
        const { data: slavesData, error: slavesError } = await supabase
          .from('slaves')
          .select('*');
        
        if (slavesError) throw slavesError;
        if (slavesData?.length) {
          const formattedSlaves: SlaveServer[] = slavesData.map(s => ({
            id: s.id,
            name: s.name,
            hostname: s.hostname,
            ip: s.ip,
            status: s.status as 'online' | 'offline' | 'error',
            lastSeen: s.last_seen,
            metrics: {
              cpu: s.cpu || 0,
              ram: s.ram || 0,
              instances: s.instances || 0
            }
          }));
          setSlaves(formattedSlaves);
        }

        // Load proxies
        const { data: proxiesData, error: proxiesError } = await supabase
          .from('proxies')
          .select('*');
        
        if (proxiesError) throw proxiesError;
        if (proxiesData?.length) {
          const formattedProxies: Proxy[] = proxiesData.map(p => ({
            id: p.id,
            address: p.address,
            port: p.port,
            username: p.username,
            password: p.password,
            valid: p.valid,
            lastChecked: p.last_checked,
            failCount: p.fail_count
          }));
          setProxies(formattedProxies);
        }

        // Load viewers
        const { data: viewersData, error: viewersError } = await supabase
          .from('viewers')
          .select('*');
        
        if (viewersError) throw viewersError;
        if (viewersData?.length) {
          const formattedViewers: ViewerInstance[] = viewersData.map(v => ({
            id: v.id,
            slaveId: v.slave_id,
            url: v.url,
            proxy: v.proxy_id, // We should fetch the proxy details in a real app
            status: v.status as 'running' | 'stopped' | 'error',
            startTime: v.start_time,
            error: v.error
          }));
          setViewers(formattedViewers);
        }

        // Load commands
        const { data: commandsData, error: commandsError } = await supabase
          .from('commands')
          .select('*');
        
        if (commandsError) throw commandsError;
        if (commandsData?.length) {
          const formattedCommands: Command[] = commandsData.map(c => ({
            id: c.id,
            type: c.type as 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom',
            target: c.target,
            payload: c.payload as Record<string, any> || {},
            timestamp: c.timestamp,
            status: c.status as 'pending' | 'executed' | 'failed'
          }));
          setCommands(formattedCommands);
        }

        // Load logs
        const { data: logsData, error: logsError } = await supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(100); // Limit to the most recent 100 logs
        
        if (logsError) throw logsError;
        if (logsData?.length) {
          const formattedLogs: LogEntry[] = logsData.map(l => ({
            id: l.id,
            timestamp: l.timestamp,
            level: l.level as 'info' | 'warning' | 'error',
            source: l.source,
            message: l.message,
            details: l.details as Record<string, any> | undefined
          }));
          setLogs(formattedLogs);
        }

      } catch (error) {
        console.error("Error loading data from Supabase:", error);
        toast.error("Failed to load data from the server. Using local data instead.");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Set up real-time subscriptions for each table
    const slavesSubscription = supabase
      .channel('slaves-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'slaves' }, (payload) => {
        console.log('Slaves changed:', payload);
        loadData(); // Reload all data when changes occur
      })
      .subscribe();

    const proxiesSubscription = supabase
      .channel('proxies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'proxies' }, (payload) => {
        console.log('Proxies changed:', payload);
        loadData();
      })
      .subscribe();

    const viewersSubscription = supabase
      .channel('viewers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'viewers' }, (payload) => {
        console.log('Viewers changed:', payload);
        loadData();
      })
      .subscribe();

    const logsSubscription = supabase
      .channel('logs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
        console.log('New log:', payload);
        if (payload.new) {
          const newLog: LogEntry = {
            id: payload.new.id,
            timestamp: payload.new.timestamp,
            level: payload.new.level as 'info' | 'warning' | 'error',
            source: payload.new.source,
            message: payload.new.message,
            details: payload.new.details as Record<string, any> | undefined
          };
          setLogs(prev => [newLog, ...prev]);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(slavesSubscription);
      supabase.removeChannel(proxiesSubscription);
      supabase.removeChannel(viewersSubscription);
      supabase.removeChannel(logsSubscription);
    };
  }, []);

  // Function to add a slave
  const addSlave = async (slave: SlaveServer) => {
    try {
      const { data, error } = await supabase
        .from('slaves')
        .insert({
          id: slave.id,
          name: slave.name,
          hostname: slave.hostname,
          ip: slave.ip,
          status: slave.status,
          last_seen: slave.lastSeen,
          cpu: slave.metrics.cpu,
          ram: slave.metrics.ram,
          instances: slave.metrics.instances
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newSlave: SlaveServer = {
          id: data[0].id,
          name: data[0].name,
          hostname: data[0].hostname,
          ip: data[0].ip,
          status: data[0].status as 'online' | 'offline' | 'error',
          lastSeen: data[0].last_seen,
          metrics: {
            cpu: data[0].cpu || 0,
            ram: data[0].ram || 0,
            instances: data[0].instances || 0
          }
        };
        setSlaves(prev => [...prev, newSlave]);
        toast.success("Slave server added successfully");
      }
    } catch (error) {
      console.error("Error adding slave:", error);
      toast.error(`Failed to add slave server: ${(error as Error).message}`);
    }
  };

  // Function to update a slave
  const updateSlave = async (id: string, data: Partial<SlaveServer>) => {
    try {
      const updateData: any = {};
      
      if (data.name) updateData.name = data.name;
      if (data.hostname) updateData.hostname = data.hostname;
      if (data.ip) updateData.ip = data.ip;
      if (data.status) updateData.status = data.status;
      if (data.lastSeen) updateData.last_seen = data.lastSeen;
      
      if (data.metrics) {
        if (data.metrics.cpu !== undefined) updateData.cpu = data.metrics.cpu;
        if (data.metrics.ram !== undefined) updateData.ram = data.metrics.ram;
        if (data.metrics.instances !== undefined) updateData.instances = data.metrics.instances;
      }
      
      const { error } = await supabase
        .from('slaves')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setSlaves(prev =>
        prev.map(slave => (slave.id === id ? { ...slave, ...data } : slave))
      );
    } catch (error) {
      console.error("Error updating slave:", error);
      toast.error(`Failed to update slave server: ${(error as Error).message}`);
    }
  };

  // Function to remove a slave
  const removeSlave = async (id: string) => {
    try {
      const { error } = await supabase
        .from('slaves')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setSlaves(prev => prev.filter(slave => slave.id !== id));
      toast.info("Slave server removed");
    } catch (error) {
      console.error("Error removing slave:", error);
      toast.error(`Failed to remove slave server: ${(error as Error).message}`);
    }
  };

  // Function to add a proxy
  const addProxy = async (proxy: Proxy) => {
    try {
      const { data, error } = await supabase
        .from('proxies')
        .insert({
          address: proxy.address,
          port: proxy.port,
          username: proxy.username,
          password: proxy.password,
          valid: proxy.valid,
          last_checked: proxy.lastChecked,
          fail_count: proxy.failCount
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newProxy: Proxy = {
          id: data[0].id,
          address: data[0].address,
          port: data[0].port,
          username: data[0].username,
          password: data[0].password,
          valid: data[0].valid,
          lastChecked: data[0].last_checked,
          failCount: data[0].fail_count
        };
        setProxies(prev => [...prev, newProxy]);
        toast.success("Proxy added successfully");
      }
    } catch (error) {
      console.error("Error adding proxy:", error);
      toast.error(`Failed to add proxy: ${(error as Error).message}`);
    }
  };

  // Function to update a proxy
  const updateProxy = async (id: string, data: Partial<Proxy>) => {
    try {
      const updateData: any = {};
      
      if (data.address) updateData.address = data.address;
      if (data.port) updateData.port = data.port;
      if (data.username !== undefined) updateData.username = data.username;
      if (data.password !== undefined) updateData.password = data.password;
      if (data.valid !== undefined) updateData.valid = data.valid;
      if (data.lastChecked) updateData.last_checked = data.lastChecked;
      if (data.failCount !== undefined) updateData.fail_count = data.failCount;
      
      const { error } = await supabase
        .from('proxies')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setProxies(prev =>
        prev.map(proxy => (proxy.id === id ? { ...proxy, ...data } : proxy))
      );
    } catch (error) {
      console.error("Error updating proxy:", error);
      toast.error(`Failed to update proxy: ${(error as Error).message}`);
    }
  };

  // Function to remove a proxy
  const removeProxy = async (id: string) => {
    try {
      const { error } = await supabase
        .from('proxies')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setProxies(prev => prev.filter(proxy => proxy.id !== id));
      toast.info("Proxy removed");
    } catch (error) {
      console.error("Error removing proxy:", error);
      toast.error(`Failed to remove proxy: ${(error as Error).message}`);
    }
  };

  // Function to import proxies from text
  const importProxies = async (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    try {
      const proxyData = lines.map((line, index) => {
        const parts = line.split(':');
        if (parts.length >= 4) {
          // Format: address:port:username:password
          return {
            address: parts[0],
            port: parts[1],
            username: parts[2],
            password: parts[3],
            valid: true,
            last_checked: new Date().toISOString(),
            fail_count: 0
          };
        } else if (parts.length >= 2) {
          // Format: address:port
          return {
            address: parts[0],
            port: parts[1],
            valid: true,
            last_checked: new Date().toISOString(),
            fail_count: 0
          };
        } else {
          // Invalid format
          return {
            address: line,
            port: '',
            valid: false,
            last_checked: new Date().toISOString(),
            fail_count: 0
          };
        }
      });
      
      const { data, error } = await supabase
        .from('proxies')
        .insert(proxyData)
        .select();
      
      if (error) throw error;
      
      if (data) {
        const newProxies: Proxy[] = data.map(p => ({
          id: p.id,
          address: p.address,
          port: p.port,
          username: p.username,
          password: p.password,
          valid: p.valid,
          lastChecked: p.last_checked,
          failCount: p.fail_count
        }));
        setProxies(prev => [...prev, ...newProxies]);
        toast.success(`Imported ${newProxies.length} proxies`);
      }
    } catch (error) {
      console.error("Error importing proxies:", error);
      toast.error(`Failed to import proxies: ${(error as Error).message}`);
    }
  };

  // Function to add a viewer
  const addViewer = async (viewer: ViewerInstance) => {
    try {
      // First, need to find the proxy ID if a proxy string is provided
      let proxyId = null;
      if (viewer.proxy) {
        const proxyParts = typeof viewer.proxy === 'string' ? viewer.proxy.split(':') : [];
        if (proxyParts.length >= 2) {
          const { data: proxyData } = await supabase
            .from('proxies')
            .select('id')
            .eq('address', proxyParts[0])
            .eq('port', proxyParts[1])
            .limit(1);
          
          if (proxyData && proxyData.length > 0) {
            proxyId = proxyData[0].id;
          }
        }
      }
      
      const { data, error } = await supabase
        .from('viewers')
        .insert({
          slave_id: viewer.slaveId,
          url: viewer.url,
          proxy_id: proxyId,
          status: viewer.status,
          start_time: viewer.startTime,
          error: viewer.error,
          is_test: !viewer.slaveId // Consider it a test if no slaveId is provided
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newViewer: ViewerInstance = {
          id: data[0].id,
          slaveId: data[0].slave_id,
          url: data[0].url,
          proxy: viewer.proxy, // Keep original proxy string for UI display
          status: data[0].status as 'running' | 'stopped' | 'error',
          startTime: data[0].start_time,
          error: data[0].error
        };
        setViewers(prev => [...prev, newViewer]);
      }
      
      // Add log entry for the new viewer
      await addLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        source: viewer.slaveId ? `Slave-${viewer.slaveId}` : 'Master',
        message: `New viewer started for ${viewer.url}`,
        details: { viewerId: viewer.id, proxy: viewer.proxy }
      });
    } catch (error) {
      console.error("Error adding viewer:", error);
      toast.error(`Failed to add viewer: ${(error as Error).message}`);
    }
  };

  // Function to update a viewer
  const updateViewer = async (id: string, data: Partial<ViewerInstance>) => {
    try {
      const updateData: any = {};
      
      if (data.url) updateData.url = data.url;
      if (data.status) updateData.status = data.status;
      if (data.error !== undefined) updateData.error = data.error;
      
      const { error } = await supabase
        .from('viewers')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setViewers(prev =>
        prev.map(viewer => (viewer.id === id ? { ...viewer, ...data } : viewer))
      );
      
      // Log status changes
      if (data.status === 'error') {
        const errorViewer = viewers.find(v => v.id === id);
        await addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'error',
          source: errorViewer?.slaveId ? `Slave-${errorViewer.slaveId}` : 'Master',
          message: `Viewer error: ${data.error || 'Unknown error'}`,
          details: { viewerId: id, url: errorViewer?.url }
        });
      }
    } catch (error) {
      console.error("Error updating viewer:", error);
      toast.error(`Failed to update viewer: ${(error as Error).message}`);
    }
  };

  // Function to remove a viewer
  const removeViewer = async (id: string) => {
    try {
      const viewer = viewers.find(v => v.id === id);
      
      const { error } = await supabase
        .from('viewers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      setViewers(prev => prev.filter(viewer => viewer.id !== id));
      
      // Log viewer removal
      if (viewer) {
        await addLog({
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          level: 'info',
          source: viewer.slaveId ? `Slave-${viewer.slaveId}` : 'Master',
          message: `Viewer stopped for ${viewer.url}`,
          details: { viewerId: id }
        });
      }
    } catch (error) {
      console.error("Error removing viewer:", error);
      toast.error(`Failed to remove viewer: ${(error as Error).message}`);
    }
  };

  // Function to add a command
  const addCommand = async (command: Command) => {
    try {
      const { data, error } = await supabase
        .from('commands')
        .insert({
          type: command.type,
          target: command.target,
          payload: command.payload,
          timestamp: command.timestamp,
          status: command.status
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newCommand: Command = {
          id: data[0].id,
          type: data[0].type as 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom',
          target: data[0].target,
          payload: data[0].payload as Record<string, any> || {},
          timestamp: data[0].timestamp,
          status: data[0].status as 'pending' | 'executed' | 'failed'
        };
        setCommands(prev => [...prev, newCommand]);
      }
      
      // Log the new command
      await addLog({
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        source: 'Master',
        message: `New command sent: ${command.type} to ${command.target}`,
        details: { commandId: command.id, payload: command.payload }
      });
    } catch (error) {
      console.error("Error adding command:", error);
      toast.error(`Failed to add command: ${(error as Error).message}`);
    }
  };

  // Function to update a command
  const updateCommand = async (id: string, data: Partial<Command>) => {
    try {
      const updateData: any = {};
      
      if (data.status) updateData.status = data.status;
      if (data.payload) updateData.payload = data.payload;
      
      const { error } = await supabase
        .from('commands')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
      
      // Update local state
      setCommands(prev =>
        prev.map(command => (command.id === id ? { ...command, ...data } : command))
      );
    } catch (error) {
      console.error("Error updating command:", error);
      toast.error(`Failed to update command: ${(error as Error).message}`);
    }
  };

  // Function to add a log
  const addLog = async (log: LogEntry) => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .insert({
          timestamp: log.timestamp,
          level: log.level,
          source: log.source,
          message: log.message,
          details: log.details
        })
        .select();
      
      if (error) throw error;
      
      if (data && data[0]) {
        const newLog: LogEntry = {
          id: data[0].id,
          timestamp: data[0].timestamp,
          level: data[0].level as 'info' | 'warning' | 'error',
          source: data[0].source,
          message: data[0].message,
          details: data[0].details as Record<string, any> | undefined
        };
        // Not setting logs state here as it will be updated via the realtime subscription
      }
      
      // Show toast for warnings and errors
      if (log.level === 'error') {
        toast.error(log.message);
      } else if (log.level === 'warning') {
        toast.warning(log.message);
      }
    } catch (error) {
      console.error("Error adding log:", error);
      // We don't show a toast here as it might lead to toast spam
    }
  };

  // Function to clear logs
  const clearLogs = async () => {
    try {
      // In a production app, we would use a stored procedure or a function to clear logs
      // but for demo purposes we'll use a simple delete
      const { error } = await supabase
        .from('logs')
        .delete()
        .neq('id', 'placeholder'); // Delete all logs
      
      if (error) throw error;
      
      setLogs([]);
      toast.info("Logs cleared");
    } catch (error) {
      console.error("Error clearing logs:", error);
      toast.error(`Failed to clear logs: ${(error as Error).message}`);
    }
  };

  // Function to reset to defaults
  const resetToDefaults = async () => {
    try {
      // In a production app, we would implement a proper migration or reset procedure
      // but for demo purposes we'll do some basic operations
      
      // Clear all tables first
      await supabase.from('viewers').delete().neq('id', 'placeholder');
      await supabase.from('commands').delete().neq('id', 'placeholder');
      await supabase.from('logs').delete().neq('id', 'placeholder');
      await supabase.from('proxies').delete().neq('id', 'placeholder');
      await supabase.from('slaves').delete().neq('id', 'placeholder');
      
      // Insert mock data
      for (const slave of mockSlaves) {
        await supabase.from('slaves').insert({
          id: slave.id,
          name: slave.name,
          hostname: slave.hostname,
          ip: slave.ip,
          status: slave.status,
          last_seen: slave.lastSeen,
          cpu: slave.metrics.cpu,
          ram: slave.metrics.ram,
          instances: slave.metrics.instances
        });
      }
      
      for (const proxy of mockProxies) {
        await supabase.from('proxies').insert({
          id: proxy.id,
          address: proxy.address,
          port: proxy.port,
          username: proxy.username,
          password: proxy.password,
          valid: proxy.valid,
          last_checked: proxy.lastChecked,
          fail_count: proxy.failCount
        });
      }
      
      // Viewers and other data will be created as needed
      
      // Reset local state
      setSlaves(mockSlaves);
      setProxies(mockProxies);
      setViewers(mockViewers);
      setCommands(mockCommands);
      setLogs(mockLogs);
      
      toast.info("All data has been reset to defaults");
    } catch (error) {
      console.error("Error resetting to defaults:", error);
      toast.error(`Failed to reset data: ${(error as Error).message}`);
    }
  };

  const value = {
    slaves,
    proxies,
    viewers,
    commands,
    logs,
    addSlave,
    updateSlave,
    removeSlave,
    addProxy,
    updateProxy,
    removeProxy,
    importProxies,
    addViewer,
    updateViewer,
    removeViewer,
    addCommand,
    updateCommand,
    addLog,
    clearLogs,
    resetToDefaults,
    isLoading,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextProps => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

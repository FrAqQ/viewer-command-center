
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { SlaveServer, Proxy, ViewerInstance, Command, LogEntry } from '../types';
import { mockSlaves, mockProxies, mockViewers, mockCommands, mockLogs } from '../data/mockData';
import { toast } from '@/components/ui/sonner';

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
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

// Helper functions to load data from localStorage
const loadFromStorage = <T extends unknown>(key: string, defaultData: T): T => {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultData;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error);
    return defaultData;
  }
};

// Helper function to save data to localStorage
const saveToStorage = <T extends unknown>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error);
    toast.error(`Failed to save data: ${(error as Error).message}`);
  }
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from localStorage or use mock data as defaults
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

  // Update localStorage whenever state changes
  useEffect(() => {
    saveToStorage('slaves', slaves);
  }, [slaves]);

  useEffect(() => {
    saveToStorage('proxies', proxies);
  }, [proxies]);

  useEffect(() => {
    saveToStorage('viewers', viewers);
  }, [viewers]);

  useEffect(() => {
    saveToStorage('commands', commands);
  }, [commands]);

  useEffect(() => {
    saveToStorage('logs', logs);
  }, [logs]);

  const addSlave = (slave: SlaveServer) => {
    setSlaves((prev) => [...prev, slave]);
    toast.success("Slave server added successfully");
  };

  const updateSlave = (id: string, data: Partial<SlaveServer>) => {
    setSlaves((prev) =>
      prev.map((slave) => (slave.id === id ? { ...slave, ...data } : slave))
    );
  };

  const removeSlave = (id: string) => {
    setSlaves((prev) => prev.filter((slave) => slave.id !== id));
    toast.info("Slave server removed");
  };

  const addProxy = (proxy: Proxy) => {
    setProxies((prev) => [...prev, proxy]);
    toast.success("Proxy added successfully");
  };

  const updateProxy = (id: string, data: Partial<Proxy>) => {
    setProxies((prev) =>
      prev.map((proxy) => (proxy.id === id ? { ...proxy, ...data } : proxy))
    );
  };

  const removeProxy = (id: string) => {
    setProxies((prev) => prev.filter((proxy) => proxy.id !== id));
  };

  const importProxies = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    
    const newProxies: Proxy[] = lines.map((line, index) => {
      const parts = line.split(':');
      if (parts.length >= 4) {
        // Format: address:port:username:password
        return {
          id: `imported-${Date.now()}-${index}`,
          address: parts[0],
          port: parts[1],
          username: parts[2],
          password: parts[3],
          valid: true,
          lastChecked: new Date().toISOString(),
          failCount: 0
        };
      } else if (parts.length >= 2) {
        // Format: address:port
        return {
          id: `imported-${Date.now()}-${index}`,
          address: parts[0],
          port: parts[1],
          valid: true,
          lastChecked: new Date().toISOString(),
          failCount: 0
        };
      } else {
        // Invalid format
        return {
          id: `imported-${Date.now()}-${index}`,
          address: line,
          port: '',
          valid: false,
          lastChecked: new Date().toISOString(),
          failCount: 0
        };
      }
    });
    
    setProxies((prev) => [...prev, ...newProxies]);
    toast.success(`Imported ${newProxies.length} proxies`);
  };

  const addViewer = (viewer: ViewerInstance) => {
    setViewers((prev) => [...prev, viewer]);
    
    // Log the new viewer
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      source: viewer.slaveId ? `Slave-${viewer.slaveId}` : 'Master',
      message: `New viewer started for ${viewer.url}`,
      details: { viewerId: viewer.id, proxy: viewer.proxy }
    };
    
    addLog(newLog);
  };

  const updateViewer = (id: string, data: Partial<ViewerInstance>) => {
    setViewers((prev) =>
      prev.map((viewer) => (viewer.id === id ? { ...viewer, ...data } : viewer))
    );
    
    // Log status changes
    if (data.status === 'error') {
      const errorViewer = viewers.find(v => v.id === id);
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'error',
        source: errorViewer?.slaveId ? `Slave-${errorViewer.slaveId}` : 'Master',
        message: `Viewer error: ${data.error || 'Unknown error'}`,
        details: { viewerId: id, url: errorViewer?.url }
      };
      addLog(newLog);
    }
  };

  const removeViewer = (id: string) => {
    const viewer = viewers.find(v => v.id === id);
    setViewers((prev) => prev.filter((viewer) => viewer.id !== id));
    
    // Log viewer removal
    if (viewer) {
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        level: 'info',
        source: viewer.slaveId ? `Slave-${viewer.slaveId}` : 'Master',
        message: `Viewer stopped for ${viewer.url}`,
        details: { viewerId: id }
      };
      addLog(newLog);
    }
  };

  const addCommand = (command: Command) => {
    setCommands((prev) => [...prev, command]);
    
    // Log the new command
    const newLog: LogEntry = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'Master',
      message: `New command sent: ${command.type} to ${command.target}`,
      details: { commandId: command.id, payload: command.payload }
    };
    addLog(newLog);
  };

  const updateCommand = (id: string, data: Partial<Command>) => {
    setCommands((prev) =>
      prev.map((command) => (command.id === id ? { ...command, ...data } : command))
    );
  };

  const addLog = (log: LogEntry) => {
    setLogs((prev) => [log, ...prev]);
    
    // Show toast for warnings and errors
    if (log.level === 'error') {
      toast.error(log.message);
    } else if (log.level === 'warning') {
      toast.warning(log.message);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    toast.info("Logs cleared");
  };

  const resetToDefaults = () => {
    setSlaves(mockSlaves);
    setProxies(mockProxies);
    setViewers(mockViewers);
    setCommands(mockCommands);
    setLogs(mockLogs);
    toast.info("All data has been reset to defaults");
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

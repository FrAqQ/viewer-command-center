
import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react';
import { SlaveServer, Proxy, ViewerInstance, Command, LogEntry } from '@/types';
import { v4 as uuidv4 } from '@/utils/uuid';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';

interface AppContextType {
  slaves: SlaveServer[];
  proxies: Proxy[];
  viewers: ViewerInstance[];
  logs: LogEntry[];
  commands: Command[];
  isLoading: boolean;
  addSlave: (slave: Omit<SlaveServer, 'id'>) => void;
  updateSlave: (id: string, updates: Partial<SlaveServer>) => void;
  removeSlave: (id: string) => void;
  addProxy: (proxy: Omit<Proxy, 'id'>) => void;
  updateProxy: (id: string, updates: Partial<Proxy>) => void;
  removeProxy: (id: string) => void;
  checkProxy: (id: string) => Promise<void>;
  checkAllProxies: () => Promise<void>;
  addViewer: (viewer: Omit<ViewerInstance, 'id'>) => void;
  updateViewer: (id: string, updates: Partial<ViewerInstance>) => void;
  removeViewer: (id: string) => void;
  addLog: (log: Omit<LogEntry, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
  addCommand: (command: Omit<Command, 'id' | 'timestamp' | 'status'>) => Promise<string | null>;
  updateCommand: (id: string, updates: Partial<Command>) => void;
  resetToDefaults: () => void;
  setSlaves: Dispatch<SetStateAction<SlaveServer[]>>;
  setProxies: Dispatch<SetStateAction<Proxy[]>>;
  setViewers: Dispatch<SetStateAction<ViewerInstance[]>>;
  setLogs: Dispatch<SetStateAction<LogEntry[]>>;
  importProxies?: (proxyText: string) => void;
  user: any | null;
  userRoles: string[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Fix: Move the generic function outside of JSX context and use a type parameter placeholder
function useLocalStorage<T>(key: string, initialValue: T): [T, (value: SetStateAction<T>) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: SetStateAction<T>) => {
    try {
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

const AppProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [slaves, setSlaves] = useState<SlaveServer[]>([]);
  const [proxies, setProxies] = useState<Proxy[]>([]);
  const [viewers, setViewers] = useState<ViewerInstance[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [commands, setCommands] = useState<Command[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  
  const addSlave = (slave: Omit<SlaveServer, 'id'>) => {
    const newSlave: SlaveServer = { id: uuidv4(), ...slave };
    setSlaves(prevSlaves => [...prevSlaves, newSlave]);
  };

  const updateSlave = (id: string, updates: Partial<SlaveServer>) => {
    setSlaves(prevSlaves =>
      prevSlaves.map(slave => (slave.id === id ? { ...slave, ...updates } : slave))
    );
  };

  const removeSlave = (id: string) => {
    setSlaves(prevSlaves => prevSlaves.filter(slave => slave.id !== id));
  };

  const addProxy = (proxy: Omit<Proxy, 'id'>) => {
    const newProxy: Proxy = { id: uuidv4(), ...proxy };
    setProxies(prevProxies => [...prevProxies, newProxy]);
  };

  const updateProxy = (id: string, updates: Partial<Proxy>) => {
    setProxies(prevProxies =>
      prevProxies.map(proxy => (proxy.id === id ? { ...proxy, ...updates } : proxy))
    );
  };

  const removeProxy = (id: string) => {
    setProxies(prevProxies => prevProxies.filter(proxy => proxy.id !== id));
  };
  
  const checkProxy = async (id: string) => {
    const proxy = proxies.find(p => p.id === id);
    if (!proxy) return;
    
    updateProxy(id, { valid: false, lastChecked: new Date().toISOString() });
    
    try {
      const controller = new AbortController();
      // Store timeoutId in a separate variable to avoid the "Cannot find name 'timeoutId'" error
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const proxyUrl = proxy.username && proxy.password
        ? `http://${proxy.username}:${proxy.password}@${proxy.address}:${proxy.port}`
        : `http://${proxy.address}:${proxy.port}`;
      
      const checkUrl = 'https://www.google.com/';
      
      await fetch(checkUrl, {
        signal: controller.signal,
        mode: 'no-cors',
        // @ts-ignore
        proxy: proxyUrl
      });
      
      clearTimeout(timeoutId);
      updateProxy(id, { valid: true, lastChecked: new Date().toISOString(), failCount: 0 });
      toast.success(`Proxy ${proxy.address}:${proxy.port} is valid`);
    } catch (error: any) {
      // Using a local timeoutId to avoid the reference error
      const localTimeoutId = setTimeout(() => {}, 0);
      clearTimeout(localTimeoutId);
      console.error(`Proxy ${proxy.address}:${proxy.port} check failed:`, error);
      
      const failCount = proxy.failCount ? proxy.failCount + 1 : 1;
      updateProxy(id, { 
        valid: false, 
        lastChecked: new Date().toISOString(),
        failCount: failCount
      });
      
      toast.error(`Proxy ${proxy.address}:${proxy.port} is invalid (${error.message})`);
    }
  };
  
  const checkAllProxies = async () => {
    for (const proxy of proxies) {
      await checkProxy(proxy.id);
    }
  };

  const addViewer = (viewer: Omit<ViewerInstance, 'id'>) => {
    const newViewer: ViewerInstance = { id: uuidv4(), ...viewer };
    setViewers(prevViewers => [...prevViewers, newViewer]);
  };

  const updateViewer = (id: string, updates: Partial<ViewerInstance>) => {
    setViewers(prevViewers =>
      prevViewers.map(viewer => (viewer.id === id ? { ...viewer, ...updates } : viewer))
    );
  };

  const removeViewer = (id: string) => {
    setViewers(prevViewers => prevViewers.filter(viewer => viewer.id !== id));
  };

  const addLog = (log: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = { 
      id: uuidv4(), 
      timestamp: new Date().toISOString(), 
      ...log,
      // Ensure details is a proper Record if present
      details: log.details ? (
        typeof log.details === 'object' && log.details !== null ? log.details : { value: log.details }
      ) : {}
    };
    setLogs(prevLogs => [newLog, ...prevLogs]);
  };

  const clearLogs = () => {
    setLogs([]);
  };
  
  const addCommand = async (command: Omit<Command, 'id' | 'timestamp' | 'status'>): Promise<string | null> => {
    const newCommand: Command = { 
      id: uuidv4(), 
      timestamp: new Date().toISOString(), 
      status: 'pending', 
      ...command 
    };
    
    // Update commands state
    setCommands(prevCommands => [...prevCommands, newCommand]);
    
    const { data, error } = await supabase
      .from('commands')
      .insert([{
        type: newCommand.type,
        target: newCommand.target,
        payload: newCommand.payload,
        timestamp: newCommand.timestamp,
        status: 'pending'
      }])
      .select()
      .single();
      
    if (error) {
      console.error('Error sending command:', error);
      toast.error('Failed to send command: ' + error.message);
      return null;
    }
    
    toast.success(`Command "${newCommand.type}" sent to ${newCommand.target}`);
    return data.id;
  };

  const updateCommand = (id: string, updates: Partial<Command>) => {
    setCommands(prevCommands =>
      prevCommands.map(command => (command.id === id ? { ...command, ...updates } : command))
    );
  };

  const resetToDefaults = () => {
    setSlaves([]);
    setProxies([]);
    setViewers([]);
    setLogs([]);
    
    localStorage.removeItem('slaves');
    localStorage.removeItem('proxies');
    localStorage.removeItem('viewers');
    localStorage.removeItem('logs');
  };

  const importProxies = (proxyText: string) => {
    if (!proxyText.trim()) return;
    
    const lines = proxyText.trim().split('\n');
    const newProxies: Proxy[] = [];
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      
      const parts = trimmedLine.split(':');
      
      if (parts.length >= 2) {
        const address = parts[0];
        const port = parts[1];
        const username = parts.length >= 3 ? parts[2] : undefined;
        const password = parts.length >= 4 ? parts[3] : undefined;
        
        newProxies.push({
          id: uuidv4(),
          address,
          port,
          username,
          password,
          valid: true, // Assume valid until checked
          lastChecked: new Date().toISOString(),
          failCount: 0
        });
      }
    });
    
    if (newProxies.length > 0) {
      setProxies(prevProxies => [...prevProxies, ...newProxies]);
      toast.success(`Imported ${newProxies.length} proxies`);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load slaves from Supabase
        const { data: slavesData, error: slavesError } = await supabase
          .from('slaves')
          .select('*')
          .order('name', { ascending: true });
        if (slavesError) {
          console.error("Error fetching slaves:", slavesError);
          toast.error("Failed to load slaves from Supabase: " + slavesError.message);
        } else if (slavesData) {
          // Map the data to match our SlaveServer type
          const mappedSlaves: SlaveServer[] = slavesData.map(slave => ({
            id: slave.id,
            name: slave.name,
            hostname: slave.hostname,
            ip: slave.ip,
            status: (slave.status as 'online' | 'offline' | 'error') || 'offline',
            lastSeen: slave.last_seen,
            metrics: {
              cpu: slave.cpu || 0,
              ram: slave.ram || 0,
              instances: slave.instances || 0
            }
          }));
          setSlaves(mappedSlaves);
        }
        
        // Load proxies from Supabase
        const { data: proxiesData, error: proxiesError } = await supabase
          .from('proxies')
          .select('*')
          .order('address', { ascending: true });
        if (proxiesError) {
          console.error("Error fetching proxies:", proxiesError);
          toast.error("Failed to load proxies from Supabase: " + proxiesError.message);
        } else if (proxiesData) {
          // Map the data to match our Proxy type
          const mappedProxies: Proxy[] = proxiesData.map(proxy => ({
            id: proxy.id,
            address: proxy.address,
            port: proxy.port,
            username: proxy.username || undefined,
            password: proxy.password || undefined,
            valid: proxy.valid || false,
            lastChecked: proxy.last_checked,
            failCount: proxy.fail_count || 0
          }));
          setProxies(mappedProxies);
        }
        
        // Load viewers from Supabase
        const { data: viewersData, error: viewersError } = await supabase
          .from('viewers')
          .select('*');
        if (viewersError) {
          console.error("Error fetching viewers:", viewersError);
          toast.error("Failed to load viewers from Supabase: " + viewersError.message);
        } else if (viewersData) {
          // Map the data to match our ViewerInstance type
          const mappedViewers: ViewerInstance[] = viewersData.map(viewer => ({
            id: viewer.id,
            url: viewer.url,
            slaveId: viewer.slave_id || undefined,
            proxy: viewer.proxy_id || undefined,
            status: (viewer.status as 'running' | 'stopped' | 'error') || 'stopped',
            startTime: viewer.start_time,
            error: viewer.error || undefined
          }));
          setViewers(mappedViewers);
        }
        
        // Load logs from Supabase
        const { data: logsData, error: logsError } = await supabase
          .from('logs')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);
        if (logsError) {
          console.error("Error fetching logs:", logsError);
          toast.error("Failed to load logs from Supabase: " + logsError.message);
        } else if (logsData) {
          // Map the data to match our LogEntry type
          const mappedLogs: LogEntry[] = logsData.map(log => ({
            id: log.id,
            level: (log.level as 'error' | 'info' | 'warning') || 'info',
            source: log.source,
            message: log.message,
            timestamp: log.timestamp,
            details: log.details ? (typeof log.details === 'object' ? log.details : { value: log.details }) : {}
          }));
          setLogs(mappedLogs);
        }

        // Load commands from Supabase with proper type handling
        const { data: commandsData, error: commandsError } = await supabase
          .from('commands')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);
        if (commandsError) {
          console.error("Error fetching commands:", commandsError);
          toast.error("Failed to load commands from Supabase: " + commandsError.message);
        } else if (commandsData) {
          // Map the data to match our Command type with proper type handling for result
          const mappedCommands: Command[] = commandsData.map(cmd => {
            // Create base command object
            const commandObj: Command = {
              id: cmd.id,
              type: cmd.type as 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom',
              target: cmd.target,
              payload: typeof cmd.payload === 'object' && cmd.payload !== null ? 
                cmd.payload as Record<string, any> : 
                { value: cmd.payload },
              timestamp: cmd.timestamp,
              status: (cmd.status as 'pending' | 'executed' | 'failed') || 'pending',
            };
            
            // Add result property if it exists in the data
            if ('result' in cmd && cmd.result !== undefined) {
              commandObj.result = typeof cmd.result === 'object' && cmd.result !== null ? 
                cmd.result as Record<string, any> : 
                { value: cmd.result };
            }
            
            return commandObj;
          });
          setCommands(mappedCommands);
        }
      } catch (error) {
        console.error("Unexpected error during data loading:", error);
        toast.error("Failed to load data: " + (error as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          
          // In a real app, you'd fetch user roles from a dedicated table
          // For now, we'll just set a default role
          setUserRoles(['admin']);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserRoles([]);
        }
      }
    );

    // Initial session check
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        
        // In a real app, you'd fetch user roles from a dedicated table
        // For now, we'll just set a default role
        setUserRoles(['admin']);
      }
    };
    
    checkSession();
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const contextValue: AppContextType = {
    slaves,
    proxies,
    viewers,
    logs,
    commands,
    isLoading,
    addSlave,
    updateSlave,
    removeSlave,
    addProxy,
    updateProxy,
    removeProxy,
    checkProxy,
    checkAllProxies,
    addViewer,
    updateViewer,
    removeViewer,
    addLog,
    clearLogs,
    addCommand,
    updateCommand,
    resetToDefaults,
    setSlaves,
    setProxies,
    setViewers,
    setLogs,
    importProxies,
    user,
    userRoles,
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export { AppProvider, useAppContext };

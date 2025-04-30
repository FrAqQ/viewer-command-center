
export interface SlaveServer {
  id: string;
  name: string;
  hostname: string;
  ip: string;
  status: 'online' | 'offline' | 'error';
  lastSeen: string;
  metrics: {
    cpu: number;
    ram: number;
    instances: number;
  };
}

export interface Proxy {
  id: string;
  address: string;
  port: string;
  username?: string;
  password?: string;
  valid: boolean;
  lastChecked?: string;
  failCount: number;
}

export interface ViewerInstance {
  id: string;
  slaveId?: string;
  url: string;
  proxy?: string;
  status: 'running' | 'stopped' | 'error';
  startTime: string;
  error?: string;
}

export interface Command {
  id: string;
  type: 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom';
  target: 'all' | string; // all or slaveId
  payload: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'executed' | 'failed';
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  details?: Record<string, any>;
}

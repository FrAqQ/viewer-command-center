
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
  screenshot?: string;
}

export interface Command {
  id: string;
  type: 'spawn' | 'stop' | 'update_proxy' | 'reconnect' | 'custom';
  target: 'all' | string; // all or slaveId
  payload: Record<string, any>;
  timestamp: string;
  status: 'pending' | 'executed' | 'failed';
  result?: Record<string, any>;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  details?: Record<string, any>;
}

// Webhook payload types
export interface StatusUpdatePayload {
  type: 'status_update';
  slaveId: string;
  slaveName: string;
  data: {
    status: 'online' | 'offline' | 'error';
    hostname?: string;
    ip?: string;
    metrics?: {
      cpu: number;
      ram: number;
      instances: number;
    };
  };
}

export interface ViewerUpdatePayload {
  type: 'viewer_update';
  slaveId: string;
  data: {
    viewers: {
      id: string;
      url: string;
      proxy?: string;
      status: 'running' | 'stopped' | 'error';
      error?: string;
      screenshot?: string;
    }[];
  };
}

export interface LogEntryPayload {
  type: 'log_entry';
  slaveId: string;
  data: {
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: Record<string, any>;
  };
}

export interface CommandResultPayload {
  type: 'command_result';
  slaveId: string;
  data: {
    commandId: string;
    status: 'executed' | 'failed';
    result?: Record<string, any>;
  };
}

export interface GetPendingCommandsPayload {
  type: 'get_pending_commands';
  slaveId: string;
}

export type WebhookPayload = 
  | StatusUpdatePayload
  | ViewerUpdatePayload
  | LogEntryPayload
  | CommandResultPayload
  | GetPendingCommandsPayload;

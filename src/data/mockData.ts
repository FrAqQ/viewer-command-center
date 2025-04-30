
import { SlaveServer, Proxy, ViewerInstance, Command, LogEntry } from '../types';

// Mock Slave Servers
export const mockSlaves: SlaveServer[] = [
  {
    id: '1',
    name: 'Slave-01',
    hostname: 'slave-01.example.com',
    ip: '192.168.1.101',
    status: 'online',
    lastSeen: new Date().toISOString(),
    metrics: {
      cpu: 32,
      ram: 45,
      instances: 8,
    },
  },
  {
    id: '2',
    name: 'Slave-02',
    hostname: 'slave-02.example.com',
    ip: '192.168.1.102',
    status: 'online',
    lastSeen: new Date().toISOString(),
    metrics: {
      cpu: 65,
      ram: 70,
      instances: 12,
    },
  },
  {
    id: '3',
    name: 'Slave-03',
    hostname: 'slave-03.example.com',
    ip: '192.168.1.103',
    status: 'error',
    lastSeen: new Date(Date.now() - 300000).toISOString(),
    metrics: {
      cpu: 0,
      ram: 25,
      instances: 0,
    },
  },
  {
    id: '4',
    name: 'Slave-04',
    hostname: 'slave-04.example.com',
    ip: '192.168.1.104',
    status: 'offline',
    lastSeen: new Date(Date.now() - 900000).toISOString(),
    metrics: {
      cpu: 0,
      ram: 0,
      instances: 0,
    },
  },
];

// Mock Proxies
export const mockProxies: Proxy[] = [
  { id: '1', address: '185.199.228.220', port: '7300', username: 'user1', password: 'pass1', valid: true, lastChecked: new Date().toISOString(), failCount: 0 },
  { id: '2', address: '185.199.229.156', port: '7300', username: 'user2', password: 'pass2', valid: true, lastChecked: new Date().toISOString(), failCount: 0 },
  { id: '3', address: '185.199.231.45', port: '8080', username: 'user3', password: 'pass3', valid: true, lastChecked: new Date().toISOString(), failCount: 0 },
  { id: '4', address: '103.152.112.162', port: '80', username: 'user4', password: 'pass4', valid: false, lastChecked: new Date().toISOString(), failCount: 3 },
  { id: '5', address: '188.74.210.207', port: '6100', username: 'user5', password: 'pass5', valid: true, lastChecked: new Date().toISOString(), failCount: 0 },
  { id: '6', address: '188.74.183.10', port: '8279', username: 'user6', password: 'pass6', valid: true, lastChecked: new Date().toISOString(), failCount: 1 },
  { id: '7', address: '188.74.210.21', port: '6100', username: 'user7', password: 'pass7', valid: false, lastChecked: new Date().toISOString(), failCount: 5 },
];

// Mock Viewer Instances
export const mockViewers: ViewerInstance[] = [
  { id: '1', slaveId: '1', url: 'https://twitch.tv/channel1', proxy: '185.199.228.220:7300', status: 'running', startTime: new Date(Date.now() - 3600000).toISOString() },
  { id: '2', slaveId: '1', url: 'https://twitch.tv/channel1', proxy: '185.199.229.156:7300', status: 'running', startTime: new Date(Date.now() - 1800000).toISOString() },
  { id: '3', slaveId: '2', url: 'https://twitch.tv/channel2', proxy: '185.199.231.45:8080', status: 'error', startTime: new Date(Date.now() - 600000).toISOString(), error: 'Proxy connection refused' },
  { id: '4', slaveId: '2', url: 'https://twitch.tv/channel1', proxy: '188.74.210.207:6100', status: 'running', startTime: new Date().toISOString() },
  { id: '5', url: 'https://twitch.tv/channel3', status: 'running', startTime: new Date(Date.now() - 120000).toISOString() },
];

// Mock Commands
export const mockCommands: Command[] = [
  { id: '1', type: 'spawn', target: '1', payload: { url: 'https://twitch.tv/channel1', count: 5 }, timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'executed' },
  { id: '2', type: 'update_proxy', target: 'all', payload: { action: 'refresh' }, timestamp: new Date(Date.now() - 2700000).toISOString(), status: 'executed' },
  { id: '3', type: 'stop', target: '2', payload: { instanceIds: ['3'] }, timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'executed' },
  { id: '4', type: 'reconnect', target: '3', payload: {}, timestamp: new Date(Date.now() - 900000).toISOString(), status: 'failed' },
];

// Mock Logs
export const mockLogs: LogEntry[] = [
  { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), level: 'info', source: 'Slave-01', message: 'Spawned 5 viewers for channel1', details: { command: '1' } },
  { id: '2', timestamp: new Date(Date.now() - 2700000).toISOString(), level: 'info', source: 'System', message: 'Proxy list updated', details: { count: 7 } },
  { id: '3', timestamp: new Date(Date.now() - 1800000).toISOString(), level: 'warning', source: 'Slave-02', message: 'Viewer instance could not connect', details: { instanceId: '3', proxy: '185.199.231.45:8080' } },
  { id: '4', timestamp: new Date(Date.now() - 900000).toISOString(), level: 'error', source: 'Slave-03', message: 'Connection lost to slave server', details: { lastSeen: new Date(Date.now() - 900000).toISOString() } },
  { id: '5', timestamp: new Date(Date.now() - 600000).toISOString(), level: 'error', source: 'Proxy', message: 'Multiple failures for proxy 103.152.112.162:80', details: { failCount: 3 } },
  { id: '6', timestamp: new Date(Date.now() - 300000).toISOString(), level: 'info', source: 'Master', message: 'Local viewer test started', details: { url: 'https://twitch.tv/channel3' } },
  { id: '7', timestamp: new Date(Date.now() - 180000).toISOString(), level: 'info', source: 'Slave-01', message: 'Viewer successfully connected', details: { instanceId: '1' } },
];


import React from 'react';
import { ViewerInstance } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface ViewerStatusTableProps {
  viewers: ViewerInstance[];
  onStopViewer: (id: string) => void;
}

const ViewerStatusTable: React.FC<ViewerStatusTableProps> = ({ viewers, onStopViewer }) => {
  const { slaves } = useApp();
  
  const getSlaveNameById = (slaveId?: string) => {
    if (!slaveId) return 'Master';
    const slave = slaves.find(s => s.id === slaveId);
    return slave ? slave.name : 'Unknown';
  };
  
  const formatDuration = (startTime: string) => {
    const start = new Date(startTime).getTime();
    const now = Date.now();
    const diffSecs = Math.floor((now - start) / 1000);
    const hours = Math.floor(diffSecs / 3600);
    const minutes = Math.floor((diffSecs % 3600) / 60);
    const seconds = diffSecs % 60;
    
    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
    parts.push(`${seconds}s`);
    
    return parts.join(' ');
  };
  
  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Channel URL</TableHead>
            <TableHead>Proxy</TableHead>
            <TableHead>Server</TableHead>
            <TableHead>Runtime</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {viewers.map((viewer) => (
            <TableRow key={viewer.id}>
              <TableCell>
                <span className={`status-dot ${viewer.status === 'running' ? 'success' : viewer.status === 'stopped' ? 'warning' : 'danger'}`}></span>
                <span className="ml-2 text-xs">{viewer.status}</span>
              </TableCell>
              <TableCell className="font-medium">{viewer.url}</TableCell>
              <TableCell className="text-xs">{viewer.proxy || 'None'}</TableCell>
              <TableCell>{getSlaveNameById(viewer.slaveId)}</TableCell>
              <TableCell>{formatDuration(viewer.startTime)}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => onStopViewer(viewer.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ViewerStatusTable;

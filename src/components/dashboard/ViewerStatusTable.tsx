
import React, { useState } from 'react';
import { ViewerInstance } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { X, Image } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { getViewerScreenshot } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface ViewerStatusTableProps {
  viewers: ViewerInstance[];
  onStopViewer: (id: string) => void;
}

const ViewerStatusTable: React.FC<ViewerStatusTableProps> = ({ viewers, onStopViewer }) => {
  const { slaves } = useApp();
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [screenshotDialogOpen, setScreenshotDialogOpen] = useState(false);
  const [isLoadingScreenshot, setIsLoadingScreenshot] = useState(false);
  
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

  const handleViewScreenshot = async (viewerId: string) => {
    setIsLoadingScreenshot(true);
    try {
      const screenshotData = await getViewerScreenshot(viewerId);
      setSelectedScreenshot(screenshotData);
      if (screenshotData) {
        setScreenshotDialogOpen(true);
      } else {
        toast.error("No screenshot available for this viewer");
      }
    } catch (error) {
      console.error('Error loading screenshot:', error);
      toast.error('Error loading screenshot');
    } finally {
      setIsLoadingScreenshot(false);
    }
  };
  
  return (
    <>
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Channel URL</TableHead>
              <TableHead>Proxy</TableHead>
              <TableHead>Server</TableHead>
              <TableHead>Runtime</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {viewers.map((viewer) => (
              <TableRow key={viewer.id}>
                <TableCell>
                  <span className={`status-dot ${viewer.status === 'running' ? 'success' : viewer.status === 'stopped' ? 'warning' : 'danger'}`}></span>
                  <span className="ml-2 text-xs">{viewer.status}</span>
                  {viewer.error && (
                    <span className="block text-xs text-red-500 mt-1 truncate max-w-[200px]" title={viewer.error}>
                      {viewer.error}
                    </span>
                  )}
                </TableCell>
                <TableCell className="font-medium">{viewer.url}</TableCell>
                <TableCell className="text-xs">{viewer.proxy || 'None'}</TableCell>
                <TableCell>{getSlaveNameById(viewer.slaveId)}</TableCell>
                <TableCell>{formatDuration(viewer.startTime)}</TableCell>
                <TableCell>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => handleViewScreenshot(viewer.id)}
                      disabled={isLoadingScreenshot}
                      title="View Screenshot"
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0"
                      onClick={() => onStopViewer(viewer.id)}
                      title="Stop Viewer"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={screenshotDialogOpen} onOpenChange={setScreenshotDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Viewer Screenshot</DialogTitle>
          </DialogHeader>
          <div className="overflow-auto max-h-[70vh]">
            {selectedScreenshot ? (
              <img 
                src={`data:image/png;base64,${selectedScreenshot}`} 
                alt="Viewer screenshot" 
                className="w-full h-auto"
              />
            ) : (
              <div className="text-center p-4">
                No screenshot available
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewerStatusTable;


import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getViewerScreenshot } from '@/integrations/supabase/client';
import { LogEntry, ViewerInstance } from '@/types';

const GlobalErrorDisplay: React.FC = () => {
  const { logs, viewers } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [viewerScreenshots, setViewerScreenshots] = useState<Record<string, string | null>>({});
  
  // Get only error logs
  const errorLogs = logs
    .filter(log => log.level === 'error')
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10); // Get only the 10 most recent errors
  
  const errorCount = errorLogs.length;
  
  useEffect(() => {
    // Load screenshots for viewers with errors
    const loadScreenshots = async () => {
      const newScreenshots: Record<string, string | null> = {};
      
      // Find viewers with errors
      const viewersWithErrors = viewers.filter(viewer => 
        viewer.status === 'error' && viewer.error
      );
      
      // Load screenshots for these viewers
      for (const viewer of viewersWithErrors) {
        try {
          const screenshot = await getViewerScreenshot(viewer.id);
          newScreenshots[viewer.id] = screenshot;
        } catch (error) {
          console.error(`Failed to load screenshot for viewer ${viewer.id}:`, error);
        }
      }
      
      setViewerScreenshots(newScreenshots);
    };
    
    if (isOpen) {
      loadScreenshots();
    }
  }, [isOpen, viewers]);
  
  // Find related viewer for a log entry
  const findRelatedViewer = (logEntry: LogEntry): ViewerInstance | undefined => {
    if (!logEntry.details) return undefined;
    
    // Try to extract viewer ID from the log details
    const viewerId = logEntry.details.viewerId || 
                    (logEntry.details.id && typeof logEntry.details.id === 'string' && 
                     viewers.some(v => v.id === logEntry.details.id) ? logEntry.details.id : null);
    
    if (viewerId) {
      return viewers.find(v => v.id === viewerId);
    }
    
    return undefined;
  };
  
  if (errorCount === 0) return null;
  
  return (
    <>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="relative"
          onClick={() => setIsOpen(true)}
        >
          <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
          {errorCount} Error{errorCount !== 1 ? 's' : ''}
          {errorCount > 0 && (
            <span className="absolute top-0 right-0 transform translate-x-1/3 -translate-y-1/3 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
              {errorCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>System Errors</span>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="flex-grow">
            <div className="space-y-4 p-2">
              {errorLogs.map((log) => {
                const relatedViewer = findRelatedViewer(log);
                const hasScreenshot = relatedViewer && viewerScreenshots[relatedViewer.id];
                
                return (
                  <div 
                    key={log.id} 
                    className="border rounded-md p-4 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{log.source}</div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {hasScreenshot && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          View Screenshot
                        </Button>
                      )}
                    </div>
                    
                    <div className="mt-2 text-red-600">{log.message}</div>
                    
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        <code className="p-2 bg-muted rounded block whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {selectedLog && (
        <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Error Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Source</h3>
                <p>{selectedLog.source}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Message</h3>
                <p className="text-red-600">{selectedLog.message}</p>
              </div>
              
              <div>
                <h3 className="font-medium">Time</h3>
                <p>{new Date(selectedLog.timestamp).toLocaleString()}</p>
              </div>
              
              {selectedLog.details && (
                <div>
                  <h3 className="font-medium">Details</h3>
                  <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                    {JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
              
              {(() => {
                const relatedViewer = findRelatedViewer(selectedLog);
                if (relatedViewer && viewerScreenshots[relatedViewer.id]) {
                  return (
                    <div>
                      <h3 className="font-medium">Screenshot</h3>
                      <div className="border rounded overflow-hidden mt-2">
                        <img 
                          src={`data:image/png;base64,${viewerScreenshots[relatedViewer.id]}`}
                          alt="Error screenshot"
                          className="w-full h-auto"
                        />
                      </div>
                    </div>
                  );
                }
                return null;
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default GlobalErrorDisplay;

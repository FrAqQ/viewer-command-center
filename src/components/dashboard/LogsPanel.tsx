
import React from 'react';
import { LogEntry } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';

interface LogsPanelProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

const LogsPanel: React.FC<LogsPanelProps> = ({ logs, onClearLogs }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };
  
  return (
    <Card className="col-span-1">
      <CardHeader className="pb-3 flex flex-row justify-between items-center">
        <CardTitle className="text-lg">System Logs</CardTitle>
        <Button variant="outline" size="sm" onClick={onClearLogs} className="h-8">
          <Trash2 className="h-4 w-4 mr-1" />
          Clear
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4">
          {logs.length === 0 ? (
            <div className="py-4 text-center text-sm text-muted-foreground">
              No logs to display
            </div>
          ) : (
            <ul className="space-y-1">
              {logs.map((log) => (
                <li key={log.id} className="py-1 border-b last:border-0">
                  <div className="flex items-start">
                    <div className={`flex-shrink-0 status-dot ${
                      log.level === 'error' ? 'danger' : 
                      log.level === 'warning' ? 'warning' : 'info'
                    } mt-1.5 mr-2`} />
                    <div className="flex-grow">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{log.source}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatTimestamp(log.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {Object.entries(log.details).map(([key, value]) => (
                            <span key={key} className="mr-2">
                              {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default LogsPanel;


import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Trash2, Download, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from '@/components/ui/sonner';

const LogsPage = () => {
  const { logs, clearLogs } = useApp();
  const [search, setSearch] = useState('');
  const [logLevel, setLogLevel] = useState('all');
  const [source, setSource] = useState('all');
  const isMobile = useIsMobile();
  
  // Get unique sources from logs
  const sources = ['all', ...Array.from(new Set(logs.map(log => log.source)))];
  
  // Filter logs based on search, level and source
  const filteredLogs = logs.filter(log => {
    const matchesSearch = search ? 
      log.message.toLowerCase().includes(search.toLowerCase()) || 
      log.source.toLowerCase().includes(search.toLowerCase()) : true;
      
    const matchesLevel = logLevel !== 'all' ? log.level === logLevel : true;
    
    const matchesSource = source !== 'all' ? log.source === source : true;
    
    return matchesSearch && matchesLevel && matchesSource;
  });
  
  const getLogLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-status-danger" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-status-warning" />;
      default:
        return <Info className="h-4 w-4 text-status-info" />;
    }
  };
  
  const handleExportLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${new Date(log.timestamp).toLocaleString()}] [${log.level.toUpperCase()}] [${log.source}] ${log.message} ${log.details ? JSON.stringify(log.details) : ''}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viewer-command-center-logs-${new Date().toISOString().slice(0,10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("Logs exported successfully");
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">System Logs</h1>
          <p className="text-muted-foreground mb-6">Review and analyze system events and errors</p>
        </div>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle>Log Browser</CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={handleExportLogs}>
                <Download className="h-4 w-4 mr-1" />
                {!isMobile && "Export"}
              </Button>
              <Button variant="outline" onClick={clearLogs} className="text-status-danger">
                <Trash2 className="h-4 w-4 mr-1" />
                {!isMobile && "Clear"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex space-x-2 flex-1">
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" className="w-10 p-0">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-1 space-x-2">
                <Select 
                  onValueChange={(value) => setLogLevel(value)} 
                  defaultValue={logLevel}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Log Level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  onValueChange={(value) => setSource(value)} 
                  defaultValue={source}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent>
                    {sources.map((src) => (
                      <SelectItem key={src} value={src}>
                        {src === 'all' ? 'All Sources' : src}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {filteredLogs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No logs found matching your filters</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table className="overflow-auto">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">Level</TableHead>
                      <TableHead className="w-[160px]">Timestamp</TableHead>
                      <TableHead className="w-[120px]">Source</TableHead>
                      <TableHead>Message</TableHead>
                      {!isMobile && <TableHead className="w-[200px]">Details</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {getLogLevelIcon(log.level)}
                            <span className="capitalize text-xs">{log.level}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {new Date(log.timestamp).toLocaleTimeString()}
                          <br />
                          {new Date(log.timestamp).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{log.source}</TableCell>
                        <TableCell className="font-medium">{log.message}</TableCell>
                        {!isMobile && (
                          <TableCell>
                            {log.details && (
                              <code className="text-xs block max-w-[200px] truncate">
                                {JSON.stringify(log.details)}
                              </code>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default LogsPage;

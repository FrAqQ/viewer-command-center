
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useApp } from '@/context/AppContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogEntry } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle, Search, RefreshCw, Trash2, Filter, Download, ArrowUp, ArrowDown, Info, AlertTriangle, Ban } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Label } from '@/components/ui/label';

const LogsPage = () => {
  const { logs, clearLogs, isLoading } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>(logs);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [showLogDetails, setShowLogDetails] = useState(false);
  
  // Calculate unique sources for filtering
  const sources = [...new Set(logs.map(log => log.source))].sort();
  
  // Update filtered logs when filters or logs change
  useEffect(() => {
    let result = [...logs];
    
    // Apply level filter
    if (levelFilter !== 'all') {
      result = result.filter(log => log.level === levelFilter);
    }
    
    // Apply source filter
    if (sourceFilter !== 'all') {
      result = result.filter(log => log.source === sourceFilter);
    }
    
    // Apply search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(log => 
        log.message.toLowerCase().includes(term) || 
        log.source.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    result.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortDirection === 'asc' ? dateA - dateB : dateB - dateA;
    });
    
    setFilteredLogs(result);
  }, [logs, levelFilter, sourceFilter, searchTerm, sortDirection]);
  
  const handleClearLogs = async () => {
    try {
      await clearLogs();
      toast.success('Logs cleared successfully');
    } catch (error) {
      toast.error('Failed to clear logs');
      console.error(error);
    }
  };
  
  const handleExportLogs = () => {
    // Format logs as JSON
    const exportData = JSON.stringify(filteredLogs, null, 2);
    
    // Create a blob and download it
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Logs exported successfully');
  };
  
  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };
  
  const handleViewLogDetails = (log: LogEntry) => {
    setSelectedLog(log);
    setShowLogDetails(true);
  };
  
  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error':
        return <Ban className="h-4 w-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };
  
  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error': return 'destructive';
      case 'warning': return 'warning';
      case 'info': return 'secondary';
      default: return 'outline';
    }
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold mb-2">System Logs</h1>
            <p className="text-muted-foreground mb-6">Loading data from Supabase...</p>
          </div>
          
          <Skeleton className="h-[100px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">System Logs</h1>
          <p className="text-muted-foreground mb-6">View and analyze system logs from your viewer network</p>
        </div>
        
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Log Overview</CardTitle>
                <CardDescription>
                  {logs.length} log entries, {logs.filter(log => log.level === 'error').length} errors
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportLogs}
                  disabled={filteredLogs.length === 0}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleClearLogs}
                  disabled={logs.length === 0}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                <div className="sm:col-span-2 relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-1" />
                      <SelectValue placeholder="Filter by level" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="h-4 w-4 mr-1" />
                      <SelectValue placeholder="Filter by source" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    {sources.map(source => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={toggleSortDirection}>
                  {sortDirection === 'desc' ? (
                    <>
                      <ArrowDown className="h-4 w-4 mr-1" />
                      Newest First
                    </>
                  ) : (
                    <>
                      <ArrowUp className="h-4 w-4 mr-1" />
                      Oldest First
                    </>
                  )}
                </Button>
              </div>
              
              {filteredLogs.length === 0 ? (
                <div className="text-center p-8 border rounded-md">
                  <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No logs found matching the current filters</p>
                  
                  {logs.length > 0 && (searchTerm || levelFilter !== 'all' || sourceFilter !== 'all') && (
                    <Button 
                      variant="link" 
                      onClick={() => {
                        setSearchTerm('');
                        setLevelFilter('all');
                        setSourceFilter('all');
                      }}
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Level</TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Source</TableHead>
                        <TableHead className="w-[40%]">Message</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.slice(0, 100).map((log) => (
                        <TableRow key={log.id} className={log.level === 'error' ? 'bg-red-50/50 dark:bg-red-900/20' : ''}>
                          <TableCell>
                            <Badge variant={getLevelBadgeVariant(log.level)}>
                              <div className="flex items-center">
                                {getLevelIcon(log.level)}
                                <span className="ml-1 capitalize">{log.level}</span>
                              </div>
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs">
                            {formatTimestamp(log.timestamp)}
                          </TableCell>
                          <TableCell className="font-medium">{log.source}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.message}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleViewLogDetails(log)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {filteredLogs.length > 100 && (
                    <div className="p-2 text-center text-sm text-muted-foreground">
                      Showing 100 of {filteredLogs.length} logs. Export to see all.
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Dialog open={showLogDetails} onOpenChange={setShowLogDetails}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Log Details</DialogTitle>
            </DialogHeader>
            
            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Timestamp</Label>
                    <p className="text-sm font-medium">
                      {formatTimestamp(selectedLog.timestamp)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Level</Label>
                    <div className="flex items-center">
                      <Badge variant={getLevelBadgeVariant(selectedLog.level)}>
                        <div className="flex items-center">
                          {getLevelIcon(selectedLog.level)}
                          <span className="ml-1 capitalize">{selectedLog.level}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  <p className="text-sm font-medium">{selectedLog.source}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Message</Label>
                  <p className="text-sm">{selectedLog.message}</p>
                </div>
                
                <div>
                  <Label className="text-xs text-muted-foreground">Details</Label>
                  <ScrollArea className="h-[200px] w-full rounded-md border p-4 mt-1 bg-muted/20">
                    <pre className="text-xs font-mono whitespace-pre-wrap">
                      {selectedLog.details 
                        ? JSON.stringify(selectedLog.details, null, 2) 
                        : 'No additional details'}
                    </pre>
                  </ScrollArea>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default LogsPage;

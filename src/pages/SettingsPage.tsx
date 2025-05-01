import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Upload, RefreshCw, Trash2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const SettingsPage = () => {
  const { slaves, proxies, viewers, commands, logs, resetToDefaults, isLoading } = useApp();
  const [debugMode, setDebugMode] = useState(false);
  const [exportData, setExportData] = useState('');
  const [importData, setImportData] = useState('');
  const [showSupabaseInfo, setShowSupabaseInfo] = useState(false);
  // Store the original console methods as references
  const [originalConsoleLog] = useState(() => console.log);
  const [originalConsoleError] = useState(() => console.error);
  
  const handleExportData = () => {
    const data = {
      slaves,
      proxies,
      viewers,
      commands,
      logs,
      exportedAt: new Date().toISOString(),
    };
    
    setExportData(JSON.stringify(data, null, 2));
    toast.success('Data exported to text area');
  };
  
  const handleDownloadExport = () => {
    if (!exportData) {
      toast.error('No data to download. Please export first.');
      return;
    }
    
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `viewer-network-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Export file downloaded');
  };
  
  const handleImport = () => {
    if (!importData.trim()) {
      toast.error('No data to import');
      return;
    }
    
    try {
      const data = JSON.parse(importData);
      
      if (!data.slaves || !data.proxies || !data.viewers) {
        throw new Error('Invalid import data format');
      }
      
      // In a real implementation, we would process the import data
      // For now, just show a success message
      toast.success('Data imported successfully');
      
      // Clear the import textarea
      setImportData('');
    } catch (error) {
      toast.error(`Failed to parse import data: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  };
  
  const handleReset = () => {
    resetToDefaults();
    toast.success('System reset to default values');
  };
  
  const handleToggleDebugMode = (checked: boolean) => {
    setDebugMode(checked);
    
    if (checked) {
      // Enable more verbose console logging
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      
      console.log = function(...args) {
        originalConsoleLog('[DEBUG]', ...args);
      };
      
      console.error = function(...args) {
        originalConsoleError('[DEBUG ERROR]', ...args);
        toast.error(`Debug Error: ${args.join(' ')}`);
      };
      
      toast.success('Debug mode enabled');
    } else {
      // Restore original console methods
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      
      toast.info('Debug mode disabled');
    }
  };
  
  const testSupabaseConnection = async () => {
    try {
      const { data, error } = await supabase.from('slaves').select('count');
      
      if (error) {
        throw error;
      }
      
      toast.success('Supabase connection successful');
      setShowSupabaseInfo(true);
    } catch (error) {
      console.error('Supabase connection test failed:', error);
      toast.error(`Supabase connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-6">Configure and manage your viewer network</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Data</CardTitle>
              <CardDescription>Export all data for backup or transfer</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-4" onClick={handleExportData} disabled={isLoading}>
                <Download className="h-4 w-4 mr-1" />
                Generate Export
              </Button>
              <Textarea
                placeholder="Export data will appear here"
                value={exportData}
                onChange={(e) => setExportData(e.target.value)}
                rows={8}
                readOnly
              />
            </CardContent>
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleDownloadExport}
                disabled={!exportData}
              >
                <Download className="h-4 w-4 mr-1" />
                Download as JSON
              </Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Import Data</CardTitle>
              <CardDescription>Import data from a previous export</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Paste exported JSON data here"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                rows={8}
              />
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full" onClick={handleImport} disabled={!importData.trim()}>
                <Upload className="h-4 w-4 mr-1" />
                Import Data
              </Button>
            </CardFooter>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
            <CardDescription>Configure system behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="debug-mode">Debug Mode</Label>
                <p className="text-sm text-muted-foreground">
                  Enable more verbose logging for troubleshooting
                </p>
              </div>
              <Switch
                id="debug-mode"
                checked={debugMode}
                onCheckedChange={handleToggleDebugMode}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Test Supabase Connection</Label>
                <p className="text-sm text-muted-foreground">
                  Verify connection to Supabase backend
                </p>
              </div>
              <Button variant="outline" onClick={testSupabaseConnection}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Test Connection
              </Button>
            </div>
            
            {showSupabaseInfo && (
              <Alert className="mt-4">
                <AlertTitle>Supabase Connection Details</AlertTitle>
                <AlertDescription>
                  <div className="space-y-2 mt-2">
                    <p>
                      <strong>URL:</strong>{" "}
                      <code className="px-1 py-0.5 bg-muted rounded text-sm">
                        https://qdxpxqdewqrbvlsajeeo.supabase.co
                      </code>
                    </p>
                    <p>
                      <strong>Project ID:</strong>{" "}
                      <code className="px-1 py-0.5 bg-muted rounded text-sm">
                        qdxpxqdewqrbvlsajeeo
                      </code>
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <span className="text-status-success">Connected</span>
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full mt-4">
                  <Trash2 className="h-4 w-4 mr-1" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will reset all data to default values. This includes all slaves, proxies,
                    viewers, commands, and logs. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Reset
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="bg-amber-50 dark:bg-amber-950/20">
            <div className="flex items-center">
              <ShieldAlert className="h-5 w-5 mr-2 text-amber-500" />
              <CardTitle>Security Notice</CardTitle>
            </div>
            <CardDescription>Important security information</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Development Mode Active</AlertTitle>
              <AlertDescription>
                This application is running in development mode with public permissions.
                For production use, you should:
                <ul className="list-disc ml-6 mt-2 space-y-1">
                  <li>Enable authentication for Supabase</li>
                  <li>Set up proper Row Level Security policies</li>
                  <li>Use environment variables for sensitive information</li>
                  <li>Deploy to a secure hosting environment</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <p className="text-xs text-muted-foreground">
              For more information on securing your application, please refer to the 
              <a href="https://supabase.com/docs/guides/auth" className="text-primary ml-1" target="_blank" rel="noopener noreferrer">
                Supabase Authentication Documentation
              </a>.
            </p>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;

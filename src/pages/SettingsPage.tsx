
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/sonner';
import { useApp } from '@/context/AppContext';
import { Download, Upload, RefreshCw, Trash2, Save } from 'lucide-react';

const SettingsPage = () => {
  const { slaves, proxies, viewers, commands, logs, resetToDefaults } = useApp();
  
  const handleExportData = () => {
    try {
      const exportData = {
        slaves,
        proxies,
        viewers,
        commands,
        logs,
        exportedAt: new Date().toISOString()
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `viewer-command-center-export-${new Date().toISOString().slice(0, 10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      toast.success('Data exported successfully');
    } catch (error) {
      toast.error(`Export failed: ${(error as Error).message}`);
      console.error('Export error:', error);
    }
  };
  
  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);
        
        // Validate data structure
        if (!importedData.slaves || !importedData.proxies || !importedData.viewers) {
          throw new Error('Invalid data format');
        }
        
        // Store each data type in localStorage
        localStorage.setItem('slaves', JSON.stringify(importedData.slaves));
        localStorage.setItem('proxies', JSON.stringify(importedData.proxies));
        localStorage.setItem('viewers', JSON.stringify(importedData.viewers));
        localStorage.setItem('commands', JSON.stringify(importedData.commands));
        localStorage.setItem('logs', JSON.stringify(importedData.logs));
        
        toast.success('Data imported successfully, refreshing page...');
        
        // Reload the page to reflect the imported data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
        
      } catch (error) {
        toast.error(`Import failed: ${(error as Error).message}`);
        console.error('Import error:', error);
      }
    };
    
    reader.readAsText(file);
  };
  
  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all data? This cannot be undone.')) {
      localStorage.clear();
      toast.success('All data cleared, returning to defaults');
      resetToDefaults();
    }
  };
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-6">Configure your application preferences</p>
        </div>
        
        <Tabs defaultValue="data">
          <TabsList className="mb-6">
            <TabsTrigger value="data">Data Management</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>
          
          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Data Storage</CardTitle>
                <CardDescription>Manage your locally stored data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h3 className="font-medium">Current Data</h3>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>Slaves</span>
                        <Badge variant="outline">{slaves.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Proxies</span>
                        <Badge variant="outline">{proxies.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Viewers</span>
                        <Badge variant="outline">{viewers.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Commands</span>
                        <Badge variant="outline">{commands.length}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Logs</span>
                        <Badge variant="outline">{logs.length}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="font-medium">Storage Location</h3>
                    <p className="text-sm text-muted-foreground">
                      Data is stored locally in your browser's localStorage.
                      This means your data stays on your device and is not sent to any server.
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Warning: Clearing browser data or using private browsing will result in data loss.
                      Use the export feature to back up your data regularly.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                <Button onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-1" />
                  Export Data
                </Button>
                <div className="relative">
                  <Input
                    type="file"
                    id="import-data"
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                    accept=".json"
                    onChange={handleImportData}
                  />
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-1" />
                    Import Data
                  </Button>
                </div>
                <Button variant="outline" onClick={resetToDefaults}>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Reset to Defaults
                </Button>
                <Button variant="destructive" onClick={handleClearAllData}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Clear All Data
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure basic application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="notifications">Enable Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications for important events
                      </p>
                    </div>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="dark-mode">Dark Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Use dark color theme
                      </p>
                    </div>
                    <Switch id="dark-mode" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="auto-refresh">Auto Refresh</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically refresh viewer status
                      </p>
                    </div>
                    <Switch id="auto-refresh" defaultChecked />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="h-4 w-4 mr-1" />
                  Save Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Advanced Settings</CardTitle>
                <CardDescription>Configure technical application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storage-limit">Local Storage Limit (items per category)</Label>
                  <Input id="storage-limit" type="number" defaultValue="1000" />
                  <p className="text-xs text-muted-foreground">
                    Maximum number of items to store per category (logs, commands, etc.)
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="refresh-interval">Status Refresh Interval (seconds)</Label>
                  <Input id="refresh-interval" type="number" defaultValue="30" />
                  <p className="text-xs text-muted-foreground">
                    How often to refresh viewer and slave status
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="debug-mode">Debug Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Show additional debugging information
                    </p>
                  </div>
                  <Switch id="debug-mode" />
                </div>
              </CardContent>
              <CardFooter>
                <Button>
                  <Save className="h-4 w-4 mr-1" />
                  Save Advanced Settings
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>About Viewer Command Center</CardTitle>
            <CardDescription>
              Version 1.0.0 - Frontend Only Edition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              This application is designed to run entirely in your browser. All data is stored locally on your device
              using browser localStorage. No data is sent to external servers.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Make sure to export your data regularly as a backup, as clearing your browser data will result in data loss.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default SettingsPage;

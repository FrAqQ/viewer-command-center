
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/sonner';

const SettingsPage = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-6">Configure your master control panel</p>
        </div>
        
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>API Configuration</CardTitle>
              <CardDescription>Configure API endpoint settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input id="api-key" type="password" value="sk_test_*****************" readOnly />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="api-url">API Base URL</Label>
                <Input id="api-url" value="https://master-controller.example.com/api" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="refresh-rate">Refresh Rate (seconds)</Label>
                  <Input id="refresh-rate" type="number" min="5" value="10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Connection Timeout (ms)</Label>
                  <Input id="timeout" type="number" min="1000" value="5000" />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast.success("API settings saved")}>Save API Settings</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security settings for your master control panel</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="ip-whitelist">IP Whitelisting</Label>
                  <p className="text-sm text-muted-foreground">
                    Only allow specified IP addresses to connect
                  </p>
                </div>
                <Switch id="ip-whitelist" />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="whitelist">Whitelisted IPs (one per line)</Label>
                <Textarea
                  id="whitelist"
                  placeholder="192.168.1.1&#10;10.0.0.1"
                  className="min-h-[100px]"
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="jwt-auth">JWT Authentication</Label>
                  <p className="text-sm text-muted-foreground">
                    Require JWT tokens for API access
                  </p>
                </div>
                <Switch id="jwt-auth" defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="jwt-secret">JWT Secret Key</Label>
                <Input id="jwt-secret" type="password" value="your-secret-key-here" />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast.success("Security settings saved")}>Save Security Settings</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Proxy Settings</CardTitle>
              <CardDescription>Configure proxy rotation and validation settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rotation-method">Proxy Rotation Method</Label>
                  <Select defaultValue="round-robin">
                    <SelectTrigger>
                      <SelectValue placeholder="Select method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round-robin">Round Robin</SelectItem>
                      <SelectItem value="random">Random</SelectItem>
                      <SelectItem value="least-used">Least Used</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max-fails">Max Consecutive Failures</Label>
                  <Input id="max-fails" type="number" min="1" max="10" value="3" />
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-disable">Auto-disable Failed Proxies</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically disable proxies after too many failures
                  </p>
                </div>
                <Switch id="auto-disable" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-test">Periodic Proxy Testing</Label>
                  <p className="text-sm text-muted-foreground">
                    Regularly test proxy connections in the background
                  </p>
                </div>
                <Switch id="auto-test" defaultChecked />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={() => toast.success("Proxy settings saved")}>Save Proxy Settings</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Configure system-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="log-level">Log Level</Label>
                <Select defaultValue="info">
                  <SelectTrigger>
                    <SelectValue placeholder="Select log level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="debug">Debug</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="dark-mode">Dark Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Use dark theme for the interface
                  </p>
                </div>
                <Switch id="dark-mode" defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notifications">Desktop Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Show desktop notifications for important events
                  </p>
                </div>
                <Switch id="notifications" defaultChecked />
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Reset to Defaults</Button>
              <Button onClick={() => toast.success("System settings saved")}>Save System Settings</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;

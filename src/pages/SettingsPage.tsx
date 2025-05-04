
import React from 'react';
import Layout from '@/components/Layout';
import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';

const SettingsPage = () => {
  const { user, userRoles } = useAppContext();
  
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground mb-6">Configure system settings and preferences</p>
        </div>
        
        <RoleGuard requiredRole="admin">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList>
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="api">API Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Email</p>
                    <p>{user?.email || 'Not logged in'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium">User Roles</p>
                    <div className="flex gap-2">
                      {userRoles.map(role => (
                        <Badge key={role} variant="outline">{role}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Viewer Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="timeout" className="text-sm font-medium">Viewer Timeout (seconds)</label>
                    <Input id="timeout" type="number" defaultValue={300} />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="proxy-timeout" className="text-sm font-medium">Proxy Test Timeout (seconds)</label>
                    <Input id="proxy-timeout" type="number" defaultValue={10} />
                  </div>
                  
                  <Button>Save Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="api-key" className="text-sm font-medium">API Key</label>
                    <Input id="api-key" type="password" defaultValue="sk_test_123456789" />
                  </div>
                  
                  <Button>Regenerate API Key</Button>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="webhook-url" className="text-sm font-medium">Webhook URL</label>
                    <Input id="webhook-url" type="text" defaultValue="https://api.example.com/webhook" />
                  </div>
                  
                  <Button>Save API Settings</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </RoleGuard>
      </div>
    </Layout>
  );
};

export default SettingsPage;

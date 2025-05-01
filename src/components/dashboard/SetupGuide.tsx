
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Copy, Download, Terminal, FileCode, Play } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { slaveCode } from '@/data/slave-client-snippet';

interface SetupGuideProps {
  // Add any props if needed
}

const SetupGuide: React.FC<SetupGuideProps> = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  
  const installCommands = `# Create a directory for your slave
mkdir slave-client
cd slave-client

# Initialize and install dependencies
npm init -y
npm install axios @supabase/supabase-js playwright os-utils node-cron`;

  const handleCopyInstall = () => {
    navigator.clipboard.writeText(installCommands);
    toast.success("Install commands copied to clipboard");
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(slaveCode);
    toast.success("Slave code copied to clipboard");
  };
  
  const handleDownloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([slaveCode], {type: 'text/javascript'});
    element.href = URL.createObjectURL(file);
    element.download = "slave.js";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Slave code downloaded");
  };
  
  const generateAPIKey = () => {
    // Generate a random API key (for demo purposes)
    const randomKey = Array(64)
      .fill(0)
      .map(() => Math.floor(Math.random() * 16).toString(16))
      .join("");
    setApiKey(randomKey);
    toast.success("API key generated");
  };
  
  const copyAPIKey = () => {
    navigator.clipboard.writeText(apiKey);
    toast.success("API key copied to clipboard");
  };
  
  // Show demo setup only
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <Tabs defaultValue="setup">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="setup">1. Setup</TabsTrigger>
            <TabsTrigger value="code">2. Code</TabsTrigger>
            <TabsTrigger value="run">3. Run</TabsTrigger>
          </TabsList>
          
          <TabsContent value="setup">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Setup Slave Environment</h3>
              <p>
                Follow these steps to set up a new slave server. Each slave will connect
                to this master panel and receive commands.
              </p>
              
              <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Prerequisites</AlertTitle>
                <AlertDescription>
                  You need Node.js 14+ and npm installed on the slave machine.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4 mt-4">
                <h4 className="font-medium">1. Create a directory and install dependencies</h4>
                <div className="bg-secondary/50 p-4 rounded-md relative">
                  <pre className="text-xs md:text-sm whitespace-pre-wrap">
                    {installCommands}
                  </pre>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleCopyInstall}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <h4 className="font-medium">2. Generate an API Key</h4>
                <p className="text-sm text-muted-foreground">
                  Generate a secure API key that will be used to authenticate communication between your slaves and this master panel.
                </p>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Generate API Key</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>API Key Management</DialogTitle>
                      <DialogDescription>
                        Generate and manage API keys for secure slave authentication.
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="apikey">API Key</Label>
                        <div className="flex space-x-2">
                          <Input 
                            id="apikey" 
                            value={apiKey} 
                            type={showApiKey ? "text" : "password"}
                            placeholder="No API key generated"
                            readOnly
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => setShowApiKey(!showApiKey)}
                          >
                            {showApiKey ? "Hide" : "Show"}
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={generateAPIKey}>
                          Generate New Key
                        </Button>
                        <Button variant="secondary" onClick={copyAPIKey} disabled={!apiKey}>
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Key
                        </Button>
                      </div>
                      
                      <Alert className="mt-2">
                        <AlertTitle>Important</AlertTitle>
                        <AlertDescription className="text-sm">
                          After generating an API key, make sure to:
                          <ul className="list-disc pl-4 mt-2">
                            <li>Add it to your Supabase environment in the Edge Functions settings</li>
                            <li>Update the slave code with this key</li>
                            <li>Never share this key publicly</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    </div>
                    
                    <DialogFooter>
                      <Button type="submit" onClick={() => toast.success("API key saved successfully")}>
                        Save Changes
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <Alert className="mt-4" variant="destructive">
                <AlertTitle>Security Warning</AlertTitle>
                <AlertDescription className="text-sm">
                  Store your API key securely as an environment variable on your slave servers. Never commit it to version control.
                </AlertDescription>
              </Alert>
            </div>
          </TabsContent>
          
          <TabsContent value="code">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Slave Node.js Code</h3>
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleCopyCode} variant="outline">
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </Button>
                  <Button size="sm" onClick={handleDownloadCode} variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
              
              <Alert>
                <FileCode className="h-4 w-4" />
                <AlertTitle>Customize Your Slave</AlertTitle>
                <AlertDescription>
                  Modify the configuration section with your slave name and API key.
                </AlertDescription>
              </Alert>
              
              <div className="mt-4 relative">
                <div className="max-h-[500px] overflow-auto bg-secondary/50 p-4 rounded-md">
                  <pre className="text-xs whitespace-pre-wrap font-mono">
                    {slaveCode}
                  </pre>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="run">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Run Your Slave</h3>
              <p>
                Start your slave and verify that it connects to the master panel.
              </p>
              
              <div className="space-y-2">
                <h4 className="font-medium">1. Before running</h4>
                <p className="text-sm text-muted-foreground">
                  Make sure you've:
                </p>
                <ul className="list-disc pl-6 text-sm">
                  <li>Installed all dependencies</li>
                  <li>Updated configuration section with your API key</li>
                  <li>Have an active internet connection</li>
                </ul>
              </div>
              
              <div className="space-y-2 mt-4">
                <h4 className="font-medium">2. Start the slave</h4>
                <div className="bg-secondary/50 p-4 rounded-md">
                  <pre className="text-xs md:text-sm">node slave.js</pre>
                </div>
              </div>
              
              <Alert className="mt-4">
                <Play className="h-4 w-4" />
                <AlertTitle>Verify Connection</AlertTitle>
                <AlertDescription>
                  After starting, your slave should appear in the Slave Servers list in a few moments.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2 mt-4">
                <h4 className="font-medium">3. Run as a background service (optional)</h4>
                <p className="text-sm text-muted-foreground">
                  For production, you may want to run your slave as a background service.
                  You can use tools like PM2 or create a system service.
                </p>
                <div className="bg-secondary/50 p-4 rounded-md">
                  <pre className="text-xs md:text-sm">npm install -g pm2
pm2 start slave.js --name "viewer-slave"
pm2 save
pm2 startup</pre>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default SetupGuide;

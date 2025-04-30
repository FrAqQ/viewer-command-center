
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, Info } from 'lucide-react';
import { toast } from '@/components/ui/sonner';

const SetupGuide: React.FC = () => {
  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFkeHB4cWRld3FyYnZsc2FqZWVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NzM0MDMsImV4cCI6MjA1MzI0OTQwM30.-wnDf1hMWOow3O1kbcTfC3mw59h-5SsmdFGhp5bKgUE");
    toast.success("API Key copied to clipboard");
  };

  const handleCopyRegistrationCommand = () => {
    navigator.clipboard.writeText(
      "curl -X POST https://qdxpxqdewqrbvlsajeeo.supabase.co/rest/v1/slaves -H \"apikey: YOUR_API_KEY\" -H \"Content-Type: application/json\" -d '{\"name\":\"SLAVE_NAME\",\"hostname\":\"HOST_NAME\",\"ip\":\"IP_ADDRESS\",\"status\":\"online\"}'"
    );
    toast.success("Registration command copied to clipboard");
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText("https://qdxpxqdewqrbvlsajeeo.supabase.co");
    toast.success("Supabase URL copied to clipboard");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="h-5 w-5" />
          Slave Server Setup Guide
        </CardTitle>
        <CardDescription>
          Follow these steps to connect a slave server to your ViewerBot network
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium mb-2">1. Supabase Connection Details</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-center p-2 bg-muted rounded-md">
              <span className="text-sm font-mono">Supabase URL</span>
              <Button variant="ghost" size="sm" onClick={handleCopyUrl}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-center p-2 bg-muted rounded-md">
              <span className="text-sm font-mono">API Key</span>
              <Button variant="ghost" size="sm" onClick={handleCopyApiKey}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">2. Registration Command</h3>
          <div className="bg-muted p-2 rounded-md">
            <pre className="text-xs font-mono overflow-x-auto whitespace-pre-wrap">
              curl -X POST https://qdxpxqdewqrbvlsajeeo.supabase.co/rest/v1/slaves \{"\n"}
              -H "apikey: YOUR_API_KEY" \{"\n"}
              -H "Content-Type: application/json" \{"\n"}
              -d '&#123;"name":"SLAVE_NAME","hostname":"HOST_NAME","ip":"IP_ADDRESS","status":"online"&#125;'
            </pre>
            <div className="flex justify-end mt-2">
              <Button variant="ghost" size="sm" onClick={handleCopyRegistrationCommand}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">3. Updating Status</h3>
          <p className="text-sm text-muted-foreground">
            Your slave server should regularly update its status by sending PATCH requests to the same endpoint:
          </p>
          <pre className="text-xs font-mono mt-2 bg-muted p-2 rounded-md">
            PATCH /rest/v1/slaves?id=eq.YOUR_SLAVE_ID{"\n"}
            &#123;"status":"online","last_seen":"2023-04-30T12:00:00Z","cpu":50,"ram":75,"instances":10&#125;
          </pre>
        </div>
        
        <div>
          <h3 className="font-medium mb-2">4. Listening for Commands</h3>
          <p className="text-sm text-muted-foreground">
            Your slave server should listen to the Supabase realtime channel for commands:
          </p>
          <pre className="text-xs font-mono mt-2 bg-muted p-2 rounded-md">
            {`const commandsChannel = supabase
  .channel('commands-channel')
  .on('postgres_changes', 
    { event: 'INSERT', schema: 'public', table: 'commands', filter: 'target=eq.YOUR_SLAVE_ID' }, 
    handleNewCommand)
  .subscribe()`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default SetupGuide;

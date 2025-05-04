
import React from 'react';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { useAppContext } from '@/context/AppContext';

const Header = () => {
  const { logs } = useAppContext();
  const errorsCount = logs.filter(log => log.level === 'error').length;
  const warningsCount = logs.filter(log => log.level === 'warning').length;
  
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-full items-center">
        <div className="mr-4 flex">
          <div className="hidden md:flex">
            <nav className="flex items-center gap-6 text-sm font-medium">
              <a className="flex items-center gap-2 text-lg font-semibold" href="/">
                <div className="rounded bg-primary px-1.5 py-0.5 text-xs font-bold text-primary-foreground">
                  V2
                </div>
                <span>Viewer Command Center</span>
              </a>
            </nav>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          <div className="hidden md:flex">
            <span className="text-xs text-muted-foreground mr-4">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <Bell className="h-4 w-4" />
                {errorsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-danger text-xs font-bold text-white">
                    {errorsCount}
                  </span>
                )}
                {errorsCount === 0 && warningsCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-status-warning text-xs font-bold text-foreground">
                    {warningsCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {logs.slice(0, 5).map((log) => (
                <DropdownMenuItem key={log.id} className="flex flex-col items-start">
                  <div className="flex items-center gap-2">
                    <span className={`status-dot ${log.level === 'error' ? 'danger' : log.level === 'warning' ? 'warning' : 'info'}`} />
                    <span className="font-medium">{log.source}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.message}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem className="text-center font-medium text-primary">
                <a href="/logs" className="w-full text-center">View All Logs</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;


import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { 
  Menu, 
  Settings, 
  Monitor, 
  PlayCircle, 
  Server, 
  ShieldAlert,
  Globe
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: <Monitor className="h-5 w-5" /> },
  { name: 'Proxies', path: '/proxies', icon: <Globe className="h-5 w-5" /> },
  { name: 'Slaves', path: '/slaves', icon: <Server className="h-5 w-5" /> },
  { name: 'Test Viewer', path: '/test', icon: <PlayCircle className="h-5 w-5" /> },
  { name: 'Commands', path: '/commands', icon: <ShieldAlert className="h-5 w-5" /> },
  { name: 'Settings', path: '/settings', icon: <Settings className="h-5 w-5" /> },
];

const MobileNav = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild className="md:hidden absolute left-4 top-3 z-50">
        <Button variant="outline" size="icon" className="rounded-full">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72">
        <div className="px-2 py-6">
          <h2 className="text-xl font-bold mb-1">Master Panel</h2>
          <p className="text-sm text-muted-foreground mb-6">Viewer Control System</p>
          <ScrollArea className="h-[calc(100vh-10rem)]">
            <div className="flex flex-col space-y-2 py-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    location.pathname === item.path
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-secondary hover:text-accent-foreground"
                  )}
                >
                  {item.icon}
                  <span className="ml-3">{item.name}</span>
                </Link>
              ))}
            </div>
          </ScrollArea>
          <div className="absolute bottom-4 left-4 right-4 border-t pt-4">
            <div className="flex items-center">
              <div className="flex-shrink-0 mr-3">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                  A
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Admin</p>
                <p className="text-xs text-muted-foreground">admin@example.com</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNav;

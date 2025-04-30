
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
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

const Sidebar = () => {
  const location = useLocation();
  
  return (
    <div className="hidden md:block h-screen w-64 border-r bg-card">
      <div className="flex flex-col h-full">
        <div className="p-6">
          <h2 className="text-xl font-bold">Master Panel</h2>
          <p className="text-sm text-muted-foreground">Viewer Control System</p>
        </div>
        <div className="flex-1 px-3 py-2">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
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
          </nav>
        </div>
        <div className="border-t p-4">
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
    </div>
  );
};

export default Sidebar;

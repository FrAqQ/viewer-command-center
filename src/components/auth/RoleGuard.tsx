import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'operator' | 'viewer';
  fallback?: React.ReactNode;
}

const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  requiredRole = 'admin',
  fallback 
}) => {
  const { user, userRoles } = useAppContext();
  
  // If no user is logged in, show the fallback or default message
  if (!user) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>Authentication Required</AlertTitle>
        <AlertDescription>
          You need to be logged in to access this feature.
        </AlertDescription>
      </Alert>
    );
  }
  
  // Check if user has the required role
  const hasRole = userRoles.includes(requiredRole);
  
  if (!hasRole) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You do not have the required permissions to access this feature.
          Required role: {requiredRole}
        </AlertDescription>
      </Alert>
    );
  }
  
  // User has the required role, render children
  return <>{children}</>;
};

export default RoleGuard;

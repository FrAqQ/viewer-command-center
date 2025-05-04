import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SlaveServer } from '@/types';
import { useAppContext } from '@/context/AppContext';

interface SlaveEditDialogProps {
  slave?: SlaveServer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SlaveEditDialog: React.FC<SlaveEditDialogProps> = ({ slave, open, onOpenChange }) => {
  const { updateSlave, addSlave } = useAppContext();
  const [slaveData, setSlaveData] = useState<Partial<SlaveServer>>({
    name: '',
    hostname: '',
    ip: '',
    status: 'offline',
  });
  
  const isEditMode = !!slave;
  
  useEffect(() => {
    if (slave) {
      setSlaveData({
        name: slave.name,
        hostname: slave.hostname,
        ip: slave.ip,
        status: slave.status,
      });
    } else {
      setSlaveData({
        name: '',
        hostname: '',
        ip: '',
        status: 'offline',
      });
    }
  }, [slave]);
  
  const handleSave = () => {
    if (!slaveData.name || !slaveData.hostname || !slaveData.ip) {
      return;
    }
    
    if (isEditMode && slave) {
      updateSlave(slave.id, slaveData);
    } else {
      const newSlave: SlaveServer = {
        id: `slave-${Date.now()}`,
        name: slaveData.name!,
        hostname: slaveData.hostname!,
        ip: slaveData.ip!,
        status: slaveData.status as 'online' | 'offline' | 'error',
        lastSeen: new Date().toISOString(),
        metrics: {
          cpu: 0,
          ram: 0,
          instances: 0
        }
      };
      addSlave(newSlave);
    }
    
    onOpenChange(false);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Slave Server' : 'Add New Slave Server'}</DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? 'Edit the slave server details below.' 
              : 'Enter the details for the new slave server.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Server Name</Label>
            <Input
              id="name"
              placeholder="Slave-01"
              value={slaveData.name || ''}
              onChange={(e) => setSlaveData({ ...slaveData, name: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hostname">Hostname</Label>
              <Input
                id="hostname"
                placeholder="slave-01.example.com"
                value={slaveData.hostname || ''}
                onChange={(e) => setSlaveData({ ...slaveData, hostname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip">IP Address</Label>
              <Input
                id="ip"
                placeholder="192.168.1.100"
                value={slaveData.ip || ''}
                onChange={(e) => setSlaveData({ ...slaveData, ip: e.target.value })}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={slaveData.status}
              onValueChange={(value) => setSlaveData({ ...slaveData, status: value as 'online' | 'offline' | 'error' })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>{isEditMode ? 'Save Changes' : 'Add Server'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SlaveEditDialog;

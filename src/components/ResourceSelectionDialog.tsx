import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export const ResourceSelectionDialog = ({
  isOpen,
  onClose,
  onSave,
  resources,
  selectedIds,
  setSelectedIds,
  title,
  allowMultiple,
}) => {
  const handleSelect = (id) => {
    if (allowMultiple) {
      setSelectedIds(prev =>
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
      );
    } else {
      setSelectedIds([id]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-72">
          <div className="space-y-4">
            {resources.map(resource => (
              <div key={resource.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`resource-${resource.id}`}
                  checked={selectedIds.includes(resource.id)}
                  onCheckedChange={() => handleSelect(resource.id)}
                />
                <label htmlFor={`resource-${resource.id}`}>{resource.name}</label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

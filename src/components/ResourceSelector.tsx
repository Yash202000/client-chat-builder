import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

interface Resource {
  id: number;
  name: string;
  description?: string;
  tool_type?: 'custom' | 'mcp';
}

interface ResourceSelectorProps<T extends Resource> {
  resources: T[];
  selectedIds: number[];
  onSelect: (ids: number[]) => void;
  title: string;
  triggerButtonText: string;
  isLoading: boolean;
  allowMultiple?: boolean;
}

export function ResourceSelector<T extends Resource>({ 
  resources, 
  selectedIds, 
  onSelect, 
  title, 
  triggerButtonText,
  isLoading,
  allowMultiple = true
}: ResourceSelectorProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResources = resources.filter(resource => 
    (resource.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (id: number) => {
    if (allowMultiple) {
      const newSelectedIds = selectedIds.includes(id)
        ? selectedIds.filter(selectedId => selectedId !== id)
        : [...selectedIds, id];
      onSelect(newSelectedIds);
    } else {
      onSelect([id]);
      setIsOpen(false); // Close dialog on single selection
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{triggerButtonText}</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Select one or more {title.toLowerCase()} to associate.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Input 
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
              <p>Loading...</p>
            ) : filteredResources.map(resource => (
              <Card 
                key={resource.id} 
                className={`cursor-pointer transition-all ${
                  selectedIds.includes(resource.id) 
                    ? 'border-blue-600 ring-2 ring-blue-600'
                    : 'border-gray-200'
                }`}
                onClick={() => handleSelect(resource.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">{resource.name}</h3>
                    {resource.tool_type && (
                      <span className="text-xs font-normal bg-secondary text-secondary-foreground py-0.5 px-2 rounded-full">
                        {resource.tool_type === 'mcp' ? 'MCP Connection' : 'Custom'}
                      </span>
                    )}
                  </div>
                  {(resource.description || "") && <p className="text-sm text-gray-500 mt-1">{resource.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

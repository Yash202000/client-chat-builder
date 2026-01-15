import React, { useState, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Plus, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  NODE_CATEGORIES,
  NodeTypeDefinition,
  TRIGGER_NODES,
  CORE_NODES,
  CHAT_NODES
} from '@/lib/nodeTypeDefinitions';

interface AddNodePopoverProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNode: (nodeType: string, nodeData: Record<string, any>) => void;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
}

export const AddNodePopover: React.FC<AddNodePopoverProps> = ({
  isOpen,
  onOpenChange,
  onSelectNode,
  children,
  side = 'bottom',
  align = 'center'
}) => {
  const [search, setSearch] = useState('');

  // Filter nodes based on search
  const filteredCategories = useMemo(() => {
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) {
      return NODE_CATEGORIES;
    }

    const filterNodes = (nodes: NodeTypeDefinition[]) =>
      nodes.filter(node =>
        node.label.toLowerCase().includes(searchLower) ||
        node.type.toLowerCase().includes(searchLower)
      );

    return {
      triggers: { label: 'Triggers', nodes: filterNodes(TRIGGER_NODES) },
      core: { label: 'Core Nodes', nodes: filterNodes(CORE_NODES) },
      chat: { label: 'Chat & Conversation', nodes: filterNodes(CHAT_NODES) },
    };
  }, [search]);

  const handleSelectNode = (node: NodeTypeDefinition) => {
    onSelectNode(node.type, node.defaultData);
    onOpenChange(false);
    setSearch('');
  };

  const hasResults = Object.values(filteredCategories).some(cat => cat.nodes.length > 0);

  return (
    <Popover open={isOpen} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        className="w-72 p-0 rounded-xl shadow-xl border-slate-200 dark:border-slate-700 dark:bg-slate-800"
        side={side}
        align={align}
        sideOffset={8}
      >
        <Command className="rounded-xl">
          <div className="flex items-center border-b border-slate-200 dark:border-slate-700 px-3">
            <Search className="h-4 w-4 text-slate-400 shrink-0" />
            <CommandInput
              placeholder="Search nodes..."
              value={search}
              onValueChange={setSearch}
              className="h-10 border-0 focus:ring-0 text-sm"
            />
          </div>
          <CommandList className="max-h-[300px] overflow-y-auto">
            {!hasResults && (
              <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                No nodes found
              </CommandEmpty>
            )}

            {/* Triggers */}
            {filteredCategories.triggers.nodes.length > 0 && (
              <CommandGroup heading="Triggers" className="px-2 py-1.5">
                {filteredCategories.triggers.nodes.map((node) => {
                  const IconComponent = node.icon;
                  return (
                    <CommandItem
                      key={node.type}
                      value={`${node.type} ${node.label}`}
                      onSelect={() => handleSelectNode(node)}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className={cn("p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700", node.iconColor)}>
                        <IconComponent size={16} className={node.iconColor} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {node.label}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Core Nodes */}
            {filteredCategories.core.nodes.length > 0 && (
              <CommandGroup heading="Core Nodes" className="px-2 py-1.5">
                {filteredCategories.core.nodes.map((node) => {
                  const IconComponent = node.icon;
                  return (
                    <CommandItem
                      key={node.type}
                      value={`${node.type} ${node.label}`}
                      onSelect={() => handleSelectNode(node)}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className={cn("p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700", node.iconColor)}>
                        <IconComponent size={16} className={node.iconColor} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {node.label}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* Chat Nodes */}
            {filteredCategories.chat.nodes.length > 0 && (
              <CommandGroup heading="Chat & Conversation" className="px-2 py-1.5">
                {filteredCategories.chat.nodes.map((node) => {
                  const IconComponent = node.icon;
                  return (
                    <CommandItem
                      key={node.type}
                      value={`${node.type} ${node.label}`}
                      onSelect={() => handleSelectNode(node)}
                      className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                    >
                      <div className={cn("p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700", node.iconColor)}>
                        <IconComponent size={16} className={node.iconColor} />
                      </div>
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                        {node.label}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default AddNodePopover;

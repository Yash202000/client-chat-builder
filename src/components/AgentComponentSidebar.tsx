
import React from 'react';
import { Zap, BrainCircuit, Cloud, Code } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Tool, KnowledgeBase, Agent } from '@/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const DraggableNode = ({ type, label, icon, resourceId, toolType, mcpServerUrl, isDisabled }) => {
  const onDragStart = (event, nodeType, id, label, toolType, mcpServerUrl) => {
    if (isDisabled) {
      event.preventDefault();
      return;
    }
    const data = JSON.stringify({ nodeType, id, label, toolType, mcpServerUrl });
    event.dataTransfer.setData('application/reactflow', data);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`flex flex-col items-center p-4 m-2 border rounded-lg shadow-md bg-white ${isDisabled ? 'cursor-not-allowed bg-gray-200 text-gray-500' : 'cursor-grab hover:shadow-lg transition-shadow'}`}
      onDragStart={(event) => onDragStart(event, type, resourceId, label, toolType, mcpServerUrl)}
      draggable={!isDisabled}
    >
      {icon}
      <span className="mt-2 font-semibold text-sm">{label}</span>
    </div>
  );
};

export const AgentComponentSidebar = ({ agent }: { agent: Agent }) => {
  const { authFetch } = useAuth();

  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({ 
    queryKey: ['tools'], 
    queryFn: async () => {
      const response = await authFetch(`/api/v1/tools/`);
      if (!response.ok) throw new Error('Failed to fetch tools');
      return response.json();
    }
  });

  const { data: knowledgeBases, isLoading: isLoadingKnowledgeBases } = useQuery<KnowledgeBase[]>({ 
    queryKey: ['knowledgeBases'], 
    queryFn: async () => {
      const response = await authFetch(`/api/v1/knowledge-bases/`);
      if (!response.ok) throw new Error('Failed to fetch knowledge bases');
      return response.json();
    }
  });

  const getToolIcon = (toolType) => {
    switch (toolType) {
      case 'mcp':
        return <Cloud className="text-blue-500" size={32} />;
      case 'custom':
        return <Code className="text-green-500" size={32} />;
      default:
        return <Zap className="text-orange-500" size={32} />;
    }
  };

  const attachedToolIds = new Set(agent.tools?.map(t => t.id) || []);
  const attachedKbIds = new Set(agent.knowledge_bases?.map(kb => kb.id) || []);

  return (
    <aside className="w-64 p-4 bg-gray-50 border-r overflow-y-auto">
      <h3 className="text-lg font-bold mb-4">Components</h3>
      <Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
        <AccordionItem value="item-1">
          <AccordionTrigger>Tools</AccordionTrigger>
          <AccordionContent>
            {isLoadingTools ? (
              <p>Loading tools...</p>
            ) : (
              tools?.map(tool => (
                <DraggableNode 
                  key={`tool-${tool.id}`} 
                  type="tools" 
                  label={tool.name} 
                  icon={getToolIcon(tool.tool_type)} 
                  resourceId={tool.id} 
                  toolType={tool.tool_type} 
                  mcpServerUrl={tool.mcp_server_url}
                  isDisabled={attachedToolIds.has(tool.id)}
                />
              ))
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-2">
          <AccordionTrigger>Knowledge Bases</AccordionTrigger>
          <AccordionContent>
            {isLoadingKnowledgeBases ? (
              <p>Loading knowledge bases...</p>
            ) : (
              knowledgeBases?.map(kb => (
                <DraggableNode 
                  key={`kb-${kb.id}`} 
                  type="knowledge" 
                  label={kb.name} 
                  icon={<BrainCircuit className="text-indigo-500" size={32} />} 
                  resourceId={kb.id}
                  isDisabled={attachedKbIds.has(kb.id)}
                />
              ))
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </aside>
  );
};

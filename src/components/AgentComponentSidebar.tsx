
import React from 'react';
import { Zap, BrainCircuit, Cloud, Code } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Tool, KnowledgeBase, Agent } from '@/types';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
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
      className={`flex flex-col items-center p-4 m-2 border rounded-lg shadow-md transition-all ${
        isDisabled
          ? 'cursor-not-allowed bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-slate-600'
          : 'cursor-grab bg-white dark:bg-slate-800 hover:shadow-lg hover:scale-105 border-slate-200 dark:border-slate-600'
      }`}
      onDragStart={(event) => onDragStart(event, type, resourceId, label, toolType, mcpServerUrl)}
      draggable={!isDisabled}
    >
      {icon}
      <span className="mt-2 font-semibold text-sm dark:text-white">{label}</span>
    </div>
  );
};

export const AgentComponentSidebar = ({ agent }: { agent: Agent }) => {
  const { authFetch } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useI18n();

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
    <aside className={`w-64 p-4 bg-white dark:bg-slate-900 ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:border-slate-700 overflow-y-auto`}>
      <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">{t('builder.components')}</h3>
      <Accordion type="multiple" defaultValue={['item-1', 'item-2']}>
        <AccordionItem value="item-1" className="border-slate-200 dark:border-slate-700">
          <AccordionTrigger className="hover:no-underline dark:text-white">{t('builder.tools')}</AccordionTrigger>
          <AccordionContent>
            {isLoadingTools ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
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
        <AccordionItem value="item-2" className="border-slate-200 dark:border-slate-700">
          <AccordionTrigger className="hover:no-underline dark:text-white">{t('builder.knowledgeBases')}</AccordionTrigger>
          <AccordionContent>
            {isLoadingKnowledgeBases ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
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

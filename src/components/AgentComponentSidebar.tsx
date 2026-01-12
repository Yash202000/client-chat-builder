
import React from 'react';
import { Zap, BrainCircuit, Cloud, Code, Shield, PanelLeftClose, PanelLeft, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Tool, KnowledgeBase, Agent, Workflow } from '@/types';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

const DraggableNode = ({ type, label, icon, resourceId, toolType, mcpServerUrl, isDisabled, isCollapsed = false }) => {
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
      className={`flex ${isCollapsed ? 'justify-center p-2' : 'flex-col items-center p-4'} m-2 border rounded-lg shadow-md transition-all ${
        isDisabled
          ? 'cursor-not-allowed bg-gray-200 dark:bg-slate-700 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-slate-600'
          : 'cursor-grab bg-white dark:bg-slate-800 hover:shadow-lg hover:scale-105 border-slate-200 dark:border-slate-600'
      }`}
      onDragStart={(event) => onDragStart(event, type, resourceId, label, toolType, mcpServerUrl)}
      draggable={!isDisabled}
      title={isCollapsed ? label : undefined}
    >
      {icon}
      {!isCollapsed && <span className="mt-2 font-semibold text-sm dark:text-white">{label}</span>}
    </div>
  );
};

interface AgentComponentSidebarProps {
  agent: Agent;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const AgentComponentSidebar = ({ agent, isCollapsed = false, onToggle }: AgentComponentSidebarProps) => {
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

  const { data: workflows, isLoading: isLoadingWorkflows } = useQuery<Workflow[]>({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/workflows/`);
      if (!response.ok) throw new Error('Failed to fetch workflows');
      return response.json();
    }
  });

  const getToolIcon = (toolType) => {
    switch (toolType) {
      case 'mcp':
        return <Cloud className="text-blue-500" size={32} />;
      case 'custom':
        return <Code className="text-green-500" size={32} />;
      case 'builtin':
        return <Shield className="text-purple-500" size={32} />;
      default:
        return <Zap className="text-orange-500" size={32} />;
    }
  };

  const attachedToolIds = new Set(agent.tools?.map(t => t.id) || []);
  const attachedKbIds = new Set(agent.knowledge_bases?.map(kb => kb.id) || []);
  const attachedWorkflowIds = new Set(agent.workflows?.map(w => w.id) || []);

  return (
    <aside className={`${isCollapsed ? 'w-14' : 'w-64'} p-4 bg-white dark:bg-slate-900 ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:border-slate-700 overflow-y-auto transition-all duration-200 ease-in-out`}>
      {/* Header with toggle button */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
        {!isCollapsed && (
          <h3 className="text-lg font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">
            {t('builder.components')}
          </h3>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-7 w-7 flex-shrink-0"
            title={isCollapsed ? t('common.expand', { defaultValue: 'Expand' }) : t('common.collapse', { defaultValue: 'Collapse' })}
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {isCollapsed ? (
        /* Collapsed view - show only icons */
        <div className="space-y-2">
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
                isCollapsed={true}
              />
            ))
          )}
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
                icon={<BrainCircuit className="text-indigo-500" size={24} />}
                resourceId={kb.id}
                isDisabled={attachedKbIds.has(kb.id)}
                isCollapsed={true}
              />
            ))
          )}
          {isLoadingWorkflows ? (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
            </div>
          ) : (
            workflows?.filter(w => w.is_active).map(workflow => (
              <DraggableNode
                key={`workflow-${workflow.id}`}
                type="workflow"
                label={workflow.name}
                icon={<Layers className="text-purple-500" size={24} />}
                resourceId={workflow.id}
                isDisabled={attachedWorkflowIds.has(workflow.id)}
                isCollapsed={true}
              />
            ))
          )}
        </div>
      ) : (
        /* Expanded view - full accordion */
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
        <AccordionItem value="item-3" className="border-slate-200 dark:border-slate-700">
          <AccordionTrigger className="hover:no-underline dark:text-white">
              <span className="flex items-center gap-2">
                {t('builder.workflows', { defaultValue: 'Workflows' })}
                <span className="text-xs text-green-600 dark:text-green-400 font-normal">(Active)</span>
              </span>
            </AccordionTrigger>
          <AccordionContent>
            {isLoadingWorkflows ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
              </div>
            ) : (
              workflows?.filter(w => w.is_active).map(workflow => (
                <DraggableNode
                  key={`workflow-${workflow.id}`}
                  type="workflow"
                  label={workflow.name}
                  icon={<Layers className="text-purple-500" size={32} />}
                  resourceId={workflow.id}
                  isDisabled={attachedWorkflowIds.has(workflow.id)}
                />
              ))
            )}
          </AccordionContent>
        </AccordionItem>
        </Accordion>
      )}
    </aside>
  );
};

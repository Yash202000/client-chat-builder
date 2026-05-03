
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
      className={`flex items-center overflow-hidden ${isCollapsed ? 'justify-center p-2' : 'gap-2 px-3 py-2'} mx-2 my-1 rounded-lg transition-all duration-200 ${
        isDisabled
          ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500 opacity-60'
          : 'cursor-grab bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:from-purple-900/20 shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 active:scale-95'
      }`}
      onDragStart={(event) => onDragStart(event, type, resourceId, label, toolType, mcpServerUrl)}
      draggable={!isDisabled}
      title={label}
    >
      <div className="flex-shrink-0">{icon}</div>
      {!isCollapsed && <span className="font-medium text-xs text-slate-700 dark:text-slate-200 leading-tight min-w-0 break-words">{label}</span>}
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
        return <Cloud className="text-blue-500" size={16} />;
      case 'custom':
        return <Code className="text-green-500" size={16} />;
      case 'builtin':
        return <Shield className="text-purple-500" size={16} />;
      default:
        return <Zap className="text-orange-500" size={16} />;
    }
  };

  const attachedToolIds = new Set(agent.tools?.map(t => t.id) || []);
  const attachedKbIds = new Set(agent.knowledge_bases?.map(kb => kb.id) || []);
  const attachedWorkflowIds = new Set(agent.workflows?.map(w => w.id) || []);

  return (
    <aside className={`${isCollapsed ? 'w-0 overflow-hidden md:w-12' : 'overflow-y-auto fixed md:relative inset-y-0 left-0 z-50 md:inset-auto w-[280px] md:w-[232px] shadow-2xl md:shadow-none'} bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-900 ${isRTL ? 'border-l' : 'border-r'} border-slate-200 dark:border-slate-700 transition-all duration-300 ease-in-out scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700`}>
      {/* Header with toggle button */}
      <div className={`sticky top-0 z-10 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} p-4 bg-gradient-to-b from-slate-50 via-slate-50 to-transparent dark:from-slate-900 dark:via-slate-900`}>
        {!isCollapsed && (
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">
              {t('builder.components')}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Drag to canvas</p>
          </div>
        )}
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="h-8 w-8 flex-shrink-0 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg"
            title={isCollapsed ? t('common.expand', { defaultValue: 'Expand' }) : t('common.collapse', { defaultValue: 'Collapse' })}
          >
            {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <div className="px-2 pb-4">

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
                icon={<BrainCircuit className="text-indigo-500" size={16} />}
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
                icon={<Layers className="text-purple-500" size={16} />}
                resourceId={workflow.id}
                isDisabled={attachedWorkflowIds.has(workflow.id)}
                isCollapsed={true}
              />
            ))
          )}
        </div>
      ) : (
        /* Expanded view - full accordion */
        <Accordion type="multiple" defaultValue={['item-1', 'item-2', 'item-3']} className="space-y-2">
        <AccordionItem value="item-1" className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50">
          <AccordionTrigger className="hover:no-underline px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">{t('builder.tools')}</AccordionTrigger>
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
        <AccordionItem value="item-2" className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50">
          <AccordionTrigger className="hover:no-underline px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">{t('builder.knowledgeBases')}</AccordionTrigger>
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
                  icon={<BrainCircuit className="text-indigo-500" size={16} />}
                  resourceId={kb.id}
                  isDisabled={attachedKbIds.has(kb.id)}
                />
              ))
            )}
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="item-3" className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/50">
          <AccordionTrigger className="hover:no-underline px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800">
              <span className="flex items-center gap-2">
                {t('builder.workflows', { defaultValue: 'Workflows' })}
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">Active</span>
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
                  icon={<Layers className="text-purple-500" size={16} />}
                  resourceId={workflow.id}
                  isDisabled={attachedWorkflowIds.has(workflow.id)}
                />
              ))
            )}
          </AccordionContent>
        </AccordionItem>
        </Accordion>
      )}
      </div>
    </aside>
  );
};

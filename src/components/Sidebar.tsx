import React, { useState } from 'react';
import {
  Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code,
  SquareStack, Globe, ClipboardList, Wrench, ChevronDown, ChevronRight,
  Target, Notebook, CheckCircle, Database, Tag, UserPlus, Activity,
  Zap, Wifi, Phone, Send, Instagram, PanelLeftClose, PanelLeft
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useI18n } from '@/hooks/useI18n';
import { Button } from '@/components/ui/button';

const DraggableNode = ({ type, label, icon, nodeData, isRTL, isCollapsed = false }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'p-3'} mb-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-750 hover:shadow-md transition-all text-slate-800 dark:text-slate-200`}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
      title={isCollapsed ? label : undefined}
    >
      <div className="text-slate-600 dark:text-slate-400">{icon}</div>
      {!isCollapsed && (
        <span className={`${isRTL ? 'mr-3' : 'ml-3'} text-sm font-medium`}>{label}</span>
      )}
    </div>
  );
};

const AccordionSection = ({ title, children, isRTL, isCollapsed = false }) => {
    const [isOpen, setIsOpen] = useState(true);

    // When sidebar is collapsed, just show the children (icons only) without accordion header
    if (isCollapsed) {
        return <div className="py-2 border-t border-slate-200 dark:border-slate-700 mt-2 pt-2">{children}</div>;
    }

    return (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center justify-between py-2 cursor-pointer font-bold text-base text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors `}
            >
                {title}
                <div className="text-slate-600 dark:text-slate-400">
                    {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                </div>
            </div>
            {isOpen && <div className="py-2">{children}</div>}
        </div>
    );
}


const Sidebar = () => {
  const { t, isRTL } = useI18n();
  const [prebuiltTools, setPrebuiltTools] = useState([]);
  const [customTools, setCustomTools] = useState([]);
  const [builtinTools, setBuiltinTools] = useState([]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { authFetch } = useAuth();

  useEffect(() => {
    const fetchTools = async (toolType, setTools) => {
      try {
        const response = await authFetch(`/api/v1/tools/?tool_type=${toolType}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${toolType} tools`);
        }
        const data = await response.json();
        setTools(data);
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchTools('pre_built', setPrebuiltTools);
    fetchTools('custom', setCustomTools);
    fetchTools('builtin', setBuiltinTools);
  }, [authFetch]);

  return (
    <aside
      className={`${isCollapsed ? 'w-14' : 'w-64'} border-r border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 overflow-y-auto transition-all duration-200 ease-in-out`}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      {/* Sidebar Header with Toggle Button */}
      <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4`}>
        {!isCollapsed && (
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {t("workflows.editor.sidebar.title") || "Nodes"}
          </span>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-7 w-7"
          title={isCollapsed ? t("workflows.editor.sidebar.expand") || "Expand sidebar" : t("workflows.editor.sidebar.collapse") || "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          <span className="sr-only">{isCollapsed ? "Expand" : "Collapse"} Sidebar</span>
        </Button>
      </div>

      <AccordionSection title={t("workflows.editor.sidebar.triggers")} isRTL={isRTL} isCollapsed={isCollapsed}>
        <DraggableNode type="trigger_websocket" label={t("workflows.editor.sidebar.nodes.websocket")} icon={<Wifi size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_whatsapp" label={t("workflows.editor.sidebar.nodes.whatsapp")} icon={<Phone size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_telegram" label={t("workflows.editor.sidebar.nodes.telegram")} icon={<Send size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_instagram" label={t("workflows.editor.sidebar.nodes.instagram")} icon={<Instagram size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
      </AccordionSection>

      <AccordionSection title={t("workflows.editor.sidebar.coreNodes")} isRTL={isRTL} isCollapsed={isCollapsed}>
        <DraggableNode type="llm" label={t("workflows.editor.sidebar.nodes.llmPrompt")} icon={<Bot size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="listen" label={t("workflows.editor.sidebar.nodes.listenForInput")} icon={<Ear size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="prompt" label={t("workflows.editor.sidebar.nodes.promptForInput")} icon={<HelpCircle size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="form" label={t("workflows.editor.sidebar.nodes.form")} icon={<ClipboardList size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="condition" label={t("workflows.editor.sidebar.nodes.condition")} icon={<GitBranch size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="knowledge" label={t("workflows.editor.sidebar.nodes.knowledgeSearch")} icon={<BookOpen size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="code" label={t("workflows.editor.sidebar.nodes.code")} icon={<Code size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="data_manipulation" label={t("workflows.editor.sidebar.nodes.dataManipulation")} icon={<SquareStack size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="http_request" label={t("workflows.editor.sidebar.nodes.httpRequest")} icon={<Globe size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="extract_entities" label="Extract Entities" icon={<Target size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="response" label={t("workflows.editor.sidebar.nodes.output")} icon={<MessageSquare size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
      </AccordionSection>

      <AccordionSection title={t("workflows.editor.sidebar.chatConversation")} isRTL={isRTL} isCollapsed={isCollapsed}>
        <DraggableNode type="intent_router" label={t("workflows.editor.sidebar.nodes.intentRouter")} icon={<Target size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="question_classifier" label={t("workflows.editor.sidebar.nodes.questionClassifier")} icon={<HelpCircle size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="entity_collector" label={t("workflows.editor.sidebar.nodes.collectEntities")} icon={<Notebook size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="check_entity" label={t("workflows.editor.sidebar.nodes.checkEntity")} icon={<CheckCircle size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="update_context" label={t("workflows.editor.sidebar.nodes.updateContext")} icon={<Database size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="tag_conversation" label={t("workflows.editor.sidebar.nodes.tagConversation")} icon={<Tag size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="assign_to_agent" label={t("workflows.editor.sidebar.nodes.assignToAgent")} icon={<UserPlus size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="set_status" label={t("workflows.editor.sidebar.nodes.setStatus")} icon={<Activity size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
      </AccordionSection>

      {builtinTools.length > 0 && (
        <AccordionSection title={t("workflows.editor.sidebar.builtinTools")} isRTL={isRTL} isCollapsed={isCollapsed}>
          {builtinTools.map(tool => (
            <DraggableNode
              key={tool.id}
              type="tool"
              label={tool.name}
              icon={<Zap size={20} />}
              nodeData={{ tool_id: tool.id, tool_name: tool.name, parameters: tool.parameters }}
              isRTL={isRTL}
              isCollapsed={isCollapsed}
            />
          ))}
        </AccordionSection>
      )}

      {prebuiltTools.length > 0 && (
        <AccordionSection title={t("workflows.editor.sidebar.prebuiltTools")} isRTL={isRTL} isCollapsed={isCollapsed}>
          {prebuiltTools.map(tool => (
            <DraggableNode
              key={tool.id}
              type="tool"
              label={tool.name}
              icon={<Cog size={20} />}
              nodeData={{ tool_id: tool.id, tool_name: tool.name, parameters: tool.parameters }}
              isRTL={isRTL}
              isCollapsed={isCollapsed}
            />
          ))}
        </AccordionSection>
      )}

      {customTools.length > 0 && (
        <AccordionSection title={t("workflows.editor.sidebar.customTools")} isRTL={isRTL} isCollapsed={isCollapsed}>
          {customTools.map(tool => (
            <DraggableNode
              key={tool.id}
              type="tool"
              label={tool.name}
              icon={<Wrench size={20} />}
              nodeData={{ tool_id: tool.id, tool_name: tool.name, parameters: tool.parameters }}
              isRTL={isRTL}
              isCollapsed={isCollapsed}
            />
          ))}
        </AccordionSection>
      )}
    </aside>
  );
};

export default Sidebar;

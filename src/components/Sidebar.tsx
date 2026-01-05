import React, { useState } from 'react';
import {
  Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code,
  SquareStack, Globe, ClipboardList, Wrench, ChevronDown, ChevronRight,
  Target, Notebook, CheckCircle, Database, Tag, UserPlus, Activity,
  Zap, Wifi, Phone, Send, Instagram, PanelLeftClose, PanelLeft, Layers,
  Repeat, RefreshCw, PhoneCall, Server, PlayCircle
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
      className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'p-3'} mb-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 cursor-grab hover:scale-105 hover:shadow-lg transition-all duration-150 text-slate-800 dark:text-slate-200`}
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
        <DraggableNode type="start" label={t("workflows.editor.sidebar.nodes.start") || "Start"} icon={<PlayCircle size={20} className="text-emerald-500" />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_websocket" label={t("workflows.editor.sidebar.nodes.websocket")} icon={<Wifi size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_whatsapp" label={t("workflows.editor.sidebar.nodes.whatsapp")} icon={<svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_telegram" label={t("workflows.editor.sidebar.nodes.telegram")} icon={<svg className="h-5 w-5 text-sky-500" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_instagram" label={t("workflows.editor.sidebar.nodes.instagram")} icon={<Instagram size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_twilio_voice" label={t("workflows.editor.sidebar.nodes.twilioVoice") || "Twilio Voice"} icon={<svg className="h-5 w-5 text-red-500" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.381 0 0 5.381 0 12s5.381 12 12 12 12-5.381 12-12S18.619 0 12 0zm0 20.4c-4.636 0-8.4-3.764-8.4-8.4S7.364 3.6 12 3.6s8.4 3.764 8.4 8.4-3.764 8.4-8.4 8.4zm3.6-8.4c0 1.988-1.612 3.6-3.6 3.6S8.4 13.988 8.4 12 10.012 8.4 12 8.4s3.6 1.612 3.6 3.6z"/></svg>} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="trigger_freeswitch" label={t("workflows.editor.sidebar.nodes.freeswitch") || "FreeSWITCH"} icon={<svg className="h-5 w-5 text-purple-500" viewBox="0 0 24 24" fill="currentColor"><path d="M20 15.5c-1.25 0-2.45-.2-3.57-.57a1.02 1.02 0 0 0-1.02.24l-2.2 2.2a15.045 15.045 0 0 1-6.59-6.59l2.2-2.21a.96.96 0 0 0 .25-1A11.36 11.36 0 0 1 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1zM19 12h2a9 9 0 0 0-9-9v2c3.87 0 7 3.13 7 7zm-4 0h2c0-2.76-2.24-5-5-5v2c1.66 0 3 1.34 3 3z"/></svg>} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
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
        <DraggableNode type="subworkflow" label={t("workflows.editor.sidebar.nodes.subworkflow") || "Subworkflow"} icon={<Layers size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="foreach_loop" label={t("workflows.editor.sidebar.nodes.forEachLoop") || "For Each Loop"} icon={<Repeat size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="while_loop" label={t("workflows.editor.sidebar.nodes.whileLoop") || "While Loop"} icon={<RefreshCw size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="update_context" label={t("workflows.editor.sidebar.nodes.updateContext")} icon={<Database size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="response" label={t("workflows.editor.sidebar.nodes.output")} icon={<MessageSquare size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="question_classifier" label={t("workflows.editor.sidebar.nodes.questionClassifier")} icon={<HelpCircle size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
      </AccordionSection>

      <AccordionSection title={t("workflows.editor.sidebar.chatConversation")} isRTL={isRTL} isCollapsed={isCollapsed}>
        <DraggableNode type="intent_router" label={t("workflows.editor.sidebar.nodes.intentRouter")} icon={<Target size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="entity_collector" label={t("workflows.editor.sidebar.nodes.collectEntities")} icon={<Notebook size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
        <DraggableNode type="check_entity" label={t("workflows.editor.sidebar.nodes.checkEntity")} icon={<CheckCircle size={20} />} nodeData={{}} isRTL={isRTL} isCollapsed={isCollapsed} />
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

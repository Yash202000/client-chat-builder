import React, { useState } from 'react';
import {
  Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code,
  SquareStack, Globe, ClipboardList, Wrench, ChevronDown, ChevronRight,
  Target, Notebook, CheckCircle, Database, Tag, UserPlus, Activity,
  Zap, Wifi, Phone, Send, Instagram
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

const DraggableNode = ({ type, label, icon, nodeData }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-data', JSON.stringify(nodeData));
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      className="flex items-center p-3 mb-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 cursor-grab hover:bg-slate-50 dark:hover:bg-slate-750 hover:shadow-md transition-all text-slate-800 dark:text-slate-200"
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      <div className="text-slate-600 dark:text-slate-400">{icon}</div>
      <span className="ml-3 text-sm font-medium">{label}</span>
    </div>
  );
};

const AccordionSection = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
            <div
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between py-2 cursor-pointer font-bold text-base text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
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
  const [prebuiltTools, setPrebuiltTools] = useState([]);
  const [customTools, setCustomTools] = useState([]);
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
  }, [authFetch]);

  return (
    <aside
      className="w-64 border-r border-slate-200 dark:border-slate-700 p-4 bg-slate-50 dark:bg-slate-900 overflow-y-auto"
    >
      <AccordionSection title="Triggers">
        <DraggableNode type="trigger_websocket" label="WebSocket" icon={<Wifi size={20} />} nodeData={{}} />
        <DraggableNode type="trigger_whatsapp" label="WhatsApp" icon={<Phone size={20} />} nodeData={{}} />
        <DraggableNode type="trigger_telegram" label="Telegram" icon={<Send size={20} />} nodeData={{}} />
        <DraggableNode type="trigger_instagram" label="Instagram" icon={<Instagram size={20} />} nodeData={{}} />
      </AccordionSection>

      <AccordionSection title="Core Nodes">
        <DraggableNode type="llm" label="LLM Prompt" icon={<Bot size={20} />} nodeData={{}} />
        <DraggableNode type="listen" label="Listen for Input" icon={<Ear size={20} />} nodeData={{}} />
        <DraggableNode type="prompt" label="Prompt for Input" icon={<HelpCircle size={20} />} nodeData={{}} />
        <DraggableNode type="form" label="Form" icon={<ClipboardList size={20} />} nodeData={{}} />
        <DraggableNode type="condition" label="Condition" icon={<GitBranch size={20} />} nodeData={{}} />
        <DraggableNode type="knowledge" label="Knowledge Search" icon={<BookOpen size={20} />} nodeData={{}} />
        <DraggableNode type="code" label="Code" icon={<Code size={20} />} nodeData={{}} />
        <DraggableNode type="data_manipulation" label="Data Manipulation" icon={<SquareStack size={20} />} nodeData={{}} />
        <DraggableNode type="http_request" label="HTTP Request" icon={<Globe size={20} />} nodeData={{}} />
        <DraggableNode type="output" label="Output" icon={<MessageSquare size={20} />} nodeData={{}} />
      </AccordionSection>

      <AccordionSection title="Chat & Conversation">
        <DraggableNode type="intent_router" label="Intent Router" icon={<Target size={20} />} nodeData={{}} />
        <DraggableNode type="entity_collector" label="Collect Entities" icon={<Notebook size={20} />} nodeData={{}} />
        <DraggableNode type="check_entity" label="Check Entity" icon={<CheckCircle size={20} />} nodeData={{}} />
        <DraggableNode type="update_context" label="Update Context" icon={<Database size={20} />} nodeData={{}} />
        <DraggableNode type="tag_conversation" label="Tag Conversation" icon={<Tag size={20} />} nodeData={{}} />
        <DraggableNode type="assign_to_agent" label="Assign to Agent" icon={<UserPlus size={20} />} nodeData={{}} />
        <DraggableNode type="set_status" label="Set Status" icon={<Activity size={20} />} nodeData={{}} />
      </AccordionSection>

      {prebuiltTools.length > 0 && (
        <AccordionSection title="Pre-built Tools">
          {prebuiltTools.map(tool => (
            <DraggableNode 
              key={tool.id}
              type="tool" 
              label={tool.name} 
              icon={<Cog size={20} />} 
              nodeData={{ tool_id: tool.id, name: tool.name, parameters: tool.parameters }}
            />
          ))}
        </AccordionSection>
      )}

      {customTools.length > 0 && (
        <AccordionSection title="Custom Tools">
          {customTools.map(tool => (
            <DraggableNode 
              key={tool.id}
              type="tool" 
              label={tool.name} 
              icon={<Wrench size={20} />} 
              nodeData={{ tool_id: tool.id, name: tool.name, parameters: tool.parameters }}
            />
          ))}
        </AccordionSection>
      )}
    </aside>
  );
};

export default Sidebar;

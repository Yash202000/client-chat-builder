import React, { useState } from 'react';
import { Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code, SquareStack, Globe, ClipboardList, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
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
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
        marginBottom: '10px',
        border: '1px solid #ddd',
        borderRadius: '5px',
        background: '#fff',
        cursor: 'grab',
      }}
      onDragStart={(event) => onDragStart(event, type)}
      draggable
    >
      {icon}
      <span style={{ marginLeft: '10px' }}>{label}</span>
    </div>
  );
};

const AccordionSection = ({ title, children }) => {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div style={{ marginTop: '10px', borderTop: '1px solid #eee' }}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    padding: '10px 0', 
                    cursor: 'pointer',
                    fontWeight: 'bold', 
                    fontSize: '16px' 
                }}
            >
                {title}
                {isOpen ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
            </div>
            {isOpen && <div style={{padding: '5px 0'}}>{children}</div>}
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
      style={{
        borderRight: '1px solid #eee',
        padding: '15px 10px',
        fontSize: '14px',
        background: '#fcfcfc',
        width: '250px',
        overflowY: 'auto'
      }}
    >
      <AccordionSection title="Node Library">
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

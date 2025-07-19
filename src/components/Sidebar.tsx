import React from 'react';
import { Bot, Cog, GitBranch, MessageSquare } from 'lucide-react';

const DraggableNode = ({ type, label, icon }) => {
  const onDragStart = (event, nodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
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

const Sidebar = () => {
  return (
    <aside
      style={{
        borderRight: '1px solid #eee',
        padding: '15px 10px',
        fontSize: '14px',
        background: '#fcfcfc',
        width: '250px',
      }}
    >
      <div style={{ marginBottom: '20px', fontWeight: 'bold', fontSize: '16px' }}>
        Node Library
      </div>
      <DraggableNode type="llm" label="LLM Prompt" icon={<Bot size={20} />} />
      <DraggableNode type="tool" label="Tool" icon={<Cog size={20} />} />
      <DraggableNode type="condition" label="Condition" icon={<GitBranch size={20} />} />
      <DraggableNode type="output" label="Output" icon={<MessageSquare size={20} />} />
    </aside>
  );
};

export default Sidebar;
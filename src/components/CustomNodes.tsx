
import React from 'react';
import { Handle, Position } from 'reactflow';
import { Zap, Cog, GitBranch, MessageSquare, Bot, Play } from 'lucide-react';

const nodeWrapperStyle = {
  background: '#fff',
  border: '1px solid #ddd',
  borderRadius: '6px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  width: '200px',
  fontFamily: 'sans-serif',
  fontSize: '11px',
};

const nodeHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  padding: '8px 12px',
  borderBottom: '1px solid #eee',
  fontWeight: 'bold',
};

const nodeContentStyle = {
  padding: '12px',
  color: '#333',
};

const iconStyle = { marginRight: '8px', color: '#fff' };

const NodeIcon = ({ type, color }) => {
  const icons = {
    llm: <Bot size={16} style={iconStyle} />,
    tool: <Cog size={16} style={iconStyle} />,
    condition: <GitBranch size={16} style={iconStyle} />,
    output: <MessageSquare size={16} style={iconStyle} />,
    start: <Play size={16} style={iconStyle} />,
    default: <Zap size={16} style={iconStyle} />,
  };
  return <div style={{ background: color, padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>{icons[type] || icons.default}</div>;
};

// Modified to not have a generic top handle if it's a tool or start node
const CustomNode = ({ data, type, children }) => {
  return (
    <div style={nodeWrapperStyle}>
      {type !== 'tool' && type !== 'start' && <Handle type="target" position={Position.Top} style={{ background: '#555', width: '8px', height: '8px' }} />}
      <div style={{ ...nodeHeaderStyle, background: data.color || '#3B82F6', color: '#fff' }}>
        <NodeIcon type={type} color={data.color || '#3B82F6'} />
        {data.label || `${type.charAt(0).toUpperCase() + type.slice(1)} Node`}
      </div>
      <div style={nodeContentStyle}>{children}</div>
      <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555', width: '8px', height: '8px' }} />
    </div>
  );
};

export const StartNode = ({ data }) => (
  <div style={nodeWrapperStyle}>
    <div style={{ ...nodeHeaderStyle, background: '#4CAF50', color: '#fff' }}>
      <NodeIcon type="start" color="#4CAF50" />
      {data.label || 'Start'}
    </div>
    <div style={nodeContentStyle}>
      Workflow Entry Point
    </div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555', width: '8px', height: '8px' }} />
  </div>
);

export const LlmNode = ({ data }) => (
  <div style={nodeWrapperStyle}>
    <div style={{ ...nodeHeaderStyle, background: '#8B5CF6', color: '#fff' }}>
      <NodeIcon type="llm" color="#8B5CF6" />
      {data.label || 'LLM Node'}
    </div>
    <div style={nodeContentStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span>Model: {data.model || 'Not set'}</span>
        <Handle type="target" position={Position.Left} id="model" style={{ background: '#3B82F6', top: '30%', width: '8px', height: '8px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Prompt: {data.prompt ? `${data.prompt.substring(0, 20)}...` : 'Not set'}</span>
        <Handle type="target" position={Position.Left} id="prompt" style={{ background: '#3B82F6', top: '70%', width: '8px', height: '8px' }} />
      </div>
    </div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555', width: '8px', height: '8px' }} />
  </div>
);

// Renders dynamic handles for each parameter
export const ToolNode = ({ data }) => {
  const paramCount = data.toolParameters ? Object.keys(data.toolParameters).length : 0;
  return (
    <div style={nodeWrapperStyle}>
        <div style={{ ...nodeHeaderStyle, background: '#10B981', color: '#fff' }}>
            <NodeIcon type='tool' color='#10B981' />
            {data.label || 'Tool Node'}
        </div>
        <div style={nodeContentStyle}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>{data.tool || 'No tool selected'}</div>
            {data.toolParameters && Object.entries(data.toolParameters).map(([paramName, param], index) => (
                <div key={paramName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span>{param.description || paramName}</span>
                    <Handle 
                        type="target" 
                        position={Position.Left} 
                        id={paramName} 
                        style={{ background: '#3B82F6', top: `${(100 / (paramCount + 1)) * (index + 1)}%`, width: '8px', height: '8px' }}
                    />
                </div>
            ))}
        </div>
        <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555', width: '8px', height: '8px' }} />
    </div>
  );
};

export const ConditionNode = ({ data }) => (
  <CustomNode data={{ ...data, color: '#F59E0B' }} type="condition">
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>If condition is true</span>
        <Handle type="source" position={Position.Right} id="true" style={{ background: '#22C55E', top: '45%', width: '10px', height: '10px' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>If condition is false</span>
        <Handle type="source" position={Position.Right} id="false" style={{ background: '#EF4444', top: '75%', width: '10px', height: '10px' }} />
      </div>
    </div>
  </CustomNode>
);

export const OutputNode = ({ data }) => (
  <CustomNode data={{ ...data, color: '#6B7280' }} type="output">
    <div>{data.outputVar || 'Workflow ends here.'}</div>
  </CustomNode>
);

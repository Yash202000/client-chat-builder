import React, { useContext } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Zap, BrainCircuit, Cloud, Code, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentBuilderContext } from './AgentBuilder';

const nodeWrapperStyle = "p-4 border-2 rounded-xl shadow-lg bg-white";
const nodeHeaderStyle = "flex items-center gap-2 font-bold text-lg";

export const AgentNode = ({ data }) => {
  return (
    <div className={`${nodeWrapperStyle} border-blue-600`}>
      <div className={nodeHeaderStyle}>
        <Bot className="text-blue-600" />
        <span>{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

const getToolIcon = (toolType) => {
  switch (toolType) {
    case 'mcp':
      return <Cloud className="text-blue-500" />;
    case 'custom':
      return <Code className="text-green-500" />;
    case 'mcp_sub_tool':
        return <Zap className="text-blue-400" />;
    default:
      return <Zap className="text-orange-500" />;
  }
};

const getBorderColor = (toolType) => {
  switch (toolType) {
      case 'mcp':
          return 'border-blue-500';
      case 'custom':
          return 'border-green-500';
      case 'mcp_sub_tool':
            return 'border-blue-400';
      default:
          return 'border-orange-500';
  }
}

export const ToolsNode = ({ data }) => {
  const { handleInspect } = useContext(AgentBuilderContext);
  const isParent = data.tool_type === 'mcp';
  const style = isParent ? { width: 250, minHeight: 70, position: 'relative' } : {};

  return (
    <div className={`${nodeWrapperStyle} ${getBorderColor(data.tool_type)}`} style={style}>
      <div className={nodeHeaderStyle}>
        {getToolIcon(data.tool_type)}
        <span>{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};

export const KnowledgeNode = ({ data }) => {
  return (
    <div className={`${nodeWrapperStyle} border-indigo-500`}>
      <div className={nodeHeaderStyle}>
        <BrainCircuit className="text-indigo-500" />
        <span>{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} />
    </div>
  );
};

export const McpSubToolNode = ({ data }) => {
    return (
        <div className={`${nodeWrapperStyle} border-cyan-500`}>
            <div className={nodeHeaderStyle}>
                <Zap className="text-cyan-500" />
                <span className="text-sm font-medium truncate">{data.label}</span>
            </div>
            <Handle type="target" position={Position.Left} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
};

export const ChatMessageNode = ({ data }) => {
  return (
    <div className={`${nodeWrapperStyle} border-green-500`}>
      <div className={nodeHeaderStyle}>
        <MessageSquare className="text-green-500" />
        <span>{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
import React, { useContext } from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Zap, BrainCircuit, Cloud, Code, X, MessageSquare, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AgentBuilderContext } from './AgentBuilder';

const nodeWrapperStyle = "p-4 border-2 rounded-xl shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 transition-all hover:shadow-xl";
const nodeHeaderStyle = "flex items-center gap-2 font-bold text-lg dark:text-white";

export const AgentNode = ({ data }) => {
  return (
    <div className={`${nodeWrapperStyle} border-green-600 dark:border-green-500 ring-2 ring-green-100 dark:ring-green-900/50`}>
      <div className={nodeHeaderStyle}>
        <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
          <Bot className="text-white" size={20} />
        </div>
        <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent dark:from-green-400 dark:to-emerald-400">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-green-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-green-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
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

  const getHandleColor = (toolType) => {
    switch (toolType) {
      case 'mcp': return '!bg-blue-500';
      case 'custom': return '!bg-green-500';
      default: return '!bg-orange-500';
    }
  };

  return (
    <div className={`${nodeWrapperStyle} ${getBorderColor(data.tool_type)} dark:border-opacity-80`} style={style}>
      <div className={nodeHeaderStyle}>
        <div className="p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
          {getToolIcon(data.tool_type)}
        </div>
        <span className="text-sm">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} className={`${getHandleColor(data.tool_type)} !w-3 !h-3 !border-2 !border-white dark:!border-slate-900`} />
      <Handle type="source" position={Position.Bottom} className={`${getHandleColor(data.tool_type)} !w-3 !h-3 !border-2 !border-white dark:!border-slate-900`} />
    </div>
  );
};

export const KnowledgeNode = ({ data }) => {
  return (
    <div className={`${nodeWrapperStyle} border-indigo-500 dark:border-indigo-400`}>
      <div className={nodeHeaderStyle}>
        <div className="p-1.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-sm">
          <BrainCircuit className="text-white" size={18} />
        </div>
        <span className="text-sm">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
    </div>
  );
};

export const WorkflowNode = ({ data }) => {
  return (
    <div className={`${nodeWrapperStyle} border-purple-500 dark:border-purple-400`}>
      <div className={nodeHeaderStyle}>
        <div className="p-1.5 bg-gradient-to-br from-purple-500 to-violet-600 rounded-lg shadow-sm">
          <Layers className="text-white" size={18} />
        </div>
        <span className="text-sm">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-purple-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
    </div>
  );
};

export const McpSubToolNode = ({ data }) => {
    return (
        <div className={`${nodeWrapperStyle} border-cyan-500 dark:border-cyan-400`}>
            <div className={`${nodeHeaderStyle} text-base`}>
                <div className="p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-sm">
                  <Zap className="text-white" size={16} />
                </div>
                <span className="text-sm font-medium truncate">{data.label}</span>
            </div>
            <Handle type="target" position={Position.Left} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
            <Handle type="source" position={Position.Right} className="!bg-cyan-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
        </div>
    );
};

export const ChatMessageNode = ({ data }) => {
  return (
    <div className={`${nodeWrapperStyle} border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-100 dark:ring-emerald-900/50`}>
      <div className={nodeHeaderStyle}>
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg shadow-sm">
          <MessageSquare className="text-white" size={18} />
        </div>
        <span className="text-sm">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Top} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-emerald-500 !w-3 !h-3 !border-2 !border-white dark:!border-slate-900" />
    </div>
  );
};
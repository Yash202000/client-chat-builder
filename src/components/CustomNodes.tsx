
import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code,
  SquareStack, Globe, ClipboardList, Target, Notebook, CheckCircle,
  Database, Tag, UserPlus, Activity, Zap, Phone, Send, Instagram, Wifi, Layers,
  Repeat, RefreshCw, PhoneCall, Server, ArrowRightLeft
} from 'lucide-react';
import { AddNodeButton } from './workflow/AddNodeButton';

export const LlmNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-blue-200/80 dark:border-blue-700/60 rounded-2xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-950/30 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-blue-400 !to-indigo-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/30">
          <Bot size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        LLM Prompt
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

export const ToolNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-emerald-200/80 dark:border-emerald-700/60 rounded-2xl bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-emerald-950/30 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-emerald-400 !to-green-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-500/30">
          <Cog size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Tool Execution
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

// Color palette for multi-condition handles
const CONDITION_COLORS = [
  { bg: '!bg-green-500 dark:!bg-green-400', text: 'text-green-600' },   // 0 - if
  { bg: '!bg-blue-500 dark:!bg-blue-400', text: 'text-blue-600' },     // 1 - else if
  { bg: '!bg-purple-500 dark:!bg-purple-400', text: 'text-purple-600' }, // 2
  { bg: '!bg-orange-500 dark:!bg-orange-400', text: 'text-orange-600' }, // 3
  { bg: '!bg-cyan-500 dark:!bg-cyan-400', text: 'text-cyan-600' },     // 4
  { bg: '!bg-pink-500 dark:!bg-pink-400', text: 'text-pink-600' },     // 5
];

export const ConditionNode = ({ id, data }) => {
  const conditions = data.conditions || [];
  const isMultiCondition = conditions.length > 0;
  const totalHandles = isMultiCondition ? conditions.length + 1 : 2; // +1 for else, or 2 for true/false

  // Calculate handle positions
  const getHandlePosition = (index: number) => {
    const spacing = 100 / (totalHandles + 1);
    return `${spacing * (index + 1)}%`;
  };

  return (
    <div className="relative group">
      <div className={`px-4 py-3 border border-amber-200/80 dark:border-amber-700/60 rounded-2xl bg-gradient-to-br from-white to-amber-50 dark:from-slate-800 dark:to-amber-950/30 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ${isMultiCondition ? 'min-w-[180px]' : 'min-w-[160px]'}`}
           style={{ minWidth: isMultiCondition ? `${Math.max(180, totalHandles * 50)}px` : undefined }}>
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-amber-400 !to-orange-500 border-2 border-white dark:border-slate-800 shadow-md" />
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-md shadow-amber-500/30">
            <GitBranch size={16} className="text-white" />
          </div>
          <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label}</strong>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {isMultiCondition ? `Multi-Condition (${conditions.length})` : 'Conditional Logic'}
        </div>

        {isMultiCondition ? (
          <>
            {/* Render handles for each condition (0, 1, 2, ...) */}
            {conditions.map((condition, index) => (
              <Handle
                key={index}
                type="source"
                position={Position.Bottom}
                id={String(index)}
                style={{ left: getHandlePosition(index) }}
                className={`w-3 h-3 ${CONDITION_COLORS[index % CONDITION_COLORS.length].bg} border-2 border-white dark:border-slate-800`}
                title={`Condition ${index}: ${condition.value || 'not set'}`}
              />
            ))}
            {/* Else handle */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="else"
              style={{ left: getHandlePosition(conditions.length) }}
              className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800"
              title="Else (no condition matched)"
            />
            {/* Handle labels */}
            <div className="flex justify-around mt-2 text-[10px] font-medium">
              {conditions.map((_, index) => (
                <span key={index} className={CONDITION_COLORS[index % CONDITION_COLORS.length].text}>
                  {index}
                </span>
              ))}
              <span className="text-red-500">else</span>
            </div>
          </>
        ) : (
          <>
            {/* Legacy true/false handles */}
            <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%' }} className="w-3 h-3 !bg-green-500 dark:!bg-green-400 border-2 border-white dark:border-slate-800" />
            <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%' }} className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
            <div className="flex justify-between mt-2 px-4 text-[10px] font-medium">
              <span className="text-green-600">true</span>
              <span className="text-red-500">false</span>
            </div>
          </>
        )}
      </div>
      {/* Add node buttons for condition handles */}
      {isMultiCondition ? (
        <>
          {conditions.map((_, index) => (
            <AddNodeButton
              key={index}
              nodeId={id}
              handleId={String(index)}
              position="bottom"
              handleOffset={{ left: getHandlePosition(index) }}
            />
          ))}
          <AddNodeButton nodeId={id} handleId="else" position="bottom" handleOffset={{ left: getHandlePosition(conditions.length) }} />
        </>
      ) : (
        <>
          <AddNodeButton nodeId={id} handleId="true" position="bottom" handleOffset={{ left: '25%' }} />
          <AddNodeButton nodeId={id} handleId="false" position="bottom" handleOffset={{ left: '75%' }} />
        </>
      )}
    </div>
  );
};

export const OutputNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-indigo-200/80 dark:border-indigo-700/60 rounded-2xl bg-gradient-to-br from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950/30 shadow-lg shadow-indigo-500/10 hover:shadow-xl hover:shadow-indigo-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-indigo-400 !to-violet-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-md shadow-indigo-500/30">
          <MessageSquare size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
        Workflow Output
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

export const StartNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-6 py-4 border-2 border-dashed border-emerald-300/80 dark:border-emerald-600/60 rounded-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-emerald-950/50 dark:via-slate-800 dark:to-teal-950/50 shadow-lg shadow-emerald-500/15 hover:shadow-xl hover:shadow-emerald-500/25 hover:scale-[1.03] transition-all duration-200 backdrop-blur-sm ring-4 ring-emerald-100/50 dark:ring-emerald-900/30">
      <div className="flex flex-col items-center gap-1.5">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 animate-pulse"></span>
          <strong className="text-sm font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">{data.label}</strong>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Workflow Start</div>
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3.5 h-3.5 !bg-gradient-to-br !from-emerald-400 !to-teal-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

export const ListenNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-cyan-200/80 dark:border-cyan-700/60 rounded-2xl bg-gradient-to-br from-white to-cyan-50 dark:from-slate-800 dark:to-cyan-950/30 shadow-lg shadow-cyan-500/10 hover:shadow-xl hover:shadow-cyan-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-cyan-400 !to-sky-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-600 shadow-md shadow-cyan-500/30">
          <Ear size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Listen for Input'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
        Pauses for user input
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

export const PromptNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-yellow-200/80 dark:border-yellow-700/60 rounded-2xl bg-gradient-to-br from-white to-yellow-50 dark:from-slate-800 dark:to-yellow-950/30 shadow-lg shadow-yellow-500/10 hover:shadow-xl hover:shadow-yellow-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-yellow-400 !to-amber-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 shadow-md shadow-yellow-500/30">
          <HelpCircle size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Prompt for Input'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>
        Asks user a question
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

export const KnowledgeNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-violet-200/80 dark:border-violet-700/60 rounded-2xl bg-gradient-to-br from-white to-violet-50 dark:from-slate-800 dark:to-violet-950/30 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-violet-400 !to-purple-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30">
          <BookOpen size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Knowledge Search'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
        Searches knowledge base
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

export const CodeNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-slate-300/80 dark:border-slate-600/60 rounded-2xl bg-gradient-to-br from-white to-slate-100 dark:from-slate-800 dark:to-slate-900/50 shadow-lg shadow-slate-500/10 hover:shadow-xl hover:shadow-slate-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-slate-400 !to-gray-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-slate-600 to-gray-700 shadow-md shadow-slate-500/30">
          <Code size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Code Execution'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        Executes Python code
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

export const DataManipulationNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-sky-200/80 dark:border-sky-700/60 rounded-2xl bg-gradient-to-br from-white to-sky-50 dark:from-slate-800 dark:to-sky-950/30 shadow-lg shadow-sky-500/10 hover:shadow-xl hover:shadow-sky-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-sky-400 !to-blue-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-md shadow-sky-500/30">
          <SquareStack size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Data Manipulation'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
        Transforms data
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

export const HttpRequestNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-teal-200/80 dark:border-teal-700/60 rounded-2xl bg-gradient-to-br from-white to-teal-50 dark:from-slate-800 dark:to-teal-950/30 shadow-lg shadow-teal-500/10 hover:shadow-xl hover:shadow-teal-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-teal-400 !to-emerald-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md shadow-teal-500/30">
          <Globe size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'HTTP Request'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
        Makes HTTP request
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

export const FormNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-purple-200/80 dark:border-purple-700/60 rounded-2xl bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-950/30 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-purple-400 !to-fuchsia-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-md shadow-purple-500/30">
          <ClipboardList size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Display Form'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
        Pauses for form input
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

// ============================================================
// NEW CHAT-SPECIFIC NODES
// ============================================================

export const IntentRouterNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-violet-200/80 dark:border-violet-700/60 rounded-2xl bg-gradient-to-br from-white to-violet-50 dark:from-slate-800 dark:to-violet-950/30 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-violet-400 !to-purple-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30">
          <Target size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Intent Router'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
        Routes by detected intent
      </div>
      {/* Multiple output handles for different intent routes */}
      <Handle type="source" position={Position.Bottom} id="default" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="route1" style={{ top: '40%' }} className="w-3 h-3 !bg-gradient-to-br !from-violet-400 !to-purple-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="route2" style={{ top: '60%' }} className="w-3 h-3 !bg-gradient-to-br !from-purple-400 !to-fuchsia-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="default" position="bottom" />
    <AddNodeButton nodeId={id} handleId="route1" position="right" handleOffset={{ top: '40%' }} />
    <AddNodeButton nodeId={id} handleId="route2" position="right" handleOffset={{ top: '60%' }} />
  </div>
);

export const EntityCollectorNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-rose-200/80 dark:border-rose-700/60 rounded-2xl bg-gradient-to-br from-white to-rose-50 dark:from-slate-800 dark:to-rose-950/30 shadow-lg shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-rose-400 !to-pink-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/30">
          <Notebook size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Collect Entities'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        Gathers required information
      </div>
      <Handle type="source" position={Position.Bottom} id="complete" className="w-3 h-3 !bg-gradient-to-br !from-green-400 !to-emerald-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="partial" className="w-3 h-3 !bg-gradient-to-br !from-amber-400 !to-orange-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="complete" position="bottom" />
    <AddNodeButton nodeId={id} handleId="partial" position="right" />
  </div>
);

export const CheckEntityNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-emerald-200/80 dark:border-emerald-700/60 rounded-2xl bg-gradient-to-br from-white to-emerald-50 dark:from-slate-800 dark:to-emerald-950/30 shadow-lg shadow-emerald-500/10 hover:shadow-xl hover:shadow-emerald-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-emerald-400 !to-teal-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/30">
          <CheckCircle size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Check Entity'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        Validates entity exists
      </div>
      <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="w-3 h-3 !bg-gradient-to-br !from-green-400 !to-emerald-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="true" position="bottom" handleOffset={{ left: '30%' }} />
    <AddNodeButton nodeId={id} handleId="false" position="bottom" handleOffset={{ left: '70%' }} />
  </div>
);

export const UpdateContextNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-blue-200/80 dark:border-blue-700/60 rounded-2xl bg-gradient-to-br from-white to-blue-50 dark:from-slate-800 dark:to-blue-950/30 shadow-lg shadow-blue-500/10 hover:shadow-xl hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-blue-400 !to-cyan-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md shadow-blue-500/30">
          <Database size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Update Context'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
        Sets context variables
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

export const TagConversationNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-fuchsia-200/80 dark:border-fuchsia-700/60 rounded-2xl bg-gradient-to-br from-white to-fuchsia-50 dark:from-slate-800 dark:to-fuchsia-950/30 shadow-lg shadow-fuchsia-500/10 hover:shadow-xl hover:shadow-fuchsia-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-fuchsia-400 !to-pink-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-fuchsia-500 to-pink-600 shadow-md shadow-fuchsia-500/30">
          <Tag size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Tag Conversation'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-500"></span>
        Adds organizational tags
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

export const AssignToAgentNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-orange-200/80 dark:border-orange-700/60 rounded-2xl bg-gradient-to-br from-white to-orange-50 dark:from-slate-800 dark:to-orange-950/30 shadow-lg shadow-orange-500/10 hover:shadow-xl hover:shadow-orange-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-orange-400 !to-amber-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 shadow-md shadow-orange-500/30">
          <UserPlus size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Assign to Agent'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
        Transfers to human agent
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

export const SetStatusNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-lime-200/80 dark:border-lime-700/60 rounded-2xl bg-gradient-to-br from-white to-lime-50 dark:from-slate-800 dark:to-lime-950/30 shadow-lg shadow-lime-500/10 hover:shadow-xl hover:shadow-lime-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-lime-400 !to-green-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-lime-500 to-green-600 shadow-md shadow-lime-500/30">
          <Activity size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Set Status'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-lime-500"></span>
        Changes conversation status
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
  </div>
);

export const ChannelRedirectNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-rose-200/80 dark:border-rose-700/60 rounded-2xl bg-gradient-to-br from-white to-rose-50 dark:from-slate-800 dark:to-rose-950/30 shadow-lg shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-rose-400 !to-pink-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-md shadow-rose-500/30">
          <ArrowRightLeft size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Channel Redirect'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
        {data.target_channel ? `Redirect to ${data.target_channel}` : 'Redirects to another channel'}
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
    </div>
    <AddNodeButton nodeId={id} handleId="output" position="bottom" />
    <AddNodeButton nodeId={id} handleId="error" position="right" />
  </div>
);

// Color palette for classifier class handles
const CLASSIFIER_COLORS = [
  { bg: '!bg-blue-500 dark:!bg-blue-400', text: 'text-blue-600 dark:text-blue-400' },
  { bg: '!bg-green-500 dark:!bg-green-400', text: 'text-green-600 dark:text-green-400' },
  { bg: '!bg-purple-500 dark:!bg-purple-400', text: 'text-purple-600 dark:text-purple-400' },
  { bg: '!bg-orange-500 dark:!bg-orange-400', text: 'text-orange-600 dark:text-orange-400' },
  { bg: '!bg-cyan-500 dark:!bg-cyan-400', text: 'text-cyan-600 dark:text-cyan-400' },
  { bg: '!bg-pink-500 dark:!bg-pink-400', text: 'text-pink-600 dark:text-pink-400' },
];

export const QuestionClassifierNode = ({ id, data }) => {
  const classes = data.classes || [];
  const hasClasses = classes.length > 0;
  const totalHandles = hasClasses ? classes.length + 1 : 1; // +1 for default

  // Calculate handle positions
  const getHandlePosition = (index: number) => {
    const spacing = 100 / (totalHandles + 1);
    return `${spacing * (index + 1)}%`;
  };

  return (
    <div className="relative group">
      <div className={`px-4 py-3 border border-amber-200/80 dark:border-amber-700/60 rounded-2xl bg-gradient-to-br from-white to-amber-50 dark:from-slate-800 dark:to-amber-950/30 shadow-lg shadow-amber-500/10 hover:shadow-xl hover:shadow-amber-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ${hasClasses ? 'min-w-[180px]' : 'min-w-[160px]'}`}
           style={{ minWidth: hasClasses ? `${Math.max(180, totalHandles * 60)}px` : undefined }}>
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-amber-400 !to-yellow-500 border-2 border-white dark:border-slate-800 shadow-md" />
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 shadow-md shadow-amber-500/30">
            <HelpCircle size={16} className="text-white" />
          </div>
          <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Question Classifier'}</strong>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          {hasClasses ? `Classifies into ${classes.length} classes` : 'Classifies using LLM'}
        </div>

        {hasClasses ? (
          <>
            {/* Render handles for each class */}
            {classes.map((cls, index) => (
              <Handle
                key={index}
                type="source"
                position={Position.Bottom}
                id={cls.name}
                style={{ left: getHandlePosition(index) }}
                className={`w-3 h-3 ${CLASSIFIER_COLORS[index % CLASSIFIER_COLORS.length].bg} border-2 border-white dark:border-slate-800 shadow-md`}
                title={cls.description || cls.name}
              />
            ))}
            {/* Default handle */}
            <Handle
              type="source"
              position={Position.Bottom}
              id="default"
              style={{ left: getHandlePosition(classes.length) }}
              className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md"
              title="Default (no class matched)"
            />
            {/* Handle labels */}
            <div className="flex justify-around mt-2 text-[10px] font-medium">
              {classes.map((cls, index) => (
                <span key={index} className={CLASSIFIER_COLORS[index % CLASSIFIER_COLORS.length].text}>
                  {cls.name.length > 8 ? cls.name.substring(0, 6) + '..' : cls.name}
                </span>
              ))}
              <span className="text-slate-500 dark:text-slate-400">default</span>
            </div>
          </>
        ) : (
          <>
            {/* Default output handle when no classes configured */}
            <Handle type="source" position={Position.Bottom} id="default" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
          </>
        )}
      </div>
      {/* Add node buttons for classifier handles */}
      {hasClasses ? (
        <>
          {classes.map((cls, index) => (
            <AddNodeButton
              key={index}
              nodeId={id}
              handleId={cls.name}
              position="bottom"
              handleOffset={{ left: getHandlePosition(index) }}
            />
          ))}
          <AddNodeButton nodeId={id} handleId="default" position="bottom" handleOffset={{ left: getHandlePosition(classes.length) }} />
        </>
      ) : (
        <AddNodeButton nodeId={id} handleId="default" position="bottom" />
      )}
    </div>
  );
};

export const ExtractEntitiesNode = ({ id, data }) => {
  const entities = data.entities || [];
  const hasEntities = entities.length > 0;

  return (
    <div className="relative group">
      <div className="px-4 py-3 border border-purple-200/80 dark:border-purple-700/60 rounded-2xl bg-gradient-to-br from-white to-purple-50 dark:from-slate-800 dark:to-purple-950/30 shadow-lg shadow-purple-500/10 hover:shadow-xl hover:shadow-purple-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-purple-400 !to-fuchsia-500 border-2 border-white dark:border-slate-800 shadow-md" />
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-md shadow-purple-500/30">
            <Target size={16} className="text-white" />
          </div>
          <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Extract Entities'}</strong>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
          {hasEntities ? `Extract ${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}` : 'LLM-powered extraction'}
        </div>
        <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
        <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
      </div>
      <AddNodeButton nodeId={id} handleId="output" position="bottom" />
      <AddNodeButton nodeId={id} handleId="error" position="right" />
    </div>
  );
};

// ========== SUBWORKFLOW NODE ==========

export const SubworkflowNode = ({ id, data }) => {
  const workflowName = data.subworkflow_name || 'Select Workflow';

  return (
    <div className="relative group">
      <div className="px-4 py-3 border border-violet-200/80 dark:border-violet-700/60 rounded-2xl bg-gradient-to-br from-white to-violet-50 dark:from-slate-800 dark:to-violet-950/30 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
        <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-violet-400 !to-purple-500 border-2 border-white dark:border-slate-800 shadow-md" />
        <div className="flex items-center gap-2.5 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30">
            <Layers size={16} className="text-white" />
          </div>
          <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'Subworkflow'}</strong>
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px] flex items-center gap-1" title={workflowName}>
          <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
          {workflowName}
        </div>
        <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md" />
        <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-gradient-to-br !from-red-400 !to-rose-500 border-2 border-white dark:border-slate-800 shadow-md" />
      </div>
      <AddNodeButton nodeId={id} handleId="output" position="bottom" />
      <AddNodeButton nodeId={id} handleId="error" position="right" />
    </div>
  );
};

// ========== TRIGGER NODES ==========

export const TriggerWebSocketNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-5 py-4 border-2 border-cyan-300/80 dark:border-cyan-600/60 rounded-2xl bg-gradient-to-br from-cyan-50 via-white to-blue-50 dark:from-cyan-950/40 dark:via-slate-800 dark:to-blue-950/40 shadow-xl shadow-cyan-500/15 hover:shadow-2xl hover:shadow-cyan-500/25 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ring-2 ring-cyan-200/50 dark:ring-cyan-700/30">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
          <Wifi size={18} className="text-white" />
        </div>
        <div>
          <strong className="text-sm font-bold text-slate-800 dark:text-white">{data.label || 'WebSocket Trigger'}</strong>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Zap size={10} className="text-cyan-500 dark:text-cyan-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">Trigger</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></span>
        Real-time conversations
      </div>
      {data.agent_id && (
        <div className="text-[10px] text-cyan-600 dark:text-cyan-300 font-medium mt-1 bg-cyan-100/50 dark:bg-cyan-900/30 px-2 py-0.5 rounded-md inline-block">Agent: {data.agent_name || `#${data.agent_id}`}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-gradient-to-br !from-cyan-400 !to-blue-500 border-2 border-white dark:border-slate-800 shadow-lg" />
    </div>
    <AddNodeButton nodeId={id} handleId="message" position="bottom" />
  </div>
);

export const TriggerWhatsAppNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-5 py-4 border-2 border-green-300/80 dark:border-green-600/60 rounded-2xl bg-gradient-to-br from-green-50 via-white to-emerald-50 dark:from-green-950/40 dark:via-slate-800 dark:to-emerald-950/40 shadow-xl shadow-green-500/15 hover:shadow-2xl hover:shadow-green-500/25 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ring-2 ring-green-200/50 dark:ring-green-700/30">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/30">
          <Phone size={18} className="text-white" />
        </div>
        <div>
          <strong className="text-sm font-bold text-slate-800 dark:text-white">{data.label || 'WhatsApp Trigger'}</strong>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Zap size={10} className="text-green-500 dark:text-green-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 dark:text-green-300">Trigger</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
        WhatsApp messages
      </div>
      {data.agent_id && (
        <div className="text-[10px] text-green-600 dark:text-green-300 font-medium mt-1 bg-green-100/50 dark:bg-green-900/30 px-2 py-0.5 rounded-md inline-block">Agent: {data.agent_name || `#${data.agent_id}`}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-gradient-to-br !from-green-400 !to-emerald-500 border-2 border-white dark:border-slate-800 shadow-lg" />
    </div>
    <AddNodeButton nodeId={id} handleId="message" position="bottom" />
  </div>
);

export const TriggerTelegramNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-5 py-4 border-2 border-sky-300/80 dark:border-sky-600/60 rounded-2xl bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-sky-950/40 dark:via-slate-800 dark:to-blue-950/40 shadow-xl shadow-sky-500/15 hover:shadow-2xl hover:shadow-sky-500/25 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ring-2 ring-sky-200/50 dark:ring-sky-700/30">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-sky-500 to-blue-600 shadow-lg shadow-sky-500/30">
          <Send size={18} className="text-white" />
        </div>
        <div>
          <strong className="text-sm font-bold text-slate-800 dark:text-white">{data.label || 'Telegram Trigger'}</strong>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Zap size={10} className="text-sky-500 dark:text-sky-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-300">Trigger</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
        Telegram messages
      </div>
      {data.agent_id && (
        <div className="text-[10px] text-sky-600 dark:text-sky-300 font-medium mt-1 bg-sky-100/50 dark:bg-sky-900/30 px-2 py-0.5 rounded-md inline-block">Agent: {data.agent_name || `#${data.agent_id}`}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-gradient-to-br !from-sky-400 !to-blue-500 border-2 border-white dark:border-slate-800 shadow-lg" />
    </div>
    <AddNodeButton nodeId={id} handleId="message" position="bottom" />
  </div>
);

export const TriggerInstagramNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-5 py-4 border-2 border-pink-300/80 dark:border-pink-600/60 rounded-2xl bg-gradient-to-br from-pink-50 via-white to-fuchsia-50 dark:from-pink-950/40 dark:via-slate-800 dark:to-fuchsia-950/40 shadow-xl shadow-pink-500/15 hover:shadow-2xl hover:shadow-pink-500/25 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ring-2 ring-pink-200/50 dark:ring-pink-700/30">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-pink-500 to-fuchsia-600 shadow-lg shadow-pink-500/30">
          <Instagram size={18} className="text-white" />
        </div>
        <div>
          <strong className="text-sm font-bold text-slate-800 dark:text-white">{data.label || 'Instagram Trigger'}</strong>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Zap size={10} className="text-pink-500 dark:text-pink-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-pink-600 dark:text-pink-300">Trigger</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse"></span>
        Instagram DMs
      </div>
      {data.agent_id && (
        <div className="text-[10px] text-pink-600 dark:text-pink-300 font-medium mt-1 bg-pink-100/50 dark:bg-pink-900/30 px-2 py-0.5 rounded-md inline-block">Agent: {data.agent_name || `#${data.agent_id}`}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-gradient-to-br !from-pink-400 !to-fuchsia-500 border-2 border-white dark:border-slate-800 shadow-lg" />
    </div>
    <AddNodeButton nodeId={id} handleId="message" position="bottom" />
  </div>
);

export const TriggerTwilioVoiceNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-5 py-4 border-2 border-red-300/80 dark:border-red-600/60 rounded-2xl bg-gradient-to-br from-red-50 via-white to-orange-50 dark:from-red-950/40 dark:via-slate-800 dark:to-orange-950/40 shadow-xl shadow-red-500/15 hover:shadow-2xl hover:shadow-red-500/25 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ring-2 ring-red-200/50 dark:ring-red-700/30">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg shadow-red-500/30">
          <PhoneCall size={18} className="text-white" />
        </div>
        <div>
          <strong className="text-sm font-bold text-slate-800 dark:text-white">{data.label || 'Twilio Voice Trigger'}</strong>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Zap size={10} className="text-red-500 dark:text-red-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-300">Trigger</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        Voice calls via Twilio
      </div>
      {data.agent_id && (
        <div className="text-[10px] text-red-600 dark:text-red-300 font-medium mt-1 bg-red-100/50 dark:bg-red-900/30 px-2 py-0.5 rounded-md inline-block">Agent: {data.agent_name || `#${data.agent_id}`}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-gradient-to-br !from-red-400 !to-orange-500 border-2 border-white dark:border-slate-800 shadow-lg" />
    </div>
    <AddNodeButton nodeId={id} handleId="message" position="bottom" />
  </div>
);

export const TriggerFreeSwitchNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-5 py-4 border-2 border-teal-300/80 dark:border-teal-600/60 rounded-2xl bg-gradient-to-br from-teal-50 via-white to-cyan-50 dark:from-teal-950/40 dark:via-slate-800 dark:to-cyan-950/40 shadow-xl shadow-teal-500/15 hover:shadow-2xl hover:shadow-teal-500/25 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm ring-2 ring-teal-200/50 dark:ring-teal-700/30">
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/30">
          <Server size={18} className="text-white" />
        </div>
        <div>
          <strong className="text-sm font-bold text-slate-800 dark:text-white">{data.label || 'FreeSWITCH Trigger'}</strong>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Zap size={10} className="text-teal-500 dark:text-teal-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-300">Trigger</span>
          </div>
        </div>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1 flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse"></span>
        Voice calls via FreeSWITCH
      </div>
      {data.agent_id && (
        <div className="text-[10px] text-teal-600 dark:text-teal-300 font-medium mt-1 bg-teal-100/50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md inline-block">Agent: {data.agent_name || `#${data.agent_id}`}</div>
      )}
      <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-gradient-to-br !from-teal-400 !to-cyan-500 border-2 border-white dark:border-slate-800 shadow-lg" />
    </div>
    <AddNodeButton nodeId={id} handleId="message" position="bottom" />
  </div>
);

// ========== LOOP NODES ==========

export const ForEachLoopNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-teal-200/80 dark:border-teal-700/60 rounded-2xl bg-gradient-to-br from-white to-teal-50 dark:from-slate-800 dark:to-teal-950/30 shadow-lg shadow-teal-500/10 hover:shadow-xl hover:shadow-teal-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-teal-400 !to-cyan-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md shadow-teal-500/30">
          <Repeat size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'For Each'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
        Iterate over array
      </div>
      {data.item_variable && (
        <div className="text-[10px] text-teal-600 dark:text-teal-300 mt-1 truncate bg-teal-100/50 dark:bg-teal-900/30 px-2 py-0.5 rounded-md inline-block">
          item: {data.item_variable}
        </div>
      )}
      {/* Loop body handle - bottom left */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop"
        style={{ left: '25%' }}
        className="w-3 h-3 !bg-gradient-to-br !from-teal-400 !to-cyan-500 border-2 border-white dark:border-slate-800 shadow-md"
      />
      {/* Exit handle - bottom right */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="exit"
        style={{ left: '75%' }}
        className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md"
      />
      {/* Handle labels */}
      <div className="flex justify-between mt-2 px-4 text-[10px] font-semibold">
        <span className="text-teal-600 dark:text-teal-400">loop</span>
        <span className="text-slate-500 dark:text-slate-400">exit</span>
      </div>
    </div>
    <AddNodeButton nodeId={id} handleId="loop" position="bottom" handleOffset={{ left: '25%' }} />
    <AddNodeButton nodeId={id} handleId="exit" position="bottom" handleOffset={{ left: '75%' }} />
  </div>
);

export const WhileLoopNode = ({ id, data }) => (
  <div className="relative group">
    <div className="px-4 py-3 border border-violet-200/80 dark:border-violet-700/60 rounded-2xl bg-gradient-to-br from-white to-violet-50 dark:from-slate-800 dark:to-violet-950/30 shadow-lg shadow-violet-500/10 hover:shadow-xl hover:shadow-violet-500/20 hover:scale-[1.02] transition-all duration-200 backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-gradient-to-br !from-violet-400 !to-purple-500 border-2 border-white dark:border-slate-800 shadow-md" />
      <div className="flex items-center gap-2.5 mb-2">
        <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-md shadow-violet-500/30">
          <RefreshCw size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-800 dark:text-white">{data.label || 'While Loop'}</strong>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-violet-500"></span>
        Repeat while true
      </div>
      {data.conditions && data.conditions.length > 0 && (
        <div className="text-[10px] text-violet-600 dark:text-violet-300 mt-1 bg-violet-100/50 dark:bg-violet-900/30 px-2 py-0.5 rounded-md inline-block">
          {data.conditions.length} condition{data.conditions.length > 1 ? 's' : ''}
        </div>
      )}
      {/* Loop body handle - bottom left */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="loop"
        style={{ left: '25%' }}
        className="w-3 h-3 !bg-gradient-to-br !from-violet-400 !to-purple-500 border-2 border-white dark:border-slate-800 shadow-md"
      />
      {/* Exit handle - bottom right */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="exit"
        style={{ left: '75%' }}
        className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800 shadow-md"
      />
      {/* Handle labels */}
      <div className="flex justify-between mt-2 px-4 text-[10px] font-semibold">
        <span className="text-violet-600 dark:text-violet-400">loop</span>
        <span className="text-slate-500 dark:text-slate-400">exit</span>
      </div>
    </div>
    <AddNodeButton nodeId={id} handleId="loop" position="bottom" handleOffset={{ left: '25%' }} />
    <AddNodeButton nodeId={id} handleId="exit" position="bottom" handleOffset={{ left: '75%' }} />
  </div>
);

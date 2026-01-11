
import React from 'react';
import { Handle, Position } from 'reactflow';
import {
  Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code,
  SquareStack, Globe, ClipboardList, Target, Notebook, CheckCircle,
  Database, Tag, UserPlus, Activity, Zap, Phone, Send, Instagram, Wifi, Layers,
  Repeat, RefreshCw, PhoneCall, Server, ArrowRightLeft
} from 'lucide-react';

export const LlmNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500 dark:!bg-blue-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-blue-500 dark:bg-blue-600">
        <Bot size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">LLM Prompt</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const ToolNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-green-200 dark:border-green-700 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/50 dark:to-emerald-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500 dark:!bg-green-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-green-500 dark:bg-green-600">
        <Cog size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Tool Execution</div>
    <Handle type="source" position={Position.Bottom} id="error" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="output" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
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

export const ConditionNode = ({ data }) => {
  const conditions = data.conditions || [];
  const isMultiCondition = conditions.length > 0;
  const totalHandles = isMultiCondition ? conditions.length + 1 : 2; // +1 for else, or 2 for true/false

  // Calculate handle positions
  const getHandlePosition = (index: number) => {
    const spacing = 100 / (totalHandles + 1);
    return `${spacing * (index + 1)}%`;
  };

  return (
    <div className={`px-4 py-3 border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm ${isMultiCondition ? 'min-w-[180px]' : ''}`}
         style={{ minWidth: isMultiCondition ? `${Math.max(180, totalHandles * 50)}px` : undefined }}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-500 dark:!bg-amber-400 border-2 border-white dark:border-slate-800" />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-amber-500 dark:bg-amber-600">
          <GitBranch size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
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
  );
};

export const OutputNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-indigo-500 dark:!bg-indigo-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-indigo-500 dark:bg-indigo-600">
        <MessageSquare size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Workflow Output</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const StartNode = ({ data }) => (
    <div className="px-6 py-3 border-2 border-dashed border-emerald-300 dark:border-emerald-600 rounded-full bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
      <div className="flex flex-col items-center gap-1">
        <strong className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{data.label}</strong>
        <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Workflow Start</div>
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-emerald-500 dark:!bg-emerald-400 border-2 border-white dark:border-slate-800" />
    </div>
);

export const ListenNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-cyan-200 dark:border-cyan-700 rounded-xl bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-950/50 dark:to-sky-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-cyan-500 dark:!bg-cyan-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-cyan-500 dark:bg-cyan-600">
        <Ear size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Listen for Input'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pauses for user input</div>
    <Handle type="source" position={Position.Bottom} id="error" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="output" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const PromptNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-500 dark:!bg-amber-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-amber-500 dark:bg-amber-600">
        <HelpCircle size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Prompt for Input'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Asks user a question</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const KnowledgeNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-indigo-200 dark:border-indigo-700 rounded-xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-indigo-500 dark:!bg-indigo-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-indigo-500 dark:bg-indigo-600">
        <BookOpen size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Knowledge Search'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Searches knowledge base</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const CodeNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-slate-600 dark:bg-slate-700">
        <Code size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Code Execution'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Executes Python code</div>
    <Handle type="source" position={Position.Bottom} id="error" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="output" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const DataManipulationNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-sky-200 dark:border-sky-700 rounded-xl bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-950/50 dark:to-blue-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-sky-500 dark:!bg-sky-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-sky-500 dark:bg-sky-600">
        <SquareStack size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Data Manipulation'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Transforms data</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const HttpRequestNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-teal-200 dark:border-teal-700 rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-950/50 dark:to-emerald-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-teal-500 dark:!bg-teal-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-teal-500 dark:bg-teal-600">
        <Globe size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'HTTP Request'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Makes HTTP request</div>
    <Handle type="source" position={Position.Bottom} id="error" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="output" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const FormNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/50 dark:to-fuchsia-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500 dark:!bg-purple-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-purple-500 dark:bg-purple-600">
        <ClipboardList size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Display Form'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Pauses for form input</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

// ============================================================
// NEW CHAT-SPECIFIC NODES
// ============================================================

export const IntentRouterNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-violet-200 dark:border-violet-700 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-violet-500 dark:!bg-violet-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-violet-500 dark:bg-violet-600">
        <Target size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Intent Router'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Routes by detected intent</div>
    {/* Multiple output handles for different intent routes */}
    <Handle type="source" position={Position.Bottom} id="default" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="route1" style={{ top: '40%' }} className="w-3 h-3 !bg-violet-500 dark:!bg-violet-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="route2" style={{ top: '60%' }} className="w-3 h-3 !bg-purple-500 dark:!bg-purple-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const EntityCollectorNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-rose-200 dark:border-rose-700 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-rose-500 dark:!bg-rose-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-rose-500 dark:bg-rose-600">
        <Notebook size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Collect Entities'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Gathers required information</div>
    <Handle type="source" position={Position.Bottom} id="complete" className="w-3 h-3 !bg-green-500 dark:!bg-green-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="partial" className="w-3 h-3 !bg-amber-500 dark:!bg-amber-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const CheckEntityNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-emerald-200 dark:border-emerald-700 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-emerald-500 dark:!bg-emerald-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-emerald-500 dark:bg-emerald-600">
        <CheckCircle size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Check Entity'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Validates entity exists</div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '30%' }} className="w-3 h-3 !bg-green-500 dark:!bg-green-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '70%' }} className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const UpdateContextNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-blue-200 dark:border-blue-700 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/50 dark:to-cyan-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500 dark:!bg-blue-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-blue-500 dark:bg-blue-600">
        <Database size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Update Context'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Sets context variables</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const TagConversationNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-fuchsia-200 dark:border-fuchsia-700 rounded-xl bg-gradient-to-br from-fuchsia-50 to-pink-50 dark:from-fuchsia-950/50 dark:to-pink-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-fuchsia-500 dark:!bg-fuchsia-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-fuchsia-500 dark:bg-fuchsia-600">
        <Tag size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Tag Conversation'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Adds organizational tags</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const AssignToAgentNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-orange-200 dark:border-orange-700 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/50 dark:to-amber-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-orange-500 dark:!bg-orange-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-orange-500 dark:bg-orange-600">
        <UserPlus size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Assign to Agent'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Transfers to human agent</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const SetStatusNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-lime-200 dark:border-lime-700 rounded-xl bg-gradient-to-br from-lime-50 to-green-50 dark:from-lime-950/50 dark:to-green-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-lime-500 dark:!bg-lime-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-lime-500 dark:bg-lime-600">
        <Activity size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Set Status'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Changes conversation status</div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const ChannelRedirectNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-rose-200 dark:border-rose-700 rounded-xl bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-rose-500 dark:!bg-rose-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-rose-500 dark:bg-rose-600">
        <ArrowRightLeft size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Channel Redirect'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
      {data.target_channel ? `Redirect to ${data.target_channel}` : 'Redirects to another channel'}
    </div>
    <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
    <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
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

export const QuestionClassifierNode = ({ data }) => {
  const classes = data.classes || [];
  const hasClasses = classes.length > 0;
  const totalHandles = hasClasses ? classes.length + 1 : 1; // +1 for default

  // Calculate handle positions
  const getHandlePosition = (index: number) => {
    const spacing = 100 / (totalHandles + 1);
    return `${spacing * (index + 1)}%`;
  };

  return (
    <div className={`px-4 py-3 border-2 border-amber-200 dark:border-amber-700 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-950/50 dark:to-yellow-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm ${hasClasses ? 'min-w-[180px]' : ''}`}
         style={{ minWidth: hasClasses ? `${Math.max(180, totalHandles * 60)}px` : undefined }}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-amber-500 dark:!bg-amber-400 border-2 border-white dark:border-slate-800" />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-amber-500 dark:bg-amber-600">
          <HelpCircle size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Question Classifier'}</strong>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
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
              className={`w-3 h-3 ${CLASSIFIER_COLORS[index % CLASSIFIER_COLORS.length].bg} border-2 border-white dark:border-slate-800`}
              title={cls.description || cls.name}
            />
          ))}
          {/* Default handle */}
          <Handle
            type="source"
            position={Position.Bottom}
            id="default"
            style={{ left: getHandlePosition(classes.length) }}
            className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800"
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
          <Handle type="source" position={Position.Bottom} id="default" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
        </>
      )}
    </div>
  );
};

export const ExtractEntitiesNode = ({ data }) => {
  const entities = data.entities || [];
  const hasEntities = entities.length > 0;

  return (
    <div className="px-4 py-3 border-2 border-purple-200 dark:border-purple-700 rounded-xl bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-950/50 dark:to-fuchsia-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500 dark:!bg-purple-400 border-2 border-white dark:border-slate-800" />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-purple-500 dark:bg-purple-600">
          <Target size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Extract Entities'}</strong>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">
        {hasEntities ? `Extract ${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}` : 'LLM-powered extraction'}
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
    </div>
  );
};

// ========== SUBWORKFLOW NODE ==========

export const SubworkflowNode = ({ data }) => {
  const workflowName = data.subworkflow_name || 'Select Workflow';

  return (
    <div className="px-4 py-3 border-2 border-violet-200 dark:border-violet-700 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm min-w-[160px]">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-violet-500 dark:!bg-violet-400 border-2 border-white dark:border-slate-800" />
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-violet-500 dark:bg-violet-600">
          <Layers size={16} className="text-white" />
        </div>
        <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'Subworkflow'}</strong>
      </div>
      <div className="text-xs text-slate-600 dark:text-slate-400 font-medium truncate max-w-[140px]" title={workflowName}>
        {workflowName}
      </div>
      <Handle type="source" position={Position.Bottom} id="output" className="w-3 h-3 !bg-slate-600 dark:!bg-slate-400 border-2 border-white dark:border-slate-800" />
      <Handle type="source" position={Position.Right} id="error" className="w-3 h-3 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
    </div>
  );
};

// ========== TRIGGER NODES ==========

export const TriggerWebSocketNode = ({ data }) => (
  <div className="px-5 py-4 border-3 border-cyan-300 dark:border-cyan-600 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/60 dark:to-blue-900/60 shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-sm ring-2 ring-cyan-200 dark:ring-cyan-700">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 shadow-md">
        <Wifi size={18} className="text-white" />
      </div>
      <div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white">{data.label || 'WebSocket Trigger'}</strong>
        <div className="flex items-center gap-1 mt-0.5">
          <Zap size={10} className="text-cyan-600 dark:text-cyan-400" />
          <span className="text-[10px] font-semibold text-cyan-700 dark:text-cyan-300">TRIGGER</span>
        </div>
      </div>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Real-time conversations</div>
    {data.agent_id && (
      <div className="text-[10px] text-cyan-700 dark:text-cyan-300 font-medium">Agent: {data.agent_name || `#${data.agent_id}`}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-cyan-500 dark:!bg-cyan-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const TriggerWhatsAppNode = ({ data }) => (
  <div className="px-5 py-4 border-3 border-green-300 dark:border-green-600 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/60 dark:to-emerald-900/60 shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-sm ring-2 ring-green-200 dark:ring-green-700">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
        <Phone size={18} className="text-white" />
      </div>
      <div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white">{data.label || 'WhatsApp Trigger'}</strong>
        <div className="flex items-center gap-1 mt-0.5">
          <Zap size={10} className="text-green-600 dark:text-green-400" />
          <span className="text-[10px] font-semibold text-green-700 dark:text-green-300">TRIGGER</span>
        </div>
      </div>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">WhatsApp messages</div>
    {data.agent_id && (
      <div className="text-[10px] text-green-700 dark:text-green-300 font-medium">Agent: {data.agent_name || `#${data.agent_id}`}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-green-500 dark:!bg-green-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const TriggerTelegramNode = ({ data }) => (
  <div className="px-5 py-4 border-3 border-sky-300 dark:border-sky-600 rounded-xl bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/60 dark:to-blue-900/60 shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-sm ring-2 ring-sky-200 dark:ring-sky-700">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg bg-gradient-to-br from-sky-500 to-blue-500 shadow-md">
        <Send size={18} className="text-white" />
      </div>
      <div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white">{data.label || 'Telegram Trigger'}</strong>
        <div className="flex items-center gap-1 mt-0.5">
          <Zap size={10} className="text-sky-600 dark:text-sky-400" />
          <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300">TRIGGER</span>
        </div>
      </div>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Telegram messages</div>
    {data.agent_id && (
      <div className="text-[10px] text-sky-700 dark:text-sky-300 font-medium">Agent: {data.agent_name || `#${data.agent_id}`}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-sky-500 dark:!bg-sky-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const TriggerInstagramNode = ({ data }) => (
  <div className="px-5 py-4 border-3 border-pink-300 dark:border-pink-600 rounded-xl bg-gradient-to-br from-pink-100 to-fuchsia-100 dark:from-pink-900/60 dark:to-fuchsia-900/60 shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-sm ring-2 ring-pink-200 dark:ring-pink-700">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-fuchsia-500 shadow-md">
        <Instagram size={18} className="text-white" />
      </div>
      <div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white">{data.label || 'Instagram Trigger'}</strong>
        <div className="flex items-center gap-1 mt-0.5">
          <Zap size={10} className="text-pink-600 dark:text-pink-400" />
          <span className="text-[10px] font-semibold text-pink-700 dark:text-pink-300">TRIGGER</span>
        </div>
      </div>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Instagram DMs</div>
    {data.agent_id && (
      <div className="text-[10px] text-pink-700 dark:text-pink-300 font-medium">Agent: {data.agent_name || `#${data.agent_id}`}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-pink-500 dark:!bg-pink-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const TriggerTwilioVoiceNode = ({ data }) => (
  <div className="px-5 py-4 border-3 border-red-300 dark:border-red-600 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900/60 dark:to-orange-900/60 shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-sm ring-2 ring-red-200 dark:ring-red-700">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 shadow-md">
        <PhoneCall size={18} className="text-white" />
      </div>
      <div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white">{data.label || 'Twilio Voice Trigger'}</strong>
        <div className="flex items-center gap-1 mt-0.5">
          <Zap size={10} className="text-red-600 dark:text-red-400" />
          <span className="text-[10px] font-semibold text-red-700 dark:text-red-300">TRIGGER</span>
        </div>
      </div>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Voice calls via Twilio</div>
    {data.agent_id && (
      <div className="text-[10px] text-red-700 dark:text-red-300 font-medium">Agent: {data.agent_name || `#${data.agent_id}`}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-red-500 dark:!bg-red-400 border-2 border-white dark:border-slate-800" />
  </div>
);

export const TriggerFreeSwitchNode = ({ data }) => (
  <div className="px-5 py-4 border-3 border-teal-300 dark:border-teal-600 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/60 dark:to-cyan-900/60 shadow-xl hover:shadow-2xl transition-shadow backdrop-blur-sm ring-2 ring-teal-200 dark:ring-teal-700">
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shadow-md">
        <Server size={18} className="text-white" />
      </div>
      <div>
        <strong className="text-sm font-bold text-slate-900 dark:text-white">{data.label || 'FreeSWITCH Trigger'}</strong>
        <div className="flex items-center gap-1 mt-0.5">
          <Zap size={10} className="text-teal-600 dark:text-teal-400" />
          <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300">TRIGGER</span>
        </div>
      </div>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Voice calls via FreeSWITCH</div>
    {data.agent_id && (
      <div className="text-[10px] text-teal-700 dark:text-teal-300 font-medium">Agent: {data.agent_name || `#${data.agent_id}`}</div>
    )}
    <Handle type="source" position={Position.Bottom} id="message" className="w-4 h-4 !bg-teal-500 dark:!bg-teal-400 border-2 border-white dark:border-slate-800" />
  </div>
);

// ========== LOOP NODES ==========

export const ForEachLoopNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-teal-200 dark:border-teal-700 rounded-xl bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/50 dark:to-cyan-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm min-w-[160px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-teal-500 dark:!bg-teal-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-teal-500 dark:bg-teal-600">
        <Repeat size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'For Each'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Iterate over array</div>
    {data.item_variable && (
      <div className="text-[10px] text-teal-700 dark:text-teal-300 mt-1 truncate">
        item: {data.item_variable}
      </div>
    )}
    {/* Loop body handle - bottom left */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="loop"
      style={{ left: '25%' }}
      className="w-3 h-3 !bg-teal-500 dark:!bg-teal-400 border-2 border-white dark:border-slate-800"
    />
    {/* Exit handle - bottom right */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="exit"
      style={{ left: '75%' }}
      className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800"
    />
    {/* Handle labels */}
    <div className="flex justify-between mt-2 px-4 text-[10px] font-medium">
      <span className="text-teal-600 dark:text-teal-400">loop</span>
      <span className="text-slate-500 dark:text-slate-400">exit</span>
    </div>
  </div>
);

export const WhileLoopNode = ({ data }) => (
  <div className="px-4 py-3 border-2 border-violet-200 dark:border-violet-700 rounded-xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/50 shadow-lg hover:shadow-xl transition-shadow backdrop-blur-sm min-w-[160px]">
    <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-violet-500 dark:!bg-violet-400 border-2 border-white dark:border-slate-800" />
    <div className="flex items-center gap-2 mb-2">
      <div className="p-1.5 rounded-lg bg-violet-500 dark:bg-violet-600">
        <RefreshCw size={16} className="text-white" />
      </div>
      <strong className="text-sm font-semibold text-slate-900 dark:text-white">{data.label || 'While Loop'}</strong>
    </div>
    <div className="text-xs text-slate-600 dark:text-slate-400 font-medium">Repeat while true</div>
    {data.conditions && data.conditions.length > 0 && (
      <div className="text-[10px] text-violet-700 dark:text-violet-300 mt-1">
        {data.conditions.length} condition{data.conditions.length > 1 ? 's' : ''}
      </div>
    )}
    {/* Loop body handle - bottom left */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="loop"
      style={{ left: '25%' }}
      className="w-3 h-3 !bg-violet-500 dark:!bg-violet-400 border-2 border-white dark:border-slate-800"
    />
    {/* Exit handle - bottom right */}
    <Handle
      type="source"
      position={Position.Bottom}
      id="exit"
      style={{ left: '75%' }}
      className="w-3 h-3 !bg-slate-500 dark:!bg-slate-400 border-2 border-white dark:border-slate-800"
    />
    {/* Handle labels */}
    <div className="flex justify-between mt-2 px-4 text-[10px] font-medium">
      <span className="text-violet-600 dark:text-violet-400">loop</span>
      <span className="text-slate-500 dark:text-slate-400">exit</span>
    </div>
  </div>
);


import React from 'react';
import { Handle, Position } from 'reactflow';
import { Bot, Cog, GitBranch, MessageSquare, Ear, HelpCircle, BookOpen, Code, SquareStack, Globe, ClipboardList } from 'lucide-react'; // Import HelpCircle icon


// ... (Keep existing LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode components as they are)

export const LlmNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f8faff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <Bot size={18} style={{ marginRight: '8px', color: '#4a90e2' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>LLM Prompt</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="error" style={{ background: '#f44336' }} />
  </div>
);

export const ToolNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f8fff8', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <Cog size={18} style={{ marginRight: '8px', color: '#5cb85c' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Tool Execution</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="error" style={{ background: '#f44336' }} />
  </div>
);

export const ConditionNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fff8f8', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <GitBranch size={18} style={{ marginRight: '8px', color: '#d9534f' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Conditional Logic</div>
    <Handle type="source" position={Position.Bottom} id="true" style={{ left: '25%', background: '#5cb85c' }} />
    <Handle type="source" position={Position.Bottom} id="false" style={{ left: '75%', background: '#d9534f' }} />
  </div>
);

export const OutputNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fffff8', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <MessageSquare size={18} style={{ marginRight: '8px', color: '#f0ad4e' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Workflow Output</div>
  </div>
);

export const StartNode = ({ data }) => (
    <div className="react-flow__node-default" style={{ padding: '15px 25px', border: '2px dashed #ccc', borderRadius: '50px', background: '#ffffff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ fontSize: '15px', color: '#333' }}>{data.label}</strong>
      </div>
      <div style={{ fontSize: '12px', color: '#777' }}>Workflow Start</div>
      <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    </div>
);

export const ListenNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f0f8ff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <Ear size={18} style={{ marginRight: '8px', color: '#5bc0de' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label || 'Listen for Input'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Pauses for user input</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="error" style={{ background: '#f44336' }} />
  </div>
);

export const PromptNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#fffaf0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <HelpCircle size={18} style={{ marginRight: '8px', color: '#f0ad4e' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label || 'Prompt for Input'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Asks user a question and waits</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
  </div>
);

export const KnowledgeNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f0f8ff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <BookOpen size={18} style={{ marginRight: '8px', color: '#5bc0de' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label || 'Knowledge Search'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Searches a knowledge base</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="error" style={{ background: '#f44336' }} />
  </div>
);

export const CodeNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f8f8f8', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <Code size={18} style={{ marginRight: '8px', color: '#6c757d' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label || 'Code Execution'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Executes custom Python code</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="error" style={{ background: '#f44336' }} />
  </div>
);

export const DataManipulationNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#e6f7ff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <SquareStack size={18} style={{ marginRight: '8px', color: '#1890ff' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label || 'Data Manipulation'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Transforms data using an expression</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="error" style={{ background: '#f44336' }} />
  </div>
);

export const HttpRequestNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f0fff0', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <Globe size={18} style={{ marginRight: '8px', color: '#3cb371' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label || 'HTTP Request'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Makes an HTTP request</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
    <Handle type="source" position={Position.Right} id="error" style={{ background: '#f44336' }} />
  </div>
);

export const FormNode = ({ data }) => (
  <div className="react-flow__node-default" style={{ padding: '15px', border: '1px solid #e0e0e0', borderRadius: '8px', background: '#f5f0ff', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
    <Handle type="target" position={Position.Top} style={{ background: '#555' }} />
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
      <ClipboardList size={18} style={{ marginRight: '8px', color: '#7a42f4' }} />
      <strong style={{ fontSize: '15px', color: '#333' }}>{data.label || 'Display Form'}</strong>
    </div>
    <div style={{ fontSize: '12px', color: '#777' }}>Pauses for user to fill form</div>
    <Handle type="source" position={Position.Bottom} id="output" style={{ background: '#555' }} />
  </div>
);

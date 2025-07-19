
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

const PropertiesPanel = ({ selectedNode, setNodes, deleteNode }) => {
  const [tools, setTools] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/tools/?company_id=1', { // Hardcoded company ID
          headers: { 'X-Company-ID': '1' },
        });
        if (!response.ok) throw new Error('Failed to fetch tools');
        const data = await response.json();
        setTools(data);
      } catch (error) {
        console.error('Error fetching tools:', error);
        toast.error("Failed to load tools.");
      }
    };
    const fetchKnowledgeBases = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/knowledge-bases/?company_id=1', { // Hardcoded company ID
          headers: { 'X-Company-ID': '1' },
        });
        if (!response.ok) throw new Error('Failed to fetch knowledge bases');
        const data = await response.json();
        setKnowledgeBases(data);
      } catch (error) {
        console.error('Error fetching knowledge bases:', error);
        toast.error("Failed to load knowledge bases.");
      }
    };

    fetchTools();
    fetchKnowledgeBases();
  }, []);

  const updateNodeData = (data) => {
    setNodes((nds) =>
      nds.map((node) =>
        node.id === selectedNode.id ? { ...node, data: { ...node.data, ...data } } : node
      )
    );
  };

  const onLabelChange = (event) => {
    updateNodeData({ label: event.target.value });
  };

  const onToolChange = (toolName) => {
    const tool = tools.find(t => t.name === toolName);
    updateNodeData({ 
      tool: toolName, 
      // Pass the tool's parameters to the node so we can render handles
      toolParameters: tool?.parameters?.properties || {},
      // Reset user-set params when tool changes
      params: {} 
    });
  };

  const onParamChange = (paramName, value) => {
    const newParams = { ...selectedNode.data.params, [paramName]: value };
    updateNodeData({ params: newParams });
  };

  const renderToolParams = () => {
    const tool = tools.find(t => t.name === selectedNode.data.tool);
    if (!tool || !tool.parameters || !tool.parameters.properties) return null;

    return (
      <div style={{ marginTop: '15px' }}>
        <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>Tool Parameters</h4>
        {Object.entries(tool.parameters.properties).map(([paramName, param]) => (
          <div key={paramName} style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{param.description || paramName}</label>
            <input
              type="text"
              value={selectedNode.data.params?.[paramName] || ''}
              onChange={(e) => onParamChange(paramName, e.target.value)}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              placeholder={`e.g., {{context.value}} or {{step1.output}}`}
              readOnly={selectedNode.data.params?.[paramName]?.startsWith('{{')}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderNodeProperties = () => {
    if (!selectedNode) return <div style={{ color: '#888' }}>Select a node to view its properties.</div>;

    switch (selectedNode.type) {
      case 'input':
        return (
          <div>
            <label>Trigger:</label>
            <select style={{ width: '100%', padding: '8px' }}>
              <option>User message</option>
              <option>API call</option>
            </select>
          </div>
        );
      case 'llm':
        return (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Node Label:</label>
              <input type="text" value={selectedNode.data.label} onChange={onLabelChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Model:</label>
              <input
                type="text"
                value={selectedNode.data.model || ''}
                onChange={(e) => updateNodeData({ model: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder="e.g., gemini-pro or {{prev_step.output}}"
                readOnly={selectedNode.data.model?.startsWith('{{')}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Knowledge Base:</label>
              <select
                value={selectedNode.data.knowledge_base_id || ''}
                onChange={(e) => updateNodeData({ knowledge_base_id: e.target.value ? parseInt(e.target.value) : null })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
              >
                <option value="">None</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Prompt:</label>
              <textarea
                value={selectedNode.data.prompt || ''}
                onChange={(e) => updateNodeData({ prompt: e.target.value })}
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', minHeight: '100px' }}
                placeholder="e.g., What is the capital of {{country}}? or {{prev_step.output}}"
                readOnly={selectedNode.data.prompt?.startsWith('{{')}
              />
            </div>
          </div>
        );
      case 'output':
        return (
          <div>
            <label>Action:</label>
            <select style={{ width: '100%', padding: '8px' }}>
              <option>Send message</option>
              <option>End conversation</option>
            </select>
          </div>
        );
      default:
        return (
          <div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Node Label:</label>
              <input type="text" value={selectedNode.data.label} onChange={onLabelChange} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Tool:</label>
              <select 
                style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }} 
                onChange={(e) => onToolChange(e.target.value)} 
                value={selectedNode.data.tool || ''}
              >
                <option value="">Select a tool</option>
                {tools.map(tool => <option key={tool.id} value={tool.name}>{tool.name}</option>)}
              </select>
            </div>
            {renderToolParams()}
          </div>
        );
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%' }}>
      <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '20px' }}>Properties</div>
      {renderNodeProperties()}
      {selectedNode && (
        <button onClick={deleteNode} style={{ marginTop: '20px', padding: '10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>
          Delete Node
        </button>
      )}
    </div>
  );
};

export default PropertiesPanel;

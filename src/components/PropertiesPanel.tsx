import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from "@/hooks/useAuth";

// A new component for a text input with a variable selector dropdown
const VariableInput = ({ value, onChange, placeholder, availableVars }) => {
    const [showVars, setShowVars] = useState(false);
    const containerRef = useRef(null);

    const handleSelectVar = (varValue) => {
        // The onChange prop expects an event-like object
        onChange({ target: { value: varValue } });
        setShowVars(false);
    };

    // Close dropdown if clicked outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowVars(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [containerRef]);

    return (
        <div style={{ position: 'relative' }} ref={containerRef}>
            <input
                type="text"
                value={value || ''}
                onChange={onChange}
                style={{ width: '100%', padding: '8px', paddingRight: '40px', borderRadius: '4px', border: '1px solid #ccc' }}
                placeholder={placeholder}
            />
            <button 
                onClick={() => setShowVars(!showVars)}
                title="Select a variable"
                style={{ 
                    position: 'absolute', 
                    right: '1px', 
                    top: '1px', 
                    bottom: '1px',
                    border: 'none',
                    background: '#f0f0f0',
                    cursor: 'pointer',
                    padding: '0 10px',
                    borderTopRightRadius: '4px',
                    borderBottomRightRadius: '4px'
                }}
            >
                {`{...}`}
            </button>
            {showVars && (
                <ul style={{ 
                    position: 'absolute', 
                    top: '100%', 
                    left: 0, 
                    right: 0, 
                    background: 'white', 
                    border: '1px solid #ccc', 
                    listStyle: 'none', 
                    padding: '5px 0', 
                    margin: '2px 0 0', 
                    zIndex: 10,
                    maxHeight: '200px',
                    overflowY: 'auto',
                    borderRadius: '4px',
                    boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                }}>
                    {availableVars.length === 0 ? (
                        <li style={{ padding: '8px 12px', color: '#888' }}>No variables available</li>
                    ) : (
                        availableVars.map(v => (
                            <li 
                                key={v.value} 
                                onClick={() => handleSelectVar(v.value)}
                                style={{ padding: '8px 12px', cursor: 'pointer', fontSize: '14px' }}
                                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
                                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                            >
                                <strong style={{ display: 'block' }}>{v.label}</strong>
                                <div style={{ fontSize: '12px', color: '#555' }}>{v.value}</div>
                            </li>
                        ))
                    )}
                </ul>
            )}
        </div>
    );
};


const PropertiesPanel = ({ selectedNode, nodes, setNodes, deleteNode }) => {
  const [tools, setTools] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const { authFetch } = useAuth();

  // Memoize the calculation of available variables
  const availableVariables = useMemo(() => {
    if (!selectedNode) return [];
    
    const vars = [];
    nodes.forEach(node => {
        // Add node outputs (excluding the current node itself)
        if (node.id !== selectedNode.id) {
            vars.push({
                label: `Output of "${node.data.label || node.id}"`,
                value: `{{${node.id}.output}}`
            });
        }
        // Add context variables from listen/prompt nodes
        if ((node.type === 'listen' || node.type === 'prompt') && node.data.params?.save_to_variable) {
            const varName = node.data.params.save_to_variable;
            const contextVar = { label: `Variable "${varName}"`, value: `{{context.${varName}}}` };
            if (!vars.some(v => v.value === contextVar.value)) {
                vars.push(contextVar);
            }
        }
    });
    return vars;
  }, [selectedNode, nodes]);

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const response = await authFetch('/api/v1/tools/?company_id=1');
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
        const response = await authFetch('/api/v1/knowledge-bases/?company_id=1');
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
      toolParameters: tool?.parameters?.properties || {},
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
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{param.title || paramName}</label>
            <VariableInput
              value={selectedNode.data.params?.[paramName]}
              onChange={(e) => onParamChange(paramName, e.target.value)}
              placeholder={param.description}
              availableVars={availableVariables}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderNodeProperties = () => {
    if (!selectedNode) return <div style={{ color: '#888', padding: '20px' }}>Select a node to view its properties.</div>;

    const commonInputStyle = { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d0d0d0', fontSize: '14px', boxSizing: 'border-box' };
    const labelStyle = { display: 'block', marginBottom: '6px', fontWeight: '500', fontSize: '14px', color: '#333' };
    const sectionStyle = { marginBottom: '20px', padding: '15px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #eee' };

    return (
      <div style={{ padding: '10px' }}>
        <div style={sectionStyle}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Node Settings</h3>
          <div style={{ marginBottom: '15px' }}>
            <label style={labelStyle}>Node Label:</label>
            <input type="text" value={selectedNode.data.label || ''} onChange={onLabelChange} style={commonInputStyle} />
          </div>
        </div>

        {selectedNode.type === 'llm' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>LLM Configuration</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Model:</label>
              <select
                value={selectedNode.data.model || ''}
                onChange={(e) => updateNodeData({ model: e.target.value })}
                style={commonInputStyle}
              >
                <option value="">Select a model</option>
                <option value="groq/llama3-8b-8192">Groq Llama3 8b</option>
                <option value="gemini/gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Knowledge Base:</label>
              <select
                value={selectedNode.data.knowledge_base_id || ''}
                onChange={(e) => updateNodeData({ knowledge_base_id: e.target.value ? parseInt(e.target.value) : null })}
                style={commonInputStyle}
              >
                <option value="">None</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Prompt:</label>
              <VariableInput
                value={selectedNode.data.prompt || ''}
                onChange={(e) => updateNodeData({ prompt: e.target.value })}
                placeholder="e.g., What is the capital of {{context.country}}?"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'tool' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Tool Configuration</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Tool:</label>
              <select 
                style={commonInputStyle} 
                onChange={(e) => onToolChange(e.target.value)} 
                value={selectedNode.data.tool || ''}
              >
                <option value="">Select a tool</option>
                {tools.map(tool => <option key={tool.id} value={tool.name}>{tool.name}</option>)}
              </select>
            </div>
            {renderToolParams()}
          </div>
        )}

        {selectedNode.type === 'condition' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Condition Logic</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Condition Expression:</label>
              <VariableInput
                value={selectedNode.data.condition || ''}
                onChange={(e) => updateNodeData({ condition: e.target.value })}
                placeholder="e.g., {{context.variable}} == 'some_value'" 
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'knowledge' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Knowledge Search</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Knowledge Base:</label>
              <select
                value={selectedNode.data.knowledge_base_id || ''}
                onChange={(e) => updateNodeData({ knowledge_base_id: e.target.value ? parseInt(e.target.value) : null })}
                style={commonInputStyle}
              >
                <option value="">None</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>
                    {kb.name}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Query:</label>
              <VariableInput
                value={selectedNode.data.query || ''}
                onChange={(e) => updateNodeData({ query: e.target.value })}
                placeholder="e.g., What is the capital of {{context.country}}?"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'http_request' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>HTTP Request</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Node Label:</label>
              <input type="text" value={selectedNode.data.label || ''} onChange={onLabelChange} style={commonInputStyle} />
            </div>
            <div style={{ marginBottom: '15px'}}> 
              <label style={labelStyle}>URL:</label>
              <VariableInput
                value={selectedNode.data.url || ''}
                onChange={(e) => updateNodeData({ url: e.target.value })}
                placeholder="e.g., https://api.example.com/data"
                availableVars={availableVariables}
              />
            </div>
            <div style={{ marginBottom: '15px'}}> 
              <label style={labelStyle}>Method:</label>
              <select
                value={selectedNode.data.method || 'GET'}
                onChange={(e) => updateNodeData({ method: e.target.value })}
                style={commonInputStyle}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px'}}> 
              <label style={labelStyle}>Headers (JSON):</label>
              <textarea
                value={selectedNode.data.headers || ''}
                onChange={(e) => updateNodeData({ headers: e.target.value })}
                placeholder='e.g., {"Content-Type": "application/json"}'
                rows={4}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ marginBottom: '15px'}}> 
              <label style={labelStyle}>Body (JSON):</label>
              <textarea
                value={selectedNode.data.body || ''}
                onChange={(e) => updateNodeData({ body: e.target.value })}
                placeholder='e.g., {"key": "{{context.value}}"}'
                rows={6}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'data_manipulation' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Data Manipulation</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Node Label:</label>
              <input type="text" value={selectedNode.data.label || ''} onChange={onLabelChange} style={commonInputStyle} />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Expression (Python):</label>
              <textarea
                value={selectedNode.data.expression || ''}
                onChange={(e) => updateNodeData({ expression: e.target.value })}
                placeholder="e.g., context.user_input.upper()"
                rows={5}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Output Variable Name:</label>
              <input
                type="text"
                value={selectedNode.data.output_variable || ''}
                onChange={(e) => updateNodeData({ output_variable: e.target.value })}
                style={commonInputStyle}
                placeholder="e.g., transformed_data"
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'code' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Code Execution</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Python Code:</label>
              <textarea
                value={selectedNode.data.code || ''}
                onChange={(e) => updateNodeData({ code: e.target.value })}
                placeholder="e.g., print('Hello, World!') result = context.user_input * 2"
                rows={10}
                style={{ ...commonInputStyle, fontFamily: 'monospace' }}
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'listen' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Listen for Input</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Save User Input to Variable:</label>
              <input
                type="text"
                value={(selectedNode.data.params && selectedNode.data.params.save_to_variable) || ''}
                onChange={(e) => onParamChange('save_to_variable', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., user_email"
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'prompt' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Prompt for Input</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Prompt Text:</label>
              <VariableInput
                value={(selectedNode.data.params && selectedNode.data.params.prompt_text) || ''}
                onChange={(e) => onParamChange('prompt_text', e.target.value)}
                placeholder="Ask the user a question..."
                availableVars={availableVariables}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Options (comma-separated):</label>
              <input
                type="text"
                value={(selectedNode.data.params && selectedNode.data.params.options) || ''}
                onChange={(e) => onParamChange('options', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., Yes, No, Maybe"
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Save User Input to Variable:</label>
              <input
                type="text"
                value={(selectedNode.data.params && selectedNode.data.params.save_to_variable) || ''}
                onChange={(e) => onParamChange('save_to_variable', e.target.value)}
                style={commonInputStyle}
                placeholder="e.g., user_choice"
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'output' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Output Node</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Output Value:</label>
              <VariableInput
                value={selectedNode.data.output_value || ''}
                onChange={(e) => updateNodeData({ output_value: e.target.value })}
                placeholder="e.g., {{llm_node_id.output}}"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {selectedNode.type === 'start' && (
          <div style={sectionStyle}>
            <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#222' }}>Start Node</h3>
            <p style={{ fontSize: '14px', color: '#555' }}>This node marks the beginning of your workflow.</p>
            <div style={{ marginBottom: '15px' }}>
              <label style={labelStyle}>Initial Input Variable Name:</label>
              <input
                type="text"
                value={selectedNode.data.initial_input_variable || 'user_message'}
                onChange={(e) => updateNodeData({ initial_input_variable: e.target.value })}
                style={commonInputStyle}
                placeholder="e.g., user_query"
              />
            </div>
          </div>
        )}
      </div>
    );
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
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from "@/hooks/useAuth";

const VariableInput = ({ value, onChange, placeholder, availableVars }) => {
    const [showVars, setShowVars] = useState(false);
    const containerRef = useRef(null);

    const handleSelectVar = (varValue) => {
        onChange({ target: { value: varValue } });
        setShowVars(false);
    };

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
        <div className="relative" ref={containerRef}>
            <input
                type="text"
                value={value || ''}
                onChange={onChange}
                className="w-full px-3 py-2 pr-12 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={placeholder}
            />
            <button
                onClick={() => setShowVars(!showVars)}
                title="Select a variable"
                className="absolute right-0.5 top-0.5 bottom-0.5 border-none bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer px-3 rounded-r-md text-slate-700 dark:text-slate-300 text-sm transition-colors"
            >
                {`{...}`}
            </button>
            {showVars && (
                <ul className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 list-none p-0 mt-1 z-10 max-h-52 overflow-y-auto rounded-md shadow-lg">
                    {availableVars.length === 0 ? (
                        <li className="px-3 py-2 text-slate-500 dark:text-slate-400">No variables available</li>
                    ) : (
                        availableVars.map(v => (
                            <li
                                key={v.value}
                                onClick={() => handleSelectVar(v.value)}
                                className="px-3 py-2 cursor-pointer text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                            >
                                <strong className="block text-slate-900 dark:text-slate-100">{v.label}</strong>
                                <div className="text-xs text-slate-600 dark:text-slate-400">{v.value}</div>
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
  const [agents, setAgents] = useState([]);
  const { authFetch } = useAuth();

  // Inline styles for compatibility
  const sectionStyle = {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#fafafa'
  };

  const labelStyle = {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    fontSize: '14px',
    color: '#333'
  };

  const commonInputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid #d0d0d0',
    fontSize: '14px',
    backgroundColor: '#fff',
    color: '#222'
  };

  // *** THE FIX: Find the most up-to-date version of the selected node from the nodes list ***
  const currentNode = useMemo(() => {
    if (!selectedNode) return null;
    return nodes.find(n => n.id === selectedNode.id);
  }, [selectedNode, nodes]);

  const availableVariables = useMemo(() => {
    if (!currentNode) return [];
    const vars = [];
    nodes.forEach(node => {
        if (node.id !== currentNode.id) {
            vars.push({
                label: `Output of "${node.data.label || node.id}"`,
                value: `{{${node.id}.output}}`
            });
        }
        if ((node.type === 'listen' || node.type === 'prompt' || node.type === 'form') && node.data.params?.save_to_variable) {
            const varName = node.data.params.save_to_variable;
            const contextVar = { label: `Variable "${varName}"`, value: `{{context.${varName}}}` };
            if (!vars.some(v => v.value === contextVar.value)) {
                vars.push(contextVar);
            }
        }
    });
    return vars;
  }, [currentNode, nodes]);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [toolsRes, kbRes, agentsRes] = await Promise.all([
          authFetch('/api/v1/tools/?company_id=1'),
          authFetch('/api/v1/knowledge-bases/?company_id=1'),
          authFetch('/api/v1/agents')
        ]);
        if (!toolsRes.ok) throw new Error('Failed to fetch tools');
        if (!kbRes.ok) throw new Error('Failed to fetch knowledge bases');
        if (!agentsRes.ok) throw new Error('Failed to fetch agents');
        const toolsData = await toolsRes.json();
        const kbData = await kbRes.json();
        const agentsData = await agentsRes.json();
        setTools(toolsData);
        setKnowledgeBases(kbData);
        setAgents(agentsData);
      } catch (error) {
        toast.error("Failed to load resources.");
      }
    };
    fetchResources();
  }, [authFetch]);

  const handleDataChange = (key, value) => {
    if (!currentNode) return;
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === currentNode.id) {
          const newData = { ...node.data, [key]: value };
          return { ...node, data: newData };
        }
        return node;
      })
    );
  };

  const handleParamsChange = (key, value) => {
    if (!currentNode) return;
    const newParams = { ...(currentNode.data.params || {}), [key]: value };
    handleDataChange('params', newParams);
  };

  const handleAgentChange = (agentId) => {
    if (!currentNode) return;
    const agent = agents.find(a => a.id === parseInt(agentId));
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === currentNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              agent_id: agentId ? parseInt(agentId) : null,
              agent_name: agent ? agent.name : null
            }
          };
        }
        return node;
      })
    );
  };

  const handleFieldChange = (index, key, value) => {
    const newFields = [...(currentNode.data.params?.fields || [])];
    newFields[index] = { ...newFields[index], [key]: value };
    handleParamsChange('fields', newFields);
  };

  const onToolChange = (toolName) => {
    const tool = tools.find(t => t.name === toolName);
    setNodes(nds => nds.map(n => {
      if (n.id === currentNode.id) {
        return {
          ...n,
          data: {
            ...n.data,
            tool: toolName,
            params: {
              toolParameters: tool?.parameters?.properties || {}
            }
          }
        }
      }
      return n;
    }))
  };

  const renderToolParams = () => {
    const tool = tools.find(t => t.name === currentNode.data.tool);
    if (!tool || !tool.parameters || !tool.parameters.properties) return null;

    return (
      <div style={{ marginTop: '15px' }}>
        <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>Tool Parameters</h4>
        {Object.entries(tool.parameters.properties).map(([paramName, param]) => (
          <div key={paramName} style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{param.title || paramName}</label>
            <VariableInput
              value={currentNode.data.params?.[paramName] || ''}
              onChange={(e) => handleParamsChange(paramName, e.target.value)}
              placeholder={param.description}
              availableVars={availableVariables}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderNodeProperties = () => {
    if (!currentNode) return <div className="text-slate-500 dark:text-slate-400 p-5">Select a node to view its properties.</div>;

    return (
      <div className="p-3">
        <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Node Settings</h3>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Node Label:</label>
            <input
              type="text"
              value={currentNode.data.label || ''}
              onChange={(e) => handleDataChange('label', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
          </div>
        </div>

        {currentNode.type === 'llm' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">LLM Configuration</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Model:</label>
              <select
                value={currentNode.data.model || ''}
                onChange={(e) => handleDataChange('model', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select a model</option>
                <option value="groq/llama3-8b-8192">Groq Llama3 8b</option>
                <option value="gemini/gemini-pro">Gemini Pro</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Knowledge Base:</label>
              <select
                value={currentNode.data.knowledge_base_id || ''}
                onChange={(e) => handleDataChange('knowledge_base_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">None</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Prompt:</label>
              <VariableInput
                value={currentNode.data.prompt || ''}
                onChange={(e) => handleDataChange('prompt', e.target.value)}
                placeholder="e.g., What is the capital of {{context.country}}?"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'tool' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Tool Configuration</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Tool:</label>
              <select
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                onChange={(e) => onToolChange(e.target.value)}
                value={currentNode.data.tool || ''}
              >
                <option value="">Select a tool</option>
                {tools.map(tool => <option key={tool.id} value={tool.name}>{tool.name}</option>)}
              </select>
            </div>
            {renderToolParams()}
          </div>
        )}

        {currentNode.type === 'condition' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Condition Logic</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Variable:</label>
              <select
                value={currentNode.data.variable || ''}
                onChange={(e) => handleDataChange('variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select a variable</option>
                {availableVariables.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Operator:</label>
              <select
                value={currentNode.data.operator || 'equals'}
                onChange={(e) => handleDataChange('operator', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="equals">Equals</option>
                <option value="not_equals">Not Equals</option>
                <option value="contains">Contains</option>
                <option value="greater_than">Greater Than</option>
                <option value="less_than">Less Than</option>
                <option value="is_set">Is Set (Exists)</option>
                <option value="is_not_set">Is Not Set (Doesn't Exist)</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Value:</label>
              <input
                type="text"
                value={currentNode.data.value || ''}
                onChange={(e) => handleDataChange('value', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Value to compare against"
                disabled={['is_set', 'is_not_set'].includes(currentNode.data.operator)}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'knowledge' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Knowledge Search</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Knowledge Base:</label>
              <select
                value={currentNode.data.knowledge_base_id || ''}
                onChange={(e) => handleDataChange('knowledge_base_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">None</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Query:</label>
              <VariableInput
                value={currentNode.data.query || ''}
                onChange={(e) => handleDataChange('query', e.target.value)}
                placeholder="e.g., What is the capital of {{context.country}}?"
                availableVars={availableVariables}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'http_request' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">HTTP Request</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">URL:</label>
              <VariableInput
                value={currentNode.data.url || ''}
                onChange={(e) => handleDataChange('url', e.target.value)}
                placeholder="e.g., https://api.example.com/data"
                availableVars={availableVariables}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Method:</label>
              <select
                value={currentNode.data.method || 'GET'}
                onChange={(e) => handleDataChange('method', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Headers (JSON):</label>
              <textarea
                value={currentNode.data.headers || ''}
                onChange={(e) => handleDataChange('headers', e.target.value)}
                placeholder='e.g., {"Content-Type": "application/json"}'
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Body (JSON):</label>
              <textarea
                value={currentNode.data.body || ''}
                onChange={(e) => handleDataChange('body', e.target.value)}
                placeholder='e.g., {"key": "{{context.value}}"}'
                rows={6}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'data_manipulation' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Data Manipulation</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Expression (Python):</label>
              <textarea
                value={currentNode.data.expression || ''}
                onChange={(e) => handleDataChange('expression', e.target.value)}
                placeholder="e.g., context.user_input.upper()"
                rows={5}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Output Variable Name:</label>
              <input
                type="text"
                value={currentNode.data.output_variable || ''}
                onChange={(e) => handleDataChange('output_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., transformed_data"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'code' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Code Execution</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Python Code:</label>
              <textarea
                value={currentNode.data.code || ''}
                onChange={(e) => handleDataChange('code', e.target.value)}
                placeholder="e.g., print('Hello, World!') result = context.user_input * 2"
                rows={10}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'listen' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Listen for Input</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Save User Input to Variable:</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., user_email"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'prompt' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Prompt for Input</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Prompt Text:</label>
              <VariableInput
                value={(currentNode.data.params?.prompt_text) || ''}
                onChange={(e) => handleParamsChange('prompt_text', e.target.value)}
                placeholder="e.g., What would you like to do today?"
                availableVars={availableVariables}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                The message shown to the user.
              </p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Save Response As:</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., user_choice"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Variable to store user's response. Access with <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">{`{{context.${(currentNode.data.params?.save_to_variable) || 'variable_name'}}}`}</code>
              </p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Options (comma-separated):</label>
              <input
                type="text"
                value={(currentNode.data.params?.options) || ''}
                onChange={(e) => handleParamsChange('options', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., Login, Register, Browse"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Optional. Leave empty for free-form text input.
              </p>
            </div>
          </div>
        )}

        {currentNode.type === 'form' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Form Configuration</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Form Title:</label>
              <input
                type="text"
                value={(currentNode.data.params?.title) || ''}
                onChange={(e) => handleParamsChange('title', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., Customer Information"
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Save Form Data to Variable:</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., customer_data"
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">Form Fields</h4>
              {(currentNode.data.params?.fields || []).map((field, index) => (
                <div key={index} className="border border-slate-300 dark:border-slate-600 rounded-md p-3 mb-3 bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-center mb-3">
                    <strong className="text-sm text-slate-900 dark:text-slate-100">Field #{index + 1}</strong>
                    <button onClick={() => {
                      const newFields = [...currentNode.data.params.fields];
                      newFields.splice(index, 1);
                      handleParamsChange('fields', newFields);
                    }} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-transparent border-none cursor-pointer text-sm">Remove</button>
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">Name (Variable Key):</label>
                    <input type="text" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder="e.g., full_name" />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">Label (Display Text):</label>
                    <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder="e.g., Full Name" />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">Type:</label>
                    <select value={field.type} onChange={(e) => handleFieldChange(index, 'type', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400">
                      <option value="text">Text</option>
                      <option value="email">Email</option>
                      <option value="number">Number</option>
                      <option value="tel">Phone</option>
                      <option value="textarea">Text Area</option>
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const newFields = [...(currentNode.data.params?.fields || []), { name: '', label: '', type: 'text' }];
                handleParamsChange('fields', newFields);
              }} className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-dashed border-blue-300 dark:border-blue-700 rounded cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors text-sm font-medium">
                + Add Field
              </button>
            </div>
          </div>
        )}

        {currentNode.type === 'output' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Workflow Output</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Output Value:</label>
              <VariableInput
                value={currentNode.data.output_value || ''}
                onChange={(e) => handleDataChange('output_value', e.target.value)}
                placeholder="e.g., {{llm_node_id.output}}"
                availableVars={availableVariables}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                This message will be sent back to the user as the final response.
              </p>
            </div>
          </div>
        )}

        {currentNode.type === 'start' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Start Node</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">This node marks the beginning of your workflow.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Initial Input Variable Name:</label>
              <input
                type="text"
                value={currentNode.data.initial_input_variable || 'user_message'}
                onChange={(e) => handleDataChange('initial_input_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., user_query"
              />
            </div>
          </div>
        )}

        {/* ========== TRIGGER NODES ========== */}

        {/* WebSocket Trigger */}
        {currentNode.type === 'trigger_websocket' && (
          <div className="mb-5 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border-2 border-cyan-200 dark:border-cyan-700">
            <h3 className="text-base font-bold mb-2 text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">⚡</span> WebSocket Trigger
            </h3>
            <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-4">Triggers workflow when a WebSocket message is received</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Trigger Label:</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
                placeholder="e.g., Customer Support Chat"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Fallback Agent:</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Agent to use if workflow fails or no intent matches</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Auto Respond:</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
              >
                <option value="true">Yes - Auto respond immediately</option>
                <option value="false">No - Wait for manual trigger</option>
              </select>
            </div>
          </div>
        )}

        {/* WhatsApp Trigger */}
        {currentNode.type === 'trigger_whatsapp' && (
          <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
            <h3 className="text-base font-bold mb-2 text-green-900 dark:text-green-100 flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">⚡</span> WhatsApp Trigger
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">Triggers workflow when a WhatsApp message is received</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Trigger Label:</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder="e.g., WhatsApp Support"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Fallback Agent:</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Agent to use if workflow fails or no intent matches</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Auto Respond:</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
              >
                <option value="true">Yes - Auto respond immediately</option>
                <option value="false">No - Wait for manual trigger</option>
              </select>
            </div>
          </div>
        )}

        {/* Telegram Trigger */}
        {currentNode.type === 'trigger_telegram' && (
          <div className="mb-5 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border-2 border-sky-200 dark:border-sky-700">
            <h3 className="text-base font-bold mb-2 text-sky-900 dark:text-sky-100 flex items-center gap-2">
              <span className="text-sky-600 dark:text-sky-400">⚡</span> Telegram Trigger
            </h3>
            <p className="text-sm text-sky-700 dark:text-sky-300 mb-4">Triggers workflow when a Telegram message is received</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Trigger Label:</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
                placeholder="e.g., Telegram Bot Support"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Fallback Agent:</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Agent to use if workflow fails or no intent matches</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Auto Respond:</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
              >
                <option value="true">Yes - Auto respond immediately</option>
                <option value="false">No - Wait for manual trigger</option>
              </select>
            </div>
          </div>
        )}

        {/* Instagram Trigger */}
        {currentNode.type === 'trigger_instagram' && (
          <div className="mb-5 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-2 border-pink-200 dark:border-pink-700">
            <h3 className="text-base font-bold mb-2 text-pink-900 dark:text-pink-100 flex items-center gap-2">
              <span className="text-pink-600 dark:text-pink-400">⚡</span> Instagram Trigger
            </h3>
            <p className="text-sm text-pink-700 dark:text-pink-300 mb-4">Triggers workflow when an Instagram DM is received</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Trigger Label:</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
                placeholder="e.g., Instagram Customer Service"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Fallback Agent:</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
              >
                <option value="">Select Agent</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Agent to use if workflow fails or no intent matches</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Auto Respond:</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
              >
                <option value="true">Yes - Auto respond immediately</option>
                <option value="false">No - Wait for manual trigger</option>
              </select>
            </div>
          </div>
        )}

        {/* ========== CHAT & CONVERSATION NODES ========== */}

        {/* Intent Router Node */}
        {currentNode.type === 'intent_router' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Intent Router</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Route conversations based on detected intents.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Default Route (No Intent):</label>
              <select
                value={currentNode.data.default_route || ''}
                onChange={(e) => handleDataChange('default_route', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select default action</option>
                <option value="continue">Continue to next node</option>
                <option value="escalate">Escalate to human</option>
                <option value="fallback">Use fallback response</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Save Intent To Variable:</label>
              <input
                type="text"
                value={currentNode.data.intent_variable || 'detected_intent'}
                onChange={(e) => handleDataChange('intent_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., detected_intent"
              />
            </div>
          </div>
        )}

        {/* Entity Collector Node */}
        {currentNode.type === 'entity_collector' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Entity Collector</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Extract and collect entities from user messages.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Entities to Collect (comma-separated):</label>
              <input
                type="text"
                value={currentNode.data.entity_names || ''}
                onChange={(e) => handleDataChange('entity_names', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., order_number, email, phone"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Max Collection Attempts:</label>
              <input
                type="number"
                value={currentNode.data.max_attempts || 3}
                onChange={(e) => handleDataChange('max_attempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                min="1"
                max="10"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Save Entities To:</label>
              <input
                type="text"
                value={currentNode.data.save_to_variable || 'collected_entities'}
                onChange={(e) => handleDataChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., collected_entities"
              />
            </div>
          </div>
        )}

        {/* Check Entity Node */}
        {currentNode.type === 'check_entity' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Check Entity</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Verify if specific entities exist in the context.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Entity Name to Check:</label>
              <input
                type="text"
                value={currentNode.data.entity_name || ''}
                onChange={(e) => handleDataChange('entity_name', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., order_number"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Validation Rule:</label>
              <select
                value={currentNode.data.validation_rule || 'exists'}
                onChange={(e) => handleDataChange('validation_rule', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="exists">Entity exists</option>
                <option value="not_empty">Not empty</option>
                <option value="matches_pattern">Matches pattern</option>
              </select>
            </div>
            {currentNode.data.validation_rule === 'matches_pattern' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Regex Pattern:</label>
                <input
                  type="text"
                  value={currentNode.data.validation_pattern || ''}
                  onChange={(e) => handleDataChange('validation_pattern', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., ^ORD-[0-9]{6}$"
                />
              </div>
            )}
          </div>
        )}

        {/* Update Context Node */}
        {currentNode.type === 'update_context' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Update Context</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Add or update variables in the conversation context.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Variable Name:</label>
              <input
                type="text"
                value={currentNode.data.variable_name || ''}
                onChange={(e) => handleDataChange('variable_name', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., user_preferences"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Variable Value:</label>
              <VariableInput
                value={currentNode.data.variable_value || ''}
                onChange={(e) => handleDataChange('variable_value', e.target.value)}
                placeholder="e.g., {{context.selected_option}}"
                availableVars={availableVariables}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Update Mode:</label>
              <select
                value={currentNode.data.update_mode || 'set'}
                onChange={(e) => handleDataChange('update_mode', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="set">Set (overwrite)</option>
                <option value="append">Append to list</option>
                <option value="merge">Merge objects</option>
              </select>
            </div>
          </div>
        )}

        {/* Tag Conversation Node */}
        {currentNode.type === 'tag_conversation' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Tag Conversation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Add tags to the conversation for organization and analytics.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Tags (comma-separated):</label>
              <input
                type="text"
                value={currentNode.data.tags || ''}
                onChange={(e) => handleDataChange('tags', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="e.g., support, refund, high-priority"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Dynamic Tag From Variable:</label>
              <select
                value={currentNode.data.dynamic_tag_variable || ''}
                onChange={(e) => handleDataChange('dynamic_tag_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">None (use static tags only)</option>
                {availableVariables.map(v => (
                  <option key={v.value} value={v.value}>{v.label}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Assign to Agent Node */}
        {currentNode.type === 'assign_to_agent' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Assign to Agent</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Route conversation to a specific agent or team.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Assignment Type:</label>
              <select
                value={currentNode.data.assignment_type || 'specific'}
                onChange={(e) => handleDataChange('assignment_type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="specific">Specific Agent</option>
                <option value="team">Team/Department</option>
                <option value="round_robin">Round Robin</option>
                <option value="least_busy">Least Busy</option>
              </select>
            </div>
            {currentNode.data.assignment_type === 'specific' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Agent ID/Email:</label>
                <input
                  type="text"
                  value={currentNode.data.agent_id || ''}
                  onChange={(e) => handleDataChange('agent_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., agent@company.com"
                />
              </div>
            )}
            {currentNode.data.assignment_type === 'team' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Team Name:</label>
                <input
                  type="text"
                  value={currentNode.data.team_name || ''}
                  onChange={(e) => handleDataChange('team_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder="e.g., Support, Sales, Technical"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Priority:</label>
              <select
                value={currentNode.data.priority || 'normal'}
                onChange={(e) => handleDataChange('priority', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
        )}

        {/* Set Status Node */}
        {currentNode.type === 'set_status' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Set Status</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Update the conversation status.</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">New Status:</label>
              <select
                value={currentNode.data.status || 'active'}
                onChange={(e) => handleDataChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="active">Active</option>
                <option value="waiting">Waiting for User</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
                <option value="escalated">Escalated</option>
                <option value="pending">Pending Review</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Status Reason (Optional):</label>
              <VariableInput
                value={currentNode.data.status_reason || ''}
                onChange={(e) => handleDataChange('status_reason', e.target.value)}
                placeholder="e.g., Issue resolved via {{context.resolution_method}}"
                availableVars={availableVariables}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Auto-close After (minutes):</label>
              <input
                type="number"
                value={currentNode.data.auto_close_minutes || ''}
                onChange={(e) => handleDataChange('auto_close_minutes', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Leave empty for no auto-close"
                min="0"
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 h-full overflow-y-auto bg-white dark:bg-slate-800">
      <div className="font-bold text-base mb-5 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-slate-100">Properties</div>
      {renderNodeProperties()}
      {currentNode && (
        <button
          onClick={deleteNode}
          className="mt-5 px-4 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white border-none rounded-lg cursor-pointer w-full transition-colors font-medium"
        >
          Delete Node
        </button>
      )}
    </div>
  );
};

export default PropertiesPanel;
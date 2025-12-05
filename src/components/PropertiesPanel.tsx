import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from '@/hooks/useI18n';

const VariableInput = ({ value, onChange, placeholder, availableVars, isRTL }) => {
  const { t } = useI18n();
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
        <div className="relative" ref={containerRef} dir={isRTL ? 'rtl' : 'ltr'}>
            <input
                type="text"
                value={value || ''}
                onChange={onChange}
                className={`w-full px-3 py-2 ${isRTL ? 'pl-12 pr-3' : 'pr-12 pl-3'} rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400`}
                placeholder={placeholder}
            />
            <button
                onClick={() => setShowVars(!showVars)}
                title={t("workflows.editor.properties.selectVariable")}
                className={`absolute ${isRTL ? 'left-0.5 rounded-l-md' : 'right-0.5 rounded-r-md'} top-0.5 bottom-0.5 border-none bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 cursor-pointer px-3 text-slate-700 dark:text-slate-300 text-sm transition-colors`}
            >
                {`{...}`}
            </button>
            {showVars && (
                <ul className="absolute top-full left-0 right-0 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 list-none p-0 mt-1 z-10 max-h-52 overflow-y-auto rounded-md shadow-lg">
                    {availableVars.length === 0 ? (
                        <li className="px-3 py-2 text-slate-500 dark:text-slate-400">{t("workflows.editor.properties.noVariablesAvailable")}</li>
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
  const { t, isRTL } = useI18n();
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
            tool_name: toolName,  // Standardized key for backend
            tool: toolName,       // Keep for backwards compatibility
            parameters: {},       // Standardized key for backend
            params: {             // Keep for backwards compatibility
              toolParameters: tool?.parameters?.properties || {}
            }
          }
        }
      }
      return n;
    }))
  };

  const handleToolParamsChange = (paramName, value) => {
    // Write to both 'parameters' (new standard) and 'params' (backwards compat)
    if (!currentNode) return;
    const newParams = { ...(currentNode.data.params || {}), [paramName]: value };
    const newParameters = { ...(currentNode.data.parameters || {}), [paramName]: value };
    setNodes(nds => nds.map(n => {
      if (n.id === currentNode.id) {
        return { ...n, data: { ...n.data, params: newParams, parameters: newParameters } };
      }
      return n;
    }));
  };

  const renderToolParams = () => {
    // Support both tool_name (new) and tool (old) keys for backwards compatibility
    const toolName = currentNode.data.tool_name || currentNode.data.tool;
    const tool = tools.find(t => t.name === toolName);
    if (!tool || !tool.parameters || !tool.parameters.properties) return null;

    // Read from both parameters (new) and params (old) keys
    const toolParams = currentNode.data.parameters || currentNode.data.params || {};

    return (
      <div style={{ marginTop: '15px' }}>
        <h4 style={{ marginBottom: '10px', fontWeight: 'bold' }}>Tool Parameters</h4>
        {Object.entries(tool.parameters.properties).map(([paramName, param]: [string, any]) => {
          // Display labels for enum options (especially for languages)
          const getEnumLabel = (value: string): string => {
            const languageLabels: Record<string, string> = {
              'auto': 'Auto Detect',
              'en': 'English',
              'ar': 'Arabic (العربية)',
              'es': 'Spanish (Español)',
              'fr': 'French (Français)',
              'de': 'German (Deutsch)',
              'zh': 'Chinese (中文)',
              'ja': 'Japanese (日本語)',
              'ko': 'Korean (한국어)',
              'pt': 'Portuguese (Português)',
              'ru': 'Russian (Русский)',
              'hi': 'Hindi (हिन्दी)',
              'it': 'Italian (Italiano)',
              'nl': 'Dutch (Nederlands)',
              'tr': 'Turkish (Türkçe)',
              'pl': 'Polish (Polski)',
              'vi': 'Vietnamese (Tiếng Việt)',
              'th': 'Thai (ไทย)',
              'id': 'Indonesian (Bahasa)',
              'llm': 'LLM (AI Translation)',
              'google': 'Google Translate',
              // LLM Model options
              'groq/llama-3.3-70b-versatile': 'Groq - Llama 3.3 70B',
              'groq/llama-3.1-8b-instant': 'Groq - Llama 3.1 8B (Fast)',
              'openai/gpt-4o': 'OpenAI - GPT-4o',
              'openai/gpt-4o-mini': 'OpenAI - GPT-4o Mini',
              'gemini/gemini-1.5-pro': 'Gemini - 1.5 Pro',
              'gemini/gemini-1.5-flash': 'Gemini - 1.5 Flash'
            };
            return languageLabels[value] || value;
          };

          return (
            <div key={paramName} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>{param.title || paramName}</label>
              {/* If parameter has enum values, render as dropdown */}
              {param.enum && Array.isArray(param.enum) ? (
                <select
                  value={toolParams[paramName] || ''}
                  onChange={(e) => handleToolParamsChange(paramName, e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  dir={isRTL ? 'rtl' : 'ltr'}
                >
                  <option value="">{t("workflows.editor.properties.select")} {paramName.replace(/_/g, ' ')}</option>
                  {param.enum.map((option: string) => (
                    <option key={option} value={option}>{getEnumLabel(option)}</option>
                  ))}
                </select>
              ) : (
                <VariableInput
                  value={toolParams[paramName] || ''}
                  onChange={(e) => handleToolParamsChange(paramName, e.target.value)}
                  placeholder={param.description}
                  availableVars={availableVariables}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderNodeProperties = () => {
    if (!currentNode) return <div className="text-slate-500 dark:text-slate-400 p-5" dir={isRTL ? 'rtl' : 'ltr'}>{t("workflows.editor.properties.selectNode")}</div>;

    return (
      <div className="p-3" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.nodeSettings")}</h3>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.nodeLabel")}</label>
            <input
              type="text"
              value={currentNode.data.label || ''}
              onChange={(e) => handleDataChange('label', e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <div className="mb-4">
            <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.nodeId")}</label>
            <div className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm font-mono select-all">
              {currentNode.id}
            </div>
          </div>
        </div>

        {currentNode.type === 'llm' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.llmConfiguration")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.model")}</label>
              <select
                value={currentNode.data.model || ''}
                onChange={(e) => handleDataChange('model', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.selectModel")}</option>
                <optgroup label="Groq">
                  <option value="groq/llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                  <option value="groq/llama-3.1-70b-versatile">Llama 3.1 70B Versatile</option>
                  <option value="groq/llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                  <option value="groq/llama3-8b-8192">Llama3 8B</option>
                  <option value="groq/mixtral-8x7b-32768">Mixtral 8x7B</option>
                </optgroup>
                <optgroup label="OpenAI">
                  <option value="openai/gpt-4o">GPT-4o</option>
                  <option value="openai/gpt-4o-mini">GPT-4o Mini</option>
                  <option value="openai/gpt-4-turbo">GPT-4 Turbo</option>
                  <option value="openai/gpt-3.5-turbo">GPT-3.5 Turbo</option>
                </optgroup>
                <optgroup label="Gemini">
                  <option value="gemini/gemini-1.5-pro">Gemini 1.5 Pro</option>
                  <option value="gemini/gemini-1.5-flash">Gemini 1.5 Flash</option>
                  <option value="gemini/gemini-pro">Gemini Pro</option>
                </optgroup>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.knowledgeBase")}</label>
              <select
                value={currentNode.data.knowledge_base_id || ''}
                onChange={(e) => handleDataChange('knowledge_base_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.none")}</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.systemPrompt")}</label>
              <textarea
                value={currentNode.data.system_prompt || ''}
                onChange={(e) => handleDataChange('system_prompt', e.target.value)}
                placeholder={t("workflows.editor.properties.systemPromptPlaceholder")}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 min-h-[80px] resize-y"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("workflows.editor.properties.systemPromptHint")}</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.prompt")}</label>
              <VariableInput
                value={currentNode.data.prompt || ''}
                onChange={(e) => handleDataChange('prompt', e.target.value)}
                placeholder={t("workflows.editor.properties.promptPlaceholder")}
                availableVars={availableVariables}
                isRTL={isRTL}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'tool' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.toolConfiguration")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.tool")}</label>
              <select
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                onChange={(e) => onToolChange(e.target.value)}
                value={currentNode.data.tool_name || currentNode.data.tool || ''}
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.selectTool")}</option>
                {tools.map(tool => <option key={tool.id} value={tool.name}>{tool.name}</option>)}
              </select>
            </div>
            {renderToolParams()}
          </div>
        )}

        {currentNode.type === 'condition' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.conditionLogic")}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Add multiple conditions for if/elseif/else logic. Conditions are evaluated in order.
            </p>

            {/* Multi-condition UI */}
            {(currentNode.data.conditions || []).map((condition, index) => (
              <div key={index} className="border border-slate-300 dark:border-slate-600 rounded-md p-3 mb-3 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-center mb-3">
                  <strong className="text-sm text-slate-900 dark:text-slate-100">
                    {index === 0 ? 'If' : `Else If`} (Handle: {index})
                  </strong>
                  <button
                    onClick={() => {
                      const newConditions = [...(currentNode.data.conditions || [])];
                      newConditions.splice(index, 1);
                      handleDataChange('conditions', newConditions);
                    }}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-transparent border-none cursor-pointer text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="mb-2">
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.variable")}</label>
                  <select
                    value={condition.variable || ''}
                    onChange={(e) => {
                      const newConditions = [...(currentNode.data.conditions || [])];
                      newConditions[index] = { ...newConditions[index], variable: e.target.value };
                      handleDataChange('conditions', newConditions);
                    }}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <option value="">{t("workflows.editor.properties.selectVariable")}</option>
                    {availableVariables.map(v => (
                      <option key={v.value} value={v.value}>{v.label}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-2">
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.operator")}</label>
                  <select
                    value={condition.operator || 'contains'}
                    onChange={(e) => {
                      const newConditions = [...(currentNode.data.conditions || [])];
                      newConditions[index] = { ...newConditions[index], operator: e.target.value };
                      handleDataChange('conditions', newConditions);
                    }}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    dir={isRTL ? 'rtl' : 'ltr'}
                  >
                    <option value="equals">{t("workflows.editor.properties.operators.equals")}</option>
                    <option value="not_equals">{t("workflows.editor.properties.operators.notEquals")}</option>
                    <option value="contains">{t("workflows.editor.properties.operators.contains")}</option>
                    <option value="greater_than">{t("workflows.editor.properties.operators.greaterThan")}</option>
                    <option value="less_than">{t("workflows.editor.properties.operators.lessThan")}</option>
                    <option value="is_set">{t("workflows.editor.properties.operators.isSet")}</option>
                    <option value="is_not_set">{t("workflows.editor.properties.operators.isNotSet")}</option>
                  </select>
                </div>
                <div>
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.value")}</label>
                  <input
                    type="text"
                    value={condition.value || ''}
                    onChange={(e) => {
                      const newConditions = [...(currentNode.data.conditions || [])];
                      newConditions[index] = { ...newConditions[index], value: e.target.value };
                      handleDataChange('conditions', newConditions);
                    }}
                    className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    placeholder={t("workflows.editor.properties.valuePlaceholder")}
                    disabled={['is_set', 'is_not_set'].includes(condition.operator)}
                    dir={isRTL ? 'rtl' : 'ltr'}
                  />
                </div>
              </div>
            ))}

            {/* Else handle info */}
            {(currentNode.data.conditions || []).length > 0 && (
              <div className="border border-dashed border-slate-400 dark:border-slate-500 rounded-md p-3 mb-3 bg-slate-100 dark:bg-slate-700/50">
                <strong className="text-sm text-slate-700 dark:text-slate-300">Else (Handle: else)</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  This path is taken if none of the above conditions match.
                </p>
              </div>
            )}

            {/* Add condition button */}
            <button
              onClick={() => {
                const newConditions = [...(currentNode.data.conditions || []), { variable: '', operator: 'contains', value: '' }];
                handleDataChange('conditions', newConditions);
              }}
              className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-dashed border-blue-300 dark:border-blue-700 rounded cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors text-sm font-medium"
            >
              + Add Condition
            </button>

            {/* Legacy single condition support info */}
            {(currentNode.data.conditions || []).length === 0 && (currentNode.data.variable || currentNode.data.operator) && (
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md">
                <p className="text-xs text-yellow-700 dark:text-yellow-300">
                  <strong>Legacy mode:</strong> This node uses old single-condition format.
                  Add a new condition above to upgrade to multi-condition mode.
                </p>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  Current: {currentNode.data.variable} {currentNode.data.operator} "{currentNode.data.value}"
                </div>
              </div>
            )}
          </div>
        )}

        {currentNode.type === 'knowledge' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.knowledgeSearch")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.knowledgeBase")}</label>
              <select
                value={currentNode.data.knowledge_base_id || ''}
                onChange={(e) => handleDataChange('knowledge_base_id', e.target.value ? parseInt(e.target.value) : null)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.none")}</option>
                {knowledgeBases.map((kb) => (
                  <option key={kb.id} value={kb.id}>{kb.name}</option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.query")}</label>
              <VariableInput
                value={currentNode.data.query || ''}
                onChange={(e) => handleDataChange('query', e.target.value)}
                placeholder={t("workflows.editor.properties.queryPlaceholder")}
                availableVars={availableVariables}
                isRTL={isRTL}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'http_request' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.httpRequest")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.url")}</label>
              <VariableInput
                value={currentNode.data.url || ''}
                onChange={(e) => handleDataChange('url', e.target.value)}
                placeholder={t("workflows.editor.properties.urlPlaceholder")}
                availableVars={availableVariables}
                isRTL={isRTL}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.method")}</label>
              <select
                value={currentNode.data.method || 'GET'}
                onChange={(e) => handleDataChange('method', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.httpHeaders")}</label>
              <textarea
                value={currentNode.data.headers || ''}
                onChange={(e) => handleDataChange('headers', e.target.value)}
                placeholder={t("workflows.editor.properties.httpHeadersPlaceholder")}
                rows={4}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir="ltr"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.httpBody")}</label>
              <textarea
                value={currentNode.data.body || ''}
                onChange={(e) => handleDataChange('body', e.target.value)}
                placeholder={t("workflows.editor.properties.httpBodyPlaceholder")}
                rows={6}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir="ltr"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'data_manipulation' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.dataManipulation")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.dataExpression")}</label>
              <textarea
                value={currentNode.data.expression || ''}
                onChange={(e) => handleDataChange('expression', e.target.value)}
                placeholder={t("workflows.editor.properties.dataExpressionPlaceholder")}
                rows={5}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir="ltr"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.outputVariable")}</label>
              <input
                type="text"
                value={currentNode.data.output_variable || ''}
                onChange={(e) => handleDataChange('output_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.outputVariablePlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'code' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.codeExecution")}</h3>

            {/* Input Arguments Section */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.codeArguments")}</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t("workflows.editor.properties.codeArgumentsHint")}</p>

              {(currentNode.data.arguments || []).map((arg, index) => (
                <div key={index} className="mb-3 p-3 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Argument {index + 1}</span>
                    <button
                      onClick={() => {
                        const newArgs = [...(currentNode.data.arguments || [])];
                        newArgs.splice(index, 1);
                        handleDataChange('arguments', newArgs);
                      }}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-transparent border-none cursor-pointer text-xs"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="mb-2">
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{t("workflows.editor.properties.codeArgumentName")}</label>
                    <input
                      type="text"
                      value={arg.name || ''}
                      onChange={(e) => {
                        const newArgs = [...(currentNode.data.arguments || [])];
                        newArgs[index] = { ...newArgs[index], name: e.target.value };
                        handleDataChange('arguments', newArgs);
                      }}
                      placeholder="e.g., my_data"
                      className="w-full px-2 py-1.5 text-sm rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">{t("workflows.editor.properties.codeArgumentValue")}</label>
                    <VariableInput
                      value={arg.value || ''}
                      onChange={(e) => {
                        const newArgs = [...(currentNode.data.arguments || [])];
                        newArgs[index] = { ...newArgs[index], value: e.target.value };
                        handleDataChange('arguments', newArgs);
                      }}
                      placeholder="e.g., {{context.variable}}"
                      availableVars={availableVariables}
                      isRTL={false}
                    />
                  </div>
                </div>
              ))}

              <button
                onClick={() => {
                  const newArgs = [...(currentNode.data.arguments || []), { name: '', value: '' }];
                  handleDataChange('arguments', newArgs);
                }}
                className="w-full py-2 bg-blue-50 dark:bg-blue-950/30 border border-dashed border-blue-300 dark:border-blue-700 rounded cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors text-sm font-medium"
              >
                + {t("workflows.editor.properties.addArgument")}
              </button>
            </div>

            {/* Return Variables Section */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.returnVariables")}</label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t("workflows.editor.properties.returnVariablesHint")}</p>

              {(currentNode.data.return_variables || []).map((varName, index) => (
                <div key={index} className="flex gap-2 mb-2 items-center">
                  <input
                    type="text"
                    value={varName || ''}
                    onChange={(e) => {
                      const newVars = [...(currentNode.data.return_variables || [])];
                      newVars[index] = e.target.value;
                      handleDataChange('return_variables', newVars);
                    }}
                    placeholder={t("workflows.editor.properties.returnVariableName")}
                    className="flex-1 px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                    dir="ltr"
                  />
                  <button
                    onClick={() => {
                      const newVars = [...(currentNode.data.return_variables || [])];
                      newVars.splice(index, 1);
                      handleDataChange('return_variables', newVars);
                    }}
                    className="px-2 py-1.5 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-transparent border-none cursor-pointer text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                onClick={() => {
                  const newVars = [...(currentNode.data.return_variables || []), ''];
                  handleDataChange('return_variables', newVars);
                }}
                className="w-full py-2 bg-green-50 dark:bg-green-950/30 border border-dashed border-green-300 dark:border-green-700 rounded cursor-pointer text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/50 transition-colors text-sm font-medium"
              >
                + {t("workflows.editor.properties.addReturnVariable")}
              </button>
            </div>

            {/* Python Code Section */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.pythonCode")}</label>
              <textarea
                value={currentNode.data.code || ''}
                onChange={(e) => handleDataChange('code', e.target.value)}
                placeholder={t("workflows.editor.properties.pythonCodePlaceholder")}
                rows={10}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir="ltr"
              />
            </div>
          </div>
        )}

        {currentNode.type === 'listen' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.listenForInput")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.saveInputToVariable")}</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.saveInputToVariablePlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        )}

        {currentNode.type === 'prompt' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.promptForInput")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.promptText")}</label>
              <VariableInput
                value={(currentNode.data.params?.prompt_text) || ''}
                onChange={(e) => handleParamsChange('prompt_text', e.target.value)}
                placeholder={t("workflows.editor.properties.promptTextPlaceholder")}
                availableVars={availableVariables}
                isRTL={isRTL}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t("workflows.editor.properties.promptTextHelp")}
              </p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.saveResponseAs")}</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.saveResponseAsPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t("workflows.editor.properties.saveResponseHelp")} <code className="px-1.5 py-0.5 bg-slate-200 dark:bg-slate-700 rounded text-xs">{`{{context.${(currentNode.data.params?.save_to_variable) || 'variable_name'}}}`}</code>
              </p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.optionsCommaSeparated")}</label>
              <input
                type="text"
                value={(currentNode.data.params?.options) || ''}
                onChange={(e) => handleParamsChange('options', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.optionsPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t("workflows.editor.properties.optionsHelp")}
              </p>
            </div>
          </div>
        )}

        {currentNode.type === 'form' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.formConfiguration")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.formTitle")}</label>
              <input
                type="text"
                value={(currentNode.data.params?.title) || ''}
                onChange={(e) => handleParamsChange('title', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.formTitlePlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-5">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.saveFormDataToVariable")}</label>
              <input
                type="text"
                value={(currentNode.data.params?.save_to_variable) || ''}
                onChange={(e) => handleParamsChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.saveFormDataToVariablePlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>

            <div>
              <h4 className="text-sm font-semibold mb-3 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.formFields")}</h4>
              {(currentNode.data.params?.fields || []).map((field, index) => (
                <div key={index} className="border border-slate-300 dark:border-slate-600 rounded-md p-3 mb-3 bg-white dark:bg-slate-900">
                  <div className="flex justify-between items-center mb-3">
                    <strong className="text-sm text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.fieldNumber", { number: index + 1 })}</strong>
                    <button onClick={() => {
                      const newFields = [...currentNode.data.params.fields];
                      newFields.splice(index, 1);
                      handleParamsChange('fields', newFields);
                    }} className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-transparent border-none cursor-pointer text-sm">{t("workflows.editor.properties.removeField")}</button>
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.fieldName")}</label>
                    <input type="text" value={field.name} onChange={(e) => handleFieldChange(index, 'name', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder={t("workflows.editor.properties.fieldNamePlaceholder")} dir={isRTL ? 'rtl' : 'ltr'} />
                  </div>
                  <div className="mb-2">
                    <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.fieldLabel")}</label>
                    <input type="text" value={field.label} onChange={(e) => handleFieldChange(index, 'label', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" placeholder={t("workflows.editor.properties.fieldLabelPlaceholder")} dir={isRTL ? 'rtl' : 'ltr'} />
                  </div>
                  <div>
                    <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.fieldType")}</label>
                    <select value={field.type} onChange={(e) => handleFieldChange(index, 'type', e.target.value)} className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400" dir={isRTL ? 'rtl' : 'ltr'}>
                      <option value="text">{t("workflows.editor.properties.fieldTypes.text")}</option>
                      <option value="email">{t("workflows.editor.properties.fieldTypes.email")}</option>
                      <option value="number">{t("workflows.editor.properties.fieldTypes.number")}</option>
                      <option value="tel">{t("workflows.editor.properties.fieldTypes.phone")}</option>
                      <option value="textarea">{t("workflows.editor.properties.fieldTypes.textarea")}</option>
                    </select>
                  </div>
                </div>
              ))}
              <button onClick={() => {
                const newFields = [...(currentNode.data.params?.fields || []), { name: '', label: '', type: 'text' }];
                handleParamsChange('fields', newFields);
              }} className="w-full py-2.5 bg-blue-50 dark:bg-blue-950/30 border border-dashed border-blue-300 dark:border-blue-700 rounded cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors text-sm font-medium">
                {t("workflows.editor.properties.addField")}
              </button>
            </div>
          </div>
        )}

        {currentNode.type === 'response' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.workflowOutput")}</h3>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.outputValue")}</label>
              <VariableInput
                value={currentNode.data.output_value || ''}
                onChange={(e) => handleDataChange('output_value', e.target.value)}
                placeholder={t("workflows.editor.properties.outputValuePlaceholder")}
                availableVars={availableVariables}
                isRTL={isRTL}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t("workflows.editor.properties.outputValueHelp")}
              </p>
            </div>
          </div>
        )}

        {currentNode.type === 'start' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.startNode")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.startNodeDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.initialInputVariable")}</label>
              <input
                type="text"
                value={currentNode.data.initial_input_variable || 'user_message'}
                onChange={(e) => handleDataChange('initial_input_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.initialInputVariablePlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        )}

        {/* ========== TRIGGER NODES ========== */}

        {/* WebSocket Trigger */}
        {currentNode.type === 'trigger_websocket' && (
          <div className="mb-5 p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg border-2 border-cyan-200 dark:border-cyan-700">
            <h3 className="text-base font-bold mb-2 text-cyan-900 dark:text-cyan-100 flex items-center gap-2">
              <span className="text-cyan-600 dark:text-cyan-400">⚡</span> {t("workflows.editor.properties.triggers.websocket")}
            </h3>
            <p className="text-sm text-cyan-700 dark:text-cyan-300 mb-4">{t("workflows.editor.properties.triggers.websocketDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.triggerLabel")}</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
                placeholder={t("workflows.editor.properties.triggers.triggerLabelPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.fallbackAgent")}</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.triggers.selectAgent")}</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t("workflows.editor.properties.triggers.fallbackAgentHelp")}</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.autoRespond")}</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="true">{t("workflows.editor.properties.triggers.autoRespondYes")}</option>
                <option value="false">{t("workflows.editor.properties.triggers.autoRespondNo")}</option>
              </select>
            </div>
          </div>
        )}

        {/* WhatsApp Trigger */}
        {currentNode.type === 'trigger_whatsapp' && (
          <div className="mb-5 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-700">
            <h3 className="text-base font-bold mb-2 text-green-900 dark:text-green-100 flex items-center gap-2">
              <span className="text-green-600 dark:text-green-400">⚡</span> {t("workflows.editor.properties.triggers.whatsapp")}
            </h3>
            <p className="text-sm text-green-700 dark:text-green-300 mb-4">{t("workflows.editor.properties.triggers.whatsappDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.triggerLabel")}</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                placeholder={t("workflows.editor.properties.triggers.whatsappPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.fallbackAgent")}</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.triggers.selectAgent")}</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t("workflows.editor.properties.triggers.fallbackAgentHelp")}</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.autoRespond")}</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 dark:focus:ring-green-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="true">{t("workflows.editor.properties.triggers.autoRespondYes")}</option>
                <option value="false">{t("workflows.editor.properties.triggers.autoRespondNo")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Telegram Trigger */}
        {currentNode.type === 'trigger_telegram' && (
          <div className="mb-5 p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border-2 border-sky-200 dark:border-sky-700">
            <h3 className="text-base font-bold mb-2 text-sky-900 dark:text-sky-100 flex items-center gap-2">
              <span className="text-sky-600 dark:text-sky-400">⚡</span> {t("workflows.editor.properties.triggers.telegram")}
            </h3>
            <p className="text-sm text-sky-700 dark:text-sky-300 mb-4">{t("workflows.editor.properties.triggers.telegramDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.triggerLabel")}</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
                placeholder={t("workflows.editor.properties.triggers.telegramPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.fallbackAgent")}</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.triggers.selectAgent")}</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t("workflows.editor.properties.triggers.fallbackAgentHelp")}</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.autoRespond")}</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 dark:focus:ring-sky-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="true">{t("workflows.editor.properties.triggers.autoRespondYes")}</option>
                <option value="false">{t("workflows.editor.properties.triggers.autoRespondNo")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Instagram Trigger */}
        {currentNode.type === 'trigger_instagram' && (
          <div className="mb-5 p-4 bg-pink-50 dark:bg-pink-900/20 rounded-lg border-2 border-pink-200 dark:border-pink-700">
            <h3 className="text-base font-bold mb-2 text-pink-900 dark:text-pink-100 flex items-center gap-2">
              <span className="text-pink-600 dark:text-pink-400">⚡</span> {t("workflows.editor.properties.triggers.instagram")}
            </h3>
            <p className="text-sm text-pink-700 dark:text-pink-300 mb-4">{t("workflows.editor.properties.triggers.instagramDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.triggerLabel")}</label>
              <input
                type="text"
                value={currentNode.data.label || ''}
                onChange={(e) => handleDataChange('label', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
                placeholder={t("workflows.editor.properties.triggers.instagramPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.fallbackAgent")}</label>
              <select
                value={currentNode.data.agent_id || ''}
                onChange={(e) => handleAgentChange(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.triggers.selectAgent")}</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{t("workflows.editor.properties.triggers.fallbackAgentHelp")}</p>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.triggers.autoRespond")}</label>
              <select
                value={currentNode.data.auto_respond !== false ? 'true' : 'false'}
                onChange={(e) => handleDataChange('auto_respond', e.target.value === 'true')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500 dark:focus:ring-pink-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="true">{t("workflows.editor.properties.triggers.autoRespondYes")}</option>
                <option value="false">{t("workflows.editor.properties.triggers.autoRespondNo")}</option>
              </select>
            </div>
          </div>
        )}

        {/* ========== CHAT & CONVERSATION NODES ========== */}

        {/* Intent Router Node */}
        {currentNode.type === 'intent_router' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.intentRouter")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.intentRouterDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.defaultRoute")}</label>
              <select
                value={currentNode.data.default_route || ''}
                onChange={(e) => handleDataChange('default_route', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.chat.selectDefaultAction")}</option>
                <option value="continue">{t("workflows.editor.properties.chat.continueToNext")}</option>
                <option value="escalate">{t("workflows.editor.properties.chat.escalateToHuman")}</option>
                <option value="fallback">{t("workflows.editor.properties.chat.useFallback")}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.saveIntentTo")}</label>
              <input
                type="text"
                value={currentNode.data.intent_variable || 'detected_intent'}
                onChange={(e) => handleDataChange('intent_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.chat.saveIntentToPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        )}

        {/* Entity Collector Node */}
        {currentNode.type === 'entity_collector' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.entityCollector")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.entityCollectorDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.entitiesToCollect")}</label>
              <input
                type="text"
                value={currentNode.data.entity_names || ''}
                onChange={(e) => handleDataChange('entity_names', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.chat.entitiesToCollectPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.maxAttempts")}</label>
              <input
                type="number"
                value={currentNode.data.max_attempts || 3}
                onChange={(e) => handleDataChange('max_attempts', parseInt(e.target.value))}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                min="1"
                max="10"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.saveEntitiesTo")}</label>
              <input
                type="text"
                value={currentNode.data.save_to_variable || 'collected_entities'}
                onChange={(e) => handleDataChange('save_to_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.chat.saveEntitiesToPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        )}

        {/* Check Entity Node */}
        {currentNode.type === 'check_entity' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.checkEntity")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.checkEntityDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.entityNameToCheck")}</label>
              <input
                type="text"
                value={currentNode.data.entity_name || ''}
                onChange={(e) => handleDataChange('entity_name', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.chat.entityNameToCheckPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.validationRule")}</label>
              <select
                value={currentNode.data.validation_rule || 'exists'}
                onChange={(e) => handleDataChange('validation_rule', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="exists">{t("workflows.editor.properties.chat.entityExists")}</option>
                <option value="not_empty">{t("workflows.editor.properties.chat.notEmpty")}</option>
                <option value="matches_pattern">{t("workflows.editor.properties.chat.matchesPattern")}</option>
              </select>
            </div>
            {currentNode.data.validation_rule === 'matches_pattern' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.regexPattern")}</label>
                <input
                  type="text"
                  value={currentNode.data.validation_pattern || ''}
                  onChange={(e) => handleDataChange('validation_pattern', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder={t("workflows.editor.properties.chat.regexPatternPlaceholder")}
                  dir="ltr"
                />
              </div>
            )}
          </div>
        )}

        {/* Update Context Node */}
        {currentNode.type === 'update_context' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.updateContext")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.updateContextDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.variableName")}</label>
              <input
                type="text"
                value={currentNode.data.variable_name || ''}
                onChange={(e) => handleDataChange('variable_name', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.chat.variableNamePlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.variableValue")}</label>
              <VariableInput
                value={currentNode.data.variable_value || ''}
                onChange={(e) => handleDataChange('variable_value', e.target.value)}
                placeholder={t("workflows.editor.properties.chat.variableValuePlaceholder")}
                availableVars={availableVariables}
                isRTL={isRTL}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.updateMode")}</label>
              <select
                value={currentNode.data.update_mode || 'set'}
                onChange={(e) => handleDataChange('update_mode', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="set">{t("workflows.editor.properties.chat.updateModeSet")}</option>
                <option value="append">{t("workflows.editor.properties.chat.updateModeAppend")}</option>
                <option value="merge">{t("workflows.editor.properties.chat.updateModeMerge")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Tag Conversation Node */}
        {currentNode.type === 'tag_conversation' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.tagConversation")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.tagConversationDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.tags")}</label>
              <input
                type="text"
                value={currentNode.data.tags || ''}
                onChange={(e) => handleDataChange('tags', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.chat.tagsPlaceholder")}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.dynamicTagFromVariable")}</label>
              <select
                value={currentNode.data.dynamic_tag_variable || ''}
                onChange={(e) => handleDataChange('dynamic_tag_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.chat.noneStaticOnly")}</option>
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
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.assignToAgent")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.assignToAgentDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.assignmentType")}</label>
              <select
                value={currentNode.data.assignment_type || 'specific'}
                onChange={(e) => handleDataChange('assignment_type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="specific">{t("workflows.editor.properties.chat.specificAgent")}</option>
                <option value="team">{t("workflows.editor.properties.chat.teamDepartment")}</option>
                <option value="round_robin">{t("workflows.editor.properties.chat.roundRobin")}</option>
                <option value="least_busy">{t("workflows.editor.properties.chat.leastBusy")}</option>
              </select>
            </div>
            {currentNode.data.assignment_type === 'specific' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.agentIdEmail")}</label>
                <input
                  type="text"
                  value={currentNode.data.agent_id || ''}
                  onChange={(e) => handleDataChange('agent_id', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder={t("workflows.editor.properties.chat.agentIdEmailPlaceholder")}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            )}
            {currentNode.data.assignment_type === 'team' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.teamName")}</label>
                <input
                  type="text"
                  value={currentNode.data.team_name || ''}
                  onChange={(e) => handleDataChange('team_name', e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                  placeholder={t("workflows.editor.properties.chat.teamNamePlaceholder")}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.priority")}</label>
              <select
                value={currentNode.data.priority || 'normal'}
                onChange={(e) => handleDataChange('priority', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="low">{t("workflows.editor.properties.chat.priorityLow")}</option>
                <option value="normal">{t("workflows.editor.properties.chat.priorityNormal")}</option>
                <option value="high">{t("workflows.editor.properties.chat.priorityHigh")}</option>
                <option value="urgent">{t("workflows.editor.properties.chat.priorityUrgent")}</option>
              </select>
            </div>
          </div>
        )}

        {/* Set Status Node */}
        {currentNode.type === 'set_status' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.setStatus")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.setStatusDescription")}</p>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.newStatus")}</label>
              <select
                value={currentNode.data.status || 'active'}
                onChange={(e) => handleDataChange('status', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="active">{t("workflows.editor.properties.chat.statusActive")}</option>
                <option value="waiting">{t("workflows.editor.properties.chat.statusWaiting")}</option>
                <option value="resolved">{t("workflows.editor.properties.chat.statusResolved")}</option>
                <option value="closed">{t("workflows.editor.properties.chat.statusClosed")}</option>
                <option value="escalated">{t("workflows.editor.properties.chat.statusEscalated")}</option>
                <option value="pending">{t("workflows.editor.properties.chat.statusPending")}</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.statusReason")}</label>
              <VariableInput
                value={currentNode.data.status_reason || ''}
                onChange={(e) => handleDataChange('status_reason', e.target.value)}
                placeholder={t("workflows.editor.properties.chat.statusReasonPlaceholder")}
                availableVars={availableVariables}
                isRTL={isRTL}
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.autoCloseAfter")}</label>
              <input
                type="number"
                value={currentNode.data.auto_close_minutes || ''}
                onChange={(e) => handleDataChange('auto_close_minutes', e.target.value ? parseInt(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={t("workflows.editor.properties.chat.autoCloseAfterPlaceholder")}
                min="0"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-5 h-full overflow-y-auto bg-white dark:bg-slate-800" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="font-bold text-base mb-5 border-b border-slate-200 dark:border-slate-700 pb-3 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.nodeSettings")}</div>
      {renderNodeProperties()}
      {currentNode && (
        <button
          onClick={deleteNode}
          className="mt-5 px-4 py-2.5 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white border-none rounded-lg cursor-pointer w-full transition-colors font-medium"
        >
          {t("workflows.editor.properties.deleteNode")}
        </button>
      )}
    </div>
  );
};

export default PropertiesPanel;
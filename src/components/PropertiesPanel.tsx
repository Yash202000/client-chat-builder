import React, { useState, useEffect, useMemo, useRef } from 'react';
import { toast } from 'sonner';
import { Maximize2 } from 'lucide-react';
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from '@/hooks/useI18n';
import { CodeEditorModal } from './CodeEditorModal';

const VariableInput = ({ value, onChange, placeholder, availableVars = [], isRTL }) => {
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

const PropertiesPanel = ({ selectedNode, nodes, setNodes, deleteNode, workflowId }) => {
  const { t, isRTL } = useI18n();
  const [tools, setTools] = useState([]);
  const [knowledgeBases, setKnowledgeBases] = useState([]);
  const [agents, setAgents] = useState([]);
  const [availableSubworkflows, setAvailableSubworkflows] = useState([]);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
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

  // Fetch available subworkflows when workflowId changes
  useEffect(() => {
    const fetchSubworkflows = async () => {
      if (!workflowId) return;
      try {
        const response = await authFetch(`/api/v1/workflows/${workflowId}/available-subworkflows`);
        if (response.ok) {
          const data = await response.json();
          setAvailableSubworkflows(data);
        }
      } catch (error) {
        console.error('Failed to fetch available subworkflows');
      }
    };
    fetchSubworkflows();
  }, [workflowId, authFetch]);

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

  // Prompt node option helpers (key-value pairs)
  const getOptionsArray = (): Array<{key: string; value: string}> => {
    const options = currentNode?.data?.params?.options;
    if (!options) return [];
    if (Array.isArray(options)) return options;
    // Convert legacy comma-separated string to key-value array
    if (typeof options === 'string') {
      return options.split(',').filter(opt => opt.trim()).map(opt => ({ key: opt.trim(), value: opt.trim() }));
    }
    return [];
  };

  const handleOptionChange = (index: number, field: 'key' | 'value', value: string) => {
    const newOptions = [...getOptionsArray()];
    newOptions[index] = { ...newOptions[index], [field]: value };
    handleParamsChange('options', newOptions);
  };

  const handleAddOption = () => {
    const newOptions = [...getOptionsArray(), { key: '', value: '' }];
    handleParamsChange('options', newOptions);
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = [...getOptionsArray()];
    newOptions.splice(index, 1);
    handleParamsChange('options', newOptions);
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
                  <VariableInput
                    value={condition.variable || ''}
                    onChange={(e) => {
                      const newConditions = [...(currentNode.data.conditions || [])];
                      newConditions[index] = { ...newConditions[index], variable: e.target.value };
                      handleDataChange('conditions', newConditions);
                    }}
                    placeholder={t("workflows.editor.properties.selectVariable")}
                    availableVars={availableVariables}
                    isRTL={isRTL}
                  />
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
              <div className="flex items-center justify-between mb-2">
                <label className="font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.pythonCode")}</label>
                <button
                  onClick={() => setIsCodeModalOpen(true)}
                  title={t("workflows.editor.properties.expandCodeEditor", { defaultValue: "Expand Editor" })}
                  className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                >
                  <Maximize2 size={16} />
                </button>
              </div>
              <textarea
                value={currentNode.data.code || ''}
                onChange={(e) => handleDataChange('code', e.target.value)}
                placeholder={t("workflows.editor.properties.pythonCodePlaceholder")}
                rows={10}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir="ltr"
              />
            </div>

            {/* Code Editor Modal */}
            <CodeEditorModal
              isOpen={isCodeModalOpen}
              onClose={() => setIsCodeModalOpen(false)}
              value={currentNode.data.code || ''}
              onChange={(code) => handleDataChange('code', code)}
            />
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
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                {t("workflows.editor.properties.expectedInputType") || "Expected Input Type"}
              </label>
              <select
                value={(currentNode.data.params?.expected_input_type) || 'any'}
                onChange={(e) => handleParamsChange('expected_input_type', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="any">{t("workflows.editor.properties.inputTypeAny") || "Any (Text, Image, or Location)"}</option>
                <option value="text">{t("workflows.editor.properties.inputTypeText") || "Text Only"}</option>
                <option value="attachment">{t("workflows.editor.properties.inputTypeAttachment") || "Image/Attachment Only"}</option>
                <option value="location">{t("workflows.editor.properties.inputTypeLocation") || "Location Only"}</option>
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                {t("workflows.editor.properties.expectedInputTypeHelp") || "Widget will disable unavailable input options based on this setting."}
              </p>
            </div>
            {/* Data Format Hint */}
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">{t("workflows.editor.properties.listenDataFormatTitle")}</p>
              <div className="text-xs text-blue-700 dark:text-blue-400 space-y-1">
                <p><strong>{t("workflows.editor.properties.listenTextOnly")}:</strong> <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">"user message"</code></p>
                <p><strong>{t("workflows.editor.properties.listenWithImage")}:</strong></p>
                <pre className="bg-blue-100 dark:bg-blue-800 p-2 rounded text-[10px] overflow-x-auto">
{`{
  "text": "message",
  "attachments": [{
    "file_name": "image.jpg",
    "file_type": "image/jpeg",
    "file_data": "base64..."
  }]
}`}
                </pre>
                <p><strong>{t("workflows.editor.properties.listenWithLocation")}:</strong></p>
                <pre className="bg-blue-100 dark:bg-blue-800 p-2 rounded text-[10px] overflow-x-auto">
{`{
  "text": "message",
  "attachments": [{
    "file_type": "application/geo+json",
    "location": {
      "latitude": 25.276987,
      "longitude": 55.296249
    }
  }]
}`}
                </pre>
                <p className="mt-2 text-blue-600 dark:text-blue-400">
                  <strong>{t("workflows.editor.properties.listenTip")}:</strong> {t("workflows.editor.properties.listenTipText")}
                </p>
              </div>
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
            {/* Options Mode Selector */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                {t("workflows.editor.properties.optionsInputMode")}
              </label>
              <select
                value={(currentNode.data.params?.options_mode) || 'manual'}
                onChange={(e) => handleParamsChange('options_mode', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="manual">{t("workflows.editor.properties.optionsModeManual")}</option>
                <option value="variable">{t("workflows.editor.properties.optionsModeVariable")}</option>
              </select>
            </div>

            {/* Manual Mode: Dynamic Key-Value Rows */}
            {(currentNode.data.params?.options_mode || 'manual') === 'manual' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                  {t("workflows.editor.properties.optionsKeyValue")}
                </label>
                {getOptionsArray().map((option: {key: string; value: string}, index: number) => (
                  <div key={index} className="border border-slate-300 dark:border-slate-600 rounded-md p-3 mb-3 bg-white dark:bg-slate-900">
                    {/* Header with Option # and Remove button */}
                    <div className="flex justify-between items-center mb-3">
                      <strong className="text-sm text-slate-900 dark:text-slate-100">
                        {t("workflows.editor.properties.optionNumber", { number: index + 1 })}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(index)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 bg-transparent border-none cursor-pointer text-sm"
                      >
                        {t("workflows.editor.properties.removeOption")}
                      </button>
                    </div>
                    {/* Key input with label */}
                    <div className="mb-2">
                      <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("workflows.editor.properties.optionKeyLabel")}
                      </label>
                      <input
                        type="text"
                        value={option.key || ''}
                        onChange={(e) => handleOptionChange(index, 'key', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        placeholder={t("workflows.editor.properties.optionKeyPlaceholder")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                    {/* Value input with label */}
                    <div>
                      <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">
                        {t("workflows.editor.properties.optionValueLabel")}
                      </label>
                      <input
                        type="text"
                        value={option.value || ''}
                        onChange={(e) => handleOptionChange(index, 'value', e.target.value)}
                        className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                        placeholder={t("workflows.editor.properties.optionValuePlaceholder")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => handleAddOption()}
                  className="w-full py-2 bg-blue-50 dark:bg-blue-950/30 border border-dashed border-blue-300 dark:border-blue-700 rounded cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors text-sm font-medium"
                >
                  {t("workflows.editor.properties.addOption")}
                </button>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {t("workflows.editor.properties.optionsKeyValueHelp")}
                </p>
              </div>
            )}

            {/* Variable Mode: Variable Reference Input */}
            {currentNode.data.params?.options_mode === 'variable' && (
              <div className="mb-4">
                <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                  {t("workflows.editor.properties.optionsVariable")}
                </label>
                <VariableInput
                  value={(currentNode.data.params?.options_variable) || ''}
                  onChange={(e) => handleParamsChange('options_variable', e.target.value)}
                  placeholder={t("workflows.editor.properties.optionsVariablePlaceholder")}
                  availableVars={availableVariables}
                  isRTL={isRTL}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {t("workflows.editor.properties.optionsVariableHelp")}
                </p>
                {/* Accepted format hint */}
                <div className="mt-3 p-3 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-2">
                    {t("workflows.editor.properties.acceptedFormatsTitle")}
                  </p>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono space-y-2">
                    <div>
                      <span className="text-slate-600 dark:text-slate-300">{t("workflows.editor.properties.formatDict")}</span>
                      <pre className="mt-1 p-2 bg-slate-200 dark:bg-slate-900 rounded text-[10px] overflow-x-auto">
{`{"id1": "Option 1", "id2": "Option 2"}`}
                      </pre>
                    </div>
                    <div>
                      <span className="text-slate-600 dark:text-slate-300">{t("workflows.editor.properties.formatList")}</span>
                      <pre className="mt-1 p-2 bg-slate-200 dark:bg-slate-900 rounded text-[10px] overflow-x-auto">
{`[{"key": "id1", "value": "Option 1"}]`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Allow Free Text Input Option */}
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="allow_text_input"
                  checked={currentNode.data.params?.allow_text_input || false}
                  onChange={(e) => handleParamsChange('allow_text_input', e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
                />
                <label htmlFor="allow_text_input" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t("workflows.editor.properties.allowTextInput")}
                </label>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 ml-7">
                {t("workflows.editor.properties.allowTextInputHelp")}
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

        {/* Question Classifier Node */}
        {currentNode.type === 'question_classifier' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">{t("workflows.editor.properties.chat.questionClassifier")}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{t("workflows.editor.properties.chat.questionClassifierDescription")}</p>

            {/* LLM Model Selection */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.llmModel")}</label>
              <select
                value={currentNode.data.model || 'groq/llama-3.1-8b-instant'}
                onChange={(e) => handleDataChange('model', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="groq/llama-3.1-8b-instant">Groq - Llama 3.1 8B (Fast)</option>
                <option value="groq/llama-3.3-70b-versatile">Groq - Llama 3.3 70B</option>
                <option value="openai/gpt-4o-mini">OpenAI - GPT-4o Mini</option>
                <option value="openai/gpt-4o">OpenAI - GPT-4o</option>
              </select>
            </div>

            {/* Classes Configuration */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.classes")}</label>
              <div className="space-y-2">
                {(currentNode.data.classes || []).map((cls, index) => (
                  <div key={index} className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-600">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={cls.name || ''}
                        onChange={(e) => {
                          const newClasses = [...(currentNode.data.classes || [])];
                          newClasses[index] = { ...newClasses[index], name: e.target.value };
                          handleDataChange('classes', newClasses);
                        }}
                        className="flex-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        placeholder={t("workflows.editor.properties.chat.className")}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      <button
                        onClick={() => {
                          const newClasses = (currentNode.data.classes || []).filter((_, i) => i !== index);
                          handleDataChange('classes', newClasses);
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-sm font-medium"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      value={cls.description || ''}
                      onChange={(e) => {
                        const newClasses = [...(currentNode.data.classes || [])];
                        newClasses[index] = { ...newClasses[index], description: e.target.value };
                        handleDataChange('classes', newClasses);
                      }}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder={t("workflows.editor.properties.chat.classDescription")}
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newClasses = [...(currentNode.data.classes || []), { name: '', description: '' }];
                    handleDataChange('classes', newClasses);
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-400 hover:border-amber-500 hover:text-amber-600 dark:hover:text-amber-400 text-sm font-medium transition-colors"
                >
                  + {t("workflows.editor.properties.chat.addClass")}
                </button>
              </div>
            </div>

            {/* Question Variable */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.questionVariable")}</label>
              <input
                type="text"
                value={currentNode.data.input_variable || 'user_message'}
                onChange={(e) => handleDataChange('input_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                placeholder="user_message"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t("workflows.editor.properties.chat.questionVariableHelp")}</p>
            </div>

            {/* Output Variable */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.chat.saveClassificationTo")}</label>
              <input
                type="text"
                value={currentNode.data.output_variable || 'classification'}
                onChange={(e) => handleDataChange('output_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 dark:focus:ring-amber-400"
                placeholder="classification"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>
        )}

        {/* Extract Entities Node */}
        {currentNode.type === 'extract_entities' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">Extract Entities (LLM)</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Automatically extract entities from text using LLM. If extraction fails, prompts user for missing required entities.</p>

            {/* LLM Model Selection */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">LLM Model</label>
              <select
                value={currentNode.data.model || 'groq/llama-3.1-8b-instant'}
                onChange={(e) => handleDataChange('model', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="groq/llama-3.1-8b-instant">Groq - Llama 3.1 8B (Fast)</option>
                <option value="groq/llama-3.3-70b-versatile">Groq - Llama 3.3 70B</option>
                <option value="openai/gpt-4o-mini">OpenAI - GPT-4o Mini</option>
                <option value="openai/gpt-4o">OpenAI - GPT-4o</option>
              </select>
            </div>

            {/* Entities Configuration */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Entities to Extract</label>
              <div className="space-y-2">
                {(currentNode.data.entities || []).map((entity, index) => (
                  <div key={index} className="p-3 bg-white dark:bg-slate-900 rounded-md border border-slate-200 dark:border-slate-600">
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={entity.name || ''}
                        onChange={(e) => {
                          const newEntities = [...(currentNode.data.entities || [])];
                          newEntities[index] = { ...newEntities[index], name: e.target.value };
                          handleDataChange('entities', newEntities);
                        }}
                        className="flex-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Entity name (e.g., customer_name)"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      />
                      <button
                        onClick={() => {
                          const newEntities = (currentNode.data.entities || []).filter((_, i) => i !== index);
                          handleDataChange('entities', newEntities);
                        }}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md text-sm font-medium"
                      >
                        ✕
                      </button>
                    </div>
                    <input
                      type="text"
                      value={entity.description || ''}
                      onChange={(e) => {
                        const newEntities = [...(currentNode.data.entities || [])];
                        newEntities[index] = { ...newEntities[index], description: e.target.value };
                        handleDataChange('entities', newEntities);
                      }}
                      className="w-full px-3 py-2 mb-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Description (e.g., Customer's full name)"
                      dir={isRTL ? 'rtl' : 'ltr'}
                    />
                    <div className="flex gap-2">
                      <select
                        value={entity.type || 'text'}
                        onChange={(e) => {
                          const newEntities = [...(currentNode.data.entities || [])];
                          newEntities[index] = { ...newEntities[index], type: e.target.value };
                          handleDataChange('entities', newEntities);
                        }}
                        className="flex-1 px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="date">Date</option>
                      </select>
                      <label className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-md">
                        <input
                          type="checkbox"
                          checked={entity.required !== false}
                          onChange={(e) => {
                            const newEntities = [...(currentNode.data.entities || [])];
                            newEntities[index] = { ...newEntities[index], required: e.target.checked };
                            handleDataChange('entities', newEntities);
                          }}
                          className="w-4 h-4 text-purple-600 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">Required</span>
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => {
                    const newEntities = [...(currentNode.data.entities || []), { name: '', description: '', type: 'text', required: true }];
                    handleDataChange('entities', newEntities);
                  }}
                  className="w-full px-3 py-2 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-md text-slate-600 dark:text-slate-400 hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 text-sm font-medium transition-colors"
                >
                  + Add Entity
                </button>
              </div>
            </div>

            {/* Input Source */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Input Source</label>
              <VariableInput
                value={currentNode.data.input_source || '{{context.user_message}}'}
                onChange={(e) => handleDataChange('input_source', e.target.value)}
                placeholder="{{context.user_message}}"
                availableVars={availableVariables}
                isRTL={isRTL}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The text to extract entities from (use variables like {'{{context.user_message}}'})</p>
            </div>

            {/* Retry Prompt Template */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">Retry Prompt Template</label>
              <input
                type="text"
                value={currentNode.data.retry_prompt_template || "I couldn't find your {entity_description}. Please provide it."}
                onChange={(e) => handleDataChange('retry_prompt_template', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400"
                placeholder="I couldn't find your {entity_description}. Please provide it."
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Message shown when asking user for missing entities. Use {'{entity_description}'} and {'{entity_name}'} placeholders.</p>
            </div>
          </div>
        )}

        {/* Subworkflow Node */}
        {currentNode.type === 'subworkflow' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">
              {t("workflows.editor.properties.subworkflowConfiguration") || "Subworkflow Configuration"}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t("workflows.editor.properties.subworkflowDescription") || "Execute another workflow as part of this workflow. The subworkflow inherits the current context."}
            </p>

            {/* Workflow Selection */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                {t("workflows.editor.properties.selectWorkflow") || "Select Workflow"}
              </label>
              <select
                value={currentNode.data.subworkflow_id || ''}
                onChange={(e) => {
                  const selectedId = e.target.value ? parseInt(e.target.value) : null;
                  const selectedWorkflow = availableSubworkflows.find(w => w.id === selectedId);
                  handleDataChange('subworkflow_id', selectedId);
                  handleDataChange('subworkflow_name', selectedWorkflow?.name || null);
                }}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                dir={isRTL ? 'rtl' : 'ltr'}
              >
                <option value="">{t("workflows.editor.properties.selectWorkflowPlaceholder") || "Select a workflow..."}</option>
                {availableSubworkflows.map(wf => (
                  <option key={wf.id} value={wf.id}>{wf.name}</option>
                ))}
              </select>
              {availableSubworkflows.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  {t("workflows.editor.properties.noSubworkflowsAvailable") || "No other workflows available. Create another workflow first."}
                </p>
              )}
              {/* Warning for subworkflows with triggers */}
              {currentNode.data.subworkflow_id && (() => {
                const selectedWf = availableSubworkflows.find(w => w.id === currentNode.data.subworkflow_id);
                return selectedWf?.has_triggers ? (
                  <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1">
                      <span className="font-bold">⚠</span>
                      <span>
                        {t("workflows.editor.properties.subworkflowHasTriggersWarning") || "This workflow has its own triggers and can also run standalone. Changes may affect both contexts."}
                      </span>
                    </p>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Output Variable */}
            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                {t("workflows.editor.properties.outputVariable") || "Output Variable"}
              </label>
              <input
                type="text"
                value={currentNode.data.output_variable || 'subworkflow_result'}
                onChange={(e) => handleDataChange('output_variable', e.target.value)}
                placeholder="subworkflow_result"
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 dark:focus:ring-violet-400"
                dir="ltr"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("workflows.editor.properties.outputVariableHint") || "Access subworkflow results via {{context.subworkflow_result.output}}"}
              </p>
            </div>

            {/* Info Box */}
            <div className="p-3 bg-violet-50 dark:bg-violet-900/20 rounded border border-violet-200 dark:border-violet-700">
              <p className="text-xs text-violet-700 dark:text-violet-300">
                <strong>{t("workflows.editor.properties.note") || "Note"}:</strong> {t("workflows.editor.properties.subworkflowPauseNote") || "If the subworkflow pauses for user input, the parent workflow will also pause. Maximum nesting depth: 5 levels."}
              </p>
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

        {/* For Each Loop Node */}
        {currentNode.type === 'foreach_loop' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">
              {t("workflows.editor.properties.forEachConfiguration") || "For Each Loop Configuration"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t("workflows.editor.properties.forEachDescription") || "Iterates over each item in an array, executing the loop body for each element."}
            </p>

            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                {t("workflows.editor.properties.arraySource") || "Array Source"}
              </label>
              <VariableInput
                value={currentNode.data.array_source || ''}
                onChange={(e) => handleDataChange('array_source', e.target.value)}
                placeholder="{{context.items}} or {{node-id.output}}"
                availableVars={availableVariables}
                isRTL={isRTL}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("workflows.editor.properties.arraySourceHint") || "Select a variable containing an array to iterate over"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                {t("workflows.editor.properties.itemVariableName") || "Item Variable Name"}
              </label>
              <input
                type="text"
                value={currentNode.data.item_variable || 'item'}
                onChange={(e) => handleDataChange('item_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="item"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("workflows.editor.properties.itemVariableHint") || "Access via {{context.item}} in loop body"}
              </p>
            </div>

            <div className="mb-4">
              <label className="block mb-2 font-medium text-sm text-slate-700 dark:text-slate-300">
                {t("workflows.editor.properties.indexVariableName") || "Index Variable Name"}
              </label>
              <input
                type="text"
                value={currentNode.data.index_variable || 'index'}
                onChange={(e) => handleDataChange('index_variable', e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="index"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {t("workflows.editor.properties.indexVariableHint") || "Access via {{context.index}} in loop body"}
              </p>
            </div>

            {/* Connection info */}
            <div className="mt-4 p-3 bg-teal-50 dark:bg-teal-900/20 border border-teal-200 dark:border-teal-700 rounded-md">
              <p className="text-xs text-teal-700 dark:text-teal-300">
                <strong>Connections:</strong> Connect the <span className="font-mono bg-teal-100 dark:bg-teal-800 px-1 rounded">loop</span> handle to loop body nodes, and the <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">exit</span> handle to the node after the loop. Connect the last node of your loop body back to this node.
              </p>
            </div>
          </div>
        )}

        {/* While Loop Node */}
        {currentNode.type === 'while_loop' && (
          <div className="mb-5 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
            <h3 className="text-base font-semibold mb-4 text-slate-900 dark:text-slate-100">
              {t("workflows.editor.properties.whileConfiguration") || "While Loop Configuration"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {t("workflows.editor.properties.whileDescription") || "Repeats the loop body while all conditions are true."}
            </p>

            {/* Multi-condition UI - reused from condition node */}
            {(currentNode.data.conditions || []).map((condition, index) => (
              <div key={index} className="border border-slate-300 dark:border-slate-600 rounded-md p-3 mb-3 bg-white dark:bg-slate-900">
                <div className="flex justify-between items-center mb-3">
                  <strong className="text-sm text-slate-900 dark:text-slate-100">
                    {index === 0 ? 'While' : 'AND'} Condition {index + 1}
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
                  <VariableInput
                    value={condition.variable || ''}
                    onChange={(e) => {
                      const newConditions = [...(currentNode.data.conditions || [])];
                      newConditions[index] = { ...newConditions[index], variable: e.target.value };
                      handleDataChange('conditions', newConditions);
                    }}
                    placeholder="{{context.variable_name}}"
                    availableVars={availableVariables}
                    isRTL={isRTL}
                    className="text-xs"
                  />
                </div>
                <div className="mb-2">
                  <label className="block mb-1 text-xs font-medium text-slate-700 dark:text-slate-300">{t("workflows.editor.properties.operator")}</label>
                  <select
                    value={condition.operator || 'greater_than'}
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

            {/* Add condition button */}
            <button
              onClick={() => {
                const newConditions = [...(currentNode.data.conditions || []), { variable: '', operator: 'greater_than', value: '' }];
                handleDataChange('conditions', newConditions);
              }}
              className="w-full py-2.5 bg-violet-50 dark:bg-violet-950/30 border border-dashed border-violet-300 dark:border-violet-700 rounded cursor-pointer text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/50 transition-colors text-sm font-medium"
            >
              + Add Condition
            </button>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
              {t("workflows.editor.properties.whileConditionHint") || "The loop continues while ALL conditions are true."}
            </p>

            {/* Connection info */}
            <div className="mt-4 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700 rounded-md">
              <p className="text-xs text-violet-700 dark:text-violet-300">
                <strong>Connections:</strong> Connect the <span className="font-mono bg-violet-100 dark:bg-violet-800 px-1 rounded">loop</span> handle to loop body nodes, and the <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">exit</span> handle to the node after the loop. Connect the last node of your loop body back to this node.
              </p>
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
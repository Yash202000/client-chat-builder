import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, ChevronDown, ChevronRight, Save, PanelRightClose, PanelRight, Plus, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Team, SpecializationTopic, AgentHandoffConfig } from '@/types';

// Provider-specific model configurations
const PROVIDER_MODELS: Record<string, Array<{ value: string; label: string }>> = {
  groq: [
    { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
    { value: 'llama-3.1-70b-versatile', label: 'Llama 3.1 70B Versatile' },
    { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
    { value: 'llama3-70b-8192', label: 'Llama 3 70B' },
    { value: 'llama3-8b-8192', label: 'Llama 3 8B' },
    { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
    { value: 'gemma2-9b-it', label: 'Gemma 2 9B' },
  ],
  gemini: [
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-pro', label: 'Gemini Pro' },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
  ],
  openai: [
    { value: 'gpt-4o', label: 'GPT-4o' },
    { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  ],
};

const DEFAULT_MODELS: Record<string, string> = {
  groq: 'llama-3.3-70b-versatile',
  gemini: 'gemini-1.5-pro',
  openai: 'gpt-4o',
};

// Collapsible Section Component
const CollapsibleSection = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</span>
        {isOpen ? <ChevronDown className="h-4 w-4 text-slate-500" /> : <ChevronRight className="h-4 w-4 text-slate-500" />}
      </button>
      {isOpen && <div className="p-3 space-y-3 bg-white dark:bg-slate-900">{children}</div>}
    </div>
  );
};

interface AgentPropertiesPanelProps {
  agent: any;
  selectedNode: any;
  onNodeDelete: (nodeId: string) => void;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

export const AgentPropertiesPanel = ({ agent, selectedNode, onNodeDelete, isCollapsed = false, onToggle }: AgentPropertiesPanelProps) => {
  const { t } = useTranslation();
  const { isRTL } = useI18n();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  // Fetch teams for handoff selection
  const { data: teams = [] } = useQuery<Team[]>({
    queryKey: ['teams'],
    queryFn: async () => {
      const response = await authFetch('/api/v1/teams/');
      if (!response.ok) throw new Error('Failed to fetch teams');
      return response.json();
    },
  });

  // Agent config state
  const [agentConfig, setAgentConfig] = useState({
    name: "",
    personality: "helpful",
    language: "en",
    timezone: "UTC",
    tts_provider: "voice_engine",
    stt_provider: "deepgram",
    voice_id: "default",
    llm_provider: "groq",
    embedding_model: "gemini",
    model_name: "llama-3.3-70b-versatile",
    handoff_team_id: null as number | null,
    vision_enabled: false,
    // Agent-to-agent handoff fields
    specialization_topics: [] as SpecializationTopic[],
    handoff_config: {
      accept_handoffs: false,
      history_mode: 'full' as 'full' | 'summary' | 'none',
      welcome_message_on_handoff: '',
    } as AgentHandoffConfig,
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Initialize config from agent
  useEffect(() => {
    if (agent) {
      setAgentConfig({
        name: agent.name || "",
        personality: agent.personality || "helpful",
        language: agent.language || "en",
        timezone: agent.timezone || "UTC",
        tts_provider: agent.tts_provider || "voice_engine",
        stt_provider: agent.stt_provider || "deepgram",
        voice_id: agent.voice_id || "default",
        llm_provider: agent.llm_provider || "groq",
        embedding_model: agent.embedding_model || "gemini",
        model_name: agent.model_name || "llama-3.3-70b-versatile",
        handoff_team_id: agent.handoff_team_id || null,
        vision_enabled: agent.vision_enabled || false,
        // Agent-to-agent handoff fields
        specialization_topics: agent.specialization_topics || [],
        handoff_config: {
          accept_handoffs: agent.handoff_config?.accept_handoffs ?? false,
          history_mode: agent.handoff_config?.history_mode || 'full',
          welcome_message_on_handoff: agent.handoff_config?.welcome_message_on_handoff || '',
        },
      });
      setHasChanges(false);
    }
  }, [agent]);

  // Reset model when provider changes
  useEffect(() => {
    const currentModels = PROVIDER_MODELS[agentConfig.llm_provider] || [];
    const isCurrentModelValid = currentModels.some(model => model.value === agentConfig.model_name);
    if (!isCurrentModelValid && agentConfig.llm_provider) {
      const defaultModel = DEFAULT_MODELS[agentConfig.llm_provider];
      if (defaultModel) {
        setAgentConfig(prev => ({ ...prev, model_name: defaultModel }));
      }
    }
  }, [agentConfig.llm_provider]);

  // Update mutation
  const mutation = useMutation({
    mutationFn: (updatedConfig: typeof agentConfig) => {
      return authFetch(`/api/v1/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agent.id.toString()] });
      await queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast.success(t("agents.settingsPage.toasts.updateSuccess", { defaultValue: "Settings saved successfully" }));
      setHasChanges(false);
    },
    onError: () => {
      toast.error(t("agents.settingsPage.toasts.updateError", { defaultValue: "Failed to save settings" }));
    },
  });

  const handleConfigChange = (key: string, value: any) => {
    setAgentConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    mutation.mutate(agentConfig);
  };

  // Collapsed view
  if (isCollapsed) {
    return (
      <aside className={`w-14 bg-white dark:bg-slate-900 ${isRTL ? 'border-r' : 'border-l'} border-slate-200 dark:border-slate-700 flex flex-col h-full transition-all duration-200 ease-in-out`}>
        <div className="flex items-center justify-center p-4">
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-7 w-7"
              title={t('common.expand', { defaultValue: 'Expand' })}
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          )}
        </div>
        {selectedNode && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 flex items-center justify-center" title={selectedNode.data.label}>
              <ChevronRight className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
        )}
      </aside>
    );
  }

  if (!selectedNode) {
    return (
      <aside className={`w-80 p-4 bg-white dark:bg-slate-900 ${isRTL ? 'border-r' : 'border-l'} border-slate-200 dark:border-slate-700 flex flex-col h-full transition-all duration-200 ease-in-out`}>
        {/* Header with toggle */}
        <div className="flex items-center justify-end mb-4">
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-7 w-7"
              title={t('common.collapse', { defaultValue: 'Collapse' })}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-3">
              <ChevronRight className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('builder.selectNodePrompt')}</p>
          </div>
        </div>
      </aside>
    );
  }

  const handleDelete = () => {
    if (onNodeDelete && selectedNode) {
      onNodeDelete(selectedNode.id);
    }
  };

  const selectedTool = selectedNode?.type === 'tools'
    ? agent.tools.find(t => t.id === selectedNode.data.id)
    : null;

  const selectedKb = selectedNode?.type === 'knowledge'
    ? agent.knowledge_bases.find(kb => kb.id === selectedNode.data.id)
    : null;

  const selectClassName = "w-full p-2 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all";

  return (
    <aside className={`w-80 bg-white dark:bg-slate-900 ${isRTL ? 'border-r' : 'border-l'} border-slate-200 dark:border-slate-700 flex flex-col h-full transition-all duration-200 ease-in-out`}>
      {/* Header */}
      <div className={`flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {onToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              className="h-7 w-7 flex-shrink-0"
              title={t('common.collapse', { defaultValue: 'Collapse' })}
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
          <h3 className="text-lg font-bold dark:text-white truncate">{selectedNode.data.label}</h3>
        </div>
        {(selectedNode.type === 'tools' || selectedNode.type === 'knowledge') && (
          <Button size="sm" variant="destructive" onClick={handleDelete} className="hover:scale-105 transition-transform flex-shrink-0">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {selectedNode.type === 'agent' && (
          <div className="space-y-3">
            {/* Basic Settings - Always Open */}
            <CollapsibleSection title={t('agents.settingsPage.basicInformation', { defaultValue: 'Basic Settings' })} defaultOpen={true}>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.agentName', { defaultValue: 'Name' })}</Label>
                <Input
                  value={agentConfig.name}
                  onChange={(e) => handleConfigChange('name', e.target.value)}
                  className="mt-1 text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                  placeholder={t('agents.settingsPage.enterAgentName', { defaultValue: 'Enter agent name' })}
                />
              </div>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.personality', { defaultValue: 'Personality' })}</Label>
                <select
                  value={agentConfig.personality}
                  onChange={(e) => handleConfigChange('personality', e.target.value)}
                  className={selectClassName}
                >
                  <option value="helpful">{t('agents.settingsPage.personalities.helpful', { defaultValue: 'Helpful' })}</option>
                  <option value="friendly">{t('agents.settingsPage.personalities.friendly', { defaultValue: 'Friendly' })}</option>
                  <option value="formal">{t('agents.settingsPage.personalities.formal', { defaultValue: 'Formal' })}</option>
                  <option value="enthusiastic">{t('agents.settingsPage.personalities.enthusiastic', { defaultValue: 'Enthusiastic' })}</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('common.language', { defaultValue: 'Language' })}</Label>
                <select
                  value={agentConfig.language}
                  onChange={(e) => handleConfigChange('language', e.target.value)}
                  className={selectClassName}
                >
                  <option value="en">{t('agents.settingsPage.languages.en', { defaultValue: 'English' })}</option>
                  <option value="es">{t('agents.settingsPage.languages.es', { defaultValue: 'Spanish' })}</option>
                  <option value="fr">{t('agents.settingsPage.languages.fr', { defaultValue: 'French' })}</option>
                  <option value="de">{t('agents.settingsPage.languages.de', { defaultValue: 'German' })}</option>
                  <option value="ar">{t('agents.settingsPage.languages.ar', { defaultValue: 'Arabic' })}</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.timezone', { defaultValue: 'Timezone' })}</Label>
                <select
                  value={agentConfig.timezone}
                  onChange={(e) => handleConfigChange('timezone', e.target.value)}
                  className={selectClassName}
                >
                  <option value="UTC">{t('agents.settingsPage.timezones.utc', { defaultValue: 'UTC' })}</option>
                  <option value="America/New_York">{t('agents.settingsPage.timezones.eastern', { defaultValue: 'Eastern (US)' })}</option>
                  <option value="America/Chicago">{t('agents.settingsPage.timezones.central', { defaultValue: 'Central (US)' })}</option>
                  <option value="America/Los_Angeles">{t('agents.settingsPage.timezones.pacific', { defaultValue: 'Pacific (US)' })}</option>
                  <option value="Asia/Kolkata">{t('agents.settingsPage.timezones.ist', { defaultValue: 'IST (India)' })}</option>
                </select>
              </div>
            </CollapsibleSection>

            {/* AI Configuration */}
            <CollapsibleSection title={t('agents.settingsPage.llmConfiguration', { defaultValue: 'AI Configuration' })}>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.llmProvider', { defaultValue: 'LLM Provider' })}</Label>
                <select
                  value={agentConfig.llm_provider}
                  onChange={(e) => handleConfigChange('llm_provider', e.target.value)}
                  className={selectClassName}
                >
                  <option value="groq">Groq</option>
                  <option value="gemini">Google Gemini</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.modelName', { defaultValue: 'Model' })}</Label>
                <select
                  value={agentConfig.model_name}
                  onChange={(e) => handleConfigChange('model_name', e.target.value)}
                  className={selectClassName}
                >
                  {PROVIDER_MODELS[agentConfig.llm_provider]?.map((model) => (
                    <option key={model.value} value={model.value}>{model.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.embeddingModel', { defaultValue: 'Embedding Model' })}</Label>
                <select
                  value={agentConfig.embedding_model}
                  onChange={(e) => handleConfigChange('embedding_model', e.target.value)}
                  className={selectClassName}
                >
                  <option value="gemini">Gemini</option>
                  <option value="nvidia">NVIDIA (Local)</option>
                  <option value="nvidia_api">NVIDIA (API)</option>
                </select>
              </div>
              <div className="flex items-center justify-between py-2">
                <div>
                  <Label className="text-xs font-medium dark:text-gray-300">
                    {t('agents.settingsPage.visionEnabled', { defaultValue: 'Vision (Image Processing)' })}
                  </Label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('agents.settingsPage.visionEnabledHelp', { defaultValue: 'Enable to process images with LLM' })}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={agentConfig.vision_enabled}
                  onChange={(e) => handleConfigChange('vision_enabled', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
              </div>
            </CollapsibleSection>

            {/* Voice Configuration */}
            <CollapsibleSection title={t('agents.settingsPage.voiceSettings', { defaultValue: 'Voice Configuration' })}>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.ttsProvider', { defaultValue: 'TTS Provider' })}</Label>
                <select
                  value={agentConfig.tts_provider}
                  onChange={(e) => handleConfigChange('tts_provider', e.target.value)}
                  className={selectClassName}
                >
                  <option value="voice_engine">Voice Engine</option>
                  <option value="localai">LocalAI</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.sttProvider', { defaultValue: 'STT Provider' })}</Label>
                <select
                  value={agentConfig.stt_provider}
                  onChange={(e) => handleConfigChange('stt_provider', e.target.value)}
                  className={selectClassName}
                >
                  <option value="deepgram">Deepgram</option>
                  <option value="groq">Groq</option>
                  <option value="openai">OpenAI</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.voiceId', { defaultValue: 'Voice ID' })}</Label>
                <select
                  value={agentConfig.voice_id || 'default'}
                  onChange={(e) => handleConfigChange('voice_id', e.target.value)}
                  className={selectClassName}
                  disabled={agentConfig.tts_provider !== 'voice_engine'}
                >
                  <option value="default">{t('agents.settingsPage.voices.default', { defaultValue: 'Default' })}</option>
                </select>
              </div>
            </CollapsibleSection>

            {/* Team Settings */}
            <CollapsibleSection title={t('agents.settingsPage.teamSettings', { defaultValue: 'Team Settings' })}>
              <div>
                <Label className="text-xs font-medium dark:text-gray-300">{t('agents.settingsPage.handoffTeam', { defaultValue: 'Handoff Team' })}</Label>
                <select
                  value={agentConfig.handoff_team_id || ""}
                  onChange={(e) => handleConfigChange('handoff_team_id', e.target.value ? parseInt(e.target.value) : null)}
                  className={selectClassName}
                >
                  <option value="">{t('agents.settingsPage.noTeam', { defaultValue: 'None (Use default)' })}</option>
                  {teams.map((team) => (
                    <option key={team.id} value={team.id}>{team.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('agents.settingsPage.handoffTeamHelp', { defaultValue: 'Team to handle human support requests' })}
                </p>
              </div>
            </CollapsibleSection>

            {/* Agent Specialization */}
            <CollapsibleSection title={t('agents.settingsPage.agentSpecialization', { defaultValue: 'Agent Specialization' })}>
              <div className="space-y-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('agents.settingsPage.specializationHelp', { defaultValue: 'Define topics this agent specializes in for agent-to-agent transfers.' })}
                </p>

                {/* Specialization Topics List */}
                {agentConfig.specialization_topics.map((topic, index) => (
                  <div key={index} className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-2">
                        <Input
                          value={topic.topic}
                          onChange={(e) => {
                            const newTopics = [...agentConfig.specialization_topics];
                            newTopics[index] = { ...newTopics[index], topic: e.target.value };
                            handleConfigChange('specialization_topics', newTopics);
                          }}
                          placeholder={t('agents.settingsPage.topicName', { defaultValue: 'Topic (e.g., billing, support)' })}
                          className="text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                        <Input
                          value={topic.description}
                          onChange={(e) => {
                            const newTopics = [...agentConfig.specialization_topics];
                            newTopics[index] = { ...newTopics[index], description: e.target.value };
                            handleConfigChange('specialization_topics', newTopics);
                          }}
                          placeholder={t('agents.settingsPage.topicDescription', { defaultValue: 'Description of what this agent handles' })}
                          className="text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        onClick={() => {
                          const newTopics = agentConfig.specialization_topics.filter((_, i) => i !== index);
                          handleConfigChange('specialization_topics', newTopics);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add Topic Button */}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-dashed"
                  onClick={() => {
                    handleConfigChange('specialization_topics', [
                      ...agentConfig.specialization_topics,
                      { topic: '', description: '' }
                    ]);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('agents.settingsPage.addTopic', { defaultValue: 'Add Specialization Topic' })}
                </Button>
              </div>
            </CollapsibleSection>

            {/* Agent-to-Agent Handoff Configuration */}
            <CollapsibleSection title={t('agents.settingsPage.agentHandoff', { defaultValue: 'Agent-to-Agent Handoff' })}>
              <div className="space-y-3">
                {/* Accept Handoffs Toggle */}
                <div className="flex items-center justify-between py-2">
                  <div>
                    <Label className="text-xs font-medium dark:text-gray-300">
                      {t('agents.settingsPage.acceptHandoffs', { defaultValue: 'Accept Handoffs' })}
                    </Label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('agents.settingsPage.acceptHandoffsHelp', { defaultValue: 'Allow other agents to transfer conversations to this agent' })}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={agentConfig.handoff_config.accept_handoffs}
                    onChange={(e) => handleConfigChange('handoff_config', {
                      ...agentConfig.handoff_config,
                      accept_handoffs: e.target.checked
                    })}
                    className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                </div>

                {/* History Mode */}
                <div>
                  <Label className="text-xs font-medium dark:text-gray-300">
                    {t('agents.settingsPage.historyMode', { defaultValue: 'History Mode' })}
                  </Label>
                  <select
                    value={agentConfig.handoff_config.history_mode}
                    onChange={(e) => handleConfigChange('handoff_config', {
                      ...agentConfig.handoff_config,
                      history_mode: e.target.value as 'full' | 'summary' | 'none'
                    })}
                    className={selectClassName}
                  >
                    <option value="full">{t('agents.settingsPage.historyModes.full', { defaultValue: 'Full - Receive complete conversation history' })}</option>
                    <option value="summary">{t('agents.settingsPage.historyModes.summary', { defaultValue: 'Summary - Receive only a summary' })}</option>
                    <option value="none">{t('agents.settingsPage.historyModes.none', { defaultValue: 'None - Start fresh without context' })}</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('agents.settingsPage.historyModeHelp', { defaultValue: 'How much conversation history to receive when taking over a conversation' })}
                  </p>
                </div>

                {/* Welcome Message on Handoff */}
                <div>
                  <Label className="text-xs font-medium dark:text-gray-300">
                    {t('agents.settingsPage.welcomeMessageOnHandoff', { defaultValue: 'Welcome Message on Handoff' })}
                  </Label>
                  <Textarea
                    value={agentConfig.handoff_config.welcome_message_on_handoff}
                    onChange={(e) => handleConfigChange('handoff_config', {
                      ...agentConfig.handoff_config,
                      welcome_message_on_handoff: e.target.value
                    })}
                    placeholder={t('agents.settingsPage.welcomeMessageOnHandoffPlaceholder', { defaultValue: "Hi! I'm the billing specialist. How can I help you today?" })}
                    className="text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white resize-none"
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t('agents.settingsPage.welcomeMessageOnHandoffHelp', { defaultValue: 'Message to send when this agent takes over a conversation' })}
                  </p>
                </div>
              </div>
            </CollapsibleSection>
          </div>
        )}

        {selectedTool && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t('builder.toolDetails')}</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('builder.id')}</p>
              <p className="text-sm dark:text-white font-mono">#{selectedTool.id}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('builder.description')}</p>
              <p className="text-sm dark:text-white">{selectedTool.description}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('builder.type')}</p>
              <p className="text-sm dark:text-white capitalize">{selectedTool.tool_type}</p>
            </div>
            {selectedTool.tool_type === 'custom' && selectedTool.parameters && (
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">{t('builder.parameters')}</p>
                <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-600 overflow-x-auto dark:text-white">
                  {JSON.stringify(selectedTool.parameters, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {selectedKb && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">{t('builder.knowledgeBaseDetails')}</p>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('builder.id')}</p>
              <p className="text-sm dark:text-white font-mono">#{selectedKb.id}</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{t('builder.description')}</p>
              <p className="text-sm dark:text-white">{selectedKb.description}</p>
            </div>
          </div>
        )}
      </div>

      {/* Save Button - Fixed at bottom for agent config */}
      {selectedNode.type === 'agent' && hasChanges && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <Button
            onClick={handleSave}
            disabled={mutation.isPending}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          >
            {mutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {t('agents.settingsPage.saving', { defaultValue: 'Saving...' })}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {t('agents.settingsPage.saveChanges', { defaultValue: 'Save Changes' })}
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
};

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const AgentSettingsPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const { t, isRTL } = useI18n();

  const { data: agent, isLoading } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
  });

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
    model_name: "llama-3.1-8b-instant",
  });

  useEffect(() => {
    if (agent) {
      setAgentConfig({
        name: agent.name,
        personality: agent.personality || "helpful",
        language: agent.language || "en",
        timezone: agent.timezone || "UTC",
        tts_provider: agent.tts_provider || "voice_engine",
        stt_provider: agent.stt_provider || "deepgram",
        voice_id: agent.voice_id || "default",
        llm_provider: agent.llm_provider || "groq",
        embedding_model: agent.embedding_model || "gemini",
        model_name: agent.model_name || "llama-3.1-8b-instant",
      });
    }
  }, [agent]);

  const mutation = useMutation({
    mutationFn: (updatedConfig: Partial<Agent>) => {
      console.log("Updating agent with config:", updatedConfig);
      return authFetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success(t("agents.settingsPage.toasts.updateSuccess"));
    },
    onError: () => {
      toast.error(t("agents.settingsPage.toasts.updateError"));
    },
  });

  const handleSave = () => {
    mutation.mutate(agentConfig);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t("agents.settingsPage.loadingSettings")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            {t("agents.settingsPage.title")}
          </h1>
          <p className="text-muted-foreground">{t("agents.settingsPage.subtitle", { name: agent?.name })}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)} className="btn-hover-lift">
          <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t("agents.settingsPage.backToBuilder")}
        </Button>
      </div>

      <Card className="card-shadow-lg bg-white dark:bg-slate-800 overflow-visible">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl dark:text-white">{t("agents.settingsPage.basicConfiguration")}</CardTitle>
              <CardDescription className="dark:text-gray-400">{t("agents.settingsPage.configurationDescription")}</CardDescription>
            </div>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/builder/${agentId}`)}
                className="btn-hover-lift"
              >
                {t("common.cancel")}
              </Button>
              <Button
                onClick={handleSave}
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 btn-hover-lift"
              >
                {mutation.isPending ? (
                  <>
                    <div className={`animate-spin rounded-full h-4 w-4 border-b-2 border-white ${isRTL ? 'ml-2' : 'mr-2'}`}></div>
                    {t("agents.settingsPage.saving")}
                  </>
                ) : (
                  t("agents.settingsPage.saveChanges")
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Basic & LLM Settings */}
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">{t("agents.settingsPage.basicInformation")}</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agentName" className="text-sm font-medium dark:text-gray-300">{t("agents.agentName")}</Label>
                    <Input
                      id="agentName"
                      value={agentConfig.name}
                      onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                      className="mt-1.5 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      placeholder={t("agents.settingsPage.enterAgentName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="personality" className="text-sm font-medium dark:text-gray-300">{t("agents.settingsPage.personality")}</Label>
                    <select
                      id="personality"
                      value={agentConfig.personality}
                      onChange={(e) => setAgentConfig({ ...agentConfig, personality: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="helpful">{t("agents.settingsPage.personalities.helpful")}</option>
                      <option value="friendly">{t("agents.settingsPage.personalities.friendly")}</option>
                      <option value="formal">{t("agents.settingsPage.personalities.formal")}</option>
                      <option value="enthusiastic">{t("agents.settingsPage.personalities.enthusiastic")}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="language" className="text-sm font-medium dark:text-gray-300">{t("common.language")}</Label>
                    <select
                      id="language"
                      value={agentConfig.language}
                      onChange={(e) => setAgentConfig({ ...agentConfig, language: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="en">{t("agents.settingsPage.languages.en")}</option>
                      <option value="es">{t("agents.settingsPage.languages.es")}</option>
                      <option value="fr">{t("agents.settingsPage.languages.fr")}</option>
                      <option value="de">{t("agents.settingsPage.languages.de")}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium dark:text-gray-300">{t("agents.settingsPage.timezone")}</Label>
                    <select
                      id="timezone"
                      value={agentConfig.timezone}
                      onChange={(e) => setAgentConfig({ ...agentConfig, timezone: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="UTC">{t("agents.settingsPage.timezones.utc")}</option>
                      <option value="America/New_York">{t("agents.settingsPage.timezones.eastern")}</option>
                      <option value="America/Chicago">{t("agents.settingsPage.timezones.central")}</option>
                      <option value="America/Los_Angeles">{t("agents.settingsPage.timezones.pacific")}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">{t("agents.settingsPage.llmConfiguration")}</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="llmProvider" className="text-sm font-medium dark:text-gray-300">{t("agents.llmProvider")}</Label>
                    <select
                      id="llmProvider"
                      value={agentConfig.llm_provider}
                      onChange={(e) => setAgentConfig({ ...agentConfig, llm_provider: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="groq">{t("agents.settingsPage.llmProviders.groq")}</option>
                      <option value="gemini">{t("agents.settingsPage.llmProviders.gemini")}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="modelName" className="text-sm font-medium dark:text-gray-300">{t("agents.settingsPage.modelName")}</Label>
                    <Input
                      id="modelName"
                      value={agentConfig.model_name}
                      onChange={(e) => setAgentConfig({ ...agentConfig, model_name: e.target.value })}
                      className="mt-1.5 dark:bg-slate-800 dark:border-slate-600 dark:text-white font-mono text-sm"
                      placeholder={t("agents.settingsPage.enterModelName")}
                    />
                  </div>
                  <div>
                    <Label htmlFor="embeddingModel" className="text-sm font-medium dark:text-gray-300">{t("agents.settingsPage.embeddingModel")}</Label>
                    <select
                      id="embeddingModel"
                      value={agentConfig.embedding_model}
                      onChange={(e) => setAgentConfig({ ...agentConfig, embedding_model: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="gemini">{t("agents.settingsPage.embeddingModels.gemini")}</option>
                      <option value="nvidia">{t("agents.settingsPage.embeddingModels.nvidia")}</option>
                      <option value="nvidia_api">{t("agents.settingsPage.embeddingModels.nvidia_api")}</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Voice Settings */}
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">{t("agents.settingsPage.voiceSettings")}</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ttsProvider" className="text-sm font-medium dark:text-gray-300">{t("agents.settingsPage.ttsProvider")}</Label>
                    <select
                      id="ttsProvider"
                      value={agentConfig.tts_provider}
                      onChange={(e) => setAgentConfig({ ...agentConfig, tts_provider: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="voice_engine">{t("agents.settingsPage.ttsProviders.voice_engine")}</option>
                      <option value="localai">{t("agents.settingsPage.ttsProviders.localai")}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sttProvider" className="text-sm font-medium dark:text-gray-300">{t("agents.settingsPage.sttProvider")}</Label>
                    <select
                      id="sttProvider"
                      value={agentConfig.stt_provider}
                      onChange={(e) => setAgentConfig({ ...agentConfig, stt_provider: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="deepgram">{t("agents.settingsPage.sttProviders.deepgram")}</option>
                      <option value="groq">{t("agents.settingsPage.sttProviders.groq")}</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="voice" className="text-sm font-medium dark:text-gray-300">{t("agents.settingsPage.voiceId")}</Label>
                    <select
                      id="voice"
                      value={agentConfig.voice_id || 'default'}
                      onChange={(e) => setAgentConfig({ ...agentConfig, voice_id: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={agentConfig.tts_provider !== 'voice_engine'}
                    >
                      <option value="default">{t("agents.settingsPage.voices.default")}</option>
                      {/* Add more voice options here */}
                    </select>
                    {agentConfig.tts_provider !== 'voice_engine' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{t("agents.settingsPage.voiceSelectionNote")}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-400 mb-2">💡 {t("agents.settingsPage.quickTips")}</h4>
                <ul className={`text-xs text-green-800 dark:text-green-300 space-y-1.5 ${isRTL ? 'pr-4' : 'pl-4'}`}>
                  <li className={isRTL ? 'text-left' : ''}>• {t("agents.settingsPage.tip1")}</li>
                  <li className={isRTL ? 'text-left' : ''}>• {t("agents.settingsPage.tip2")}</li>
                  <li className={isRTL ? 'text-left' : ''}>• {t("agents.settingsPage.tip3")}</li>
                  <li className={isRTL ? 'text-left' : ''}>• {t("agents.settingsPage.tip4")}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

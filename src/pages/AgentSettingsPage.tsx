import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

export const AgentSettingsPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

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
      toast.success("Agent settings updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update agent settings.");
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
          <p className="text-muted-foreground">Loading agent settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Agent Settings
          </h1>
          <p className="text-muted-foreground">Configure {agent?.name}'s behavior and AI models</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)} className="btn-hover-lift">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Builder
        </Button>
      </div>

      <Card className="card-shadow-lg bg-white dark:bg-slate-800 overflow-visible">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl dark:text-white">Basic Configuration</CardTitle>
              <CardDescription className="dark:text-gray-400">Configure the agent's basic information and AI model settings.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/dashboard/builder/${agentId}`)}
                className="btn-hover-lift"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={mutation.isPending}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 btn-hover-lift"
              >
                {mutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  "Save Changes"
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
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Basic Information</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="agentName" className="text-sm font-medium dark:text-gray-300">Agent Name</Label>
                    <Input
                      id="agentName"
                      value={agentConfig.name}
                      onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                      className="mt-1.5 dark:bg-slate-800 dark:border-slate-600 dark:text-white"
                      placeholder="Enter agent name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="personality" className="text-sm font-medium dark:text-gray-300">Personality</Label>
                    <select
                      id="personality"
                      value={agentConfig.personality}
                      onChange={(e) => setAgentConfig({ ...agentConfig, personality: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="helpful">Helpful & Professional</option>
                      <option value="friendly">Friendly & Casual</option>
                      <option value="formal">Formal & Business</option>
                      <option value="enthusiastic">Enthusiastic & Energetic</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="language" className="text-sm font-medium dark:text-gray-300">Language</Label>
                    <select
                      id="language"
                      value={agentConfig.language}
                      onChange={(e) => setAgentConfig({ ...agentConfig, language: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="timezone" className="text-sm font-medium dark:text-gray-300">Timezone</Label>
                    <select
                      id="timezone"
                      value={agentConfig.timezone}
                      onChange={(e) => setAgentConfig({ ...agentConfig, timezone: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">LLM Configuration</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="llmProvider" className="text-sm font-medium dark:text-gray-300">LLM Provider</Label>
                    <select
                      id="llmProvider"
                      value={agentConfig.llm_provider}
                      onChange={(e) => setAgentConfig({ ...agentConfig, llm_provider: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="groq">Groq</option>
                      <option value="gemini">Gemini</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="modelName" className="text-sm font-medium dark:text-gray-300">Model Name</Label>
                    <Input
                      id="modelName"
                      value={agentConfig.model_name}
                      onChange={(e) => setAgentConfig({ ...agentConfig, model_name: e.target.value })}
                      className="mt-1.5 dark:bg-slate-800 dark:border-slate-600 dark:text-white font-mono text-sm"
                      placeholder="e.g., llama-3.1-8b-instant"
                    />
                  </div>
                  <div>
                    <Label htmlFor="embeddingModel" className="text-sm font-medium dark:text-gray-300">Embedding Model</Label>
                    <select
                      id="embeddingModel"
                      value={agentConfig.embedding_model}
                      onChange={(e) => setAgentConfig({ ...agentConfig, embedding_model: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="gemini">Gemini</option>
                      <option value="nvidia">NVIDIA Llama 3.2 (Local)</option>
                      <option value="nvidia_api">NVIDIA API</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Voice Settings */}
            <div className="space-y-5">
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 uppercase tracking-wider">Voice Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ttsProvider" className="text-sm font-medium dark:text-gray-300">Text-to-Speech Provider</Label>
                    <select
                      id="ttsProvider"
                      value={agentConfig.tts_provider}
                      onChange={(e) => setAgentConfig({ ...agentConfig, tts_provider: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="voice_engine">Custom Voice Engine</option>
                      <option value="localai">Local AI</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="sttProvider" className="text-sm font-medium dark:text-gray-300">Speech-to-Text Provider</Label>
                    <select
                      id="sttProvider"
                      value={agentConfig.stt_provider}
                      onChange={(e) => setAgentConfig({ ...agentConfig, stt_provider: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all"
                    >
                      <option value="deepgram">Deepgram</option>
                      <option value="groq">Groq</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="voice" className="text-sm font-medium dark:text-gray-300">Voice ID</Label>
                    <select
                      id="voice"
                      value={agentConfig.voice_id || 'default'}
                      onChange={(e) => setAgentConfig({ ...agentConfig, voice_id: e.target.value })}
                      className="w-full mt-1.5 p-2 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={agentConfig.tts_provider !== 'voice_engine'}
                    >
                      <option value="default">Default Voice</option>
                      {/* Add more voice options here */}
                    </select>
                    {agentConfig.tts_provider !== 'voice_engine' && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">Voice selection only available with Custom Voice Engine</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 rounded-lg p-4 border border-green-200 dark:border-green-900">
                <h4 className="text-sm font-semibold text-green-900 dark:text-green-400 mb-2">💡 Quick Tips</h4>
                <ul className="text-xs text-green-800 dark:text-green-300 space-y-1.5">
                  <li>• Choose personality based on your target audience</li>
                  <li>• Groq offers faster inference for real-time chat</li>
                  <li>• Deepgram provides superior speech recognition</li>
                  <li>• Test different models to find the best fit</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

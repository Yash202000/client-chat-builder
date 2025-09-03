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

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Agent Settings</h1>
        <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agent Hub
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic Configuration</CardTitle>
          <CardDescription>Configure the agent's basic information and voice settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="agentName">Agent Name</Label>
                <Input
                  id="agentName"
                  value={agentConfig.name}
                  onChange={(e) => setAgentConfig({ ...agentConfig, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="personality">Personality</Label>
                <select
                  id="personality"
                  value={agentConfig.personality}
                  onChange={(e) => setAgentConfig({ ...agentConfig, personality: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="helpful">Helpful & Professional</option>
                  <option value="friendly">Friendly & Casual</option>
                  <option value="formal">Formal & Business</option>
                  <option value="enthusiastic">Enthusiastic & Energetic</option>
                </select>
              </div>
              <div>
                <Label htmlFor="language">Language</Label>
                <select
                  id="language"
                  value={agentConfig.language}
                  onChange={(e) => setAgentConfig({ ...agentConfig, language: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={agentConfig.timezone}
                  onChange={(e) => setAgentConfig({ ...agentConfig, timezone: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                </select>
              </div>
              <div>
                <Label htmlFor="llmProvider">LLM Provider</Label>
                <select
                  id="llmProvider"
                  value={agentConfig.llm_provider}
                  onChange={(e) => setAgentConfig({ ...agentConfig, llm_provider: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="groq">Groq</option>
                  <option value="gemini">Gemini</option>
                </select>
              </div>
              <div>
                <Label htmlFor="modelName">Model Name</Label>
                <Input
                  id="modelName"
                  value={agentConfig.model_name}
                  onChange={(e) => setAgentConfig({ ...agentConfig, model_name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="embeddingModel">Embedding Model</Label>
                <select
                  id="embeddingModel"
                  value={agentConfig.embedding_model}
                  onChange={(e) => setAgentConfig({ ...agentConfig, embedding_model: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="gemini">Gemini</option>
                  <option value="nvidia">NVIDIA Llama 3.2 (Local)</option>
                  <option value="nvidia_api">NVIDIA API</option>
                </select>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ttsProvider">TTS Provider</Label>
                <select
                  id="ttsProvider"
                  value={agentConfig.tts_provider}
                  onChange={(e) => setAgentConfig({ ...agentConfig, tts_provider: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="voice_engine">Custom Voice Engine</option>
                  <option value="localai">Local AI</option>
                </select>
              </div>
              <div>
                <Label htmlFor="sttProvider">STT Provider</Label>
                <select
                  id="sttProvider"
                  value={agentConfig.stt_provider}
                  onChange={(e) => setAgentConfig({ ...agentConfig, stt_provider: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="deepgram">Deepgram</option>
                  <option value="groq">Groq</option>
                </select>
              </div>
              <div>
                <Label htmlFor="voice">Voice</Label>
                <select
                  id="voice"
                  value={agentConfig.voice_id || 'default'}
                  onChange={(e) => setAgentConfig({ ...agentConfig, voice_id: e.target.value })}
                  className="w-full mt-1 p-2 border rounded-md"
                  disabled={agentConfig.tts_provider !== 'voice_engine'}
                >
                  {/* Add voice options here */}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

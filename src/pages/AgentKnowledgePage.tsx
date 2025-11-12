import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, KnowledgeBase } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { ResourceSelector } from "@/components/ResourceSelector";

export const AgentKnowledgePage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();

  const { data: agent, isLoading: isLoadingAgent } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
  });

  const { data: knowledgeBases, isLoading: isLoadingKnowledgeBases } = useQuery<KnowledgeBase[]>({
    queryKey: ['knowledgeBases'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/knowledge-bases/`);
      if (!response.ok) throw new Error('Failed to fetch knowledge bases');
      return response.json();
    },
  });

  const [selectedKbIds, setSelectedKbIds] = useState<number[]>([]);

  useEffect(() => {
    if (agent) {
      setSelectedKbIds(agent.knowledge_bases?.map((kb) => kb.id) || []);
    }
  }, [agent]);

  const mutation = useMutation({
    mutationFn: (knowledgeBaseIds: number[]) => {
      return authFetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ knowledge_base_ids: knowledgeBaseIds }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success(t("knowledgeBase.agentKnowledgePage.updateSuccess"));
    },
    onError: () => {
      toast.error(t("knowledgeBase.agentKnowledgePage.updateError"));
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedKbIds);
  };

  if (isLoadingAgent) return <div>{t("knowledgeBase.agentKnowledgePage.loading")}</div>;

  return (
    <div className={`p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)} className={`mb-6 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
        <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
        {t("knowledgeBase.agentKnowledgePage.backToAgentHub")}
      </Button>
      <Card>
        <CardHeader>
          <CardTitle className={isRTL ? 'text-right' : 'text-left'}>{t("knowledgeBase.agentKnowledgePage.title")}</CardTitle>
          <CardDescription className={isRTL ? 'text-right' : 'text-left'}>{t("knowledgeBase.agentKnowledgePage.description")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <ResourceSelector
            resources={knowledgeBases || []}
            selectedIds={selectedKbIds}
            onSelect={setSelectedKbIds}
            title={t("knowledgeBase.agentKnowledgePage.selectKnowledgeBases")}
            triggerButtonText={t("knowledgeBase.agentKnowledgePage.browseKnowledgeBases")}
            isLoading={isLoadingKnowledgeBases}
            allowMultiple={true}
          />
          <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'}`}>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? t("knowledgeBase.agentKnowledgePage.saving") : t("knowledgeBase.agentKnowledgePage.saveChanges")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

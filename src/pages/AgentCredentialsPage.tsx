import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Agent, Credential } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";
import { ResourceSelector } from "@/components/ResourceSelector";
import { CreateCredentialDialog } from "@/components/CreateCredentialDialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

export const AgentCredentialsPage = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSelectExistingOpen, setIsSelectExistingOpen] = useState(false);

  const { data: agent, isLoading: isLoadingAgent } = useQuery<Agent>({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/agents/${agentId}`);
      if (!response.ok) throw new Error('Failed to fetch agent');
      return response.json();
    },
  });

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<Credential[]>({
    queryKey: ['credentials'],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/credentials/`);
      if (!response.ok) throw new Error('Failed to fetch credentials');
      return response.json();
    },
  });

  const [selectedCredentialId, setSelectedCredentialId] = useState<number | null>(null);

  useEffect(() => {
    if (agent) {
      setSelectedCredentialId(agent.credential_id);
    }
  }, [agent]);

  const mutation = useMutation({
    mutationFn: (credentialId: number | null) => {
      return authFetch(`/api/v1/agents/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential_id: credentialId }),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      toast.success("Agent credential updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update agent credential.");
    },
  });

  const handleSave = () => {
    mutation.mutate(selectedCredentialId);
  };

  const handleCredentialCreated = (newCredentialId: number) => {
    setSelectedCredentialId(newCredentialId);
    mutation.mutate(newCredentialId);
  };

  if (isLoadingAgent) return <div>Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Agent Credentials</h1>
        <Button variant="outline" onClick={() => navigate(`/dashboard/builder/${agentId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agent Hub
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Credential</CardTitle>
          <CardDescription>The API key used by this agent for its LLM provider.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedCredentialId ? (
            <div className="flex items-center justify-between p-4 border rounded-md bg-blue-50">
              <div>
                <h4 className="font-semibold text-blue-800">{credentials?.find(c => c.id === selectedCredentialId)?.name}</h4>
                <p className="text-sm text-blue-700">Service: {credentials?.find(c => c.id === selectedCredentialId)?.service}</p>
              </div>
              <Button variant="outline" onClick={() => setSelectedCredentialId(null)}>Remove</Button>
            </div>
          ) : (
            <div className="p-4 border rounded-md text-center text-gray-500">
              No credential assigned.
            </div>
          )}

          <div className="flex justify-between items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add/Change Credential
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setIsSelectExistingOpen(true)}>
                  Select Existing Credential
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsCreateDialogOpen(true)}>
                  Create New Credential
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button onClick={handleSave} disabled={mutation.isPending}>
              {mutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <ResourceSelector
        resources={credentials || []}
        selectedIds={selectedCredentialId ? [selectedCredentialId] : []}
        onSelect={(ids) => {
          setSelectedCredentialId(ids[0] || null);
          setIsSelectExistingOpen(false);
        }}
        title="Select Credential"
        triggerButtonText="Browse Credentials"
        isLoading={isLoadingCredentials}
        allowMultiple={false}
        isOpen={isSelectExistingOpen}
        onClose={() => setIsSelectExistingOpen(false)}
      />

      <CreateCredentialDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onCredentialCreated={handleCredentialCreated}
      />
    </div>
  );
};

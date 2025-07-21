
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Credential } from "@/types";
import { useAuth } from "@/hooks/useAuth";

interface CreateAgentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateAgentDialog = ({ open, onOpenChange }: CreateAgentDialogProps) => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: "",
    welcome_message: "",
    prompt: "",
    personality: "helpful",
    language: "en",
    timezone: "UTC",
    credential_id: undefined as number | undefined,
  });

  const companyId = 1; // Hardcoded company ID for now
  const { authFetch } = useAuth();
  

  const { data: credentials, isLoading: isLoadingCredentials } = useQuery<Credential[]>({ queryKey: ['credentials', companyId], queryFn: async () => {
    const response = await authFetch(`http://localhost:8000/api/v1/credentials/`);
    if (!response.ok) {
      throw new Error("Failed to fetch credentials");
    }
    return response.json();
  }});

  const createAgentMutation = useMutation({
    mutationFn: async (newAgent: { name: string; welcome_message: string; prompt: string; credential_id?: number }) => {
      const response = await authFetch(`http://localhost:8000/api/v1/agents/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAgent),
      });
      if (!response.ok) {
        throw new Error("Failed to create agent");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      toast({
        title: "Agent created successfully!",
        description: `${formData.name} has been created and is ready to deploy.`,
      });
      setFormData({
        name: "",
        welcome_message: "",
        prompt: "",
        credential_id: undefined,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create agent",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createAgentMutation.mutate({
      name: formData.name,
      welcome_message: formData.welcome_message,
      prompt: formData.prompt,
      credential_id: formData.credential_id,
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSelectChange = (value: string) => {
    setFormData(prev => ({ ...prev, credential_id: value === "null" ? undefined : parseInt(value) }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Chat Agent</DialogTitle>
          <DialogDescription>
            Configure your new chat agent with custom responses and branding.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-gray-100 text-gray-600">
                  <Upload className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label htmlFor="name">Agent Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="e.g., Customer Support Bot"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="welcome_message">Welcome Message</Label>
              <Textarea
                id="welcome_message"
                value={formData.welcome_message}
                onChange={(e) => handleInputChange("welcome_message", e.target.value)}
                placeholder="Hi! How can I help you today?"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="prompt">Agent Prompt (System Message)</Label>
              <Textarea
                id="prompt"
                value={formData.prompt}
                onChange={(e) => handleInputChange("prompt", e.target.value)}
                placeholder="You are a helpful AI assistant."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="personality">Personality</Label>
              <Select
                onValueChange={(value) => handleInputChange("personality", value)}
                value={formData.personality}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select personality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="helpful">Helpful & Professional</SelectItem>
                  <SelectItem value="friendly">Friendly & Casual</SelectItem>
                  <SelectItem value="formal">Formal & Business</SelectItem>
                  <SelectItem value="enthusiastic">Enthusiastic & Energetic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">Language</Label>
              <Select
                onValueChange={(value) => handleInputChange("language", value)}
                value={formData.language}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                onValueChange={(value) => handleInputChange("timezone", value)}
                value={formData.timezone}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="credential">API Credential</Label>
              <Select onValueChange={handleSelectChange} value={formData.credential_id?.toString() || ""}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select an API credential" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingCredentials ? (
                    <SelectItem value="" disabled>Loading credentials...</SelectItem>
                  ) : (
                    <>
                      <SelectItem value="null">No Credential</SelectItem>
                      {credentials?.map((cred) => (
                        <SelectItem key={cred.id} value={cred.id.toString()}>
                          {cred.platform}
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createAgentMutation.isPending}>
              {createAgentMutation.isPending ? "Creating..." : "Create Agent"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

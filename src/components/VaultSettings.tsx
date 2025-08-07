import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Edit, PlusCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

// Updated type to match the new backend schema
interface Credential {
  id: number;
  name: string;
  service: string;
  created_at: string;
  updated_at: string;
}

interface CredentialFormData {
  name: string;
  service: string;
  credentials: string;
}

export const VaultSettings = () => {
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<Credential | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>({
    name: "",
    service: "",
    credentials: "",
  });
  const { authFetch } = useAuth();

  const { data: credentials, isLoading, isError } = useQuery<Credential[]>({ 
    queryKey: ['credentials'], 
    queryFn: async () => {
      const response = await authFetch(`/api/v1/credentials/`);
      if (!response.ok) throw new Error("Failed to fetch credentials");
      return response.json();
    }
  });

  const createCredentialMutation = useMutation({
    mutationFn: async (newCredential: CredentialFormData) => {
      const response = await authFetch(`/api/v1/credentials/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCredential),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success("Credential created successfully!");
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to create credential", { description: error.message });
    },
  });

  const updateCredentialMutation = useMutation({
    mutationFn: async (updatedCredential: Partial<CredentialFormData> & { id: number }) => {
      const response = await authFetch(`/api/v1/credentials/${updatedCredential.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCredential),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success("Credential updated successfully!");
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error("Failed to update credential", { description: error.message });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      const response = await authFetch(`/api/v1/credentials/${credentialId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete credential");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success("Credential deleted successfully!");
    },
    onError: (error: Error) => {
      toast.error("Failed to delete credential", { description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setFormData({ name: "", service: "", credentials: "" });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (credential: Credential) => {
    setCurrentCredential(credential);
    setFormData({ name: credential.name, service: credential.service, credentials: "" });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCredential) {
      // Update logic
      const payload: Partial<CredentialFormData> & { id: number } = { id: currentCredential.id };
      if (formData.name !== currentCredential.name) payload.name = formData.name;
      if (formData.service !== currentCredential.service) payload.service = formData.service;
      if (formData.credentials) payload.credentials = formData.credentials;
      updateCredentialMutation.mutate(payload);
    } else {
      // Create logic
      createCredentialMutation.mutate(formData);
    }
  };

  if (isLoading) return <div>Loading credentials...</div>;
  if (isError) return <div>Error loading credentials.</div>;

  const renderDialogContent = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., My OpenAI Key"
          required
        />
      </div>
      <div>
        <Label htmlFor="service">Service</Label>
        <Input
          id="service"
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          placeholder="e.g., openai"
          required
        />
      </div>
      <div>
        <Label htmlFor="credentials">
          {currentCredential ? "New API Key (Leave blank to keep current)" : "API Key"}
        </Label>
        <Input
          id="credentials"
          type="password"
          value={formData.credentials}
          onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
          required={!currentCredential}
        />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => currentCredential ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={createCredentialMutation.isPending || updateCredentialMutation.isPending}>
          {currentCredential ? (updateCredentialMutation.isPending ? "Saving..." : "Save Changes") : (createCredentialMutation.isPending ? "Adding..." : "Add Key")}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">API Key Vault</CardTitle>
        <Button onClick={handleOpenCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Key
        </Button>
      </CardHeader>
      <CardContent>
        {credentials && credentials.length > 0 ? (
          <div className="space-y-4">
            {credentials.map((credential) => (
              <div key={credential.id} className="flex items-center justify-between p-4 border rounded-md">
                <div>
                  <p className="text-lg font-medium">{credential.name}</p>
                  <p className="text-sm text-gray-500">Service: <span className="font-mono bg-gray-100 px-1 py-0.5 rounded">{credential.service}</span></p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(credential)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete the <span className="font-bold">{credential.name}</span> credential.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCredentialMutation.mutate(credential.id)}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No API keys found. Add one to get started!</p>
        )}
      </CardContent>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New API Key</DialogTitle></DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit API Key</DialogTitle></DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

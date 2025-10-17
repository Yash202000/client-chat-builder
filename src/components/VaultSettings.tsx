import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Edit, PlusCircle, Copy } from "lucide-react";
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-cyan-600 dark:border-cyan-400"></div>
        <span>Loading credentials...</span>
      </div>
    </div>
  );
  if (isError) return (
    <div className="text-center py-12">
      <div className="text-red-600 dark:text-red-400">Error loading credentials.</div>
    </div>
  );

  const renderDialogContent = () => (
    <form onSubmit={handleSubmit} className="space-y-5 p-2">
      <div className="space-y-2">
        <Label htmlFor="name" className="dark:text-gray-300">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="e.g., My OpenAI Key"
          required
          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">A descriptive name for your credential.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="service" className="dark:text-gray-300">Service</Label>
        <Input
          id="service"
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          placeholder="e.g., openai"
          required
          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">The name of the service (e.g., openai, google, etc.).</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="credentials" className="dark:text-gray-300">
          {currentCredential ? "New API Key (Leave blank to keep current)" : "API Key"}
        </Label>
        <Input
          id="credentials"
          type="password"
          value={formData.credentials}
          onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
          required={!currentCredential}
          className="dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono"
          placeholder="sk-..."
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">Your secret API key.</p>
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={() => currentCredential ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
          Cancel
        </Button>
        <Button type="submit" disabled={createCredentialMutation.isPending || updateCredentialMutation.isPending} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white">
          {currentCredential ? (updateCredentialMutation.isPending ? "Saving..." : "Save Changes") : (createCredentialMutation.isPending ? "Adding..." : "Add Key")}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-2">
            🔐 API Key Vault
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Securely manage your API credentials for various AI platforms and services</p>
        </div>
        <Button onClick={handleOpenCreate} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Key
        </Button>
      </div>

      {credentials && credentials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <Card key={credential.id} className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:shadow-xl transition-all duration-300 flex flex-col justify-between">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 rounded-lg flex items-center justify-center shadow-sm">
                    <svg className="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold dark:text-white truncate">{credential.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      <span className="font-mono bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded text-cyan-600 dark:text-cyan-400">{credential.service}</span>
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Button variant="ghost" size="sm" onClick={() => handleCopy(credential.id.toString())} className="w-full justify-start dark:hover:bg-slate-700 dark:text-white">
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Key ID
                </Button>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <p>Created: {new Date(credential.created_at).toLocaleDateString()}</p>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-slate-200 dark:border-slate-700 pt-4">
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(credential)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                      <Trash2 className="h-4 w-4 mr-1" /> Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="dark:text-white">Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription className="dark:text-gray-400">
                        This will permanently delete the <span className="font-bold text-white">{credential.name}</span> credential. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCredentialMutation.mutate(credential.id)} className="bg-red-600 hover:bg-red-700">
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">No API keys found</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Securely store your API keys to use them in your agents</p>
          <Button onClick={handleOpenCreate} className="mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white btn-hover-lift">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Key
          </Button>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Add New API Key</DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit API Key</DialogTitle>
          </DialogHeader>
          {renderDialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
};
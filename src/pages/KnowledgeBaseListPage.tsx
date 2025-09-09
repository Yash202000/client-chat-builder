
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeBase } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, BookOpen, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

const KnowledgeBasePage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded company ID for now

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [currentKnowledgeBase, setCurrentKnowledgeBase] = useState<KnowledgeBase | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    content: "",
  });

  const [importFormData, setImportFormData] = useState({
    url: "",
    name: "",
    description: "",
  });

  const [isAppendMode, setIsAppendMode] = useState(false);
  const [selectedKbToAppendId, setSelectedKbToAppendId] = useState<number | undefined>(undefined);
  const { authFetch } = useAuth();

  const { data: knowledgeBases, isLoading, isError } = useQuery<KnowledgeBase[]>({
    queryKey: ['knowledgeBases', companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/knowledge-bases/`);
      if (!response.ok) {
        throw new Error("Failed to fetch knowledge bases");
      }
      return response.json();
    },
  });

  const { data: previewContent, isLoading: isLoadingPreview } = useQuery<{ content: string }>({ 
    queryKey: ['knowledgeBaseContent', currentKnowledgeBase?.id],
    queryFn: async () => {
      if (!currentKnowledgeBase) return { content: "" };
      const response = await authFetch(`/api/v1/knowledge-bases/${currentKnowledgeBase.id}/content`);
      if (!response.ok) {
        throw new Error("Failed to fetch knowledge base content");
      }
      return response.json();
    },
    enabled: isPreviewDialogOpen && !!currentKnowledgeBase,
  });

  const createKnowledgeBaseMutation = useMutation({
    mutationFn: async (newKb: Omit<KnowledgeBase, "id">) => {
      const response = await authFetch(`/api/v1/knowledge-bases/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newKb),
      });
      if (!response.ok) {
        throw new Error("Failed to create knowledge base");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({
        title: "Knowledge Base created successfully!",
        description: "The knowledge base has been added.",
      });
      setFormData({ name: "", description: "", content: "" });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to create knowledge base",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const importKnowledgeBaseMutation = useMutation({
    mutationFn: async (newKb: { url: string; name: string; description?: string; knowledge_base_id?: number }) => {
      const response = await authFetch(`/api/v1/knowledge-bases/from-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newKb),
      });
      if (!response.ok) {
        throw new Error("Failed to import knowledge base from URL");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({
        title: "Knowledge Base imported successfully!",
        description: "Content extracted from URL and added to knowledge base.",
      });
      setImportFormData({ url: "", name: "", description: "" });
      setIsImportDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to import knowledge base",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const updateKnowledgeBaseMutation = useMutation({
    mutationFn: async (updatedKb: KnowledgeBase) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${updatedKb.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedKb),
      });
      if (!response.ok) {
        throw new Error("Failed to update knowledge base");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({
        title: "Knowledge Base updated successfully!",
        description: "The knowledge base details have been updated.",
      });
      setIsEditDialogOpen(false);
      setCurrentKnowledgeBase(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to update knowledge base",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const deleteKnowledgeBaseMutation = useMutation({
    mutationFn: async (kbId: number) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${kbId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete knowledge base");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases'] });
      toast({
        title: "Knowledge Base deleted successfully!",
        description: "The knowledge base has been removed.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete knowledge base",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const generateQnAMutation = useMutation({
    mutationFn: async (data: { knowledge_base_id: number; prompt: string }) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${data.knowledge_base_id}/generate-qna`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt: data.prompt, knowledge_base_id: data.knowledge_base_id }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate Q&A");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setFormData(prev => ({ ...prev, content: data.generated_content }));
      toast({
        title: "Q&A generated successfully!",
        description: "Review the generated content and save changes.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate Q&A",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createKnowledgeBaseMutation.mutate(formData);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSubmit = {
      url: importFormData.url,
      name: importFormData.name,
      description: importFormData.description,
      knowledge_base_id: isAppendMode ? selectedKbToAppendId : undefined,
    };
    importKnowledgeBaseMutation.mutate(dataToSubmit);
  };

  const handleEditClick = (kb: KnowledgeBase) => {
    setCurrentKnowledgeBase(kb);
    setFormData({
      name: kb.name,
      description: kb.description || "",
      content: kb.content,
    });
    setIsEditDialogOpen(true);
  };

  const handlePreviewClick = (kb: KnowledgeBase) => {
    setCurrentKnowledgeBase(kb);
    setIsPreviewDialogOpen(true);
  };

  const handleGenerateQnA = () => {
    if (currentKnowledgeBase) {
      generateQnAMutation.mutate({
        knowledge_base_id: currentKnowledgeBase.id,
        prompt: "Generate a list of 10 questions and answers based on the following content. Format as Q: ...\nA: ..."
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentKnowledgeBase) {
      updateKnowledgeBaseMutation.mutate({
        ...currentKnowledgeBase,
        ...formData,
      });
    }
  };

  if (isLoading) return <div>Loading knowledge bases...</div>;
  if (isError) return <div>Error loading knowledge bases.</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-900 to-cyan-900 bg-clip-text text-transparent">
            Knowledge Bases
          </h2>
          <p className="text-gray-600 mt-1">Manage the knowledge your AI agents use</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create New Knowledge Base
        </Button>
        <Button onClick={() => setIsImportDialogOpen(true)} variant="outline">
          <BookOpen className="h-4 w-4 mr-2" />
          Import from URL
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {knowledgeBases?.map((kb) => (
          <Card key={kb.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  {kb.name}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => handlePreviewClick(kb)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEditClick(kb)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the knowledge base.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteKnowledgeBaseMutation.mutate(kb.id)}>
                          Continue
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-3">{kb.description || "No description provided."}</CardDescription>.
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Preview Knowledge Base Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Preview: {currentKnowledgeBase?.name}</DialogTitle>
          </DialogHeader>
          {isLoadingPreview ? (
            <p>Loading content...</p>
          ) : (
            <SyntaxHighlighter language="javascript" style={solarizedlight} customStyle={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {previewContent?.content || ""}
            </SyntaxHighlighter>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Knowledge Base Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Knowledge Base</DialogTitle>
            <DialogDescription>
              Add a new knowledge base for your AI agents to reference.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createKnowledgeBaseMutation.isPending}>
                {createKnowledgeBaseMutation.isPending ? "Creating..." : "Create Knowledge Base"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import from URL Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Knowledge Base from URL</DialogTitle>
            <DialogDescription>
              Enter a URL to extract content and create a new knowledge base.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <Label htmlFor="import-url">URL</Label>
              <Input
                id="import-url"
                value={importFormData.url}
                onChange={(e) => setImportFormData({ ...importFormData, url: e.target.value })}
                required
                type="url"
                placeholder="https://example.com/article"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="appendMode"
                checked={isAppendMode}
                onChange={(e) => setIsAppendMode(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="appendMode">Append to existing Knowledge Base</Label>
            </div>

            {isAppendMode ? (
              <div>
                <Label htmlFor="select-kb">Select Knowledge Base</Label>
                <select
                  id="select-kb"
                  value={selectedKbToAppendId || ""}
                  onChange={(e) => setSelectedKbToAppendId(parseInt(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-md"
                >
                  <option value="">Select a Knowledge Base</option>
                  {knowledgeBases?.map((kb) => (
                    <option key={kb.id} value={kb.id}>
                      {kb.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="import-name">Name</Label>
                  <Input
                    id="import-name"
                    value={importFormData.name}
                    onChange={(e) => setImportFormData({ ...importFormData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="import-description">Description (Optional)</Label>
                  <Textarea
                    id="import-description"
                    value={importFormData.description}
                    onChange={(e) => setImportFormData({ ...importFormData, description: e.target.value })}
                    rows={3}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={importKnowledgeBaseMutation.isPending}>
                {importKnowledgeBaseMutation.isPending ? "Importing..." : "Import Knowledge Base"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Knowledge Base Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Base</DialogTitle>
            <DialogDescription>
              Modify the details and content of your knowledge base.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateQnA}
              disabled={generateQnAMutation.isPending || !formData.content}
            >
              {generateQnAMutation.isPending ? "Generating..." : "Create Questions and Answers"}
            </Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateKnowledgeBaseMutation.isPending}>
                {updateKnowledgeBaseMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default KnowledgeBasePage;

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeBase } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, LinkIcon, Brain } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const KnowledgeBaseManagementPage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded for now
  const { toast } = useToast();
  const { authFetch } = useAuth();

  const { data: knowledgeBases, isLoading } = useQuery<KnowledgeBase[]>({ queryKey: ['knowledgeBases', companyId], queryFn: async () => {
    const response = await authFetch(`/api/v1/knowledge-bases/`);
    if (!response.ok) {
      throw new Error("Failed to fetch knowledge bases");
    }
    return response.json();
  }});

  const createKnowledgeBaseMutation = useMutation({
    mutationFn: async (newKnowledgeBase: Omit<KnowledgeBase, 'id'>) => {
      const response = await authFetch(`/api/v1/knowledge-bases/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newKnowledgeBase),
      });
      if (!response.ok) {
        throw new Error("Failed to create knowledge base");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Knowledge Base created." });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to create Knowledge Base: ${error.message}`, variant: "destructive" });
    },
  });

  const createKnowledgeBaseFromUrlMutation = useMutation({
    mutationFn: async (data: { url: string; name: string; description?: string; knowledge_base_id?: number }) => {
      const response = await authFetch(`/api/v1/knowledge-bases/from-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Failed to import from URL");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Knowledge Base imported from URL." });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to import from URL: ${error.message}`, variant: "destructive" });
    },
  });

  const generateQnAMutation = useMutation({
    mutationFn: async (data: { knowledge_base_id: number; prompt: string }) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${data.knowledge_base_id}/generate-qna`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ knowledge_base_id: data.knowledge_base_id, prompt: data.prompt }),
      });
      if (!response.ok) {
        throw new Error("Failed to generate Q&A");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Q&A generated successfully." });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to generate Q&A: ${error.message}`, variant: "destructive" });
    },
  });

  const updateKnowledgeBaseMutation = useMutation({
    mutationFn: async (updatedKnowledgeBase: KnowledgeBase) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${updatedKnowledgeBase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(updatedKnowledgeBase),
      });
      if (!response.ok) {
        throw new Error("Failed to update knowledge base");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Knowledge Base updated." });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to update Knowledge Base: ${error.message}`, variant: "destructive" });
    },
  });

  const deleteKnowledgeBaseMutation = useMutation({
    mutationFn: async (knowledgeBaseId: number) => {
      const response = await authFetch(`/api/v1/knowledge-bases/${knowledgeBaseId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete knowledge base");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Knowledge Base deleted." });
    },
    onError: (error) => {
      toast({ title: "Error", description: `Failed to delete Knowledge Base: ${error.message}`, variant: "destructive" });
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isImportUrlDialogOpen, setIsImportUrlDialogOpen] = useState(false);
  const [isGenerateQnADialogOpen, setIsGenerateQnADialogOpen] = useState(false);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);

  const handleCreate = (newKb: Omit<KnowledgeBase, 'id'>) => {
    createKnowledgeBaseMutation.mutate(newKb);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = (updatedKb: KnowledgeBase) => {
    updateKnowledgeBaseMutation.mutate(updatedKb);
    setIsEditDialogOpen(false);
  };

  const handleImportUrl = (data: { url: string; name: string; description?: string; knowledge_base_id?: number }) => {
    createKnowledgeBaseFromUrlMutation.mutate(data);
    setIsImportUrlDialogOpen(false);
  };

  const handleGenerateQnA = (data: { knowledge_base_id: number; prompt: string }) => {
    generateQnAMutation.mutate(data);
    setIsGenerateQnADialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Knowledge Base Management</h1>
        <div className="flex gap-2">
          <Dialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"> <LinkIcon className="mr-2 h-4 w-4" /> Import from URL</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Import Knowledge Base from URL</DialogTitle>
              </DialogHeader>
              <ImportUrlForm onSubmit={handleImportUrl} knowledgeBases={knowledgeBases || []} />
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button> <Plus className="mr-2 h-4 w-4" /> Create Knowledge Base</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Knowledge Base</DialogTitle>
              </DialogHeader>
              <KnowledgeBaseForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Knowledge Bases</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>Loading knowledge bases...</p>
          ) : (
            knowledgeBases?.map((kb) => (
              <div key={kb.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{kb.name}</h4>
                  <p className="text-sm text-gray-500">{kb.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Dialog open={isGenerateQnADialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedKb(null);
                    }
                    setIsGenerateQnADialogOpen(isOpen);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedKb(kb)}><Brain className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Generate Q&A for {selectedKb?.name}</DialogTitle>
                      </DialogHeader>
                      <GenerateQnAForm kb={selectedKb} onSubmit={handleGenerateQnA} />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isEditDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedKb(null);
                    }
                    setIsEditDialogOpen(isOpen);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedKb(kb)}><Edit className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Knowledge Base</DialogTitle>
                      </DialogHeader>
                      <KnowledgeBaseForm kb={selectedKb} onSubmit={(values) => handleUpdate({ ...kb, ...values })} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" onClick={() => deleteKnowledgeBaseMutation.mutate(kb.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KnowledgeBaseForm = ({ kb, onSubmit }: { kb?: KnowledgeBase, onSubmit: (values: any) => void }) => {
  const [values, setValues] = useState(kb || { name: "", description: "", content: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Name"
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
      <Textarea
        placeholder="Description"
        value={values.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
      />
      <Textarea
        placeholder="Content"
        value={values.content}
        onChange={(e) => setValues({ ...values, content: e.target.value })}
        rows={10}
      />
      <Button type="submit">{kb ? "Update" : "Create"}</Button>
    </form>
  );
};

const ImportUrlForm = ({ onSubmit, knowledgeBases }: { onSubmit: (data: { url: string; name: string; description?: string; knowledge_base_id?: number }) => void; knowledgeBases: KnowledgeBase[] }) => {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKbId, setSelectedKbId] = useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ url, name, description, knowledge_base_id: selectedKbId });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label htmlFor="url">URL</Label>
      <Input
        id="url"
        placeholder="https://example.com/article"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
      />
      <Label htmlFor="name">Name (for new KB)</Label>
      <Input
        id="name"
        placeholder="Knowledge Base Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Label htmlFor="description">Description (for new KB)</Label>
      <Textarea
        id="description"
        placeholder="Optional description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Label htmlFor="append-to-kb">Append to existing Knowledge Base (optional)</Label>
      <select
        id="append-to-kb"
        value={selectedKbId || ""}
        onChange={(e) => setSelectedKbId(e.target.value ? parseInt(e.target.value) : undefined)}
        className="w-full mt-1 p-2 border rounded-md"
      >
        <option value="">Create New</option>
        {knowledgeBases.map((kb) => (
          <option key={kb.id} value={kb.id}>
            {kb.name}
          </option>
        ))}
      </select>
      <Button type="submit">Import</Button>
    </form>
  );
};

const GenerateQnAForm = ({ kb, onSubmit }: { kb: KnowledgeBase | null; onSubmit: (data: { knowledge_base_id: number; prompt: string }) => void }) => {
  const [prompt, setPrompt] = useState("Generate 5 question and answer pairs from the following content.");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kb) {
      onSubmit({ knowledge_base_id: kb.id, prompt });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Label htmlFor="qna-prompt">Prompt for Q&A Generation</Label>
      <Textarea
        id="qna-prompt"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={5}
      />
      <Button type="submit">Generate Q&A</Button>
    </form>
  );
};

export default KnowledgeBaseManagementPage;

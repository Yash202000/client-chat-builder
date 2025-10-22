import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeBase } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, LinkIcon, Brain, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';

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
    mutationFn: async (formData: FormData) => {
      const response = await authFetch(`/api/v1/knowledge-bases/upload`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create knowledge base" }));
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Knowledge Base created successfully." });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to create Knowledge Base: ${error.message}`, variant: "destructive" });
    },
  });

  const createRemoteKnowledgeBaseMutation = useMutation({
    mutationFn: async (newKnowledgeBase: Omit<KnowledgeBase, 'id'>) => {
      const response = await authFetch(`/api/v1/knowledge-bases/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newKnowledgeBase),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create remote knowledge base" }));
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Remote Knowledge Base created." });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: `Failed to create remote Knowledge Base: ${error.message}`, variant: "destructive" });
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
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedKb, setSelectedKb] = useState<KnowledgeBase | null>(null);

  const { data: previewContent, isLoading: isLoadingPreview } = useQuery<{ content: string }>({
    queryKey: ['knowledgeBaseContent', selectedKb?.id],
    queryFn: async () => {
      if (!selectedKb) return { content: "" };
      const response = await authFetch(`/api/v1/knowledge-bases/${selectedKb.id}/content`);
      if (!response.ok) {
        throw new Error("Failed to fetch knowledge base content");
      }
      return response.json();
    },
    enabled: isPreviewDialogOpen && !!selectedKb,
  });

  const handleCreate = (values: Omit<KnowledgeBase, 'id'>, file?: File, vectorStoreType?: string) => {
    if (values.type === 'local') {
      if (!file) {
        toast({ title: "Error", description: "A file is required for local knowledge bases.", variant: "destructive" });
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', values.name);
      formData.append('description', values.description || '');
      formData.append('embedding_model', 'nvidia'); // Or make this selectable
      if (vectorStoreType) {
        formData.append('vector_store_type', vectorStoreType);
      }
      createKnowledgeBaseMutation.mutate(formData);
    } else {
      createRemoteKnowledgeBaseMutation.mutate(values);
    }
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
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Enhanced Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
            Knowledge Bases
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">Upload documents and manage your knowledge repositories</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="btn-hover-lift">
                <LinkIcon className="mr-2 h-4 w-4" /> Import from URL
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Import Knowledge Base from URL</DialogTitle>
              </DialogHeader>
              <ImportUrlForm onSubmit={handleImportUrl} knowledgeBases={knowledgeBases || []} />
            </DialogContent>
          </Dialog>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white btn-hover-lift">
                <Plus className="mr-2 h-4 w-4" /> Create Knowledge Base
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-slate-800">
              <DialogHeader>
                <DialogTitle className="dark:text-white">Create New Knowledge Base</DialogTitle>
              </DialogHeader>
              <KnowledgeBaseForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200 dark:border-indigo-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Total Knowledge Bases</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {knowledgeBases?.length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-600 to-blue-600 flex items-center justify-center">
                <span className="text-2xl">📚</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Local</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {knowledgeBases?.filter(kb => kb.type === 'local').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
                <span className="text-2xl">💾</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800 card-shadow">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">Remote</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {knowledgeBases?.filter(kb => kb.type === 'remote').length || 0}
                </h3>
              </div>
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                <span className="text-2xl">☁️</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Bases Grid */}
      <Card className="card-shadow bg-white dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-2xl dark:text-white">Your Knowledge Bases</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading knowledge bases...</p>
              </div>
            </div>
          ) : knowledgeBases && knowledgeBases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeBases.map((kb) => (
                <Card key={kb.id} className="card-shadow hover:shadow-lg transition-all duration-200 bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0">
                        {kb.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg dark:text-white truncate">{kb.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{kb.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        kb.type === 'local'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
                      }`}>
                        {kb.type === 'local' ? '💾 Local' : '☁️ Remote'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dialog open={isPreviewDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedKb(null);
                        setIsPreviewDialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedKb(kb)} className="flex-1" title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800">
                          <DialogHeader>
                            <DialogTitle className="dark:text-white">Preview: {selectedKb?.name}</DialogTitle>
                          </DialogHeader>
                          {isLoadingPreview ? (
                            <div className="flex items-center justify-center py-8">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                            </div>
                          ) : (
                            <SyntaxHighlighter language="javascript" style={solarizedlight} customStyle={{ maxHeight: '60vh', overflowY: 'auto' }}>
                              {previewContent?.content || ""}
                            </SyntaxHighlighter>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Dialog open={isGenerateQnADialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedKb(null);
                        setIsGenerateQnADialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedKb(kb)} className="flex-1" title="Generate Q&A">
                            <Brain className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-800">
                          <DialogHeader>
                            <DialogTitle className="dark:text-white">Generate Q&A for {selectedKb?.name}</DialogTitle>
                          </DialogHeader>
                          <GenerateQnAForm kb={selectedKb} onSubmit={handleGenerateQnA} />
                        </DialogContent>
                      </Dialog>
                      <Dialog open={isEditDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedKb(null);
                        setIsEditDialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedKb(kb)} className="flex-1" title="Edit">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white dark:bg-slate-800">
                          <DialogHeader>
                            <DialogTitle className="dark:text-white">Edit Knowledge Base</DialogTitle>
                          </DialogHeader>
                          <KnowledgeBaseForm kb={selectedKb} onSubmit={(values) => handleUpdate({ ...kb, ...values })} />
                        </DialogContent>
                      </Dialog>
                      <Button variant="destructive" size="sm" onClick={() => deleteKnowledgeBaseMutation.mutate(kb.id)} className="flex-1" title="Delete">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/30 mb-6">
                  <span className="text-4xl">📚</span>
                </div>
                <h3 className="text-xl font-semibold mb-2 dark:text-white">No Knowledge Bases Yet</h3>
                <p className="text-muted-foreground mb-6">Get started by creating your first knowledge base</p>
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
                  <Plus className="mr-2 h-4 w-4" /> Create Knowledge Base
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KnowledgeBaseForm = ({ kb, onSubmit }: { kb?: KnowledgeBase, onSubmit: (values: any, file?: File, vectorStoreType?: string) => void }) => {
  const [values, setValues] = useState(kb || { name: "", description: "", type: "local", provider: "", connection_details: {} });
  const [file, setFile] = useState<File | undefined>();
  const [vectorStoreType, setVectorStoreType] = useState("chroma"); // Default to ChromaDB

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values, file, vectorStoreType);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Name"
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
        required
      />
      <Textarea
        placeholder="Description"
        value={values.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
      />
      <div>
        <Label>Type</Label>
        <select
          value={values.type}
          onChange={(e) => setValues({ ...values, type: e.target.value })}
          className="w-full mt-1 p-2 border rounded-md"
        >
          <option value="local">Local (File Upload)</option>
          <option value="remote">Remote</option>
        </select>
      </div>
      {values.type === "remote" && (
        <>
          <div>
            <Label>Provider</Label>
            <select
              value={values.provider}
              onChange={(e) => setValues({ ...values, provider: e.target.value })}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="">Select Provider</option>
              <option value="chroma">Chroma</option>
            </select>
          </div>
          {values.provider === "chroma" && (
            <>
              <Input
                placeholder="Host"
                value={values.connection_details?.host || ""}
                onChange={(e) => setValues({ ...values, connection_details: { ...values.connection_details, host: e.target.value } })}
              />
              <Input
                placeholder="Port"
                value={values.connection_details?.port || ""}
                onChange={(e) => setValues({ ...values, connection_details: { ...values.connection_details, port: e.target.value } })}
              />
              <Input
                placeholder="Collection Name"
                value={values.connection_details?.collection_name || ""}
                onChange={(e) => setValues({ ...values, connection_details: { ...values.connection_details, collection_name: e.target.value } })}
              />
            </>
          )}
        </>
      )}
      {values.type === "local" && !kb && (
        <>
          <div>
            <Label htmlFor="file">Document</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="mt-1"
              required
            />
          </div>
          <div>
            <Label>Vector Store Type</Label>
            <select
              value={vectorStoreType}
              onChange={(e) => setVectorStoreType(e.target.value)}
              className="w-full mt-1 p-2 border rounded-md"
            >
              <option value="chroma">ChromaDB</option>
              <option value="faiss">FAISS (Local File System)</option>
            </select>
          </div>
        </>
      )}
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

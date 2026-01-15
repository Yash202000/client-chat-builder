import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { KnowledgeBase } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, LinkIcon, Brain, Eye, ExternalLink, Database, BookOpen, Sparkles, Loader2, HardDrive, Cloud, Search } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Permission } from "@/components/Permission";

const KnowledgeBaseManagementPage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded for now
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const { t, isRTL } = useI18n();

  console.log('KnowledgeBaseManagementPage - Current language:', isRTL ? 'ar' : 'en');
  console.log('KnowledgeBaseManagementPage - isRTL:', isRTL);

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

  const createEmptyKnowledgeBaseMutation = useMutation({
    mutationFn: async (data: { name: string; description?: string; vector_store_type?: string }) => {
      const response = await authFetch(`/api/v1/knowledge-bases/create-empty`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          embedding_model: "nvidia",
          vector_store_type: data.vector_store_type || "chroma"
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to create knowledge base" }));
        throw new Error(errorData.message);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['knowledgeBases', companyId] });
      toast({ title: "Success", description: "Empty Knowledge Base created. You can now add documents." });
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
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
      if (file) {
        // Create KB with file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', values.name);
        formData.append('description', values.description || '');
        formData.append('embedding_model', 'nvidia');
        if (vectorStoreType) {
          formData.append('vector_store_type', vectorStoreType);
        }
        createKnowledgeBaseMutation.mutate(formData);
      } else {
        // Create empty KB - documents can be added later
        createEmptyKnowledgeBaseMutation.mutate({
          name: values.name,
          description: values.description,
          vector_store_type: vectorStoreType || 'chroma'
        });
      }
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
    <div className={`space-y-6 p-6 animate-fade-in text-left`}>
      {/* Enhanced Header */}
      <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl shadow-indigo-500/25">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-1">
              {t("knowledgeBase.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Upload documents and create structured content for AI agents
            </p>
          </div>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Permission permission="knowledgebase:create">
            <Dialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className={`rounded-xl hover:border-indigo-300 hover:bg-indigo-50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 transition-all flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <LinkIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t("knowledgeBase.importFromUrl")}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-2xl">
                <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                  <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
                      <LinkIcon className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      {t("knowledgeBase.importDialog.title")}
                    </span>
                  </DialogTitle>
                  <DialogDescription className={`${isRTL ? 'text-right' : 'text-left'} mt-2`}>{t("knowledgeBase.importDialog.description")}</DialogDescription>
                </DialogHeader>
                <ImportUrlForm onSubmit={handleImportUrl} knowledgeBases={knowledgeBases || []} />
              </DialogContent>
            </Dialog>
          </Permission>
          <Permission permission="knowledgebase:create">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className={`bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30 transition-all flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t("knowledgeBase.createNew")}
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-2xl">
                <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                  <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                      {t("knowledgeBase.createDialog.title")}
                    </span>
                  </DialogTitle>
                  <DialogDescription className={`${isRTL ? 'text-right' : 'text-left'} mt-2`}>{t("knowledgeBase.createDialog.description")}</DialogDescription>
                </DialogHeader>
                <KnowledgeBaseForm onSubmit={handleCreate} />
              </DialogContent>
            </Dialog>
          </Permission>
        </div>
      </div>

      {/* Stats Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="group bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/30 dark:to-blue-950/30 border-indigo-200/80 dark:border-indigo-800/50 shadow-lg shadow-indigo-500/5 rounded-2xl hover:shadow-xl hover:shadow-indigo-500/10 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t("knowledgeBase.managePage.totalKnowledgeBases")}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                  {knowledgeBases?.length || 0}
                </h3>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-all" />
                <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <BookOpen className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border-emerald-200/80 dark:border-emerald-800/50 shadow-lg shadow-emerald-500/5 rounded-2xl hover:shadow-xl hover:shadow-emerald-500/10 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t("knowledgeBase.managePage.local")}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {knowledgeBases?.filter(kb => kb.type === 'local').length || 0}
                </h3>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-all" />
                <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <HardDrive className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="group bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200/80 dark:border-purple-800/50 shadow-lg shadow-purple-500/5 rounded-2xl hover:shadow-xl hover:shadow-purple-500/10 transition-all">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">{t("knowledgeBase.managePage.remote")}</p>
                <h3 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {knowledgeBases?.filter(kb => kb.type === 'remote').length || 0}
                </h3>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-all" />
                <div className="relative h-14 w-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
                  <Cloud className="h-7 w-7 text-white" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Knowledge Bases Grid */}
      <Card className="shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 bg-white dark:bg-slate-800/90 border-slate-200/80 dark:border-slate-700/60 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardTitle className={`flex items-center gap-3 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/20">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg">{t("knowledgeBase.managePage.yourKnowledgeBases")}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-10 w-10 animate-spin text-indigo-500" />
                <p className="text-muted-foreground">{t("knowledgeBase.managePage.loadingKnowledgeBases")}</p>
              </div>
            </div>
          ) : knowledgeBases && knowledgeBases.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {knowledgeBases.map((kb) => (
                <Card key={kb.id} className="group bg-white dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 rounded-xl hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-200 dark:hover:border-indigo-800/50 transition-all">
                  <CardContent className="p-5">
                    <Link to={`/dashboard/knowledge-base/${kb.id}`} className="block">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-500/25 flex-shrink-0 group-hover:shadow-indigo-500/40 transition-all">
                          {kb.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-lg dark:text-white truncate">{kb.name}</h4>
                            <ExternalLink className="w-4 h-4 text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{kb.description}</p>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${
                        kb.type === 'local'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/50'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-700/50'
                      }`}>
                        {kb.type === 'local' ? <><HardDrive className="w-3 h-3 mr-1" />{t("knowledgeBase.managePage.localBadge")}</> : <><Cloud className="w-3 h-3 mr-1" />{t("knowledgeBase.managePage.remoteBadge")}</>}
                      </span>
                      {kb.chroma_collection_name && (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50">
                          <Database className="w-3 h-3 mr-1" />
                          Indexed
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Click to manage documents & structured content
                    </p>
                    <div className="flex items-center gap-1.5">
                      <Dialog open={isPreviewDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedKb(null);
                        setIsPreviewDialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedKb(kb)} className="flex-1 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/20 transition-all" title="Preview">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto bg-white dark:bg-slate-800 rounded-2xl sm:rounded-2xl">
                          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                            <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl`}>
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-indigo-500/25">
                                <Eye className="h-5 w-5 text-white" />
                              </div>
                              <span className="bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                {t("knowledgeBase.managePage.previewTitle")} {selectedKb?.name}
                              </span>
                            </DialogTitle>
                            <DialogDescription className="mt-2">{t("knowledgeBase.managePage.previewDescription")}</DialogDescription>
                          </DialogHeader>
                          {isLoadingPreview ? (
                            <div className="flex items-center justify-center py-12">
                              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                            </div>
                          ) : (
                            <div className="py-4">
                              <SyntaxHighlighter language="javascript" style={solarizedlight} customStyle={{ maxHeight: '60vh', overflowY: 'auto', borderRadius: '12px' }}>
                                {previewContent?.content || ""}
                              </SyntaxHighlighter>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Permission permission="knowledgebase:update">
                        <Dialog open={isGenerateQnADialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                          if (!isOpen) setSelectedKb(null);
                          setIsGenerateQnADialogOpen(isOpen);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedKb(kb)} className="flex-1 rounded-lg hover:border-purple-300 hover:bg-purple-50 dark:hover:border-purple-700 dark:hover:bg-purple-900/20 transition-all" title="Generate Q&A">
                              <Brain className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-2xl">
                            <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                              <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl`}>
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg shadow-purple-500/25">
                                  <Brain className="h-5 w-5 text-white" />
                                </div>
                                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                  {t("knowledgeBase.managePage.generateQnATitle")} {selectedKb?.name}
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                            <GenerateQnAForm kb={selectedKb} onSubmit={handleGenerateQnA} />
                          </DialogContent>
                        </Dialog>
                      </Permission>
                      <Permission permission="knowledgebase:update">
                        <Dialog open={isEditDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => {
                          if (!isOpen) setSelectedKb(null);
                          setIsEditDialogOpen(isOpen);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedKb(kb)} className="flex-1 rounded-lg hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 transition-all" title="Edit">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-2xl">
                            <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                              <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl`}>
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-lg shadow-blue-500/25">
                                  <Edit className="h-5 w-5 text-white" />
                                </div>
                                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                                  {t("knowledgeBase.managePage.editKnowledgeBase")}
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                            <KnowledgeBaseForm kb={selectedKb} onSubmit={(values) => handleUpdate({ ...kb, ...values })} />
                          </DialogContent>
                        </Dialog>
                      </Permission>
                      <Permission permission="knowledgebase:delete">
                        <Button variant="destructive" size="sm" onClick={() => deleteKnowledgeBaseMutation.mutate(kb.id)} className="flex-1 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-sm shadow-red-500/20 hover:shadow-red-500/30 transition-all" title="Delete">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </Permission>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-xl shadow-indigo-500/25 mb-5">
                <BookOpen className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-2 dark:text-white">{t("knowledgeBase.managePage.noKnowledgeBasesYet")}</h3>
              <p className="text-muted-foreground mb-6">{t("knowledgeBase.managePage.getStartedMessage")}</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className={`bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-xl shadow-lg shadow-indigo-500/25`}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t("knowledgeBase.managePage.createKnowledgeBase")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const KnowledgeBaseForm = ({ kb, onSubmit }: { kb?: KnowledgeBase, onSubmit: (values: any, file?: File, vectorStoreType?: string) => void }) => {
  const { t, isRTL } = useI18n();
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
    <form onSubmit={handleSubmit} className={`space-y-4 py-4`}>
      <div className="space-y-2">
        <Label className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.name")}</Label>
        <Input
          placeholder={t("knowledgeBase.forms.name")}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.description")}</Label>
        <Textarea
          placeholder={t("knowledgeBase.forms.description")}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.type")}</Label>
        <select
          value={values.type}
          onChange={(e) => setValues({ ...values, type: e.target.value })}
          className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="local">{t("knowledgeBase.forms.typeLocalOption")}</option>
          <option value="remote">{t("knowledgeBase.forms.typeRemoteOption")}</option>
        </select>
      </div>
      {values.type === "remote" && (
        <>
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.provider")}</Label>
            <select
              value={values.provider}
              onChange={(e) => setValues({ ...values, provider: e.target.value })}
              className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">{t("knowledgeBase.forms.selectProvider")}</option>
              <option value="chroma">Chroma</option>
            </select>
          </div>
          {values.provider === "chroma" && (
            <div className="space-y-3">
              <Input
                placeholder={t("knowledgeBase.forms.host")}
                value={values.connection_details?.host || ""}
                onChange={(e) => setValues({ ...values, connection_details: { ...values.connection_details, host: e.target.value } })}
                className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
              <Input
                placeholder={t("knowledgeBase.forms.port")}
                value={values.connection_details?.port || ""}
                onChange={(e) => setValues({ ...values, connection_details: { ...values.connection_details, port: e.target.value } })}
                className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
              <Input
                placeholder={t("knowledgeBase.forms.collectionName")}
                value={values.connection_details?.collection_name || ""}
                onChange={(e) => setValues({ ...values, connection_details: { ...values.connection_details, collection_name: e.target.value } })}
                className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
          )}
        </>
      )}
      {values.type === "local" && !kb && (
        <>
          <div className="space-y-2">
            <Label htmlFor="file" className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.document")} ({t("common.optional")})</Label>
            <Input
              id="file"
              type="file"
              onChange={handleFileChange}
              className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-700 dark:file:bg-indigo-900/30 dark:file:text-indigo-400 hover:file:bg-indigo-100 dark:hover:file:bg-indigo-900/50"
            />
            <p className="text-xs text-muted-foreground">
              {t("knowledgeBase.forms.documentOptionalNote")}
            </p>
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.vectorStoreType")}</Label>
            <select
              value={vectorStoreType}
              onChange={(e) => setVectorStoreType(e.target.value)}
              className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="chroma">{t("knowledgeBase.forms.chromaDB")}</option>
              <option value="faiss">{t("knowledgeBase.forms.faiss")}</option>
            </select>
          </div>
        </>
      )}
      <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/25">
          {kb ? t("knowledgeBase.forms.update") : t("knowledgeBase.forms.create")}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ImportUrlForm = ({ onSubmit, knowledgeBases }: { onSubmit: (data: { url: string; name: string; description?: string; knowledge_base_id?: number }) => void; knowledgeBases: KnowledgeBase[] }) => {
  const { t, isRTL } = useI18n();
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedKbId, setSelectedKbId] = useState<number | undefined>(undefined);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ url, name, description, knowledge_base_id: selectedKbId });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 py-4`}>
      <div className="space-y-2">
        <Label htmlFor="url" className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.url")}</Label>
        <Input
          id="url"
          placeholder={t("knowledgeBase.forms.urlPlaceholder")}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.nameForNewKB")}</Label>
        <Input
          id="name"
          placeholder={t("knowledgeBase.forms.kbNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.descriptionForNewKB")}</Label>
        <Textarea
          id="description"
          placeholder={t("knowledgeBase.forms.optionalDescription")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="append-to-kb" className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.appendToExisting")}</Label>
        <select
          id="append-to-kb"
          value={selectedKbId || ""}
          onChange={(e) => setSelectedKbId(e.target.value ? parseInt(e.target.value) : undefined)}
          className="w-full p-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="">{t("knowledgeBase.forms.createNew")}</option>
          {knowledgeBases.map((kb) => (
            <option key={kb.id} value={kb.id}>
              {kb.name}
            </option>
          ))}
        </select>
      </div>
      <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-lg shadow-indigo-500/25">
          {t("knowledgeBase.forms.import")}
        </Button>
      </DialogFooter>
    </form>
  );
};

const GenerateQnAForm = ({ kb, onSubmit }: { kb: KnowledgeBase | null; onSubmit: (data: { knowledge_base_id: number; prompt: string }) => void }) => {
  const { t, isRTL } = useI18n();
  const [prompt, setPrompt] = useState(t("knowledgeBase.forms.qnaDefaultPrompt"));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kb) {
      onSubmit({ knowledge_base_id: kb.id, prompt });
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 py-4`}>
      <div className="space-y-2">
        <Label htmlFor="qna-prompt" className="text-sm font-medium dark:text-gray-300">{t("knowledgeBase.forms.qnaPromptLabel")}</Label>
        <Textarea
          id="qna-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={5}
          className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
        />
      </div>
      <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25">
          {t("knowledgeBase.forms.generateQnA")}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default KnowledgeBaseManagementPage;

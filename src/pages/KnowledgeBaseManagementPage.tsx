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

  const [searchQuery, setSearchQuery] = useState('');
  const filteredKbs = knowledgeBases?.filter(kb =>
    kb.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-blue-500 to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/25">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 bg-clip-text text-transparent leading-tight">
                  {t("knowledgeBase.title")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("knowledgeBase.subtitle") || "Upload documents and create structured content for AI agents"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Permission permission="knowledgebase:create">
                <Dialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="h-9 px-4 text-sm border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                      <LinkIcon className="h-4 w-4 mr-1.5" />
                      {t("knowledgeBase.importFromUrl")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl sm:rounded-2xl">
                    <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/25">
                          <LinkIcon className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{t("knowledgeBase.importDialog.title")}</span>
                      </DialogTitle>
                      <DialogDescription className="mt-1">{t("knowledgeBase.importDialog.description")}</DialogDescription>
                    </DialogHeader>
                    <ImportUrlForm onSubmit={handleImportUrl} knowledgeBases={knowledgeBases || []} />
                  </DialogContent>
                </Dialog>
              </Permission>
              <Permission permission="knowledgebase:create">
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="h-9 px-4 text-sm bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md shadow-indigo-500/30">
                      <Plus className="h-4 w-4 mr-1.5" />
                      {t("knowledgeBase.createNew")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl sm:rounded-2xl">
                    <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                      <DialogTitle className="flex items-center gap-3 text-xl">
                        <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/25">
                          <Plus className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white">{t("knowledgeBase.createDialog.title")}</span>
                      </DialogTitle>
                      <DialogDescription className="mt-1">{t("knowledgeBase.createDialog.description")}</DialogDescription>
                    </DialogHeader>
                    <KnowledgeBaseForm onSubmit={handleCreate} />
                  </DialogContent>
                </Dialog>
              </Permission>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: t("knowledgeBase.managePage.totalKnowledgeBases"), value: knowledgeBases?.length || 0, icon: BookOpen, gradient: 'from-indigo-500 to-blue-600', shadow: 'shadow-indigo-500/20', accent: 'bg-indigo-500', dot: 'text-slate-400' },
            { label: t("knowledgeBase.managePage.local"), value: knowledgeBases?.filter(kb => kb.type === 'local').length || 0, icon: HardDrive, gradient: 'from-emerald-500 to-teal-600', shadow: 'shadow-emerald-500/20', accent: 'bg-emerald-500', dot: 'text-emerald-500' },
            { label: t("knowledgeBase.managePage.remote"), value: knowledgeBases?.filter(kb => kb.type === 'remote').length || 0, icon: Cloud, gradient: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/20', accent: 'bg-purple-500', dot: 'text-purple-500' },
          ].map(({ label, value, icon: Icon, gradient, shadow, accent, dot }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={`h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md ${gradient} ${shadow}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`inline-block h-1.5 w-1.5 rounded-full ${accent}`} />
                <span className="text-xs text-slate-400 dark:text-slate-500">knowledge bases</span>
              </div>
            </div>
          ))}
        </div>

        {/* KB List */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{t("knowledgeBase.managePage.yourKnowledgeBases")}</span>
              {knowledgeBases && knowledgeBases.length > 0 && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums">{filteredKbs?.length}</span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Search knowledge bases..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-8 w-52 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
          ) : filteredKbs && filteredKbs.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredKbs.map((kb) => (
                <div key={kb.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  {/* Icon */}
                  <Link to={`/dashboard/knowledge-base/${kb.id}`} className="flex-shrink-0">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-indigo-500/20">
                      {kb.name.substring(0, 2).toUpperCase()}
                    </div>
                  </Link>

                  {/* Name + badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Link to={`/dashboard/knowledge-base/${kb.id}`} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400 truncate transition-colors">
                        {kb.name}
                      </Link>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        kb.type === 'local'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50'
                          : 'bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-700/50'
                      }`}>
                        {kb.type === 'local' ? <HardDrive className="h-2.5 w-2.5" /> : <Cloud className="h-2.5 w-2.5" />}
                        {kb.type === 'local' ? t("knowledgeBase.managePage.localBadge") : t("knowledgeBase.managePage.remoteBadge")}
                      </span>
                      {kb.chroma_collection_name && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-200 dark:border-blue-700/50">
                          <Database className="h-2.5 w-2.5" />
                          Indexed
                        </span>
                      )}
                    </div>
                    {kb.description && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{kb.description}</p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <Dialog open={isPreviewDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedKb(null); setIsPreviewDialogOpen(isOpen); }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedKb(kb)} className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Preview">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[80vw] max-h-[80vh] overflow-y-auto dark:bg-slate-900 dark:border-slate-800 rounded-2xl sm:rounded-2xl">
                        <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                          <DialogTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-md shadow-indigo-500/25">
                              <Eye className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">{t("knowledgeBase.managePage.previewTitle")} {selectedKb?.name}</span>
                          </DialogTitle>
                          <DialogDescription className="mt-1">{t("knowledgeBase.managePage.previewDescription")}</DialogDescription>
                        </DialogHeader>
                        {isLoadingPreview ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
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
                      <Dialog open={isGenerateQnADialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedKb(null); setIsGenerateQnADialogOpen(isOpen); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedKb(kb)} className="h-7 w-7 text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" title="Generate Q&A">
                            <Brain className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl sm:rounded-2xl">
                          <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                            <DialogTitle className="flex items-center gap-3 text-xl">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-violet-600 shadow-md shadow-purple-500/25">
                                <Brain className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{t("knowledgeBase.managePage.generateQnATitle")} {selectedKb?.name}</span>
                            </DialogTitle>
                          </DialogHeader>
                          <GenerateQnAForm kb={selectedKb} onSubmit={handleGenerateQnA} />
                        </DialogContent>
                      </Dialog>
                    </Permission>

                    <Permission permission="knowledgebase:update">
                      <Dialog open={isEditDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedKb(null); setIsEditDialogOpen(isOpen); }}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setSelectedKb(kb)} className="h-7 w-7 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit">
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl sm:rounded-2xl">
                          <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                            <DialogTitle className="flex items-center gap-3 text-xl">
                              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md shadow-blue-500/25">
                                <Edit className="h-5 w-5 text-white" />
                              </div>
                              <span className="font-bold text-slate-900 dark:text-white">{t("knowledgeBase.managePage.editKnowledgeBase")}</span>
                            </DialogTitle>
                          </DialogHeader>
                          <KnowledgeBaseForm kb={selectedKb} onSubmit={(values) => handleUpdate({ ...kb, ...values })} />
                        </DialogContent>
                      </Dialog>
                    </Permission>

                    <Permission permission="knowledgebase:delete">
                      <Button variant="ghost" size="icon" onClick={() => deleteKnowledgeBaseMutation.mutate(kb.id)} className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </Permission>

                    <Link to={`/dashboard/knowledge-base/${kb.id}`}>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Open">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center mb-4 shadow-md shadow-indigo-500/25">
                <BookOpen className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("knowledgeBase.managePage.noKnowledgeBasesYet")}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-5">{t("knowledgeBase.managePage.getStartedMessage")}</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="h-9 px-4 text-sm bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white shadow-md shadow-indigo-500/30">
                <Plus className="h-4 w-4 mr-1.5" />
                {t("knowledgeBase.managePage.createKnowledgeBase")}
              </Button>
            </div>
          )}
        </div>
      </div>
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

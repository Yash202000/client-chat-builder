import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { KnowledgeBase } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, LinkIcon, Brain, Eye, ExternalLink, Database, BookOpen, Sparkles, Loader2, HardDrive, Cloud, Search, FlaskConical } from "lucide-react";
import { KbChatPanel } from '@/components/KbChatPanel';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Permission } from "@/components/Permission";
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
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
    <div className="p-6" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Top bar: stats pills + search + action buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Stats pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
            <BookOpen className="h-3 w-3" />
            {knowledgeBases?.length || 0} total
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <HardDrive className="h-3 w-3" />
            {knowledgeBases?.filter(kb => kb.type === 'local').length || 0} {t("knowledgeBase.managePage.local")}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
            <Cloud className="h-3 w-3" />
            {knowledgeBases?.filter(kb => kb.type === 'remote').length || 0} {t("knowledgeBase.managePage.remote")}
          </span>
        </div>

        {/* Search + action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search knowledge bases..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-52 text-xs"
            />
          </div>
          <Permission permission="knowledgebase:create">
            <Dialog open={isImportUrlDialogOpen} onOpenChange={setIsImportUrlDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 px-3 text-xs">
                  <LinkIcon className="h-3.5 w-3.5 mr-1.5" />
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
                <Button size="sm" className="h-8 px-3 text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
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

      {/* KB card grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : !filteredKbs || filteredKbs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-2xl bg-muted border border-border flex items-center justify-center mb-4">
            <BookOpen className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">{t("knowledgeBase.managePage.noKnowledgeBasesYet")}</h3>
          <p className="text-xs text-muted-foreground max-w-xs mb-5">{t("knowledgeBase.managePage.getStartedMessage")}</p>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("knowledgeBase.managePage.createKnowledgeBase")}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredKbs.map((kb, i) => (
              <motion.div
                key={kb.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 16 }}
                transition={{ duration: 0.3, delay: i * 0.045 }}
                className="rounded-xl border border-border bg-card overflow-hidden flex flex-col group"
              >
                {/* Top accent line */}
                <div className={`h-0.5 bg-gradient-to-r ${kb.type === 'local' ? 'from-indigo-500 to-blue-600' : 'from-violet-500 to-purple-600'}`} />

                {/* Clickable card body */}
                <Link to={`/dashboard/knowledge-base/${kb.id}`} className="p-4 flex-1 flex flex-col gap-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    {/* Avatar: 2-letter initials */}
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm shadow-indigo-500/20">
                      {kb.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="text-sm font-semibold text-foreground truncate">{kb.name}</span>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                          kb.type === 'local'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50'
                            : 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400 border-violet-200 dark:border-violet-700/50'
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
                        <p className="text-xs text-muted-foreground line-clamp-2">{kb.description}</p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Card footer — hover-reveal actions */}
                <div className="px-4 py-2.5 border-t border-border bg-muted/30 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Dialog open={isPreviewDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedKb(null); setIsPreviewDialogOpen(isOpen); }}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={() => setSelectedKb(kb)} className="h-7 w-7 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Preview">
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

                  <Sheet open={isTestDialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedKb(null); setIsTestDialogOpen(isOpen); }}>
                    <button onClick={() => { setSelectedKb(kb); setIsTestDialogOpen(true); }} className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors" title="Test KB">
                      <FlaskConical className="h-3.5 w-3.5" />
                    </button>
                    <SheetContent side="right" className="p-0 flex flex-col w-[480px] sm:max-w-[480px]">
                      <SheetHeader className="px-5 py-4 border-b border-border flex-shrink-0">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-sm">
                            <FlaskConical className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <SheetTitle className="text-base font-semibold">{selectedKb?.name}</SheetTitle>
                            <SheetDescription className="text-xs">Query this KB and see what chunks are retrieved</SheetDescription>
                          </div>
                        </div>
                      </SheetHeader>
                      {selectedKb && (
                        <KbChatPanel key={selectedKb.id} kb={selectedKb} authFetch={authFetch} />
                      )}
                    </SheetContent>
                  </Sheet>

                  <Permission permission="knowledgebase:update">
                    <Dialog open={isGenerateQnADialogOpen && selectedKb?.id === kb.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedKb(null); setIsGenerateQnADialogOpen(isOpen); }}>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedKb(kb)} className="h-7 w-7 text-muted-foreground hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20" title="Generate Q&A">
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
                        <Button variant="ghost" size="icon" onClick={() => setSelectedKb(kb)} className="h-7 w-7 text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20" title="Edit">
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
                    <Button variant="ghost" size="icon" onClick={() => deleteKnowledgeBaseMutation.mutate(kb.id)} className="h-7 w-7 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Permission>

                  <Link to={`/dashboard/knowledge-base/${kb.id}`} className="ml-auto">
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20" title="Open">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
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

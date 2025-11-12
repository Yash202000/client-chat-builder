
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeBase } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Edit, Trash2, BookOpen, Eye } from "lucide-react";
import { Permission } from "@/components/Permission";
import { useI18n } from "@/hooks/useI18n";
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
  const { t, isRTL, currentLanguage } = useI18n();
  const companyId = 1; // Hardcoded company ID for now

  console.log('KnowledgeBasePage render - Current language:', currentLanguage);
  console.log('KnowledgeBasePage render - isRTL:', isRTL);
  console.log('KnowledgeBasePage render - t("knowledgeBase.title"):', t("knowledgeBase.title"));

  useEffect(() => {
    console.log('KnowledgeBasePage useEffect - Language changed to:', currentLanguage);
  }, [currentLanguage]);

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

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 dark:border-purple-400"></div>
        <span>{t("knowledgeBase.loading")}</span>
      </div>
    </div>
  );
  if (isError) return (
    <div className="text-center py-12">
      <div className="text-red-600 dark:text-red-400">{t("knowledgeBase.error")}</div>
    </div>
  );

  return (
    <div className={`w-full max-w-7xl mx-auto p-4 md:p-8 space-y-8 ${isRTL ? 'text-right' : 'text-left'}`}>
      <header className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            {t("knowledgeBase.title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t("knowledgeBase.subtitle")}</p>
        </div>
        <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Permission permission="knowledgebase:create">
            <Button onClick={() => setIsImportDialogOpen(true)} variant="outline" className={`dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <BookOpen className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t("knowledgeBase.importFromUrl")}
            </Button>
          </Permission>
          <Permission permission="knowledgebase:create">
            <Button onClick={() => setIsCreateDialogOpen(true)} className={`bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t("knowledgeBase.createNew")}
            </Button>
          </Permission>
        </div>
      </header>

      {knowledgeBases && knowledgeBases.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {knowledgeBases.map((kb) => (
            <Card key={kb.id} className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:shadow-xl transition-all duration-300">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/50 dark:to-indigo-900/50 rounded-lg flex items-center justify-center shadow-sm">
                    <BookOpen className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-lg font-semibold dark:text-white flex-1 truncate">{kb.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <CardDescription className={`line-clamp-3 text-gray-600 dark:text-gray-400 mb-4 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {kb.description || t("knowledgeBase.noDescription")}
                </CardDescription>
                <div className={`flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 ${isRTL ? 'justify-start flex-row-reverse' : 'justify-end'}`}>
                  <Button variant="outline" size="sm" onClick={() => handlePreviewClick(kb)} className={`dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Eye className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t("knowledgeBase.preview")}
                  </Button>
                  <Permission permission="knowledgebase:update">
                    <Button variant="outline" size="sm" onClick={() => handleEditClick(kb)} className={`dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <Edit className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t("knowledgeBase.edit")}
                    </Button>
                  </Permission>
                  <Permission permission="knowledgebase:delete">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" className="bg-red-600 hover:bg-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className={`dark:bg-slate-800 dark:border-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="dark:text-white">{t("knowledgeBase.deleteDialog.title")}</AlertDialogTitle>
                          <AlertDialogDescription className="dark:text-gray-400">
                            {t("knowledgeBase.deleteDialog.description")} <span className="font-bold text-white">{kb.name}</span> {t("knowledgeBase.deleteDialog.description2")}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
                          <AlertDialogCancel className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">{t("knowledgeBase.deleteDialog.cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteKnowledgeBaseMutation.mutate(kb.id)} className="bg-red-600 hover:bg-red-700">
                            {t("knowledgeBase.deleteDialog.delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </Permission>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
            <BookOpen className="w-8 h-8 text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t("knowledgeBase.noKnowledgeBasesFound")}</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-2">{t("knowledgeBase.createFirstMessage")}</p>
          <Button onClick={() => setIsCreateDialogOpen(true)} className={`mt-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t("knowledgeBase.createNew")}
          </Button>
        </div>
      )}

      {/* Preview Knowledge Base Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className={`sm:max-w-[80vw] max-h-[80vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700 ${isRTL ? 'text-right' : 'text-left'}`}>
          <DialogHeader>
            <DialogTitle className="dark:text-white">{t("knowledgeBase.previewDialog.title")} {currentKnowledgeBase?.name}</DialogTitle>
          </DialogHeader>
          {isLoadingPreview ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-2 text-muted-foreground dark:text-gray-400">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 dark:border-purple-400"></div>
                <span>{t("knowledgeBase.loadingContent")}</span>
              </div>
            </div>
          ) : (
            <div className={`bg-slate-50 dark:bg-slate-900 rounded-lg p-4 max-h-[60vh] overflow-y-auto ${isRTL ? 'text-right' : 'text-left'}`}>
              <pre className={`text-sm dark:text-gray-300 whitespace-pre-wrap ${isRTL ? 'text-right' : 'text-left'}`}>{previewContent?.content || ""}</pre>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Knowledge Base Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Create New Knowledge Base</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Add a new knowledge base for your AI agents to reference.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="dark:text-gray-300">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="e.g., Product Documentation"
              />
            </div>
            <div>
              <Label htmlFor="description" className="dark:text-gray-300">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                placeholder="Describe what this knowledge base contains..."
              />
            </div>
            <div>
              <Label htmlFor="content" className="dark:text-gray-300">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm"
                placeholder="Enter your knowledge base content here..."
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={createKnowledgeBaseMutation.isPending} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                {createKnowledgeBaseMutation.isPending ? "Creating..." : "Create Knowledge Base"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Import from URL Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Import Knowledge Base from URL</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Enter a URL to extract content and create a new knowledge base.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <Label htmlFor="import-url" className="dark:text-gray-300">URL</Label>
              <Input
                id="import-url"
                value={importFormData.url}
                onChange={(e) => setImportFormData({ ...importFormData, url: e.target.value })}
                required
                type="url"
                placeholder="https://example.com/article"
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="appendMode"
                checked={isAppendMode}
                onChange={(e) => setIsAppendMode(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-600"
              />
              <Label htmlFor="appendMode" className="dark:text-gray-300">Append to existing Knowledge Base</Label>
            </div>

            {isAppendMode ? (
              <div>
                <Label htmlFor="select-kb" className="dark:text-gray-300">Select Knowledge Base</Label>
                <select
                  id="select-kb"
                  value={selectedKbToAppendId || ""}
                  onChange={(e) => setSelectedKbToAppendId(parseInt(e.target.value))}
                  className="w-full mt-1 p-2 border rounded-md dark:bg-slate-900 dark:border-slate-600 dark:text-white"
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
                  <Label htmlFor="import-name" className="dark:text-gray-300">Name</Label>
                  <Input
                    id="import-name"
                    value={importFormData.name}
                    onChange={(e) => setImportFormData({ ...importFormData, name: e.target.value })}
                    required
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                    placeholder="e.g., Imported Documentation"
                  />
                </div>
                <div>
                  <Label htmlFor="import-description" className="dark:text-gray-300">Description (Optional)</Label>
                  <Textarea
                    id="import-description"
                    value={importFormData.description}
                    onChange={(e) => setImportFormData({ ...importFormData, description: e.target.value })}
                    rows={3}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                    placeholder="Describe the imported content..."
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsImportDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={importKnowledgeBaseMutation.isPending} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
                {importKnowledgeBaseMutation.isPending ? "Importing..." : "Import Knowledge Base"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Knowledge Base Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Knowledge Base</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Modify the details and content of your knowledge base.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="dark:text-gray-300">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="dark:text-gray-300">Description (Optional)</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-content" className="dark:text-gray-300">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                rows={10}
                required
                className="dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateQnA}
              disabled={generateQnAMutation.isPending || !formData.content}
              className="w-full dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
            >
              {generateQnAMutation.isPending ? "Generating..." : "✨ Create Questions and Answers"}
            </Button>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                Cancel
              </Button>
              <Button type="submit" disabled={updateKnowledgeBaseMutation.isPending} className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white">
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

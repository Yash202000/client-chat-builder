import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tool, FollowUpConfig, FollowUpFieldConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Search, Play, ChevronDown, ChevronRight, MessageSquare, Wrench, Code, Link2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";

const ToolManagementPage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded for now
  const { authFetch, user } = useAuth();
  const { t, isRTL } = useI18n();
  const isSuperAdmin = user?.is_super_admin || false;

  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({ queryKey: ['tools', companyId], queryFn: async () => {
    const response = await authFetch(`/api/v1/tools/`);
    if (!response.ok) {
      throw new Error("Failed to fetch tools");
    }
    return response.json();
  }});

  const createToolMutation = useMutation({
    mutationFn: async (newTool: Partial<Tool>) => {
      const response = await authFetch(`/api/v1/tools/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTool),
      });
      if (!response.ok) {
        throw new Error("Failed to create tool");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', companyId] });
    },
  });

  const updateToolMutation = useMutation({
    mutationFn: async (updatedTool: Tool) => {
      const response = await authFetch(`/api/v1/tools/${updatedTool.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedTool),
      });
      if (!response.ok) {
        throw new Error("Failed to update tool");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', companyId] });
    },
  });

  const deleteToolMutation = useMutation({
    mutationFn: async (toolId: number) => {
      const response = await authFetch(`/api/v1/tools/${toolId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete tool");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', companyId] });
    },
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTools = tools?.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [creationStep, setCreationStep] = useState<'initial' | 'custom' | 'mcp'>('initial');

  const handleCreate = (newTool: Omit<Tool, 'id'>) => {
    createToolMutation.mutate(newTool, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreationStep('initial');
      }
    });
  };

  const handleUpdate = (updatedTool: Tool) => {
    updateToolMutation.mutate(updatedTool, {
      onSuccess: () => {
        setIsEditDialogOpen(false);
      }
    });
  };

  const resetCreationFlow = () => {
    setCreationStep('initial');
  }

  return (
    <div className={`space-y-6 p-6 animate-fade-in text-left`}>
      <div className={`flex justify-between items-start ${isRTL ? 'flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25">
              <Wrench className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-1">
              {t("tools.title")}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">{t("tools.subtitle")}</p>
          </div>
        </div>
        <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
            setIsCreateDialogOpen(isOpen);
            if (!isOpen) {
              resetCreationFlow();
            }
          }}>
            <DialogTrigger asChild>
              <Button className={`bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all rounded-xl flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t("tools.createTool")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl">
              <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                    <Plus className="h-5 w-5 text-white" />
                  </div>
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    {t("tools.createDialog.title")}
                  </span>
                </DialogTitle>
                <DialogDescription className={`dark:text-gray-400 ${isRTL ? 'text-right' : 'text-left'} mt-2`}>
                  {t("tools.createDialog.description")}
                </DialogDescription>
              </DialogHeader>
              {creationStep === 'initial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div
                    className="group relative p-6 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 dark:hover:from-emerald-900/20 dark:hover:to-teal-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer hover:shadow-lg hover:shadow-emerald-500/10"
                    onClick={() => setCreationStep('custom')}
                  >
                    <div className={`flex flex-col gap-3 ${isRTL ? 'items-end' : 'items-start'}`}>
                      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all">
                        <Code className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold dark:text-white">{t("tools.createDialog.customTool")}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("tools.createDialog.customToolDescription")}
                      </p>
                    </div>
                  </div>
                  <div
                    className="group relative p-6 border border-slate-200 dark:border-slate-700 rounded-2xl hover:bg-gradient-to-br hover:from-cyan-50 hover:to-blue-50 dark:hover:from-cyan-900/20 dark:hover:to-blue-900/20 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all cursor-pointer hover:shadow-lg hover:shadow-cyan-500/10"
                    onClick={() => setCreationStep('mcp')}
                  >
                    <div className={`flex flex-col gap-3 ${isRTL ? 'items-end' : 'items-start'}`}>
                      <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg shadow-cyan-500/25 group-hover:shadow-cyan-500/40 transition-all">
                        <Link2 className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold dark:text-white">{t("tools.createDialog.mcpConnection")}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("tools.createDialog.mcpConnectionDescription")}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {creationStep === 'custom' && (
                <ToolForm onSubmit={handleCreate} onBack={resetCreationFlow} />
              )}
              {creationStep === 'mcp' && (
                <McpToolForm onSubmit={handleCreate} onBack={resetCreationFlow} />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 rounded-2xl overflow-hidden">
        <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
          <CardTitle className={`flex items-center gap-3 dark:text-white ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/20">
              <Wrench className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg">{t("tools.existingTools")}</span>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-medium">
              {filteredTools?.length || 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400`} />
            <Input
              placeholder={t("tools.searchPlaceholder")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${isRTL ? 'pr-10' : 'pl-10'} rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white`}
            />
          </div>
          {isLoadingTools ? (
            <div className="flex items-center justify-center py-12">
              <div className={`flex flex-col items-center gap-3 text-muted-foreground dark:text-gray-400`}>
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <span className="text-sm">{t("tools.loading")}</span>
              </div>
            </div>
          ) : filteredTools && filteredTools.length > 0 ? (
            <div className="space-y-3">
              {filteredTools.map((tool) => (
                <div key={tool.id} className={`group flex items-center justify-between p-4 border border-slate-200/80 dark:border-slate-700/60 rounded-xl bg-white dark:bg-slate-900/50 hover:shadow-lg hover:shadow-emerald-500/5 hover:border-emerald-200 dark:hover:border-emerald-800/50 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className={`flex-1 ${isRTL ? 'text-right' : ''}`}>
                    <h4 className={`font-semibold flex items-center gap-2 dark:text-white ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                      {tool.name}
                      <span className={`text-xs font-medium py-0.5 px-2.5 rounded-full border ${
                        tool.tool_type === 'builtin'
                          ? 'bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/30 dark:to-violet-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700/50'
                          : tool.tool_type === 'mcp'
                          ? 'bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-700/50'
                          : 'bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/50'
                      }`}>
                        {tool.tool_type === 'mcp' ? t("tools.toolTypes.mcpConnection") : tool.tool_type === 'builtin' ? t("tools.toolTypes.builtin") : t("tools.toolTypes.custom")}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{tool.description}</p>
                    {tool.tool_type === 'mcp' && (
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1.5 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md inline-block">{tool.mcp_server_url}</p>
                    )}
                  </div>
                  <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    {/* Show edit for non-builtin tools OR for super admins editing builtin tools */}
                    {(tool.tool_type !== 'builtin' || isSuperAdmin) && (
                      <Dialog open={isEditDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                          if (!isOpen) setSelectedTool(null);
                          setIsEditDialogOpen(isOpen);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTool(tool)} className={`rounded-lg dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-emerald-300 hover:bg-emerald-50 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20 flex items-center transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Edit className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t("tools.edit")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="dark:bg-slate-800 dark:border-slate-700 sm:max-w-lg rounded-2xl sm:rounded-2xl">
                            <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                              <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                                  <Edit className="h-5 w-5 text-white" />
                                </div>
                                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                  Edit {tool.tool_type === 'mcp' ? 'Connection' : tool.tool_type === 'builtin' ? 'Built-in Tool' : 'Tool'}
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                          {tool.tool_type === 'builtin' ? (
                            <BuiltinToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} onBack={() => setIsEditDialogOpen(false)} />
                          ) : tool.tool_type === 'custom' ? (
                            <ToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} onBack={() => setIsEditDialogOpen(false)} />
                          ) : (
                            <McpToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} onBack={() => setIsEditDialogOpen(false)} />
                          )}
                        </DialogContent>
                      </Dialog>
                  )}
                    {/* Test button only for custom tools */}
                    {tool.tool_type === 'custom' && (
                        <Dialog open={isTestDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                          if (!isOpen) setSelectedTool(null);
                          setIsTestDialogOpen(isOpen);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTool(tool)} className={`rounded-lg dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:hover:border-blue-700 dark:hover:bg-blue-900/20 flex items-center transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <Play className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t("tools.test")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl">
                            <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
                              <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                                  <Play className="h-5 w-5 text-white" />
                                </div>
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                  Test {tool.name}
                                </span>
                              </DialogTitle>
                            </DialogHeader>
                            <TestToolDialog tool={tool} companyId={companyId} />
                          </DialogContent>
                        </Dialog>
                    )}
                    {/* Delete button only for non-builtin tools */}
                    {tool.tool_type !== 'builtin' && (
                      <Button variant="destructive" size="sm" onClick={() => deleteToolMutation.mutate(tool.id)} className="rounded-lg bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-md shadow-red-500/20 hover:shadow-red-500/30 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30">
              <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/25 mb-5">
                <Wrench className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-white">{t("tools.noToolsFound")}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2 mb-6">{t("tools.createFirstTool")}</p>
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl shadow-lg shadow-emerald-500/25">
                <Plus className="h-4 w-4 mr-2" />
                {t("tools.createTool")}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ToolForm = ({ tool, onSubmit, onBack }: { tool?: Tool, onSubmit: (values: any) => void, onBack: () => void }) => {
  const { t, isRTL } = useI18n();
  const [values, setValues] = useState(tool || {
    name: "",
    description: "",
    code: "",
    parameters: { type: "object", properties: {}, required: [] },
    tool_type: "custom",
    follow_up_config: null as FollowUpConfig | null
  });
  const [showFollowUp, setShowFollowUp] = useState(tool?.follow_up_config?.enabled || false);
  const [newFieldName, setNewFieldName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const toggleFollowUpEnabled = (enabled: boolean) => {
    if (enabled) {
      setValues({
        ...values,
        follow_up_config: {
          enabled: true,
          fields: {},
          completion_message: "",
          completion_message_template: ""
        }
      });
    } else {
      setValues({
        ...values,
        follow_up_config: null
      });
    }
  };

  const addField = () => {
    if (!newFieldName.trim() || !values.follow_up_config) return;
    const fieldKey = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
    setValues({
      ...values,
      follow_up_config: {
        ...values.follow_up_config,
        fields: {
          ...values.follow_up_config.fields,
          [fieldKey]: {
            question: "",
            lookup_source: null
          }
        }
      }
    });
    setNewFieldName("");
  };

  const updateField = (fieldName: string, updates: Partial<FollowUpFieldConfig>) => {
    if (!values.follow_up_config) return;
    setValues({
      ...values,
      follow_up_config: {
        ...values.follow_up_config,
        fields: {
          ...values.follow_up_config.fields,
          [fieldName]: {
            ...values.follow_up_config.fields[fieldName],
            ...updates
          }
        }
      }
    });
  };

  const removeField = (fieldName: string) => {
    if (!values.follow_up_config) return;
    const { [fieldName]: removed, ...rest } = values.follow_up_config.fields;
    setValues({
      ...values,
      follow_up_config: {
        ...values.follow_up_config,
        fields: rest
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 py-4`}>
      <div className="space-y-2">
        <Label htmlFor="tool-name" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.toolName")}</Label>
        <Input
          id="tool-name"
          placeholder={t("tools.forms.toolNamePlaceholder")}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tool-description" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.description")}</Label>
        <Textarea
          id="tool-description"
          placeholder={t("tools.forms.descriptionPlaceholder")}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tool-code" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.pythonCode")}</Label>
        <Textarea
          id="tool-code"
          placeholder={t("tools.forms.pythonCodePlaceholder")}
          value={values.code}
          onChange={(e) => setValues({ ...values, code: e.target.value })}
          rows={10}
          className={`font-mono text-sm rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none ${isRTL ? 'text-right' : 'text-left'}`}
        />
      </div>

      {/* Follow-up Questions Configuration */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFollowUp(!showFollowUp)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50 hover:from-slate-100 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium dark:text-white">{t("tools.followUp.title")}</span>
          </div>
          {showFollowUp ? (
            <ChevronDown className="h-4 w-4 dark:text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 dark:text-gray-400" />
          )}
        </button>

        {showFollowUp && (
          <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-gray-300">{t("tools.followUp.enable")}</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("tools.followUp.enableDescription")}</p>
              </div>
              <Switch
                checked={values.follow_up_config?.enabled || false}
                onCheckedChange={toggleFollowUpEnabled}
              />
            </div>

            {values.follow_up_config?.enabled && (
              <>
                {/* Fields Configuration */}
                <div className="space-y-3">
                  <Label className="dark:text-gray-300">{t("tools.followUp.fields")}</Label>

                  {Object.entries(values.follow_up_config.fields).map(([fieldName, fieldConfig]) => (
                    <div key={fieldName} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm dark:text-white">{fieldName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(fieldName)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder={t("tools.followUp.questionPlaceholder")}
                        value={fieldConfig.question}
                        onChange={(e) => updateField(fieldName, { question: e.target.value })}
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                      />
                      <Input
                        placeholder={t("tools.followUp.lookupSourcePlaceholder")}
                        value={fieldConfig.lookup_source || ""}
                        onChange={(e) => updateField(fieldName, { lookup_source: e.target.value || null })}
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                      />
                    </div>
                  ))}

                  {/* Add new field */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("tools.followUp.newFieldPlaceholder")}
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addField();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addField}
                      disabled={!newFieldName.trim()}
                      className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Completion Message */}
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">{t("tools.followUp.completionMessage")}</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("tools.followUp.completionMessageDescription")}</p>
                  <Input
                    placeholder={t("tools.followUp.completionMessagePlaceholder")}
                    value={values.follow_up_config.completion_message_template || values.follow_up_config.completion_message || ""}
                    onChange={(e) => setValues({
                      ...values,
                      follow_up_config: {
                        ...values.follow_up_config!,
                        completion_message_template: e.target.value,
                        completion_message: ""
                      }
                    })}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <DialogFooter className={`pt-4 border-t border-slate-200/80 dark:border-slate-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">{t("tools.forms.back")}</Button>
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25">
          {tool ? t("tools.forms.updateTool") : t("tools.forms.createTool")}
        </Button>
      </DialogFooter>
    </form>
  );
};

const BuiltinToolForm = ({ tool, onSubmit, onBack }: { tool: Tool, onSubmit: (values: any) => void, onBack: () => void }) => {
  const { t, isRTL } = useI18n();
  const [values, setValues] = useState({
    description: tool.description || "",
    follow_up_config: tool.follow_up_config as FollowUpConfig | null
  });
  const [showFollowUp, setShowFollowUp] = useState(tool.follow_up_config?.enabled || false);
  const [newFieldName, setNewFieldName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  const toggleFollowUpEnabled = (enabled: boolean) => {
    if (enabled) {
      setValues({
        ...values,
        follow_up_config: {
          enabled: true,
          fields: values.follow_up_config?.fields || {},
          completion_message: values.follow_up_config?.completion_message || "",
          completion_message_template: values.follow_up_config?.completion_message_template || ""
        }
      });
    } else {
      setValues({
        ...values,
        follow_up_config: values.follow_up_config ? { ...values.follow_up_config, enabled: false } : null
      });
    }
  };

  const addField = () => {
    if (!newFieldName.trim() || !values.follow_up_config) return;
    const fieldKey = newFieldName.trim().toLowerCase().replace(/\s+/g, '_');
    setValues({
      ...values,
      follow_up_config: {
        ...values.follow_up_config,
        fields: {
          ...values.follow_up_config.fields,
          [fieldKey]: {
            question: "",
            lookup_source: null
          }
        }
      }
    });
    setNewFieldName("");
  };

  const updateField = (fieldName: string, updates: Partial<FollowUpFieldConfig>) => {
    if (!values.follow_up_config) return;
    setValues({
      ...values,
      follow_up_config: {
        ...values.follow_up_config,
        fields: {
          ...values.follow_up_config.fields,
          [fieldName]: {
            ...values.follow_up_config.fields[fieldName],
            ...updates
          }
        }
      }
    });
  };

  const removeField = (fieldName: string) => {
    if (!values.follow_up_config) return;
    const { [fieldName]: removed, ...rest } = values.follow_up_config.fields;
    setValues({
      ...values,
      follow_up_config: {
        ...values.follow_up_config,
        fields: rest
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 py-4`}>
      {/* Name - Read only for builtin tools */}
      <div className="space-y-2">
        <Label className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.toolName")}</Label>
        <Input
          value={tool.name}
          disabled
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-gray-400 bg-slate-100 cursor-not-allowed"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">{t("tools.forms.builtinNameReadonly")}</p>
      </div>

      {/* Description - Editable */}
      <div className="space-y-2">
        <Label htmlFor="builtin-description" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.description")}</Label>
        <Textarea
          id="builtin-description"
          placeholder={t("tools.forms.descriptionPlaceholder")}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
          rows={2}
        />
      </div>

      {/* Follow-up Questions Configuration */}
      <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFollowUp(!showFollowUp)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-800 dark:to-slate-800/50 hover:from-slate-100 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 shadow-sm">
              <MessageSquare className="h-4 w-4 text-white" />
            </div>
            <span className="font-medium dark:text-white">{t("tools.followUp.title")}</span>
          </div>
          {showFollowUp ? (
            <ChevronDown className="h-4 w-4 dark:text-gray-400" />
          ) : (
            <ChevronRight className="h-4 w-4 dark:text-gray-400" />
          )}
        </button>

        {showFollowUp && (
          <div className="p-4 space-y-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div>
                <Label className="dark:text-gray-300">{t("tools.followUp.enable")}</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("tools.followUp.enableDescription")}</p>
              </div>
              <Switch
                checked={values.follow_up_config?.enabled || false}
                onCheckedChange={toggleFollowUpEnabled}
              />
            </div>

            {values.follow_up_config?.enabled && (
              <>
                {/* Fields Configuration */}
                <div className="space-y-3">
                  <Label className="dark:text-gray-300">{t("tools.followUp.fields")}</Label>

                  {Object.entries(values.follow_up_config.fields).map(([fieldName, fieldConfig]) => (
                    <div key={fieldName} className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm dark:text-white">{fieldName}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(fieldName)}
                          className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <Input
                        placeholder={t("tools.followUp.questionPlaceholder")}
                        value={fieldConfig.question}
                        onChange={(e) => updateField(fieldName, { question: e.target.value })}
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                      />
                      <Input
                        placeholder={t("tools.followUp.lookupSourcePlaceholder")}
                        value={fieldConfig.lookup_source || ""}
                        onChange={(e) => updateField(fieldName, { lookup_source: e.target.value || null })}
                        className="dark:bg-slate-800 dark:border-slate-600 dark:text-white text-sm"
                      />
                    </div>
                  ))}

                  {/* Add new field */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("tools.followUp.newFieldPlaceholder")}
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addField();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addField}
                      disabled={!newFieldName.trim()}
                      className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Completion Message */}
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">{t("tools.followUp.completionMessage")}</Label>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("tools.followUp.completionMessageDescription")}</p>
                  <Input
                    placeholder={t("tools.followUp.completionMessagePlaceholder")}
                    value={values.follow_up_config.completion_message_template || values.follow_up_config.completion_message || ""}
                    onChange={(e) => setValues({
                      ...values,
                      follow_up_config: {
                        ...values.follow_up_config!,
                        completion_message_template: e.target.value,
                        completion_message: ""
                      }
                    })}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <DialogFooter className={`pt-4 border-t border-slate-200/80 dark:border-slate-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">{t("tools.forms.back")}</Button>
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25">
          {t("tools.forms.updateTool")}
        </Button>
      </DialogFooter>
    </form>
  );
};

const McpToolForm = ({ tool, onSubmit, onBack }: { tool?: Tool, onSubmit: (values: any) => void, onBack: () => void }) => {
  const { t, isRTL } = useI18n();
  const [name, setName] = useState(tool?.name || "");
  const [description, setDescription] = useState(tool?.description || "");
  const [url, setUrl] = useState(tool?.mcp_server_url || "");
  const [inspected, setInspected] = useState(!!tool);
  const [authRequired, setAuthRequired] = useState(false);
  const [authUrl, setAuthUrl] = useState<string | null>(null);
  const { authFetch } = useAuth();

  const { mutate: inspect, data: inspectData, error: inspectError, isPending: isInspecting } = useMutation({
    mutationFn: async (urlToInspect: string) => {
      const response = await authFetch(`/api/v1/mcp/inspect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToInspect }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Failed to inspect MCP server');
      }
      return data;
    },
    onSuccess: (data) => {
      if (data.authentication_required) {
        setAuthRequired(true);
        setAuthUrl(data.authorization_url);
        setInspected(false);
      } else {
        setAuthRequired(false);
        setAuthUrl(null);
        setInspected(true);
      }
    }
  });

  const handleAuthenticate = () => {
    if (authUrl) {
      const popup = window.open(authUrl, 'google-auth', 'width=600,height=700');
      const timer = setInterval(() => {
        if (popup && popup.closed) {
          clearInterval(timer);
          // Re-run inspection after authentication
          inspect(url);
        }
      }, 500);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      mcp_server_url: url,
      tool_type: "mcp",
    });
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 py-4`}>
      <div className="space-y-2">
        <Label htmlFor="mcp-name" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.connectionName")}</Label>
        <Input
          id="mcp-name"
          placeholder={t("tools.forms.connectionNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mcp-description" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.description")}</Label>
        <Textarea
          id="mcp-description"
          placeholder={t("tools.forms.mcpDescriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white resize-none"
          rows={2}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mcp-url" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.mcpServerUrl")}</Label>
        <div className={`flex items-start gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Input
            id="mcp-url"
            placeholder={t("tools.forms.mcpUrlPlaceholder")}
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setInspected(false);
              setAuthRequired(false);
              setAuthUrl(null);
            }}
            required
            type="url"
            className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
          />
          <Button type="button" onClick={() => inspect(url)} disabled={isInspecting || !url} variant="outline" className="rounded-xl h-11 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20 whitespace-nowrap transition-all">
            {isInspecting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />{t("tools.forms.inspecting")}</> : t("tools.forms.testInspect")}
          </Button>
        </div>
      </div>

      {authRequired && (
        <div className="p-4 border bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 rounded-xl text-center">
          <h4 className="font-semibold text-amber-800 dark:text-amber-300">{t("tools.forms.authRequired")}</h4>
          <p className="text-sm text-amber-700 dark:text-amber-400 mb-4">{t("tools.forms.authRequiredMessage")}</p>
          <Button type="button" onClick={handleAuthenticate} className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/25">
            {t("tools.forms.connectToGoogle")}
          </Button>
        </div>
      )}

      {inspectData && inspected && !authRequired && (
        <div className="p-4 border bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50 rounded-xl">
          <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">{t("tools.forms.inspectionSuccess")}</h4>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">{t("tools.forms.foundTools", { count: inspectData.tools.length })}</p>
        </div>
      )}

      {inspectError && (
        <div className="p-4 border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 rounded-xl">
          <h4 className="font-semibold text-red-800 dark:text-red-300">{t("tools.forms.inspectionFailed")}</h4>
          <p className="text-sm text-red-700 dark:text-red-400">{inspectError.message}</p>
        </div>
      )}

      <DialogFooter className={`pt-4 border-t border-slate-200/80 dark:border-slate-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">{t("tools.forms.back")}</Button>
        <Button type="submit" disabled={!inspected && !tool} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 disabled:opacity-50">
          {tool ? t("tools.forms.updateConnection") : t("tools.forms.createConnection")}
        </Button>
      </DialogFooter>
    </form>
  );
};

const TestToolDialog = ({ tool, companyId }: { tool: Tool, companyId: number }) => {
  const [parameters, setParameters] = useState<Record<string, any>>({});
  const [result, setResult] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { authFetch } = useAuth();

  const executeMutation = useMutation({
    mutationFn: async (params: Record<string, any>) => {
      const response = await authFetch(`/api/v1/tools/${tool.id}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to execute tool");
      }
      return response.json();
    },
    onSuccess: (data) => {
      setResult(data);
      setIsLoading(false);
    },
    onError: (error) => {
      setResult({ error: error.message });
      setIsLoading(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    executeMutation.mutate(parameters);
  };

  return (
    <div className="space-y-4 py-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {tool.parameters && Object.keys(tool.parameters).map((paramName) => (
          <div key={paramName} className="space-y-2">
            <Label htmlFor={paramName} className="dark:text-gray-300 text-sm font-medium">{tool.parameters[paramName].description}</Label>
            <Input
              id={paramName}
              type={tool.parameters[paramName].type === "integer" ? "number" : "text"}
              value={parameters[paramName] || ""}
              onChange={(e) => setParameters({ ...parameters, [paramName]: e.target.value })}
              className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
        ))}
        <Button type="submit" disabled={isLoading} className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-full shadow-lg shadow-blue-500/25 h-11">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Executing...</> : <><Play className="h-4 w-4 mr-2" />Run Test</>}
        </Button>
      </form>
      {result && (
        <div className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
          <h4 className="font-semibold mb-3 dark:text-white text-sm uppercase tracking-wide">Result:</h4>
          <pre className="bg-slate-50 dark:bg-slate-900 p-4 rounded-xl overflow-x-auto text-sm dark:text-gray-300 border border-slate-200/80 dark:border-slate-700/60 max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolManagementPage;

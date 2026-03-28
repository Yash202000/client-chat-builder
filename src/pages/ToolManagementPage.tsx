import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tool, FollowUpConfig, FollowUpFieldConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit, Search, Play, ChevronDown, ChevronRight, MessageSquare, Wrench, Code, Link2, Loader2, Shield, Zap, Database, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";
import { cn } from "@/lib/utils";
import ToolAIChat from "@/components/ToolAIChat";

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
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [aiEditTool, setAiEditTool] = useState<Tool | null>(null);
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

  const customCount = tools?.filter(t => t.tool_type === 'custom').length ?? 0;
  const builtinCount = tools?.filter(t => t.tool_type === 'builtin').length ?? 0;
  const mcpCount = tools?.filter(t => t.tool_type === 'mcp').length ?? 0;

  const typeConfig = {
    builtin: {
      label: t("tools.toolTypes.builtin"),
      icon: Shield,
      gradient: 'from-purple-500 to-violet-600',
      shadow: 'shadow-purple-500/20',
      badge: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-700/50',
      accent: 'text-purple-600 dark:text-purple-400',
    },
    mcp: {
      label: t("tools.toolTypes.mcpConnection"),
      icon: Link2,
      gradient: 'from-cyan-500 to-blue-600',
      shadow: 'shadow-cyan-500/20',
      badge: 'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-700/50',
      accent: 'text-cyan-600 dark:text-cyan-400',
    },
    custom: {
      label: t("tools.toolTypes.custom"),
      icon: Code,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-500/20',
      badge: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50',
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-emerald-500/25">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
                  {t("tools.title")}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("tools.subtitle")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => { setAiEditTool(null); setIsAIChatOpen(true); }}
                className="h-9 px-4 text-sm bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-md shadow-violet-500/30"
              >
                <Sparkles className="h-4 w-4 mr-1.5" />
                Create with AI
              </Button>
            <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => { setIsCreateDialogOpen(isOpen); if (!isOpen) resetCreationFlow(); }}>
              <DialogTrigger asChild>
                <Button className="h-9 px-4 text-sm bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/30">
                  <Plus className="h-4 w-4 mr-1.5" />
                  {t("tools.createTool")}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg dark:bg-slate-900 dark:border-slate-800 rounded-2xl sm:rounded-2xl">
                <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                  <DialogTitle className={cn("flex items-center gap-3 text-xl", isRTL && "flex-row-reverse")}>
                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-md shadow-emerald-500/25">
                      <Plus className="h-5 w-5 text-white" />
                    </div>
                    <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent font-bold">
                      {t("tools.createDialog.title")}
                    </span>
                  </DialogTitle>
                  <DialogDescription className={cn("dark:text-slate-400 mt-2", isRTL ? "text-right" : "text-left")}>
                    {t("tools.createDialog.description")}
                  </DialogDescription>
                </DialogHeader>
                {creationStep === 'initial' && (
                  <div className="grid grid-cols-2 gap-4 py-4">
                    <div
                      className="group relative p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/20 transition-all cursor-pointer"
                      onClick={() => setCreationStep('custom')}
                    >
                      <div className={cn("flex flex-col gap-3", isRTL ? "items-end" : "items-start")}>
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl shadow-md shadow-emerald-500/20">
                          <Code className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{t("tools.createDialog.customTool")}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t("tools.createDialog.customToolDescription")}</p>
                      </div>
                    </div>
                    <div
                      className="group relative p-5 border border-slate-200 dark:border-slate-700 rounded-xl hover:border-cyan-300 dark:hover:border-cyan-700 hover:bg-cyan-50/50 dark:hover:bg-cyan-900/20 transition-all cursor-pointer"
                      onClick={() => setCreationStep('mcp')}
                    >
                      <div className={cn("flex flex-col gap-3", isRTL ? "items-end" : "items-start")}>
                        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-md shadow-cyan-500/20">
                          <Link2 className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">{t("tools.createDialog.mcpConnection")}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{t("tools.createDialog.mcpConnectionDescription")}</p>
                      </div>
                    </div>
                  </div>
                )}
                {creationStep === 'custom' && <ToolForm onSubmit={handleCreate} onBack={resetCreationFlow} />}
                {creationStep === 'mcp' && <McpToolForm onSubmit={handleCreate} onBack={resetCreationFlow} />}
              </DialogContent>
            </Dialog>
          </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Tools", value: tools?.length ?? 0, sub: "All tools combined", gradient: "from-blue-500 to-indigo-600", shadow: "shadow-blue-500/20", accent: "bg-blue-500", icon: Wrench },
            { label: t("tools.toolTypes.custom"), value: customCount, sub: "Python / API functions", gradient: "from-emerald-500 to-teal-600", shadow: "shadow-emerald-500/20", accent: "bg-emerald-500", icon: Code },
            { label: t("tools.toolTypes.mcpConnection"), value: mcpCount, sub: "External MCP servers", gradient: "from-cyan-500 to-blue-600", shadow: "shadow-cyan-500/20", accent: "bg-cyan-500", icon: Link2 },
            { label: t("tools.toolTypes.builtin"), value: builtinCount, sub: "Platform built-ins", gradient: "from-purple-500 to-violet-600", shadow: "shadow-purple-500/20", accent: "bg-purple-500", icon: Shield },
          ].map(({ label, value, sub, gradient, shadow, accent, icon: Icon }) => (
            <div key={label} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{label}</span>
                <div className={cn("h-9 w-9 rounded-lg bg-gradient-to-br flex items-center justify-center shadow-md", gradient, shadow)}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
              <p className="text-4xl font-bold text-slate-900 dark:text-white tabular-nums">{value}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={cn("inline-block h-1.5 w-1.5 rounded-full", accent)} />
                <p className="text-xs text-slate-400 dark:text-slate-500">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tools list */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-white">{t("tools.title")}</span>
              {tools && tools.length > 0 && (
                <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 tabular-nums">{filteredTools?.length}</span>
              )}
            </div>
            <div className="relative w-56">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <Input
                placeholder={t("tools.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 h-7 text-xs bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          {isLoadingTools ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
              <span className="text-sm text-slate-500 dark:text-slate-400">{t("tools.loading")}</span>
            </div>
          ) : !filteredTools || filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25">
                <Wrench className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">{t("tools.noToolsFound")}</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500 max-w-xs mb-5">{t("tools.createFirstTool")}</p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
                className="h-8 text-xs bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-md shadow-emerald-500/30"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {t("tools.createTool")}
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredTools.map((tool) => {
                const cfg = typeConfig[tool.tool_type as keyof typeof typeConfig] ?? typeConfig.custom;
                const TypeIcon = cfg.icon;
                return (
                  <div key={tool.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                    {/* Icon */}
                    <div className={cn("h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm", cfg.gradient, cfg.shadow)}>
                      <TypeIcon className="h-5 w-5 text-white" />
                    </div>

                    {/* Name + description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{tool.name}</p>
                        <span className={cn("inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded border", cfg.badge)}>
                          {cfg.label}
                        </span>
                        {tool.follow_up_config?.enabled && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50">
                            <MessageSquare className="h-2.5 w-2.5" />
                            Follow-up
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-lg">
                        {tool.description || <span className="italic">No description</span>}
                      </p>
                      {tool.tool_type === 'mcp' && tool.mcp_server_url && (
                        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mt-0.5 truncate max-w-sm">{tool.mcp_server_url}</p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className={cn("flex items-center gap-1.5 flex-shrink-0", isRTL && "flex-row-reverse")}>
                      {(tool.tool_type !== 'builtin' || isSuperAdmin) && (
                        <Dialog open={isEditDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedTool(null); setIsEditDialogOpen(isOpen); }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTool(tool)} className="h-7 px-2.5 text-xs border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800">
                              <Edit className="h-3 w-3 mr-1" />
                              {t("tools.edit")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 sm:max-w-lg rounded-2xl sm:rounded-2xl">
                            <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                              <DialogTitle className={cn("flex items-center gap-3 text-xl", isRTL && "flex-row-reverse")}>
                                <div className={cn("p-2.5 rounded-xl bg-gradient-to-br shadow-md", cfg.gradient, cfg.shadow)}>
                                  <Edit className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">
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
                      {tool.tool_type === 'custom' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setAiEditTool(tool); setIsAIChatOpen(true); }}
                          className="h-7 px-2.5 text-xs border-violet-200 dark:border-violet-800/60 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                        >
                          <Sparkles className="h-3 w-3 mr-1" />
                          AI Edit
                        </Button>
                      )}
                      {tool.tool_type === 'custom' && (
                        <Dialog open={isTestDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => { if (!isOpen) setSelectedTool(null); setIsTestDialogOpen(isOpen); }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTool(tool)} className="h-7 px-2.5 text-xs border-blue-200 dark:border-blue-800/60 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                              <Play className="h-3 w-3 mr-1" />
                              {t("tools.test")}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 rounded-2xl sm:rounded-2xl">
                            <DialogHeader className="pb-4 border-b border-slate-200 dark:border-slate-700">
                              <DialogTitle className={cn("flex items-center gap-3 text-xl", isRTL && "flex-row-reverse")}>
                                <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
                                  <Play className="h-5 w-5 text-white" />
                                </div>
                                <span className="font-bold text-slate-900 dark:text-white">Test {tool.name}</span>
                              </DialogTitle>
                            </DialogHeader>
                            <TestToolDialog tool={tool} companyId={companyId} />
                          </DialogContent>
                        </Dialog>
                      )}
                      {tool.tool_type !== 'builtin' && (
                        <button
                          onClick={() => deleteToolMutation.mutate(tool.id)}
                          className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          aria-label="Delete tool"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <ToolAIChat
        isOpen={isAIChatOpen}
        onClose={() => { setIsAIChatOpen(false); setAiEditTool(null); }}
        onToolCreated={() => queryClient.invalidateQueries({ queryKey: ['tools', companyId] })}
        editTool={aiEditTool}
      />
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
          className="rounded-xl h-11 dark:bg-emerald-900 dark:border-emerald-600 dark:text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="tool-description" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.description")}</Label>
        <Textarea
          id="tool-description"
          placeholder={t("tools.forms.descriptionPlaceholder")}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className="rounded-xl dark:bg-emerald-900 dark:border-emerald-600 dark:text-white resize-none"
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
          className={`font-mono text-sm rounded-xl dark:bg-emerald-900 dark:border-emerald-600 dark:text-white resize-none ${isRTL ? 'text-right' : 'text-left'}`}
        />
      </div>

      {/* Follow-up Questions Configuration */}
      <div className="border border-emerald-200 dark:border-emerald-700 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFollowUp(!showFollowUp)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-800 dark:to-emerald-800/50 hover:from-emerald-100 hover:to-emerald-100 dark:hover:from-emerald-700 dark:hover:to-emerald-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-sm">
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
          <div className="p-4 space-y-4 border-t border-emerald-200 dark:border-emerald-700">
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
                    <div key={fieldName} className="p-3 bg-emerald-50 dark:bg-emerald-900 rounded-lg space-y-2">
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
                        className="dark:bg-emerald-800 dark:border-emerald-600 dark:text-white text-sm"
                      />
                      <Input
                        placeholder={t("tools.followUp.lookupSourcePlaceholder")}
                        value={fieldConfig.lookup_source || ""}
                        onChange={(e) => updateField(fieldName, { lookup_source: e.target.value || null })}
                        className="dark:bg-emerald-800 dark:border-emerald-600 dark:text-white text-sm"
                      />
                    </div>
                  ))}

                  {/* Add new field */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("tools.followUp.newFieldPlaceholder")}
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="dark:bg-emerald-900 dark:border-emerald-600 dark:text-white text-sm"
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
                      className="dark:border-emerald-600 dark:text-white dark:hover:bg-emerald-700"
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
                    className="dark:bg-emerald-900 dark:border-emerald-600 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <DialogFooter className={`pt-4 border-t border-emerald-200/80 dark:border-emerald-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl dark:border-emerald-600 dark:text-white dark:hover:bg-emerald-700">{t("tools.forms.back")}</Button>
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white shadow-lg shadow-emerald-500/25">
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
          className="rounded-xl h-11 dark:bg-emerald-900 dark:border-emerald-600 dark:text-gray-400 bg-emerald-100 cursor-not-allowed"
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
          className="rounded-xl dark:bg-emerald-900 dark:border-emerald-600 dark:text-white resize-none"
          rows={2}
        />
      </div>

      {/* Follow-up Questions Configuration */}
      <div className="border border-emerald-200 dark:border-emerald-700 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowFollowUp(!showFollowUp)}
          className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 dark:from-emerald-800 dark:to-emerald-800/50 hover:from-emerald-100 hover:to-emerald-100 dark:hover:from-emerald-700 dark:hover:to-emerald-700 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-600 to-emerald-800 shadow-sm">
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
          <div className="p-4 space-y-4 border-t border-emerald-200 dark:border-emerald-700">
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
                    <div key={fieldName} className="p-3 bg-emerald-50 dark:bg-emerald-900 rounded-lg space-y-2">
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
                        className="dark:bg-emerald-800 dark:border-emerald-600 dark:text-white text-sm"
                      />
                      <Input
                        placeholder={t("tools.followUp.lookupSourcePlaceholder")}
                        value={fieldConfig.lookup_source || ""}
                        onChange={(e) => updateField(fieldName, { lookup_source: e.target.value || null })}
                        className="dark:bg-emerald-800 dark:border-emerald-600 dark:text-white text-sm"
                      />
                    </div>
                  ))}

                  {/* Add new field */}
                  <div className="flex gap-2">
                    <Input
                      placeholder={t("tools.followUp.newFieldPlaceholder")}
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="dark:bg-emerald-900 dark:border-emerald-600 dark:text-white text-sm"
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
                      className="dark:border-emerald-600 dark:text-white dark:hover:bg-emerald-700"
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
                    className="dark:bg-emerald-900 dark:border-emerald-600 dark:text-white"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <DialogFooter className={`pt-4 border-t border-emerald-200/80 dark:border-emerald-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl dark:border-emerald-600 dark:text-white dark:hover:bg-emerald-700">{t("tools.forms.back")}</Button>
        <Button type="submit" className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white shadow-lg shadow-emerald-500/25">
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
          className="rounded-xl h-11 dark:bg-emerald-900 dark:border-emerald-600 dark:text-white"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="mcp-description" className="dark:text-gray-300 text-sm font-medium">{t("tools.forms.description")}</Label>
        <Textarea
          id="mcp-description"
          placeholder={t("tools.forms.mcpDescriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-xl dark:bg-emerald-900 dark:border-emerald-600 dark:text-white resize-none"
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
            className="rounded-xl h-11 dark:bg-emerald-900 dark:border-emerald-600 dark:text-white"
          />
          <Button type="button" onClick={() => inspect(url)} disabled={isInspecting || !url} variant="outline" className="rounded-xl h-11 dark:border-emerald-600 dark:text-white dark:hover:bg-emerald-700 hover:border-cyan-300 hover:bg-cyan-50 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/20 whitespace-nowrap transition-all">
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

      <DialogFooter className={`pt-4 border-t border-emerald-200/80 dark:border-emerald-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={onBack} className="rounded-xl dark:border-emerald-600 dark:text-white dark:hover:bg-emerald-700">{t("tools.forms.back")}</Button>
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
              className="rounded-xl h-11 dark:bg-emerald-900 dark:border-emerald-600 dark:text-white"
            />
          </div>
        ))}
        <Button type="submit" disabled={isLoading} className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white w-full shadow-lg shadow-blue-500/25 h-11">
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Executing...</> : <><Play className="h-4 w-4 mr-2" />Run Test</>}
        </Button>
      </form>
      {result && (
        <div className="pt-4 border-t border-emerald-200/80 dark:border-emerald-700/60">
          <h4 className="font-semibold mb-3 dark:text-white text-sm uppercase tracking-wide">Result:</h4>
          <pre className="bg-emerald-50 dark:bg-emerald-900 p-4 rounded-xl overflow-x-auto text-sm dark:text-gray-300 border border-emerald-200/80 dark:border-emerald-700/60 max-h-64">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolManagementPage;

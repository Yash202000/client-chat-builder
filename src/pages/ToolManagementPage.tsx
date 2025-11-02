import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Search, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/hooks/useI18n";

const ToolManagementPage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded for now
  const { authFetch } = useAuth();
  const { t, isRTL } = useI18n();

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
      <div className={`flex justify-between items-start`}>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
            {t("tools.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t("tools.subtitle")}</p>
        </div>
        <div className={`flex gap-2`}>
          <Dialog open={isCreateDialogOpen} onOpenChange={(isOpen) => {
            setIsCreateDialogOpen(isOpen);
            if (!isOpen) {
              resetCreationFlow();
            }
          }}>
            <DialogTrigger asChild>
              <Button className={`bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg hover:shadow-xl transition-all flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} /> {t("tools.createTool")}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg dark:bg-slate-800 dark:border-slate-700">
              <DialogHeader>
                <DialogTitle className={`dark:text-white text-left`}>{t("tools.createDialog.title")}</DialogTitle>
                <DialogDescription className={`dark:text-gray-400 text-left`}>
                  {t("tools.createDialog.description")}
                </DialogDescription>
              </DialogHeader>
              {creationStep === 'initial' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                  <div
                    className="group relative p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer"
                    onClick={() => setCreationStep('custom')}
                  >
                    <div className={`flex flex-col gap-3 ${isRTL ? 'items-end' : 'items-start'}`}>
                      <div className="bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 p-3 rounded-lg">
                        <Edit className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="text-lg font-semibold dark:text-white">{t("tools.createDialog.customTool")}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("tools.createDialog.customToolDescription")}
                      </p>
                    </div>
                  </div>
                  <div
                    className="group relative p-6 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all cursor-pointer"
                    onClick={() => setCreationStep('mcp')}
                  >
                    <div className={`flex flex-col gap-3 ${isRTL ? 'items-end' : 'items-start'}`}>
                      <div className="bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50 p-3 rounded-lg">
                        <Search className="h-6 w-6 text-teal-600 dark:text-teal-400" />
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

      <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
          <CardTitle className={`flex items-center gap-2 dark:text-white`}>
            <Search className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            {t("tools.existingTools")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <Input
            placeholder={t("tools.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`dark:bg-slate-900 dark:border-slate-600 dark:text-white text-left`}
          />
          {isLoadingTools ? (
            <div className="flex items-center justify-center py-8">
              <div className={`flex items-center gap-2 text-muted-foreground dark:text-gray-400 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600 dark:border-emerald-400"></div>
                <span>{t("tools.loading")}</span>
              </div>
            </div>
          ) : filteredTools && filteredTools.length > 0 ? (
            filteredTools.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50 hover:shadow-md transition-shadow">
                <div className="flex-1">
                  <h4 className="font-semibold flex items-center gap-2 dark:text-white">
                    {tool.name}
                    <span className="text-xs font-normal bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 text-emerald-700 dark:text-emerald-400 py-0.5 px-2 rounded-full border border-emerald-200 dark:border-emerald-800">
                      {tool.tool_type === 'mcp' ? t("tools.toolTypes.mcpConnection") : t("tools.toolTypes.custom")}
                    </span>
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{tool.description}</p>
                  {tool.tool_type === 'mcp' && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">{tool.mcp_server_url}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                    <Dialog open={isEditDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedTool(null);
                        setIsEditDialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTool(tool)} className={`dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Edit className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t("tools.edit")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="dark:text-white">Edit {tool.tool_type === 'mcp' ? 'Connection' : 'Tool'}</DialogTitle>
                          </DialogHeader>
                          {tool.tool_type === 'custom' ? (
                            <ToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} onBack={() => setIsEditDialogOpen(false)} />
                          ) : (
                            <McpToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} onBack={() => setIsEditDialogOpen(false)} />
                          )}
                        </DialogContent>
                      </Dialog>
                  {tool.tool_type === 'custom' && (
                      <Dialog open={isTestDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                        if (!isOpen) setSelectedTool(null);
                        setIsTestDialogOpen(isOpen);
                      }}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTool(tool)} className={`dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <Play className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t("tools.test")}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="dark:bg-slate-800 dark:border-slate-700">
                          <DialogHeader>
                            <DialogTitle className="dark:text-white">Test {tool.name}</DialogTitle>
                          </DialogHeader>
                          <TestToolDialog tool={tool} companyId={companyId} />
                        </DialogContent>
                      </Dialog>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => deleteToolMutation.mutate(tool.id)} className="bg-red-600 hover:bg-red-700">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                <Search className="w-8 h-8 text-slate-400 dark:text-slate-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{t("tools.noToolsFound")}</h3>
              <p className="text-gray-500 dark:text-gray-400 mt-2">{t("tools.createFirstTool")}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

const ToolForm = ({ tool, onSubmit, onBack }: { tool?: Tool, onSubmit: (values: any) => void, onBack: () => void }) => {
  const { t, isRTL } = useI18n();
  const [values, setValues] = useState(tool || { name: "", description: "", code: "", parameters: { type: "object", properties: {}, required: [] }, tool_type: "custom" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 pt-4 text-left}`}>
      <div>
        <Label htmlFor="tool-name" className="dark:text-gray-300">{t("tools.forms.toolName")}</Label>
        <Input
          id="tool-name"
          placeholder={t("tools.forms.toolNamePlaceholder")}
          value={values.name}
          onChange={(e) => setValues({ ...values, name: e.target.value })}
          required
          className={`dark:bg-slate-900 dark:border-slate-600 dark:text-white text-left}`}
        />
      </div>
      <div>
        <Label htmlFor="tool-description" className="dark:text-gray-300">{t("tools.forms.description")}</Label>
        <Textarea
          id="tool-description"
          placeholder={t("tools.forms.descriptionPlaceholder")}
          value={values.description}
          onChange={(e) => setValues({ ...values, description: e.target.value })}
          className={`dark:bg-slate-900 dark:border-slate-600 dark:text-white text-left}`}
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="tool-code" className="dark:text-gray-300">{t("tools.forms.pythonCode")}</Label>
        <Textarea
          id="tool-code"
          placeholder={t("tools.forms.pythonCodePlaceholder")}
          value={values.code}
          onChange={(e) => setValues({ ...values, code: e.target.value })}
          rows={10}
          className={`font-mono text-sm dark:bg-slate-900 dark:border-slate-600 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}
        />
      </div>
      <div className={`flex justify-between pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="ghost" onClick={onBack} className="dark:text-white dark:hover:bg-slate-700">{t("tools.forms.back")}</Button>
        <Button type="submit" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          {tool ? t("tools.forms.updateTool") : t("tools.forms.createTool")}
        </Button>
      </div>
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
    <form onSubmit={handleSubmit} className={`space-y-4 pt-4 text-left}`}>
      <div>
        <Label htmlFor="mcp-name" className="dark:text-gray-300">{t("tools.forms.connectionName")}</Label>
        <Input
          id="mcp-name"
          placeholder={t("tools.forms.connectionNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className={`dark:bg-slate-900 dark:border-slate-600 dark:text-white text-left}`}
        />
      </div>
      <div>
        <Label htmlFor="mcp-description" className="dark:text-gray-300">{t("tools.forms.description")}</Label>
        <Textarea
          id="mcp-description"
          placeholder={t("tools.forms.mcpDescriptionPlaceholder")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`dark:bg-slate-900 dark:border-slate-600 dark:text-white text-left}`}
          rows={2}
        />
      </div>
      <div>
        <Label htmlFor="mcp-url" className="dark:text-gray-300">{t("tools.forms.mcpServerUrl")}</Label>
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
            className={`dark:bg-slate-900 dark:border-slate-600 dark:text-white text-left}`}
          />
          <Button type="button" onClick={() => inspect(url)} disabled={isInspecting || !url} variant="outline" className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 whitespace-nowrap">
            {isInspecting ? t("tools.forms.inspecting") : t("tools.forms.testInspect")}
          </Button>
        </div>
      </div>

      {authRequired && (
        <div className={`p-4 border bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 rounded-lg text-center text-left}`}>
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300">{t("tools.forms.authRequired")}</h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-400 mb-4">{t("tools.forms.authRequiredMessage")}</p>
          <Button type="button" onClick={handleAuthenticate} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
            {t("tools.forms.connectToGoogle")}
          </Button>
        </div>
      )}

      {inspectData && inspected && !authRequired && (
        <div className={`p-4 border bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 rounded-lg text-left}`}>
          <h4 className="font-semibold text-green-800 dark:text-green-300">{t("tools.forms.inspectionSuccess")}</h4>
          <p className="text-sm text-green-700 dark:text-green-400">{t("tools.forms.foundTools", { count: inspectData.tools.length })}</p>
        </div>
      )}

      {inspectError && (
         <div className={`p-4 border bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 rounded-lg text-left}`}>
          <h4 className="font-semibold text-red-800 dark:text-red-300">{t("tools.forms.inspectionFailed")}</h4>
          <p className="text-sm text-red-700 dark:text-red-400">{inspectError.message}</p>
        </div>
      )}

      <div className={`flex justify-between pt-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="ghost" onClick={onBack} className="dark:text-white dark:hover:bg-slate-700">{t("tools.forms.back")}</Button>
        <Button type="submit" disabled={!inspected && !tool} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
          {tool ? t("tools.forms.updateConnection") : t("tools.forms.createConnection")}
        </Button>
      </div>
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
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        {tool.parameters && Object.keys(tool.parameters).map((paramName) => (
          <div key={paramName}>
            <Label htmlFor={paramName} className="dark:text-gray-300">{tool.parameters[paramName].description}</Label>
            <Input
              id={paramName}
              type={tool.parameters[paramName].type === "integer" ? "number" : "text"}
              value={parameters[paramName] || ""}
              onChange={(e) => setParameters({ ...parameters, [paramName]: e.target.value })}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
        ))}
        <Button type="submit" disabled={isLoading} className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white w-full">
          {isLoading ? "Executing..." : "▶ Run Test"}
        </Button>
      </form>
      {result && (
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <h4 className="font-semibold mb-2 dark:text-white">Result:</h4>
          <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md overflow-x-auto text-sm dark:text-gray-300 border border-slate-200 dark:border-slate-700">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ToolManagementPage;

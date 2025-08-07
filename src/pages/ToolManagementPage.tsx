import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tool, PreBuiltConnector } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit, Search, Settings, Play } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

const ToolManagementPage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded for now
  const { authFetch } = useAuth();
  

  const { data: tools, isLoading: isLoadingTools } = useQuery<Tool[]>({ queryKey: ['tools', companyId], queryFn: async () => {
    const response = await authFetch(`/api/v1/tools/`);
    if (!response.ok) {
      throw new Error("Failed to fetch tools");
    }
    return response.json();
  }});

  const { data: preBuiltConnectors, isLoading: isLoadingPreBuiltConnectors } = useQuery<Record<string, PreBuiltConnector>>({ queryKey: ['preBuiltConnectors'], queryFn: async () => {
    const response = await authFetch(`/api/v1/pre-built-connectors`);
    if (!response.ok) {
      throw new Error("Failed to fetch pre-built connectors");
    }
    return response.json();
  }});

  const createToolMutation = useMutation({
    mutationFn: async (newTool: Partial<Tool> & { pre_built_connector_name?: string }) => {
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
  const [isMarketplaceDialogOpen, setIsMarketplaceDialogOpen] = useState(false);
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTools = tools?.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreate = (newTool: Omit<Tool, 'id'>) => {
    createToolMutation.mutate(newTool);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = (updatedTool: Tool) => {
    updateToolMutation.mutate(updatedTool);
    setIsEditDialogOpen(false);
    setIsConfigureDialogOpen(false);
  };
  
  const handleInstallConnector = (connectorName: string) => {
    createToolMutation.mutate({ pre_built_connector_name: connectorName });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tool Management</h1>
        <div className="flex gap-2">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button> <Plus className="mr-2 h-4 w-4" /> Create Tool</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Tool</DialogTitle>
              </DialogHeader>
              <ToolForm onSubmit={handleCreate} />
            </DialogContent>
          </Dialog>
          <Dialog open={isMarketplaceDialogOpen} onOpenChange={setIsMarketplaceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"> <Search className="mr-2 h-4 w-4" /> Browse Marketplace</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Tool Marketplace</DialogTitle>
              </DialogHeader>
              <Marketplace
                connectors={preBuiltConnectors || {}}
                onInstall={handleInstallConnector}
                isLoading={isLoadingPreBuiltConnectors}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search existing tools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4"
          />
          {isLoadingTools ? (
            <p>Loading tools...</p>
          ) : (
            filteredTools?.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{tool.name} {tool.code === "" && <span className="text-xs text-gray-500">(Marketplace)</span>}</h4>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {tool.code === "" && (
                  <Dialog open={isConfigureDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedTool(null);
                    }
                    setIsConfigureDialogOpen(isOpen);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedTool(tool)}><Settings className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Configure {tool.name}</DialogTitle>
                      </DialogHeader>
                      <ConfigurationForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} />
                    </DialogContent>
                  </Dialog>
                  )}
                  <Dialog open={isEditDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedTool(null);
                    }
                    setIsEditDialogOpen(isOpen);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedTool(tool)}><Edit className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Tool</DialogTitle>
                      </DialogHeader>
                      <ToolForm tool={tool} onSubmit={(values) => handleUpdate({ ...tool, ...values })} />
                    </DialogContent>
                  </Dialog>
                  <Dialog open={isTestDialogOpen && selectedTool?.id === tool.id} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      setSelectedTool(null);
                    }
                    setIsTestDialogOpen(isOpen);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" onClick={() => setSelectedTool(tool)}><Play className="h-4 w-4" /></Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Test {tool.name}</DialogTitle>
                      </DialogHeader>
                      <TestToolDialog tool={tool} companyId={companyId} />
                    </DialogContent>
                  </Dialog>
                  <Button variant="destructive" onClick={() => deleteToolMutation.mutate(tool.id)}>
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

const ToolForm = ({ tool, onSubmit }: { tool?: Tool, onSubmit: (values: any) => void }) => {
  const [values, setValues] = useState(tool || { name: "", description: "", code: "", parameters: { type: "object", properties: {}, required: [] } });

  const handleParameterChange = (index, field, value) => {
    const newProperties = { ...values.parameters.properties };
    const key = Object.keys(newProperties)[index];
    newProperties[key][field] = value;
    setValues({ ...values, parameters: { ...values.parameters, properties: newProperties } });
  };

  const addParameter = () => {
    const newParamName = `param${Object.keys(values.parameters.properties).length + 1}`;
    const newProperties = { ...values.parameters.properties, [newParamName]: { type: "string", description: "" } };
    const newRequired = [...values.parameters.required, newParamName];
    setValues({ ...values, parameters: { ...values.parameters, properties: newProperties, required: newRequired } });
  };

  const removeParameter = (index) => {
    const newProperties = { ...values.parameters.properties };
    const key = Object.keys(newProperties)[index];
    delete newProperties[key];
    const newRequired = values.parameters.required.filter(p => p !== key);
    setValues({ ...values, parameters: { ...values.parameters, properties: newProperties, required: newRequired } });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Tool Name"
        value={values.name}
        onChange={(e) => setValues({ ...values, name: e.target.value })}
      />
      <Textarea
        placeholder="Description"
        value={values.description}
        onChange={(e) => setValues({ ...values, description: e.target.value })}
      />
      <Textarea
        placeholder="Code"
        value={values.code}
        onChange={(e) => setValues({ ...values, code: e.target.value })}
        rows={10}
      />
      <div>
        <Label>Parameters</Label>
        {Object.keys(values.parameters.properties).map((key, index) => (
          <div key={index} className="flex items-center gap-2 p-2 border rounded-lg">
            <Input
              placeholder="Name"
              value={key}
              disabled // Editing the name directly is complex, so we disable it for now
            />
            <Input
              placeholder="Description"
              value={values.parameters.properties[key].description}
              onChange={(e) => handleParameterChange(index, "description", e.target.value)}
            />
            <select
              value={values.parameters.properties[key].type}
              onChange={(e) => handleParameterChange(index, "type", e.target.value)}
            >
              <option value="string">string</option>
              <option value="number">number</option>
              <option value="boolean">boolean</option>
            </select>
            <Button type="button" variant="destructive" onClick={() => removeParameter(index)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={addParameter} className="mt-2">
          <Plus className="mr-2 h-4 w-4" /> Add Parameter
        </Button>
      </div>
      <Button type="submit">
        {tool ? "Update" : "Create"}
      </Button>
    </form>
  );
};

const ConfigurationForm = ({ tool, onSubmit }: { tool: Tool, onSubmit: (values: any) => void }) => {
  const [config, setConfig] = useState(tool.configuration || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ configuration: config });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {Object.keys(tool.parameters).map((paramName) => (
        <div key={paramName}>
          <Label htmlFor={paramName}>{tool.parameters[paramName].description}</Label>
          <Input
            id={paramName}
            type={tool.parameters[paramName].type === "integer" ? "number" : "text"}
            value={config[paramName] || ""}
            onChange={(e) => setConfig({ ...config, [paramName]: e.target.value })}
          />
        </div>
      ))}
      <Button type="submit">Save Configuration</Button>
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
        {Object.keys(tool.parameters).map((paramName) => (
          <div key={paramName}>
            <Label htmlFor={paramName}>{tool.parameters[paramName].description}</Label>
            <Input
              id={paramName}
              type={tool.parameters[paramName].type === "integer" ? "number" : "text"}
              value={parameters[paramName] || ""}
              onChange={(e) => setParameters({ ...parameters, [paramName]: e.target.value })}
            />
          </div>
        ))}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Executing..." : "Run Test"}
        </Button>
      </form>
      {result && (
        <div>
          <h4 className="font-semibold">Result:</h4>
          <pre className="bg-gray-100 p-4 rounded-md overflow-x-auto text-sm">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

const Marketplace = ({ connectors, onInstall, isLoading }: { connectors: Record<string, PreBuiltConnector>, onInstall: (name: string) => void, isLoading: boolean }) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredConnectors = Object.entries(connectors).filter(([_, connector]) =>
    connector.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    connector.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search marketplace..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />
      {isLoading ? (
        <p>Loading marketplace...</p>
      ) : (
        filteredConnectors.map(([name, connector]) => (
          <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-semibold">{connector.name}</h4>
              <p className="text-sm text-gray-500">{connector.description}</p>
            </div>
            <Button onClick={() => onInstall(name)}>Install</Button>
          </div>
        ))
      )}
    </div>
  );
};

export default ToolManagementPage;

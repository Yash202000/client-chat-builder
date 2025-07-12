import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tool } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "recharts";

const ToolManagementPage = () => {
  const queryClient = useQueryClient();
  const companyId = 1; // Hardcoded for now

  const { data: tools, isLoading } = useQuery<Tool[]>({ queryKey: ['tools', companyId], queryFn: async () => {
    const response = await fetch(`http://localhost:8000/api/v1/tools/`, {
      headers: {
        "X-Company-ID": companyId.toString(),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch tools");
    }
    return response.json();
  }});

  const createToolMutation = useMutation({
    mutationFn: async (newTool: Omit<Tool, 'id'>) => {
      const response = await fetch(`http://localhost:8000/api/v1/tools/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyId.toString(),
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
      const response = await fetch(`http://localhost:8000/api/v1/tools/${updatedTool.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "X-Company-ID": companyId.toString(),
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
      const response = await fetch(`http://localhost:8000/api/v1/tools/${toolId}`, {
        method: "DELETE",
        headers: {
          "X-Company-ID": companyId.toString(),
        },
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
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);

  const handleCreate = (newTool: Omit<Tool, 'id'>) => {
    createToolMutation.mutate(newTool);
    setIsCreateDialogOpen(false);
  };

  const handleUpdate = (updatedTool: Tool) => {
    updateToolMutation.mutate(updatedTool);
    setIsEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Tool Management</h1>
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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Existing Tools</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <p>Loading tools...</p>
          ) : (
            tools?.map((tool) => (
              <div key={tool.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-semibold">{tool.name}</h4>
                  <p className="text-sm text-gray-500">{tool.description}</p>
                </div>
                <div className="flex items-center gap-2">
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
  const [values, setValues] = useState(tool || { name: "", description: "", code: "", parameters: {} });
  const [parametersJson, setParametersJson] = useState(JSON.stringify(values.parameters, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    setParametersJson(JSON.stringify(values.parameters, null, 2));
  }, [values.parameters]);

  const handleParametersChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newJsonString = e.target.value;
    setParametersJson(newJsonString);
    try {
      const parsed = JSON.parse(newJsonString);
      setValues({ ...values, parameters: parsed });
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format");
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(parametersJson);
      setParametersJson(JSON.stringify(parsed, null, 2));
      setJsonError(null);
    } catch (error) {
      setJsonError("Invalid JSON format - cannot format");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (jsonError) {
      alert("Please correct the JSON format before submitting.");
      return;
    }
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
        <Label htmlFor="parameters-json">Parameters (JSON Schema)</Label>
        <Textarea
          id="parameters-json"
          value={parametersJson}
          onChange={handleParametersChange}
          rows={8}
          className={jsonError ? "border-red-500" : ""}
        />
        {jsonError && <p className="text-red-500 text-sm mt-1">{jsonError}</p>}
        <Button type="button" variant="outline" onClick={handleFormatJson} className="mt-2">
          Format JSON
        </Button>
      </div>
      <Button type="submit" disabled={!!jsonError}>
        {tool ? "Update" : "Create"}
      </Button>
    </form>
  );
};

export default ToolManagementPage;

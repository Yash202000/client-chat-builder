
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Key, Trash, PlusCircle } from "lucide-react";
import { CreateApiKeyModal } from "./CreateApiKeyModal";

interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

export const ApiKeys = () => {
  const { toast } = useToast();
  const { authFetch } = useAuth();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showCopied, setShowCopied] = useState(false);

  const fetchApiKeys = async () => {
    try {
      const response = await authFetch("/api/v1/api-keys/");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch API keys.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch API keys", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchApiKeys();
  }, []);

  const handleDeleteApiKey = async (apiKeyId: number) => {
    try {
      const response = await authFetch(`/api/v1/api-keys/${apiKeyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setApiKeys(apiKeys.filter((key) => key.id !== apiKeyId));
        toast({
          title: "Success",
          description: "API key deleted successfully.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete API key.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete API key", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for third-party integrations.
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Key
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-semibold">{apiKey.name}</p>
                <p className="text-sm text-gray-500">
                  Created on {new Date(apiKey.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey.key)}>
                  {showCopied ? "Copied!" : "Copy Key"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteApiKey(apiKey.id)}>
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {apiKeys.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No API keys found.
            </div>
          )}
        </CardContent>
      </Card>
      <CreateApiKeyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onApiKeyCreated={fetchApiKeys}
      />
    </>
  );
};

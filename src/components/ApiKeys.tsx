
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Key, Trash, PlusCircle } from "lucide-react";
import { CreateApiKeyModal } from "./CreateApiKeyModal";
import { useI18n } from '@/hooks/useI18n';

interface ApiKey {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

export const ApiKeys = () => {
  const { t, isRTL } = useI18n();
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
          title: t('apiKeys.error'),
          description: t('apiKeys.fetchError'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to fetch API keys", error);
      toast({
        title: t('apiKeys.error'),
        description: t('apiKeys.unexpectedError'),
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
          title: t('apiKeys.success'),
          description: t('apiKeys.deletedSuccess'),
        });
      } else {
        toast({
          title: t('apiKeys.error'),
          description: t('apiKeys.deletedError'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to delete API key", error);
      toast({
        title: t('apiKeys.error'),
        description: t('apiKeys.unexpectedError'),
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
      <Card dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader className={`flex flex-row items-center  justify-between dark:border-slate-700`}>
          <div>
            <CardTitle className="flex items-center gap-2 dark:text-white">
              <Key className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              {t('apiKeys.title')}
            </CardTitle>
            <CardDescription className="dark:text-gray-400">
              {t('apiKeys.subtitle')}
            </CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
            <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('apiKeys.createKey')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className={`flex items-center  justify-between p-3 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700`}>
              <div>
                <p className="font-semibold dark:text-white">{apiKey.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('apiKeys.createdOn')} {new Date(apiKey.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className={`flex items-center gap-2 `}>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(apiKey.key)} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
                  {showCopied ? t('apiKeys.copied') : t('apiKeys.copyKey')}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDeleteApiKey(apiKey.id)} className="bg-red-600 hover:bg-red-700">
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {apiKeys.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              {t('apiKeys.noKeys')}
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

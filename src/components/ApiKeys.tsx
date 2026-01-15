
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Key, Trash, PlusCircle, Copy, Check, Calendar } from "lucide-react";
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
  const { playSuccessSound } = useNotifications();
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
        playSuccessSound();
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
      <Card dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800/90 dark:border-slate-700/60 border-slate-200/80 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
        <CardHeader className={`flex flex-row items-center justify-between border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl blur-md opacity-40 group-hover:opacity-60 transition-all" />
              <div className="relative p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
                <Key className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <CardTitle className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {t('apiKeys.title')}
              </CardTitle>
              <CardDescription className="dark:text-gray-400">
                {t('apiKeys.subtitle')}
              </CardDescription>
            </div>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-cyan-500/30 transition-all">
            <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t('apiKeys.createKey')}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3 p-6">
          {apiKeys.map((apiKey) => (
            <div key={apiKey.id} className={`group flex items-center justify-between p-4 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-lg hover:shadow-cyan-500/5 hover:border-cyan-200 dark:hover:border-cyan-700/50 transition-all ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2.5 rounded-lg bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40">
                  <Key className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div>
                  <p className="font-semibold dark:text-white group-hover:text-cyan-700 dark:group-hover:text-cyan-300 transition-colors">{apiKey.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar className="h-3.5 w-3.5" />
                    {t('apiKeys.createdOn')} {new Date(apiKey.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(apiKey.key)}
                  className="rounded-lg dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-cyan-300 hover:bg-cyan-50 dark:hover:border-cyan-700 dark:hover:bg-cyan-900/30 transition-colors"
                >
                  {showCopied ? (
                    <>
                      <Check className={`h-4 w-4 text-green-500 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                      {t('apiKeys.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                      {t('apiKeys.copyKey')}
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteApiKey(apiKey.id)}
                  className="rounded-lg h-9 w-9 p-0 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {apiKeys.length === 0 && (
            <div className="flex flex-col items-center justify-center text-center py-12">
              <div className="relative mb-4">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full blur-xl opacity-30" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center shadow-xl shadow-cyan-500/25">
                  <Key className="h-10 w-10 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{t('apiKeys.noKeys')}</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-4">
                {t('apiKeys.noKeysDescription') || 'Create your first API key to integrate with external services.'}
              </p>
              <Button onClick={() => setIsModalOpen(true)} className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25">
                <PlusCircle className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                {t('apiKeys.createKey')}
              </Button>
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

import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, Edit, PlusCircle, Copy, Shield, Loader2, Calendar, Key, Check, Vault } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useI18n } from '@/hooks/useI18n';

// Updated type to match the new backend schema
interface Credential {
  id: number;
  name: string;
  service: string;
  created_at: string;
  updated_at: string;
}

interface CredentialFormData {
  name: string;
  service: string;
  credentials: string;
}

export const VaultSettings = () => {
  const { t, isRTL } = useI18n();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentCredential, setCurrentCredential] = useState<Credential | null>(null);
  const [formData, setFormData] = useState<CredentialFormData>({
    name: "",
    service: "",
    credentials: "",
  });
  const { authFetch } = useAuth();

  const { data: credentials, isLoading, isError } = useQuery<Credential[]>({ 
    queryKey: ['credentials'], 
    queryFn: async () => {
      const response = await authFetch(`/api/v1/credentials/`);
      if (!response.ok) throw new Error("Failed to fetch credentials");
      return response.json();
    }
  });

  const createCredentialMutation = useMutation({
    mutationFn: async (newCredential: CredentialFormData) => {
      const response = await authFetch(`/api/v1/credentials/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCredential),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success(t('vault.createdSuccess'));
      setIsCreateDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(t('vault.createdError'), { description: error.message });
    },
  });

  const updateCredentialMutation = useMutation({
    mutationFn: async (updatedCredential: Partial<CredentialFormData> & { id: number }) => {
      const response = await authFetch(`/api/v1/credentials/${updatedCredential.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCredential),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update credential");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success(t('vault.updatedSuccess'));
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast.error(t('vault.updatedError'), { description: error.message });
    },
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: async (credentialId: number) => {
      const response = await authFetch(`/api/v1/credentials/${credentialId}`, {
        method: "DELETE",
      });
      if (!response.ok && response.status !== 204) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to delete credential");
      }
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credentials'] });
      toast.success(t('vault.deletedSuccess'));
    },
    onError: (error: Error) => {
      toast.error(t('vault.deletedError'), { description: error.message });
    },
  });

  const handleOpenCreate = () => {
    setFormData({ name: "", service: "", credentials: "" });
    setIsCreateDialogOpen(true);
  };

  const handleOpenEdit = (credential: Credential) => {
    setCurrentCredential(credential);
    setFormData({ name: credential.name, service: credential.service, credentials: "" });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentCredential) {
      // Update logic
      const payload: Partial<CredentialFormData> & { id: number } = { id: currentCredential.id };
      if (formData.name !== currentCredential.name) payload.name = formData.name;
      if (formData.service !== currentCredential.service) payload.service = formData.service;
      if (formData.credentials) payload.credentials = formData.credentials;
      updateCredentialMutation.mutate(payload);
    } else {
      // Create logic
      createCredentialMutation.mutate(formData);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t('vault.copiedToClipboard'));
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full blur-xl opacity-30 animate-pulse" />
          <div className="relative w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-violet-500/25">
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
        </div>
        <span className="text-gray-600 dark:text-gray-400 font-medium">{t('vault.loading')}</span>
      </div>
    </div>
  );
  if (isError) return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="relative mb-4">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-rose-600 rounded-full blur-xl opacity-30" />
        <div className="relative w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl shadow-red-500/25">
          <Shield className="h-8 w-8 text-white" />
        </div>
      </div>
      <div className="text-red-600 dark:text-red-400 font-medium">{t('vault.errorLoading')}</div>
    </div>
  );

  const renderDialogContent = () => (
    <form onSubmit={handleSubmit} className="space-y-5" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-sm font-medium dark:text-gray-300">{t('vault.nameLabel')}</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder={t('vault.namePlaceholder')}
          required
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('vault.nameDesc')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="service" className="text-sm font-medium dark:text-gray-300">{t('vault.serviceLabel')}</Label>
        <select
          id="service"
          value={formData.service}
          onChange={(e) => setFormData({ ...formData, service: e.target.value })}
          required
          className="w-full h-11 px-3 border rounded-xl dark:bg-slate-900 dark:border-slate-600 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-violet-500 transition-all"
        >
          <option value="">{t('vault.servicePlaceholder')}</option>
          <option value="deepgram">{t('vault.services.deepgram')}</option>
          <option value="gemini">{t('vault.services.gemini')}</option>
          <option value="google_translate">{t('vault.services.google_translate')}</option>
          <option value="groq">{t('vault.services.groq')}</option>
          <option value="openai">{t('vault.services.openai')}</option>
        </select>
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('vault.serviceDesc')}</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="credentials" className="text-sm font-medium dark:text-gray-300">
          {currentCredential ? t('vault.newApiKeyLabel') : t('vault.apiKeyLabel')}
        </Label>
        <Input
          id="credentials"
          type="password"
          value={formData.credentials}
          onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
          required={!currentCredential}
          className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white font-mono"
          placeholder={t('vault.apiKeyPlaceholder')}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">{t('vault.apiKeyDesc')}</p>
      </div>
      <DialogFooter className={`pt-4 border-t border-slate-200/80 dark:border-slate-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <Button type="button" variant="outline" onClick={() => currentCredential ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)} className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={createCredentialMutation.isPending || updateCredentialMutation.isPending} className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25">
          {createCredentialMutation.isPending || updateCredentialMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              {currentCredential ? (
                <>
                  <Check className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('vault.saveChanges')}
                </>
              ) : (
                <>
                  <Key className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                  {t('vault.addKey')}
                </>
              )}
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  );

  return (
    <div className="w-full max-w-7xl mx-auto" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 ${isRTL ? 'sm:flex-row-reverse' : ''}`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition-all" />
            <div className="relative p-4 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-xl shadow-violet-500/25">
              <Vault className="h-8 w-8 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
              {t('vault.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">{t('vault.subtitle')}</p>
          </div>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all">
          <PlusCircle className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t('vault.addNewKey')}
        </Button>
      </div>

      {credentials && credentials.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {credentials.map((credential) => (
            <Card key={credential.id} className="group rounded-2xl border-slate-200/80 dark:border-slate-700/60 dark:bg-slate-800/90 hover:shadow-xl hover:shadow-violet-500/10 hover:border-violet-200 dark:hover:border-violet-700/50 transition-all duration-300 flex flex-col justify-between overflow-hidden">
              <CardHeader className="border-b border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800 dark:to-slate-900/80">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl blur-md opacity-30 group-hover:opacity-50 transition-all" />
                    <div className="relative w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                      <Key className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold dark:text-white truncate group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">{credential.name}</p>
                    <span className="inline-flex items-center text-xs bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full mt-1 font-medium">
                      {credential.service}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <Button variant="ghost" size="sm" onClick={() => handleCopy(credential.id.toString())} className={`w-full ${isRTL ? 'justify-end' : 'justify-start'} rounded-lg dark:hover:bg-slate-700 dark:text-white hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors`}>
                  <Copy className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                  {t('vault.copyKeyId')}
                </Button>
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t('vault.created')}: {new Date(credential.created_at).toLocaleDateString()}
                </div>
              </CardContent>
              <CardFooter className={`flex ${isRTL ? 'flex-row-reverse justify-start' : 'justify-end'} gap-2 border-t border-slate-200/80 dark:border-slate-700/60 pt-4 bg-slate-50/50 dark:bg-slate-900/30`}>
                <Button variant="outline" size="sm" onClick={() => handleOpenEdit(credential)} className="rounded-lg dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 hover:border-violet-300 hover:bg-violet-50 dark:hover:border-violet-700 dark:hover:bg-violet-900/30 transition-colors">
                  <Edit className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('vault.edit')}
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                      <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-1' : 'mr-1'}`} /> {t('vault.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl" dir={isRTL ? 'rtl' : 'ltr'}>
                    <AlertDialogHeader>
                      <AlertDialogTitle className={`dark:text-white flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                          <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
                        </div>
                        {t('vault.deleteConfirmTitle')}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="dark:text-gray-400">
                        {t('vault.deleteConfirmDesc1')} <span className="font-bold text-violet-600 dark:text-violet-400">{credential.name}</span> {t('vault.deleteConfirmDesc2')}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={`pt-4 border-t border-slate-200/80 dark:border-slate-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <AlertDialogCancel className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteCredentialMutation.mutate(credential.id)} className="rounded-xl bg-red-600 hover:bg-red-700 text-white">
                        <Trash2 className={`h-4 w-4 ${isRTL ? 'ml-1.5' : 'mr-1.5'}`} />
                        {t('vault.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full blur-xl opacity-30" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-violet-500/25">
              <Vault className="h-12 w-12 text-white" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{t('vault.noKeysFound')}</h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-md text-center mb-6">{t('vault.noKeysDesc')}</p>
          <Button onClick={handleOpenCreate} className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25">
            <PlusCircle className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} /> {t('vault.addFirstKey')}
          </Button>
        </div>
      )}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
            <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                <PlusCircle className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {t('vault.addNewApiKey')}
              </span>
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400 mt-2">
              {t('vault.addNewApiKeyDesc') || 'Securely store your API credentials for external services.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderDialogContent()}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
          <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
            <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <span className="bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                {t('vault.editApiKey')}
              </span>
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400 mt-2">
              {t('vault.editApiKeyDesc') || 'Update your API credential details.'}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {renderDialogContent()}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
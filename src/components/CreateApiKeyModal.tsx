
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useI18n } from '@/hooks/useI18n';
import { Key, Loader2 } from "lucide-react";

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApiKeyCreated: () => void;
}

export const CreateApiKeyModal = ({
  isOpen,
  onClose,
  onApiKeyCreated,
}: CreateApiKeyModalProps) => {
  const { t, isRTL } = useI18n();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
  const { authFetch } = useAuth();
  const [newApiKeyName, setNewApiKeyName] = useState("");

  const handleCreateApiKey = async () => {
    try {
      const response = await authFetch("/api/v1/api-keys/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: newApiKeyName }),
      });

      if (response.ok) {
        toast({
          title: t('createApiKeyModal.success'),
          description: t('createApiKeyModal.createdSuccess'),
        });
        playSuccessSound();
        onApiKeyCreated();
        onClose();
      } else {
        toast({
          title: t('createApiKeyModal.error'),
          description: t('createApiKeyModal.createdError'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create API key", error);
      toast({
        title: t('createApiKeyModal.error'),
        description: t('createApiKeyModal.unexpectedError'),
        variant: "destructive",
      });
    }
  };

  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    await handleCreateApiKey();
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl sm:max-w-md">
        <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
          <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/25">
              <Key className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              {t('createApiKeyModal.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400 mt-2">
            {t('createApiKeyModal.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium dark:text-gray-300">
              {t('createApiKeyModal.name')}
            </Label>
            <Input
              id="name"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              placeholder={t('createApiKeyModal.namePlaceholder')}
            />
          </div>
        </div>
        <DialogFooter className={`pt-4 border-t border-slate-200/80 dark:border-slate-700/60 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <Button variant="outline" onClick={onClose} className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !newApiKeyName.trim()}
            className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/25"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Key className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('createApiKeyModal.create')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

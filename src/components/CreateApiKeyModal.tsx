
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
import { useI18n } from '@/hooks/useI18n';

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700">
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t('createApiKeyModal.title')}</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {t('createApiKeyModal.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className={`${isRTL ? 'text-left' : 'text-right'} dark:text-gray-300`}>
              {t('createApiKeyModal.name')}
            </Label>
            <Input
              id="name"
              value={newApiKeyName}
              onChange={(e) => setNewApiKeyName(e.target.value)}
              className="col-span-3 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              placeholder={t('createApiKeyModal.namePlaceholder')}
            />
          </div>
        </div>
        <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
          <Button variant="outline" onClick={onClose} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
            {t('common.cancel')}
          </Button>
          <Button onClick={handleCreateApiKey} className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700">
            {t('createApiKeyModal.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

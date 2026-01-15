
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare, Plus } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';

interface CreateChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string, description: string) => void;
  isLoading: boolean;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { t, isRTL } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit(name.trim(), description.trim());
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-slate-800 dark:border-slate-700 rounded-2xl sm:rounded-2xl sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader className="pb-4 border-b border-slate-200/80 dark:border-slate-700/60">
          <DialogTitle className={`dark:text-white flex items-center gap-3 text-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/25">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t('teamChat.dialogs.createChannel.title')}
            </span>
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400 mt-2">
            {t('teamChat.dialogs.createChannel.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium dark:text-gray-300">
              {t('teamChat.dialogs.createChannel.nameLabel')}
            </label>
            <Input
              id="name"
              placeholder={t('teamChat.dialogs.createChannel.namePlaceholder')}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium dark:text-gray-300">
              {t('teamChat.dialogs.createChannel.descLabel')}
            </label>
            <Input
              id="description"
              placeholder={t('teamChat.dialogs.createChannel.descPlaceholder')}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl h-11 dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>
        </div>
        <DialogFooter className="pt-4 border-t border-slate-200/80 dark:border-slate-700/60">
          <Button variant="outline" onClick={onClose} className="rounded-xl dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
            className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl shadow-lg shadow-purple-500/25"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <MessageSquare className="h-4 w-4 mr-2" />
                {t('teamChat.dialogs.createChannel.button')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChannelModal;

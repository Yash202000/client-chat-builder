import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/hooks/useI18n';

const CreateWorkflowDialog = ({ isOpen, onClose, onSubmit }) => {
  const { t, isRTL } = useI18n();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit({ name, description });
      onClose();
      setName('');
      setDescription('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-slate-800 dark:border-slate-700 sm:max-w-md" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="dark:text-white">{t('workflows.createDialog.title')}</DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {t('workflows.createDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="workflow-name" className="dark:text-gray-300">{t('workflows.createDialog.nameLabel')}</Label>
            <Input
              id="workflow-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('workflows.createDialog.namePlaceholder')}
              required
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <div>
            <Label htmlFor="workflow-desc" className="dark:text-gray-300">{t('workflows.createDialog.descriptionLabel')}</Label>
            <Textarea
              id="workflow-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder={t('workflows.createDialog.descriptionPlaceholder')}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
            <Button type="button" variant="outline" onClick={onClose} className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700">
              {t('workflows.createDialog.cancelButton')}
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              {t('workflows.createDialog.createButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateWorkflowDialog;
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, RefreshCw } from 'lucide-react';
import { useI18n } from '@/hooks/useI18n';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export const WorkflowDetailsDialog = ({ isOpen, onClose, workflow, onSave }) => {
  const { t, isRTL } = useI18n();
  const { authFetch } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerPhrases, setTriggerPhrases] = useState([]);
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setTriggerPhrases(workflow.trigger_phrases || []);
    }
  }, [workflow]);

  const handleAddPhrase = (e) => {
    if (e.key === 'Enter' && currentPhrase.trim()) {
      e.preventDefault();
      if (!triggerPhrases.includes(currentPhrase.trim())) {
        setTriggerPhrases([...triggerPhrases, currentPhrase.trim()]);
      }
      setCurrentPhrase('');
    }
  };

  const handleRemovePhrase = (phraseToRemove) => {
    setTriggerPhrases(triggerPhrases.filter(phrase => phrase !== phraseToRemove));
  };

  const handleRegenerateDescription = async () => {
    console.log('Regenerate clicked, workflow:', workflow);
    if (!workflow?.id) {
      console.error('No workflow ID');
      return;
    }

    setIsRegenerating(true);
    try {
      const response = await authFetch(`/api/v1/workflows/${workflow.id}/regenerate-description`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to regenerate description');
      }

      const data = await response.json();
      setDescription(data.description);
      toast.success(t('workflows.detailsDialog.descriptionRegenerated') || 'Description regenerated from workflow steps');
    } catch (error) {
      console.error('Error regenerating description:', error);
      toast.error(error.message || t('workflows.detailsDialog.regenerateFailed') || 'Failed to regenerate description');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    onSave({ name, description, trigger_phrases: triggerPhrases });
    onClose();
  };

  if (!workflow) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>{t('workflows.detailsDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('workflows.detailsDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className={isRTL ? 'text-left' : 'text-right'}>
              {t('workflows.detailsDialog.nameLabel')}
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className={`pt-2 ${isRTL ? 'text-left' : 'text-right'}`}>
              {t('workflows.detailsDialog.descriptionLabel')}
            </Label>
            <div className="col-span-3 space-y-2">
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                dir={isRTL ? 'rtl' : 'ltr'}
                placeholder={t('workflows.detailsDialog.descriptionPlaceholder') || 'Describe what this workflow does...'}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRegenerateDescription}
                disabled={isRegenerating}
                className="h-8 text-xs"
                title={t('workflows.detailsDialog.regenerateDescription') || 'Auto-generate from workflow steps'}
              >
                <RefreshCw className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'} ${isRegenerating ? 'animate-spin' : ''}`} />
                {isRegenerating
                  ? (t('workflows.detailsDialog.regenerating') || 'Generating...')
                  : (t('workflows.detailsDialog.autoGenerate') || 'Auto-generate')}
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="trigger-phrases" className={`${isRTL ? 'text-left' : 'text-right'} pt-2`}>
              {t('workflows.detailsDialog.triggerPhrasesLabel')}
            </Label>
            <div className="col-span-3">
              <Input
                id="trigger-phrases"
                placeholder={t('workflows.detailsDialog.triggerPhrasesPlaceholder')}
                value={currentPhrase}
                onChange={(e) => setCurrentPhrase(e.target.value)}
                onKeyDown={handleAddPhrase}
                className="mb-2"
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <div className={`flex flex-wrap gap-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {triggerPhrases.map((phrase, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {phrase}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemovePhrase(phrase)}
                    />
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {t('workflows.detailsDialog.triggerPhrasesHint')}
              </p>
            </div>
          </div>
        </div>
        <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
          <Button variant="outline" onClick={onClose}>{t('workflows.detailsDialog.cancelButton')}</Button>
          <Button onClick={handleSave}>{t('workflows.detailsDialog.saveButton')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
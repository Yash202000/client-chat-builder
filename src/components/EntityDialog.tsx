import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useI18n } from '@/hooks/useI18n';

interface Entity {
  name: string;
  type: string;
  extraction_method: string;
  validation_regex?: string;
  required: boolean;
  prompt_if_missing?: string;
  description?: string;
  example_values?: string[];
}

interface EntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Entity | null;
  onSave: (entity: Entity) => void;
}

export const EntityDialog: React.FC<EntityDialogProps> = ({
  open,
  onOpenChange,
  entity,
  onSave,
}) => {
  const { t, isRTL } = useI18n();
  const [formData, setFormData] = useState<Entity>({
    name: '',
    type: 'text',
    extraction_method: 'llm',
    required: false,
    example_values: [],
  });
  const [exampleInput, setExampleInput] = useState('');

  useEffect(() => {
    if (entity) {
      setFormData(entity);
    } else {
      setFormData({
        name: '',
        type: 'text',
        extraction_method: 'llm',
        required: false,
        example_values: [],
      });
    }
  }, [entity, open]);

  const handleAddExample = () => {
    if (exampleInput.trim()) {
      setFormData({
        ...formData,
        example_values: [...(formData.example_values || []), exampleInput.trim()],
      });
      setExampleInput('');
    }
  };

  const handleRemoveExample = (index: number) => {
    setFormData({
      ...formData,
      example_values: (formData.example_values || []).filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }
    onSave(formData);
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir={isRTL ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle>
            {entity ? t('workflows.entityDialog.editTitle') : t('workflows.entityDialog.createTitle')}
          </DialogTitle>
          <DialogDescription>
            {t('workflows.entityDialog.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Entity Name */}
          <div className="space-y-2">
            <Label htmlFor="entity-name">
              {t('workflows.entityDialog.nameLabel')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="entity-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('workflows.entityDialog.namePlaceholder')}
              className="font-mono"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Entity Type */}
          <div className="space-y-2">
            <Label htmlFor="entity-type">{t('workflows.entityDialog.typeLabel')}</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="entity-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="string">{t('workflows.entityDialog.types.string')}</SelectItem>
                <SelectItem value="number">{t('workflows.entityDialog.types.number')}</SelectItem>
                <SelectItem value="email">{t('workflows.entityDialog.types.email')}</SelectItem>
                <SelectItem value="phone">{t('workflows.entityDialog.types.phone')}</SelectItem>
                <SelectItem value="date">{t('workflows.entityDialog.types.date')}</SelectItem>
                <SelectItem value="custom">{t('workflows.entityDialog.types.custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Extraction Method */}
          <div className="space-y-2">
            <Label htmlFor="extraction-method">{t('workflows.entityDialog.extractionMethodLabel')}</Label>
            <Select
              value={formData.extraction_method}
              onValueChange={(value) =>
                setFormData({ ...formData, extraction_method: value })
              }
            >
              <SelectTrigger id="extraction-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="llm">{t('workflows.entityDialog.extractionMethods.llm')}</SelectItem>
                <SelectItem value="regex">{t('workflows.entityDialog.extractionMethods.regex')}</SelectItem>
                <SelectItem value="keyword">{t('workflows.entityDialog.extractionMethods.keyword')}</SelectItem>
                <SelectItem value="pattern">{t('workflows.entityDialog.extractionMethods.pattern')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Validation Regex */}
          {formData.extraction_method === 'regex' && (
            <div className="space-y-2">
              <Label htmlFor="validation-regex">{t('workflows.entityDialog.validationRegexLabel')}</Label>
              <Input
                id="validation-regex"
                value={formData.validation_regex || ''}
                onChange={(e) =>
                  setFormData({ ...formData, validation_regex: e.target.value })
                }
                placeholder={t('workflows.entityDialog.validationRegexPlaceholder')}
                className="font-mono text-sm"
                dir="ltr"
              />
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('workflows.entityDialog.descriptionLabel')}</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('workflows.entityDialog.descriptionPlaceholder')}
              rows={2}
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Example Values */}
          <div className="space-y-2">
            <Label>{t('workflows.entityDialog.exampleValuesLabel')}</Label>
            <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
              {t('workflows.entityDialog.exampleValuesHint')}
            </p>
            <div className={`flex gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <Input
                value={exampleInput}
                onChange={(e) => setExampleInput(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), handleAddExample())
                }
                placeholder={t('workflows.entityDialog.exampleValuesPlaceholder')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
              <Button onClick={handleAddExample} type="button" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(formData.example_values?.length || 0) > 0 && (
              <div className={`flex flex-wrap gap-2 mt-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                {formData.example_values?.map((example, idx) => (
                  <Badge
                    key={idx}
                    variant="secondary"
                    className="pl-3 pr-1 py-1 gap-1"
                  >
                    {example}
                    <button
                      onClick={() => handleRemoveExample(idx)}
                      className="ml-1 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Required Toggle */}
          <div className={`flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div>
              <Label htmlFor="required" className="cursor-pointer">
                {t('workflows.entityDialog.requiredLabel')}
              </Label>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                {t('workflows.entityDialog.requiredDesc')}
              </p>
            </div>
            <Switch
              id="required"
              checked={formData.required}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, required: checked })
              }
            />
          </div>

          {/* Prompt if Missing */}
          {formData.required && (
            <div className="space-y-2">
              <Label htmlFor="prompt-text">{t('workflows.entityDialog.promptIfMissingLabel')}</Label>
              <Input
                id="prompt-text"
                value={formData.prompt_if_missing || ''}
                onChange={(e) =>
                  setFormData({ ...formData, prompt_if_missing: e.target.value })
                }
                placeholder={t('workflows.entityDialog.promptIfMissingPlaceholder')}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          )}
        </div>

        <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('workflows.entityDialog.cancelButton')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim()}
            className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
          >
            {t('workflows.entityDialog.saveButton')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

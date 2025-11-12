import React, { useState, useEffect } from 'react';
import { Settings, Plus, Edit2, Trash2, TestTube, Sparkles, X, Save, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { IntentDialog } from './IntentDialog';
import { EntityDialog } from './EntityDialog';
import { TestIntentDialog } from './TestIntentDialog';
import { useI18n } from '@/hooks/useI18n';

interface Intent {
  id: string;
  name: string;
  keywords: string[];
  training_phrases: string[];
  confidence_threshold: number;
}

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

interface IntentConfig {
  enabled: boolean;
  trigger_intents: Intent[];
  entities: Entity[];
  auto_trigger_enabled: boolean;
  min_confidence: number;
}

interface WorkflowSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId?: number;
}

export const WorkflowSettings: React.FC<WorkflowSettingsProps> = ({ open, onOpenChange, workflowId }) => {
  const { t, isRTL } = useI18n();
  const [config, setConfig] = useState<IntentConfig>({
    enabled: false,
    trigger_intents: [],
    entities: [],
    auto_trigger_enabled: false,
    min_confidence: 0.75,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showIntentDialog, setShowIntentDialog] = useState(false);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [showTestDialog, setShowTestDialog] = useState(false);
  const [editingIntent, setEditingIntent] = useState<Intent | null>(null);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const { authFetch } = useAuth();

  useEffect(() => {
    if (workflowId && open) {
      fetchIntentConfig();
    }
  }, [workflowId, open]);

  const fetchIntentConfig = async () => {
    if (!workflowId) return;

    setLoading(true);
    try {
      const response = await authFetch(`/api/v1/workflows/${workflowId}/intent-config`);
      if (!response.ok) throw new Error('Failed to fetch intent config');
      const data = await response.json();

      // Merge with default config to ensure all fields exist
      const intentConfig = data.intent_config || {};
      setConfig({
        enabled: intentConfig.enabled ?? false,
        trigger_intents: intentConfig.trigger_intents || [],
        entities: intentConfig.entities || [],
        auto_trigger_enabled: intentConfig.auto_trigger_enabled ?? false,
        min_confidence: intentConfig.min_confidence ?? 0.75,
      });
    } catch (error) {
      console.error('Error fetching intent config:', error);
      toast.error(t('workflows.settingsDialog.toasts.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const saveIntentConfig = async () => {
    if (!workflowId) {
      toast.error(t('workflows.settingsDialog.toasts.noWorkflow'));
      return;
    }

    setSaving(true);
    try {
      const response = await authFetch(`/api/v1/workflows/${workflowId}/intent-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent_config: config }),
      });
      if (!response.ok) throw new Error('Failed to save intent config');
      toast.success(t('workflows.settingsDialog.toasts.saveSuccess'));
    } catch (error) {
      console.error('Error saving intent config:', error);
      toast.error(t('workflows.settingsDialog.toasts.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddIntent = () => {
    setEditingIntent({
      id: `intent_${Date.now()}`,
      name: '',
      keywords: [],
      training_phrases: [],
      confidence_threshold: 0.7,
    });
    setShowIntentDialog(true);
  };

  const handleEditIntent = (intent: Intent) => {
    setEditingIntent(intent);
    setShowIntentDialog(true);
  };

  const handleDeleteIntent = (intentId: string) => {
    setConfig({
      ...config,
      trigger_intents: config.trigger_intents.filter(i => i.id !== intentId),
    });
    toast.success(t('workflows.settingsDialog.toasts.intentRemoved'));
  };

  const handleAddEntity = () => {
    setEditingEntity({
      name: '',
      type: 'text',
      extraction_method: 'llm',
      required: false,
    });
    setShowEntityDialog(true);
  };

  const handleEditEntity = (entity: Entity) => {
    setEditingEntity(entity);
    setShowEntityDialog(true);
  };

  const handleDeleteEntity = (entityName: string) => {
    setConfig({
      ...config,
      entities: config.entities.filter(e => e.name !== entityName),
    });
    toast.success(t('workflows.settingsDialog.toasts.entityRemoved'));
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0" dir={isRTL ? 'rtl' : 'ltr'}>
          {loading ? (
            <div className="p-6 h-full flex items-center justify-center bg-white dark:bg-slate-900">
              <div className="text-slate-600 dark:text-slate-400">{t('workflows.settingsDialog.loading')}</div>
            </div>
          ) : (
            <div className="h-full flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className={`flex items-center justify-between mb-4 `}>
          <div className={`flex items-center gap-3 `}>
            <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500">
              <Settings className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('workflows.settingsDialog.title')}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('workflows.settingsDialog.description')}
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Enable Intent Detection Toggle */}
        <div className={`flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 `}>
          <div className={`flex items-center gap-3 `}>
            <Sparkles className={cn(
              "h-5 w-5",
              config.enabled ? "text-violet-500" : "text-slate-400"
            )} />
            <div>
              <Label htmlFor="enable-intents" className="text-sm font-semibold cursor-pointer">
                {t('workflows.settingsDialog.enableIntentDetection')}
              </Label>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('workflows.settingsDialog.enableIntentDetectionDescription')}
              </p>
            </div>
          </div>
          <Switch
            id="enable-intents"
            checked={config.enabled}
            onCheckedChange={(checked) => setConfig({ ...config, enabled: checked })}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {config.enabled && (
          <>
            {/* Auto-Trigger Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('workflows.settingsDialog.autoTriggerSettings')}
              </h3>

              <div className={`flex items-center justify-between p-4 rounded-lg border border-slate-200 dark:border-slate-700 `}>
                <div>
                  <Label htmlFor="auto-trigger" className="text-sm font-medium cursor-pointer">
                    {t('workflows.settingsDialog.autoTriggerWorkflow')}
                  </Label>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {t('workflows.settingsDialog.autoTriggerWorkflowDescription')}
                  </p>
                </div>
                <Switch
                  id="auto-trigger"
                  checked={config.auto_trigger_enabled}
                  onCheckedChange={(checked) =>
                    setConfig({ ...config, auto_trigger_enabled: checked })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-confidence">
                  {t('workflows.settingsDialog.minimumConfidence', { percentage: Math.round(config.min_confidence * 100) })}
                </Label>
                <input
                  id="min-confidence"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.min_confidence}
                  onChange={(e) =>
                    setConfig({ ...config, min_confidence: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-violet-500"
                />
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {t('workflows.settingsDialog.confidenceThresholdDescription')}
                </p>
              </div>
            </div>

            {/* Trigger Intents */}
            <div className="space-y-4">
              <div className={`flex items-center justify-between `}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t('workflows.settingsDialog.triggerIntents')}
                </h3>
                <Button
                  onClick={handleAddIntent}
                  size="sm"
                  className="bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
                >
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('workflows.settingsDialog.addIntent')}
                </Button>
              </div>

              {config.trigger_intents.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  <AlertCircle className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {t('workflows.settingsDialog.noIntentsConfigured')}
                  </p>
                  <Button
                    onClick={handleAddIntent}
                    variant="outline"
                    size="sm"
                  >
                    <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                    {t('workflows.settingsDialog.addFirstIntent')}
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {config.trigger_intents.map((intent) => (
                    <div
                      key={intent.id}
                      className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors"
                    >
                      <div className={`flex items-start justify-between mb-3 `}>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                            {intent.name || t('workflows.settingsDialog.unnamedIntent')}
                          </h4>
                          <div className={`flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 `}>
                            <span>{t('workflows.settingsDialog.confidence')}: {Math.round(intent.confidence_threshold * 100)}%</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditIntent(intent)}
                            className="h-8 w-8"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteIntent(intent.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {intent.keywords.length > 0 && (
                        <div className="mb-2">
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                            {t('workflows.settingsDialog.keywords')}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {intent.keywords.map((kw, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {kw}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {intent.training_phrases.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-1 block">
                            {t('workflows.settingsDialog.trainingPhrases')}:
                          </span>
                          <div className="text-xs text-slate-600 dark:text-slate-400">
                            {intent.training_phrases.slice(0, 2).join(', ')}
                            {intent.training_phrases.length > 2 && ` ${t('workflows.settingsDialog.moreItems', { count: intent.training_phrases.length - 2 })}`}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Entities */}
            <div className="space-y-4">
              <div className={`flex items-center justify-between `}>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {t('workflows.settingsDialog.entities')}
                </h3>
                <Button
                  onClick={handleAddEntity}
                  size="sm"
                  variant="outline"
                >
                  <Plus className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t('workflows.settingsDialog.addEntity')}
                </Button>
              </div>

              {config.entities.length === 0 ? (
                <div className="p-6 text-center border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    {t('workflows.settingsDialog.noEntitiesConfigured')}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {config.entities.map((entity, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 `}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm text-slate-900 dark:text-white">
                          {entity.name}
                        </div>
                        <div className="text-xs text-slate-600 dark:text-slate-400">
                          {entity.type} • {entity.extraction_method}
                          {entity.required && ` • ${t('workflows.settingsDialog.required')}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditEntity(entity)}
                          className="h-8 w-8"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntity(entity.name)}
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Test Intent Detection */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button
                onClick={() => setShowTestDialog(true)}
                variant="outline"
                className="w-full"
                disabled={config.trigger_intents.length === 0}
              >
                <TestTube className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t('workflows.settingsDialog.testIntentDetection')}
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
        <div className={`flex gap-3 `}>
          <Button
            onClick={saveIntentConfig}
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600"
          >
            <Save className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {saving ? t('workflows.settingsDialog.saving') : t('workflows.settingsDialog.saveConfiguration')}
          </Button>
          <Button onClick={() => onOpenChange(false)} variant="outline">
            {t('workflows.settingsDialog.close')}
          </Button>
        </div>
      </div>

            </div>
          )}
        </DialogContent>
      </Dialog>

      <IntentDialog
        open={showIntentDialog}
        onOpenChange={setShowIntentDialog}
        intent={editingIntent}
        onSave={(intent) => {
          const existing = config.trigger_intents.find(i => i.id === intent.id);
          if (existing) {
            setConfig({
              ...config,
              trigger_intents: config.trigger_intents.map(i =>
                i.id === intent.id ? intent : i
              ),
            });
          } else {
            setConfig({
              ...config,
              trigger_intents: [...config.trigger_intents, intent],
            });
          }
          setShowIntentDialog(false);
          toast.success(t('workflows.settingsDialog.toasts.intentSaved'));
        }}
      />

      <EntityDialog
        open={showEntityDialog}
        onOpenChange={setShowEntityDialog}
        entity={editingEntity}
        onSave={(entity) => {
          const existing = config.entities.find(e => e.name === entity.name);
          if (existing) {
            setConfig({
              ...config,
              entities: config.entities.map(e =>
                e.name === entity.name ? entity : e
              ),
            });
          } else {
            setConfig({
              ...config,
              entities: [...config.entities, entity],
            });
          }
          setShowEntityDialog(false);
          toast.success(t('workflows.settingsDialog.toasts.entitySaved'));
        }}
      />

      <TestIntentDialog
        open={showTestDialog}
        onOpenChange={setShowTestDialog}
        workflowId={workflowId}
      />
    </>
  );
};

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { useI18n } from '@/hooks/useI18n';
import { Agent, ApiIntegration, ApiIntegrationUpdate } from "@/types";
import { Key, Webhook, Bot, Workflow, Clock, RefreshCw } from "lucide-react";

interface EditApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
  integration: ApiIntegration;
  agents: Agent[];
  workflows: any[];
}

export const EditApiIntegrationModal = ({
  isOpen,
  onClose,
  onUpdated,
  integration,
  agents,
  workflows,
}: EditApiIntegrationModalProps) => {
  const { t, isRTL } = useI18n();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<ApiIntegrationUpdate>({
    name: integration.name,
    description: integration.description || "",
    webhook_url: integration.webhook_url || "",
    webhook_secret: integration.webhook_secret || "",
    webhook_enabled: integration.webhook_enabled,
    sync_response: integration.sync_response,
    default_agent_id: integration.default_agent_id,
    default_workflow_id: integration.default_workflow_id,
    rate_limit_requests: integration.rate_limit_requests,
    rate_limit_window: integration.rate_limit_window,
    is_active: integration.is_active,
  });

  useEffect(() => {
    setFormData({
      name: integration.name,
      description: integration.description || "",
      webhook_url: integration.webhook_url || "",
      webhook_secret: integration.webhook_secret || "",
      webhook_enabled: integration.webhook_enabled,
      sync_response: integration.sync_response,
      default_agent_id: integration.default_agent_id,
      default_workflow_id: integration.default_workflow_id,
      rate_limit_requests: integration.rate_limit_requests,
      rate_limit_window: integration.rate_limit_window,
      is_active: integration.is_active,
    });
  }, [integration]);

  const handleChange = (field: keyof ApiIntegrationUpdate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim()) {
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.nameRequired', 'Please enter a name'),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(`/api/v1/api-integrations/${integration.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t('apiIntegrations.success', 'Success'),
          description: t('apiIntegrations.updatedSuccess', 'Integration updated successfully'),
        });
        playSuccessSound();
        onUpdated();
        onClose();
      } else {
        const error = await response.json();
        toast({
          title: t('apiIntegrations.error', 'Error'),
          description: error.detail || t('apiIntegrations.updatedError', 'Failed to update integration'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update integration", error);
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.unexpectedError', 'An unexpected error occurred'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSecret = async () => {
    try {
      const response = await authFetch(`/api/v1/api-integrations/${integration.id}/regenerate-secret`, {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
        // Extract the new secret from the message
        const match = data.message?.match(/New secret: (.+)/);
        if (match) {
          handleChange('webhook_secret', match[1]);
        }
        toast({
          title: t('apiIntegrations.success', 'Success'),
          description: t('apiIntegrations.secretRegenerated', 'Webhook secret regenerated'),
        });
        playSuccessSound();
      } else {
        toast({
          title: t('apiIntegrations.error', 'Error'),
          description: t('apiIntegrations.secretRegenerateError', 'Failed to regenerate secret'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to regenerate secret", error);
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.unexpectedError', 'An unexpected error occurred'),
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {t('apiIntegrations.editTitle', 'Edit API Integration')}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {t('apiIntegrations.editDescription', 'Update the configuration for this API integration')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* API Key Info (read-only) */}
          <div className="flex items-center gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
            <Key className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
            <span className="text-sm dark:text-gray-300">
              {t('apiIntegrations.linkedApiKey', 'Linked API Key')}: <strong>{integration.api_key_name || integration.api_key_prefix}</strong>
            </span>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div>
              <Label className="dark:text-white">{t('apiIntegrations.isActive', 'Active')}</Label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('apiIntegrations.isActiveDesc', 'Enable or disable this integration')}
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => handleChange('is_active', checked)}
            />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label className="dark:text-gray-300">{t('apiIntegrations.name', 'Name')} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="dark:text-gray-300">{t('apiIntegrations.description', 'Description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              rows={2}
            />
          </div>

          {/* Response Mode */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
              <div>
                <Label className="dark:text-white">{t('apiIntegrations.syncResponse', 'Synchronous Response')}</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {t('apiIntegrations.syncResponseDesc', 'Wait for response in the same HTTP request')}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.sync_response}
              onCheckedChange={(checked) => handleChange('sync_response', checked)}
            />
          </div>

          {/* Default Agent */}
          <div className="space-y-2">
            <Label className="dark:text-gray-300 flex items-center gap-2">
              <Bot className="h-4 w-4" />
              {t('apiIntegrations.defaultAgent', 'Default Agent')}
            </Label>
            <Select
              value={formData.default_agent_id?.toString() || "none"}
              onValueChange={(value) => handleChange('default_agent_id', value === "none" ? undefined : parseInt(value))}
            >
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="none" className="dark:text-white dark:focus:bg-slate-700">
                  {t('apiIntegrations.noDefault', 'No default')}
                </SelectItem>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id.toString()} className="dark:text-white dark:focus:bg-slate-700">
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Default Workflow */}
          <div className="space-y-2">
            <Label className="dark:text-gray-300 flex items-center gap-2">
              <Workflow className="h-4 w-4" />
              {t('apiIntegrations.defaultWorkflow', 'Default Workflow')}
            </Label>
            <Select
              value={formData.default_workflow_id?.toString() || "none"}
              onValueChange={(value) => handleChange('default_workflow_id', value === "none" ? undefined : parseInt(value))}
            >
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                <SelectItem value="none" className="dark:text-white dark:focus:bg-slate-700">
                  {t('apiIntegrations.noDefault', 'No default')}
                </SelectItem>
                {workflows.map((workflow) => (
                  <SelectItem key={workflow.id} value={workflow.id.toString()} className="dark:text-white dark:focus:bg-slate-700">
                    {workflow.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Webhook Configuration */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Webhook className="h-4 w-4 text-cyan-600 dark:text-cyan-400" />
                <Label className="dark:text-white font-medium">
                  {t('apiIntegrations.webhookConfig', 'Webhook Configuration')}
                </Label>
              </div>
              <Switch
                checked={formData.webhook_enabled}
                onCheckedChange={(checked) => handleChange('webhook_enabled', checked)}
              />
            </div>

            {formData.webhook_enabled && (
              <div className="space-y-3 pt-2">
                <div className="space-y-2">
                  <Label className="dark:text-gray-300">{t('apiIntegrations.webhookUrl', 'Webhook URL')}</Label>
                  <Input
                    value={formData.webhook_url}
                    onChange={(e) => handleChange('webhook_url', e.target.value)}
                    className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                    placeholder="https://your-server.com/webhook"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="dark:text-gray-300">{t('apiIntegrations.webhookSecret', 'Webhook Secret')}</Label>
                  <div className="flex gap-2">
                    <Input
                      value={formData.webhook_secret}
                      onChange={(e) => handleChange('webhook_secret', e.target.value)}
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white flex-1 font-mono text-sm"
                      readOnly
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleRegenerateSecret}
                      className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      {t('apiIntegrations.regenerate', 'Regenerate')}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t('apiIntegrations.webhookSecretHelp', 'Used to sign webhook payloads for verification')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Rate Limiting */}
          <div className="space-y-4 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <Label className="dark:text-white font-medium">
              {t('apiIntegrations.rateLimiting', 'Rate Limiting (Optional)')}
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="dark:text-gray-300 text-sm">{t('apiIntegrations.maxRequests', 'Max Requests')}</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_requests || ''}
                  onChange={(e) => handleChange('rate_limit_requests', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="100"
                />
              </div>
              <div className="space-y-2">
                <Label className="dark:text-gray-300 text-sm">{t('apiIntegrations.windowSeconds', 'Window (seconds)')}</Label>
                <Input
                  type="number"
                  value={formData.rate_limit_window || ''}
                  onChange={(e) => handleChange('rate_limit_window', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
                  placeholder="60"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className={isRTL ? 'flex-row-reverse' : ''}>
          <Button
            variant="outline"
            onClick={onClose}
            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {loading ? t('common.saving', 'Saving...') : t('common.saveChanges', 'Save Changes')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

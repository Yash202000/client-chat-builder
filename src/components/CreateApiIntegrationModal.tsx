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
import { Agent, ApiIntegrationCreate } from "@/types";
import { Key, Webhook, Bot, Workflow, Clock } from "lucide-react";

interface ApiKeyBasic {
  id: number;
  name: string;
  key: string;
  created_at: string;
}

interface CreateApiIntegrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
  apiKeys: ApiKeyBasic[];
  agents: Agent[];
  workflows: any[];
}

export const CreateApiIntegrationModal = ({
  isOpen,
  onClose,
  onCreated,
  apiKeys,
  agents,
  workflows,
}: CreateApiIntegrationModalProps) => {
  const { t, isRTL } = useI18n();
  const { toast } = useToast();
  const { playSuccessSound } = useNotifications();
  const { authFetch } = useAuth();

  const [loading, setLoading] = useState(false);
  const [selectedApiKeyId, setSelectedApiKeyId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ApiIntegrationCreate>({
    name: "",
    description: "",
    webhook_url: "",
    webhook_secret: "",
    webhook_enabled: false,
    sync_response: true,
    default_agent_id: undefined,
    default_workflow_id: undefined,
    rate_limit_requests: undefined,
    rate_limit_window: undefined,
  });

  const handleChange = (field: keyof ApiIntegrationCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!selectedApiKeyId) {
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.selectApiKey', 'Please select an API key'),
        variant: "destructive",
      });
      return;
    }

    if (!formData.name.trim()) {
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.nameRequired', 'Please enter a name'),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await authFetch(`/api/v1/api-integrations/?api_key_id=${selectedApiKeyId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: t('apiIntegrations.success', 'Success'),
          description: t('apiIntegrations.createdSuccess', 'Integration created successfully'),
        });
        playSuccessSound();
        onCreated();
        handleClose();
      } else {
        const error = await response.json();
        toast({
          title: t('apiIntegrations.error', 'Error'),
          description: error.detail || t('apiIntegrations.createdError', 'Failed to create integration'),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create integration", error);
      toast({
        title: t('apiIntegrations.error', 'Error'),
        description: t('apiIntegrations.unexpectedError', 'An unexpected error occurred'),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      webhook_url: "",
      webhook_secret: "",
      webhook_enabled: false,
      sync_response: true,
      default_agent_id: undefined,
      default_workflow_id: undefined,
      rate_limit_requests: undefined,
      rate_limit_window: undefined,
    });
    setSelectedApiKeyId(null);
    onClose();
  };

  const generateSecret = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let secret = '';
    for (let i = 0; i < 32; i++) {
      secret += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    handleChange('webhook_secret', secret);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent dir={isRTL ? 'rtl' : 'ltr'} className="dark:bg-slate-800 dark:border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="dark:text-white">
            {t('apiIntegrations.createTitle', 'Create API Integration')}
          </DialogTitle>
          <DialogDescription className="dark:text-gray-400">
            {t('apiIntegrations.createDescription', 'Configure a new API integration for third-party systems')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* API Key Selection */}
          <div className="space-y-2">
            <Label className="dark:text-gray-300 flex items-center gap-2">
              <Key className="h-4 w-4" />
              {t('apiIntegrations.apiKey', 'API Key')} *
            </Label>
            <Select
              value={selectedApiKeyId?.toString() || ""}
              onValueChange={(value) => setSelectedApiKeyId(parseInt(value))}
            >
              <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600 dark:text-white">
                <SelectValue placeholder={t('apiIntegrations.selectApiKey', 'Select an API key')} />
              </SelectTrigger>
              <SelectContent className="dark:bg-slate-800 dark:border-slate-700">
                {apiKeys.map((key) => (
                  <SelectItem key={key.id} value={key.id.toString()} className="dark:text-white dark:focus:bg-slate-700">
                    {key.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label className="dark:text-gray-300">{t('apiIntegrations.name', 'Name')} *</Label>
            <Input
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              placeholder={t('apiIntegrations.namePlaceholder', 'My Integration')}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="dark:text-gray-300">{t('apiIntegrations.description', 'Description')}</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="dark:bg-slate-900 dark:border-slate-600 dark:text-white"
              placeholder={t('apiIntegrations.descriptionPlaceholder', 'Describe what this integration is for...')}
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
                <SelectValue placeholder={t('apiIntegrations.selectAgent', 'Select an agent')} />
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
                <SelectValue placeholder={t('apiIntegrations.selectWorkflow', 'Select a workflow')} />
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
                      className="dark:bg-slate-900 dark:border-slate-600 dark:text-white flex-1"
                      placeholder={t('apiIntegrations.webhookSecretPlaceholder', 'Secret for HMAC signature')}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateSecret}
                      className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
                    >
                      {t('apiIntegrations.generate', 'Generate')}
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
            onClick={handleClose}
            className="dark:border-slate-600 dark:text-white dark:hover:bg-slate-700"
          >
            {t('common.cancel', 'Cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
          >
            {loading ? t('common.creating', 'Creating...') : t('apiIntegrations.create', 'Create Integration')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

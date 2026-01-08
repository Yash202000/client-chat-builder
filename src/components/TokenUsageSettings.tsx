import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Save, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface TokenTrackingSettings {
  token_tracking_mode: string;
  monthly_budget_cents: number | null;
  alert_threshold_percent: number;
  alert_email: string | null;
  alerts_enabled: boolean;
  per_agent_daily_limit_cents: number | null;
}

interface TokenUsageSettingsProps {
  onClose?: () => void;
}

export const TokenUsageSettings = ({ onClose }: TokenUsageSettingsProps) => {
  const { authFetch, companyId } = useAuth();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState<TokenTrackingSettings>({
    token_tracking_mode: "detailed",
    monthly_budget_cents: null,
    alert_threshold_percent: 80,
    alert_email: null,
    alerts_enabled: true,
    per_agent_daily_limit_cents: null,
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery<TokenTrackingSettings>({
    queryKey: ["tokenTrackingSettings", companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/token-usage/settings`, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch settings");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Update settings when data loads
  useEffect(() => {
    if (currentSettings) {
      setSettings(currentSettings);
    }
  }, [currentSettings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<TokenTrackingSettings>) => {
      const response = await authFetch(`/api/v1/token-usage/settings`, {
        method: "PUT",
        headers: {
          "X-Company-ID": companyId?.toString() || "",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tokenTrackingSettings"] });
      queryClient.invalidateQueries({ queryKey: ["tokenUsageStats"] });
      toast.success("Settings saved successfully");
      onClose?.();
    },
    onError: (error) => {
      toast.error("Failed to save settings");
      console.error(error);
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  // Convert cents to dollars for display
  const centsToUsd = (cents: number | null) => {
    if (cents === null) return "";
    return (cents / 100).toFixed(2);
  };

  // Convert dollars to cents for storage
  const usdToCents = (usd: string): number | null => {
    if (!usd || usd === "") return null;
    const value = parseFloat(usd);
    if (isNaN(value)) return null;
    return Math.round(value * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tracking Mode */}
      <div className="space-y-2">
        <Label htmlFor="tracking-mode" className="dark:text-white">Tracking Mode</Label>
        <Select
          value={settings.token_tracking_mode}
          onValueChange={(value) => setSettings({ ...settings, token_tracking_mode: value })}
        >
          <SelectTrigger id="tracking-mode" className="dark:bg-slate-900 dark:border-slate-600">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">
              <div className="flex flex-col">
                <span>Disabled</span>
                <span className="text-xs text-gray-500">No token tracking</span>
              </div>
            </SelectItem>
            <SelectItem value="aggregated">
              <div className="flex flex-col">
                <span>Aggregated</span>
                <span className="text-xs text-gray-500">Track totals only, no per-request details</span>
              </div>
            </SelectItem>
            <SelectItem value="detailed">
              <div className="flex flex-col">
                <span>Detailed</span>
                <span className="text-xs text-gray-500">Full per-request tracking with sessions</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Choose how granular you want token usage tracking to be
        </p>
      </div>

      {/* Monthly Budget */}
      <div className="space-y-2">
        <Label htmlFor="monthly-budget" className="dark:text-white">Monthly Budget (USD)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <Input
            id="monthly-budget"
            type="number"
            step="0.01"
            min="0"
            placeholder="No limit"
            className="pl-7 dark:bg-slate-900 dark:border-slate-600"
            value={centsToUsd(settings.monthly_budget_cents)}
            onChange={(e) => setSettings({
              ...settings,
              monthly_budget_cents: usdToCents(e.target.value)
            })}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Set a monthly spending limit. Leave empty for no limit.
        </p>
      </div>

      {/* Alert Threshold */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="dark:text-white">Alert Threshold</Label>
          <span className="text-sm font-medium dark:text-white">{settings.alert_threshold_percent}%</span>
        </div>
        <Slider
          value={[settings.alert_threshold_percent]}
          onValueChange={(value) => setSettings({ ...settings, alert_threshold_percent: value[0] })}
          max={100}
          min={10}
          step={5}
          className="w-full"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Receive alerts when spending reaches this percentage of your budget
        </p>
      </div>

      {/* Alerts Enabled */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label className="dark:text-white">Enable Alerts</Label>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Receive notifications when budget thresholds are reached
          </p>
        </div>
        <Switch
          checked={settings.alerts_enabled}
          onCheckedChange={(checked) => setSettings({ ...settings, alerts_enabled: checked })}
        />
      </div>

      {/* Alert Email */}
      {settings.alerts_enabled && (
        <div className="space-y-2">
          <Label htmlFor="alert-email" className="dark:text-white">Alert Email (Optional)</Label>
          <Input
            id="alert-email"
            type="email"
            placeholder="alerts@company.com"
            className="dark:bg-slate-900 dark:border-slate-600"
            value={settings.alert_email || ""}
            onChange={(e) => setSettings({
              ...settings,
              alert_email: e.target.value || null
            })}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Email address for budget alert notifications
          </p>
        </div>
      )}

      {/* Per-Agent Daily Limit */}
      <div className="space-y-2">
        <Label htmlFor="agent-limit" className="dark:text-white">Per-Agent Daily Limit (USD)</Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
          <Input
            id="agent-limit"
            type="number"
            step="0.01"
            min="0"
            placeholder="No limit"
            className="pl-7 dark:bg-slate-900 dark:border-slate-600"
            value={centsToUsd(settings.per_agent_daily_limit_cents)}
            onChange={(e) => setSettings({
              ...settings,
              per_agent_daily_limit_cents: usdToCents(e.target.value)
            })}
          />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Optional daily spending limit per agent
        </p>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-700 dark:text-blue-300">
          Cost estimates are based on public pricing and may not reflect your actual API costs if you have custom pricing arrangements.
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        )}
        <Button
          onClick={handleSave}
          disabled={saveSettingsMutation.isPending}
          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
        >
          {saveSettingsMutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

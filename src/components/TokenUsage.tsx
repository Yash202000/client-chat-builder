import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Coins,
  TrendingUp,
  Zap,
  Bot,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Activity,
  Settings,
  Bell
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { TokenUsageSettings } from "./TokenUsageSettings";

interface TokenUsageStats {
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  estimated_cost_usd: number;
  request_count: number;
  by_provider: Record<string, { tokens: number; cost_usd: number; requests: number }>;
  by_agent: Array<{ agent_id: number; agent_name: string; tokens: number; cost_usd: number; requests: number }>;
  by_model: Array<{ model_name: string; provider: string; tokens: number; cost_usd: number; requests: number }>;
  period: { start: string; end: string };
}

interface DailyUsage {
  date: string;
  tokens: number;
  cost_usd: number;
  requests: number;
}

interface UsageAlert {
  id: number;
  alert_type: string;
  threshold_value: number;
  current_value: number;
  message: string;
  acknowledged: boolean;
  created_at: string;
}

interface MonthlySpend {
  spend_cents: number;
  spend_usd: number;
  budget_cents: number | null;
  budget_usd: number | null;
  percent_used: number | null;
}

const PROVIDER_COLORS = {
  openai: "#10B981",
  groq: "#8B5CF6",
  gemini: "#F59E0B",
  anthropic: "#EF4444"
};

const PIE_COLORS = ["#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#3B82F6", "#EC4899"];

export const TokenUsage = () => {
  const { authFetch, companyId } = useAuth();
  const queryClient = useQueryClient();
  const [days, setDays] = useState("30");
  const [showSettings, setShowSettings] = useState(false);

  // Fetch usage stats
  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useQuery<TokenUsageStats>({
    queryKey: ["tokenUsageStats", companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/token-usage/stats`, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch token usage stats");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch daily usage
  const { data: dailyUsage, isLoading: isLoadingDaily, refetch: refetchDaily } = useQuery<DailyUsage[]>({
    queryKey: ["tokenUsageDaily", companyId, days],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/token-usage/daily?days=${days}`, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch daily usage");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch monthly spend
  const { data: monthlySpend, isLoading: isLoadingSpend } = useQuery<MonthlySpend>({
    queryKey: ["tokenUsageMonthlySpend", companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/token-usage/monthly-spend`, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch monthly spend");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Fetch alerts
  const { data: alerts, refetch: refetchAlerts } = useQuery<UsageAlert[]>({
    queryKey: ["tokenUsageAlerts", companyId],
    queryFn: async () => {
      const response = await authFetch(`/api/v1/token-usage/alerts`, {
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to fetch alerts");
      return response.json();
    },
    enabled: !!companyId,
  });

  // Acknowledge alert mutation
  const acknowledgeAlertMutation = useMutation({
    mutationFn: async (alertId: number) => {
      const response = await authFetch(`/api/v1/token-usage/alerts/${alertId}/acknowledge`, {
        method: "POST",
        headers: { "X-Company-ID": companyId?.toString() || "" },
      });
      if (!response.ok) throw new Error("Failed to acknowledge alert");
      return response.json();
    },
    onSuccess: () => {
      refetchAlerts();
    },
  });

  const handleRefresh = () => {
    refetchStats();
    refetchDaily();
    refetchAlerts();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Prepare provider data for pie chart
  const providerData = stats?.by_provider
    ? Object.entries(stats.by_provider).map(([provider, data]) => ({
        name: provider,
        value: data.tokens,
        cost: data.cost_usd,
        requests: data.requests
      }))
    : [];

  const chartConfig = {
    tokens: { label: "Tokens", color: "#10B981" },
    cost: { label: "Cost", color: "#8B5CF6" },
    requests: { label: "Requests", color: "#F59E0B" },
  };

  if (isLoadingStats || isLoadingDaily || isLoadingSpend) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-semibold dark:text-white flex items-center gap-2">
            <Coins className="h-5 w-5 text-orange-500" />
            Token Usage & Costs
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Monitor LLM token consumption and estimated costs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-32 dark:bg-slate-800 dark:border-slate-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="14">Last 14 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => setShowSettings(true)}>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-yellow-800 dark:text-yellow-400 flex items-center gap-2 text-base">
              <Bell className="h-5 w-5" />
              Budget Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-center justify-between p-2 bg-white dark:bg-slate-800 rounded border border-yellow-200 dark:border-yellow-800"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm dark:text-white">
                      {alert.message || `${alert.alert_type}: ${formatCurrency(alert.current_value / 100)} of ${formatCurrency(alert.threshold_value / 100)}`}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => acknowledgeAlertMutation.mutate(alert.id)}
                    disabled={acknowledgeAlertMutation.isPending}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-green-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Total Tokens</span>
            </div>
            <p className="text-2xl font-bold dark:text-white">{formatNumber(stats?.total_tokens || 0)}</p>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              <span className="text-green-600 dark:text-green-400">{formatNumber(stats?.prompt_tokens || 0)}</span> input /
              <span className="text-blue-600 dark:text-blue-400 ml-1">{formatNumber(stats?.completion_tokens || 0)}</span> output
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Estimated Cost</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(stats?.estimated_cost_usd || 0)}
            </p>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {stats?.request_count || 0} requests
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Monthly Spend</span>
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(monthlySpend?.spend_usd || 0)}
            </p>
            {monthlySpend?.budget_usd && (
              <div className="mt-1">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <span>Budget: {formatCurrency(monthlySpend.budget_usd)}</span>
                  <span>{monthlySpend.percent_used?.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${
                      (monthlySpend.percent_used || 0) > 90 ? 'bg-red-500' :
                      (monthlySpend.percent_used || 0) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(monthlySpend.percent_used || 0, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">Avg Cost/Request</span>
            </div>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats?.request_count ? formatCurrency((stats.estimated_cost_usd || 0) / stats.request_count) : "$0.00"}
            </p>
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Per API call
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Daily Usage Chart */}
        <Card className="lg:col-span-2 dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white text-base">Usage Over Time</CardTitle>
            <CardDescription className="dark:text-gray-400">Daily token consumption and costs</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyUsage && dailyUsage.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyUsage}>
                    <defs>
                      <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-700" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      className="text-xs"
                    />
                    <YAxis tickFormatter={(value) => formatNumber(value)} className="text-xs" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Area
                      type="monotone"
                      dataKey="tokens"
                      stroke="#10B981"
                      fillOpacity={1}
                      fill="url(#colorTokens)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                No usage data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Provider Distribution */}
        <Card className="dark:bg-slate-800 dark:border-slate-700">
          <CardHeader>
            <CardTitle className="dark:text-white text-base">By Provider</CardTitle>
            <CardDescription className="dark:text-gray-400">Token distribution</CardDescription>
          </CardHeader>
          <CardContent>
            {providerData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={providerData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {providerData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PROVIDER_COLORS[entry.name as keyof typeof PROVIDER_COLORS] || PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2">
                  {providerData.map((provider, index) => (
                    <div key={provider.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: PROVIDER_COLORS[provider.name as keyof typeof PROVIDER_COLORS] || PIE_COLORS[index % PIE_COLORS.length] }}
                        />
                        <span className="text-sm capitalize dark:text-white">{provider.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-semibold dark:text-white">{formatNumber(provider.value)}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                          ({formatCurrency(provider.cost)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-gray-500 dark:text-gray-400">
                No provider data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Usage Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Usage by Agent</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Token consumption and costs per agent
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.by_agent && stats.by_agent.length > 0 ? (
            <div className="space-y-3">
              {stats.by_agent.map((agent) => {
                const percentage = stats.total_tokens > 0
                  ? (agent.tokens / stats.total_tokens) * 100
                  : 0;
                return (
                  <div
                    key={agent.agent_id}
                    className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 flex items-center justify-center">
                        <Bot className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold dark:text-white">{agent.agent_name || `Agent #${agent.agent_id}`}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {agent.requests} requests
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="font-semibold dark:text-white">{formatNumber(agent.tokens)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">tokens</p>
                      </div>
                      <div className="text-right min-w-[80px]">
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(agent.cost_usd)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{percentage.toFixed(1)}% of total</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <Bot className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No agent usage data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Usage Table */}
      <Card className="dark:bg-slate-800 dark:border-slate-700">
        <CardHeader>
          <CardTitle className="dark:text-white">Usage by Model</CardTitle>
          <CardDescription className="dark:text-gray-400">
            Detailed breakdown by LLM model
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats?.by_model && stats.by_model.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700">
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Model</th>
                    <th className="text-left py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Provider</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Tokens</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Requests</th>
                    <th className="text-right py-2 px-3 text-sm font-medium text-gray-500 dark:text-gray-400">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.by_model.map((model, index) => (
                    <tr
                      key={`${model.provider}-${model.model_name}`}
                      className="border-b border-slate-100 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                    >
                      <td className="py-2 px-3">
                        <span className="font-medium dark:text-white">{model.model_name}</span>
                      </td>
                      <td className="py-2 px-3">
                        <Badge
                          variant="outline"
                          className="capitalize"
                          style={{
                            borderColor: PROVIDER_COLORS[model.provider as keyof typeof PROVIDER_COLORS] || '#6B7280',
                            color: PROVIDER_COLORS[model.provider as keyof typeof PROVIDER_COLORS] || '#6B7280'
                          }}
                        >
                          {model.provider}
                        </Badge>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-sm dark:text-white">
                        {formatNumber(model.tokens)}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-sm dark:text-white">
                        {model.requests}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(model.cost_usd)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Zap className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No model usage data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-lg dark:bg-slate-800">
          <DialogHeader>
            <DialogTitle className="dark:text-white flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Token Tracking Settings
            </DialogTitle>
            <DialogDescription>
              Configure tracking mode, budgets, and alerts
            </DialogDescription>
          </DialogHeader>
          <TokenUsageSettings onClose={() => setShowSettings(false)} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

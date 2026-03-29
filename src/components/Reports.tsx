import { useState } from "react";
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Clock,
  MessageSquare,
  Users,
  Star,
  Download,
  Filter,
  CheckCircle2,
  UserCheck,
  AlertCircle,
  FileBarChart,
  Activity,
  Shield,
  Zap,
  RefreshCw,
  Bell,
  Bot,
  Heart,
  LineChart as LineChartIcon,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { ReopenAnalytics } from "@/components/ReopenAnalytics";
import { SecurityLogs } from "@/components/SecurityLogs";
import { TokenUsage } from "@/components/TokenUsage";
import { useI18n } from "@/hooks/useI18n";

function DatePicker({ date, setDate, placeholder, isRTL }) {
  const handleDateSelect = (selectedDate) => {
    // Prevent date from being deselected (set to undefined)
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            `w-[200px] font-normal rounded-xl border-slate-200/80 dark:border-slate-600/80 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-white shadow-sm hover:shadow-md transition-all duration-200 flex items-center ${isRTL ? 'flex-row-reverse justify-end text-right' : 'justify-start text-left'}`,
            !date && "text-slate-500 dark:text-slate-400"
          )}
        >
          <div className={`p-1.5 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 ${isRTL ? 'ml-2.5' : 'mr-2.5'}`}>
            <CalendarIcon className="h-3 w-3 text-white" />
          </div>
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 rounded-xl border-slate-200/80 dark:border-slate-700/80 shadow-xl dark:bg-slate-800">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className="dark:bg-slate-800 rounded-xl"
        />
      </PopoverContent>
    </Popover>
  );
}

export const Reports = () => {
  const { authFetch, companyId } = useAuth();
  const { t, isRTL } = useI18n();
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });

  const buildUrl = (baseUrl) => {
    const params = new URLSearchParams();
    if (dateRange.from) params.append("start_date", format(dateRange.from, "yyyy-MM-dd"));
    if (dateRange.to) params.append("end_date", format(dateRange.to, "yyyy-MM-dd"));
    return `${baseUrl}?${params.toString()}`;
  }

  const { data: metricsData, isLoading: isLoadingMetrics, isError: isErrorMetrics } = useQuery({
    queryKey: ['overallMetrics', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/metrics`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch overall metrics");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: agentPerformanceData, isLoading: isLoadingAgentPerformance, isError: isErrorAgentPerformance } = useQuery({
    queryKey: ['agentPerformance', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/agent-performance`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch agent performance");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: customerSatisfactionData, isLoading: isLoadingCustomerSatisfaction, isError: isErrorCustomerSatisfaction } = useQuery({
    queryKey: ['customerSatisfaction', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/customer-satisfaction`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch customer satisfaction data");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: topIssuesData, isLoading: isLoadingTopIssues, isError: isErrorTopIssues } = useQuery({
    queryKey: ['topIssues', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/top-issues`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch top issues data");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: errorRatesData, isLoading: isLoadingErrorRates, isError: isErrorErrorRates } = useQuery({
    queryKey: ['errorRates', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/error-rates`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch error rates data");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: latencyData, isLoading: isLoadingLatency, isError: isErrorLatency } = useQuery({
    queryKey: ['latency', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/latency`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch latency data");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: alertsData, isLoading: isLoadingAlerts, isError: isErrorAlerts } = useQuery({
    queryKey: ['alerts', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/alerts`, {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch alerts data");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: conversationStatusData, isLoading: isLoadingConversationStatus, isError: isErrorConversationStatus } = useQuery({
    queryKey: ['conversationStatus', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/conversation-status`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch conversation status");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: conversationTrendsData, isLoading: isLoadingConversationTrends, isError: isErrorConversationTrends } = useQuery({
    queryKey: ['conversationTrends', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/conversation-trends`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch conversation trends");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const { data: channelDistributionData, isLoading: isLoadingChannelDistribution, isError: isErrorChannelDistribution } = useQuery({
    queryKey: ['channelDistribution', companyId, dateRange],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(buildUrl(`/api/v1/reports/channel-distribution`), {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch channel distribution");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const [summaryDays, setSummaryDays] = useState(30);

  const { data: summaryData } = useQuery({
    queryKey: ['reportsSummary', companyId, summaryDays],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/summary?days=${summaryDays}`);
      if (!response.ok) throw new Error("Failed to fetch summary");
      return response.json();
    },
    enabled: !!companyId,
  });

  const CHART_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#3b82f6', '#ec4899', '#14b8a6', '#f97316'];
  const STATUS_COLORS: Record<string, string> = {
    active: '#22c55e', inactive: '#94a3b8', assigned: '#6366f1',
    pending: '#f59e0b', resolved: '#3b82f6', archived: '#64748b',
  };

  const metrics = [
    {
      title: t("reports.metrics.totalSessions"),
      value: metricsData?.total_sessions ?? "N/A",
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: t("reports.metrics.activeConversations"),
      value: metricsData?.active_conversations ?? "N/A",
      icon: MessageSquare,
      color: "text-green-600"
    },
    {
      title: t("reports.metrics.resolutionRate"),
      value: metricsData?.resolution_rate ?? "N/A",
      icon: CheckCircle2,
      color: "text-emerald-600"
    },
    {
      title: t("reports.metrics.agentAvailability"),
      value: metricsData?.agent_availability_rate ?? "N/A",
      icon: UserCheck,
      color: "text-purple-600"
    },
    {
      title: t("reports.metrics.unattendedConversations"),
      value: metricsData?.unattended_conversations ?? "N/A",
      icon: AlertCircle,
      color: "text-orange-600"
    },
    {
      title: t("reports.metrics.avgResponseTime"),
      value: latencyData?.avg_response_time ?? "N/A",
      icon: Clock,
      color: "text-sky-600"
    },
    {
      title: t("reports.metrics.customerSatisfaction"),
      value: metricsData?.customer_satisfaction ?? "N/A",
      icon: Star,
      color: "text-yellow-600"
    },
    {
      title: t("reports.metrics.activeAgents"),
      value: metricsData?.active_agents ?? "N/A",
      icon: Users,
      color: "text-indigo-600"
    },
    {
      title: t("reports.metrics.overallErrorRate"),
      value: errorRatesData?.overall_error_rate ?? "N/A",
      icon: TrendingUp,
      color: "text-red-600"
    }
  ];

  const agentPerformance = agentPerformanceData || [];
  const customerSatisfaction = customerSatisfactionData || [];
  const topIssues = topIssuesData || [];
  const alerts = alertsData || [];
  const conversationStatus = conversationStatusData || [];
  const conversationTrends = conversationTrendsData || [];
  const channelDistribution = channelDistributionData || [];

  // Helper function to get status color
  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-500 dark:bg-green-600',
      'inactive': 'bg-gray-500 dark:bg-gray-600',
      'assigned': 'bg-blue-500 dark:bg-blue-600',
      'pending': 'bg-yellow-500 dark:bg-yellow-600',
      'resolved': 'bg-purple-500 dark:bg-purple-600',
      'archived': 'bg-slate-500 dark:bg-slate-600',
    };
    return colors[status] || 'bg-orange-500 dark:bg-orange-600';
  };

  // Helper function to get channel icon
  const getChannelEmoji = (channel) => {
    const emojis = {
      'web': '💻',
      'whatsapp': '📱',
      'messenger': '💙',
      'instagram': '📷',
      'telegram': '✈️',
      'gmail': '📧',
      'twilio_voice': '📞',
      'freeswitch': '☎️',
      'api': '🔌',
    };
    return emojis[channel] || '💬';
  };

  const { data: optimizationSuggestionsData, isLoading: isLoadingOptimizationSuggestions, isError: isErrorOptimizationSuggestions } = useQuery({
    queryKey: ['optimizationSuggestions', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/optimization/suggestions`, {
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch optimization suggestions");
      }
      return response.json();
    },
    enabled: !!companyId,
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      if (!companyId) throw new Error("Company ID not available");
      const response = await authFetch(`/api/v1/optimization/generate-suggestions`, {
        method: "POST",
        headers: {
          "X-Company-ID": companyId.toString(),
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to generate suggestions");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['optimizationSuggestions'] });
      toast({ title: "Optimization suggestions generated!" });
    },
    onError: (error) => {
      toast({ title: "Failed to generate suggestions", description: error.message, variant: "destructive" });
    },
  });

  const optimizationSuggestions = optimizationSuggestionsData || [];

  if (isLoadingMetrics || isLoadingAgentPerformance || isLoadingCustomerSatisfaction || isLoadingTopIssues || isLoadingErrorRates || isLoadingLatency || isLoadingAlerts || isLoadingOptimizationSuggestions || isLoadingConversationStatus || isLoadingConversationTrends || isLoadingChannelDistribution) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="p-6 rounded-xl bg-muted inline-block mb-4">
            <RefreshCw className="h-12 w-12 text-muted-foreground animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t("reports.loading")}</p>
        </div>
      </div>
    );
  }

  if (isErrorMetrics || isErrorAgentPerformance || isErrorCustomerSatisfaction || isErrorTopIssues || isErrorErrorRates || isErrorLatency || isErrorAlerts || isErrorOptimizationSuggestions || isErrorConversationStatus || isErrorConversationTrends || isErrorChannelDistribution) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="p-6 rounded-xl bg-muted inline-block mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">{t("reports.error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-0 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Compact header */}
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker date={dateRange.from} setDate={(date) => setDateRange({ ...dateRange, from: date })} placeholder={t("reports.startDate")} isRTL={isRTL} />
          <DatePicker date={dateRange.to} setDate={(date) => setDateRange({ ...dateRange, to: date })} placeholder={t("reports.endDate")} isRTL={isRTL} />
        </div>
        <Button size="sm" className="h-8 px-3 text-xs">
          <Download className="h-3.5 w-3.5 mr-1.5" />{t("reports.export")}
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {metrics.map((metric, i) => {
          const IconComponent = metric.icon;
          return (
            <motion.div
              key={metric.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="rounded-xl border border-border bg-card p-3.5"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-muted`}>
                  <IconComponent className={`h-3.5 w-3.5 ${metric.color}`} />
                </div>
                <span className="text-xs font-medium text-muted-foreground truncate">{metric.title}</span>
              </div>
              <p className="text-xl font-bold text-foreground">{metric.value}</p>
            </motion.div>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-muted p-0.5 rounded-xl border border-border h-auto flex flex-wrap gap-0.5 mb-6">
          <TabsTrigger value="overview" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.agents")}</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.customers")}</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <LineChartIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.trends")}</span>
          </TabsTrigger>
          <TabsTrigger value="token-usage" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Token Usage</span>
          </TabsTrigger>
          <TabsTrigger value="reopens" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.reopens")}</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.alerts")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="optimization" className="rounded-lg text-xs px-3 py-1.5 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground font-medium transition-all flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.optimization")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Summary Charts */}
          {summaryData && (
            <div className="space-y-6">
              {/* Day range selector */}
              <div className="flex items-center gap-2">
                {[7, 30, 90].map(d => (
                  <button
                    key={d}
                    onClick={() => setSummaryDays(d)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      summaryDays === d
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    Last {d}d
                  </button>
                ))}
                <span className="text-xs text-muted-foreground ml-2">
                  {summaryData.total_sessions} total · {summaryData.resolution_rate}% resolved
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Volume — Line Chart */}
                <div className="lg:col-span-2 rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                    <LineChartIcon className="h-4 w-4 text-orange-500" />
                    Daily Volume
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={summaryData.daily_volume}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v?.slice(5)} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} dot={false} name="Sessions" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Status Breakdown — Pie Chart */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Status Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={summaryData.sessions_by_status} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={70} label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {summaryData.sessions_by_status.map((entry, i) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sessions per Channel — Bar Chart */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Sessions by Channel</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={summaryData.sessions_per_channel} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis type="category" dataKey="channel" tick={{ fontSize: 11 }} width={80} />
                      <Tooltip />
                      <Bar dataKey="count" name="Sessions" radius={[0, 4, 4, 0]}>
                        {summaryData.sessions_per_channel.map((entry, i) => (
                          <Cell key={entry.channel} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Agent Leaderboard */}
                <div className="rounded-xl border border-border bg-card p-4">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Agent Leaderboard</h3>
                  {summaryData.sessions_per_agent.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">No assigned sessions yet</p>
                  ) : (
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {summaryData.sessions_per_agent.map((row, i) => (
                        <div key={row.agent} className="flex items-center gap-3">
                          <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-foreground truncate">{row.agent}</span>
                              <span className="text-xs font-bold text-orange-500">{row.count}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                                style={{ width: `${(row.count / summaryData.sessions_per_agent[0].count) * 100}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Status Distribution */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-lg bg-muted">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("reports.overview.conversationStatus")}</h3>
                  <p className="text-xs text-muted-foreground">{t("reports.overview.conversationStatusDesc")}</p>
                </div>
              </div>
              <div className="space-y-4">
                {conversationStatus.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-xl bg-muted inline-block mb-3">
                      <Activity className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{t("reports.noDataAvailable")}</p>
                  </div>
                ) : (
                  conversationStatus.map((item) => (
                    <div key={item.status} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`w-24 text-sm text-foreground font-medium capitalize text-left`}>{item.status}</span>
                      <div className={`flex-1 bg-muted rounded-full h-3.5 ${isRTL ? 'rotate-180' : ''}`}>
                        <div
                          className={`h-3.5 rounded-full ${getStatusColor(item.status)} transition-all shadow-sm`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold text-foreground w-20 ${isRTL ? 'text-left' : 'text-right'}`}>{item.count} ({item.percentage}%)</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-lg bg-muted">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("reports.overview.channelDistribution")}</h3>
                  <p className="text-xs text-muted-foreground">{t("reports.overview.channelDistributionDesc")}</p>
                </div>
              </div>
              <div className="space-y-4">
                {channelDistribution.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-xl bg-muted inline-block mb-3">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{t("reports.noDataAvailable")}</p>
                  </div>
                ) : (
                  channelDistribution.map((item) => (
                    <div key={item.channel} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`w-24 text-sm text-foreground font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span>{getChannelEmoji(item.channel)}</span>
                        <span className="capitalize">{item.channel}</span>
                      </span>
                      <div className={`flex-1 bg-muted rounded-full h-3.5 ${isRTL ? 'rotate-180' : ''}`}>
                        <div
                          className="h-3.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all shadow-sm"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className={`text-sm font-semibold text-foreground w-20 ${isRTL ? 'text-left' : 'text-right'}`}>{item.count} ({item.percentage}%)</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Conversation Trends */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-muted">
                <BarChart3 className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("reports.overview.conversationTrends")}</h3>
                <p className="text-xs text-muted-foreground">{t("reports.overview.conversationTrendsDesc")}</p>
              </div>
            </div>
            {conversationTrends.length === 0 ? (
              <div className="h-64 flex items-center justify-center bg-muted/50 rounded-xl border border-border">
                <div className="text-center">
                  <div className="p-4 rounded-xl bg-muted inline-block mb-4">
                    <BarChart3 className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t("reports.overview.noConversationData")}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {conversationTrends.map((item, index) => {
                  const maxCount = Math.max(...conversationTrends.map(t => t.count));
                  const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                  return (
                    <div key={index} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`w-24 text-xs text-foreground font-medium text-left`}>{new Date(item.date).toLocaleDateString()}</span>
                      <div className={`flex-1 bg-muted rounded-full h-7 relative ${isRTL ? 'rotate-180' : ''}`}>
                        <div
                          className={`h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all flex items-center pr-3 shadow-sm ${isRTL ? 'justify-start pl-3' : 'justify-end'}`}
                          style={{ width: `${barWidth}%` }}
                        >
                          {barWidth > 15 && <span className={`text-xs text-white font-bold ${isRTL ? 'rotate-180' : ''}`}>{item.count}</span>}
                        </div>
                        {barWidth <= 15 && (
                          <span className={`absolute top-1/2 -translate-y-1/2 text-xs text-foreground font-bold ${isRTL ? 'left-3 rotate-180' : 'right-3'}`}>{item.count}</span>
                        )}
                      </div>
                    </div>
                  );
                  })}
                </div>
              )}
            </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-muted">
                <Bot className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("reports.agents.agentPerformance")}</h3>
                <p className="text-xs text-muted-foreground">{t("reports.agents.agentPerformanceDesc")}</p>
              </div>
            </div>
            <div className="space-y-4">
              {agentPerformance.length === 0 ? (
                <div className="text-center py-16">
                  <div className="p-5 rounded-xl bg-muted inline-block mb-4">
                    <Users className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">{t("reports.agents.noPerformanceData")}</p>
                </div>
              ) : (
                agentPerformance.map((agent) => (
                  <div key={agent.agent_id} className={`flex items-center justify-between p-4 border border-border rounded-xl bg-muted/50 hover:bg-muted transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {agent.agent_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div className={isRTL ? 'text-right' : 'text-left'}>
                        <h4 className="font-semibold text-foreground">{agent.agent_name}</h4>
                        <p className="text-xs text-muted-foreground">{agent.conversations} {t("reports.agents.conversationsThisWeek")}</p>
                    </div>

                    <div className={`flex items-center gap-6 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="text-center">
                        <p className="font-bold text-foreground">{agent.avg_response || "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{t("reports.agents.avgResponse")}</p>
                      </div>
                      <div className="text-center">
                        <div className={`flex items-center gap-1.5 justify-center`}>
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-foreground">{agent.satisfaction || "N/A"}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{t("reports.agents.rating")}</p>
                      </div>
                      <span className="px-3 py-1 rounded-lg bg-green-500/10 text-green-600 text-xs font-semibold border border-green-500/20">{t("reports.agents.active")}</span>
                    </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Satisfaction */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-lg bg-muted">
                  <Star className="h-4 w-4 text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("reports.customers.customerSatisfaction")}</h3>
                  <p className="text-xs text-muted-foreground">{t("reports.customers.satisfactionDesc")}</p>
                </div>
              </div>
              <div className="space-y-4">
                {customerSatisfaction.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-xl bg-muted inline-block mb-3">
                      <Star className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{t("reports.noDataAvailable")}</p>
                  </div>
                ) : (
                  customerSatisfaction.map((item) => (
                    <div key={item.rating} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="w-5 text-foreground font-bold text-sm">{item.rating}</span>
                      </div>
                      <div className={`flex-1 bg-muted rounded-full h-3.5 ${isRTL ? 'rotate-180' : ''}`}>
                        <div
                          className="h-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all shadow-sm"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className={`text-sm font-bold text-foreground w-14 ${isRTL ? 'text-left' : 'text-right'}`}>
                        {item.percentage}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Issues */}
            <div className="rounded-xl border border-border bg-card p-4">
              <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2 rounded-lg bg-muted">
                  <AlertCircle className="h-4 w-4 text-rose-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{t("reports.customers.topIssues")}</h3>
                  <p className="text-xs text-muted-foreground">{t("reports.customers.topIssuesDesc")}</p>
                </div>
              </div>
              <div className="space-y-3">
                {topIssues.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-xl bg-muted inline-block mb-3">
                      <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground">{t("reports.noDataAvailable")}</p>
                  </div>
                ) : (
                  topIssues.map((item) => (
                    <div key={item.issue} className={`flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border hover:bg-muted transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <span className={`text-sm font-medium text-foreground ${isRTL ? 'text-right' : 'text-left'}`}>{item.issue}</span>
                      <span className="px-2.5 py-0.5 rounded-md bg-muted text-foreground text-xs font-bold border border-border">{item.count}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-muted">
                <LineChartIcon className="h-4 w-4 text-teal-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("reports.trends.conversationTrends")}</h3>
                <p className="text-xs text-muted-foreground">{t("reports.trends.conversationTrendsDesc")}</p>
              </div>
            </div>
            <div className="h-96 flex items-center justify-center bg-muted/50 rounded-xl border border-border">
              <div className="text-center">
                <div className="p-5 rounded-xl bg-muted inline-block mb-4">
                  <BarChart3 className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t("reports.trends.advancedCharts")}</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="token-usage" className="space-y-6">
          <TokenUsage />
        </TabsContent>

        <TabsContent value="reopens" className="space-y-6">
          <ReopenAnalytics />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityLogs />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-muted">
                <Bell className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("reports.alerts.alerts")}</h3>
                <p className="text-xs text-muted-foreground">{t("reports.alerts.alertsDesc")}</p>
              </div>
            </div>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div key={alert.id} className={`p-4 rounded-lg border-l-4 text-left transition-colors ${
                    alert.type === "critical"
                      ? "bg-red-500/5 border-red-500"
                      : "bg-yellow-500/5 border-yellow-500"
                  }`}>
                    <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`p-1.5 rounded-lg ${
                        alert.type === "critical"
                          ? "bg-red-500/10"
                          : "bg-yellow-500/10"
                      }`}>
                        <AlertCircle className={`h-4 w-4 ${
                          alert.type === "critical"
                            ? "text-red-500"
                            : "text-yellow-500"
                        }`} />
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm font-semibold mb-1 ${
                          alert.type === "critical"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}>{alert.message}</p>
                        <p className="text-xs text-muted-foreground">{new Date(alert.timestamp).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-5 rounded-xl bg-muted inline-block mb-4">
                  <CheckCircle2 className="h-12 w-12 text-green-500" />
                </div>
                <p className="text-muted-foreground font-medium">{t("reports.alerts.noActiveAlerts")}</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-4">
            <div className={`flex items-center gap-3 mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 rounded-lg bg-muted">
                <Zap className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t("reports.optimization.optimizationSuggestions")}</h3>
                <p className="text-xs text-muted-foreground">{t("reports.optimization.optimizationDesc")}</p>
              </div>
            </div>
            {optimizationSuggestions.length > 0 ? (
              <div className="space-y-3">
                {optimizationSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className={`p-4 border border-border rounded-lg bg-muted/50 text-left hover:bg-muted transition-colors`}>
                    <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className="p-1.5 rounded-lg bg-muted flex-shrink-0">
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-2 text-sm">{suggestion.description}</p>
                        <div className="space-y-1.5">
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground border border-border">{t("reports.optimization.type")}</span>
                            <span className="text-xs text-muted-foreground">{suggestion.suggestion_type}</span>
                          </div>
                          {suggestion.agent_id && (
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground border border-border">{t("reports.optimization.agentId")}</span>
                              <span className="text-xs text-muted-foreground">{suggestion.agent_id}</span>
                            </div>
                          )}
                          {suggestion.details && (
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground border border-border">{t("reports.optimization.details")}</span>
                              <span className="text-xs text-muted-foreground">{JSON.stringify(suggestion.details)}</span>
                            </div>
                          )}
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <span className="px-2 py-0.5 rounded-md bg-muted text-xs font-semibold text-muted-foreground border border-border">{t("reports.optimization.generated")}</span>
                            <span className="text-xs text-muted-foreground">{new Date(suggestion.created_at).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-5 rounded-xl bg-muted inline-block mb-4">
                  <Zap className="h-12 w-12 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground mb-6 font-medium">{t("reports.optimization.noSuggestions")}</p>
              </div>
            )}
            <Button
              onClick={() => generateSuggestionsMutation.mutate()}
              size="sm"
              className="mt-4 h-8 px-3 text-xs"
              disabled={generateSuggestionsMutation.isPending}
            >
              {generateSuggestionsMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  {t("reports.optimization.generating")}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5" />
                  {t("reports.optimization.generateNew")}
                </span>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
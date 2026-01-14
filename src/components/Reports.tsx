import { useState } from "react";
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
  LineChart,
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
          <div className="p-6 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 inline-block mb-4">
            <RefreshCw className="h-12 w-12 text-orange-500 dark:text-orange-400 animate-spin" />
          </div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">{t("reports.loading")}</p>
        </div>
      </div>
    );
  }

  if (isErrorMetrics || isErrorAgentPerformance || isErrorCustomerSatisfaction || isErrorTopIssues || isErrorErrorRates || isErrorLatency || isErrorAlerts || isErrorOptimizationSuggestions || isErrorConversationStatus || isErrorConversationTrends || isErrorChannelDistribution) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-red-100 to-rose-100 dark:from-red-900/30 dark:to-rose-900/30 inline-block mb-4">
            <AlertCircle className="h-12 w-12 text-red-500 dark:text-red-400" />
          </div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">{t("reports.error")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6`}>
        <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 shadow-xl shadow-orange-500/25">
            <FileBarChart className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t("reports.title")}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">{t("reports.subtitle")}</p>
          </div>
        </div>
        <div className={`flex flex-wrap items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <DatePicker
            date={dateRange.from}
            setDate={(date) => setDateRange({ ...dateRange, from: date })}
            placeholder={t("reports.startDate")}
            isRTL={isRTL}
          />
          <DatePicker
            date={dateRange.to}
            setDate={(date) => setDateRange({ ...dateRange, to: date })}
            placeholder={t("reports.endDate")}
            isRTL={isRTL}
          />
          <Button className={`rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:scale-[1.02] transition-all duration-200 flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Download className="h-4 w-4" />
            {t("reports.export")}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          const colorMap = {
            'text-blue-600': { bg: 'from-white to-blue-50 dark:from-slate-800 dark:to-blue-950/30', border: 'border-blue-200/80 dark:border-blue-800/60', shadow: 'shadow-blue-500/10 hover:shadow-blue-500/20', icon: 'from-blue-500 to-blue-600' },
            'text-green-600': { bg: 'from-white to-green-50 dark:from-slate-800 dark:to-green-950/30', border: 'border-green-200/80 dark:border-green-800/60', shadow: 'shadow-green-500/10 hover:shadow-green-500/20', icon: 'from-green-500 to-green-600' },
            'text-emerald-600': { bg: 'from-white to-emerald-50 dark:from-slate-800 dark:to-emerald-950/30', border: 'border-emerald-200/80 dark:border-emerald-800/60', shadow: 'shadow-emerald-500/10 hover:shadow-emerald-500/20', icon: 'from-emerald-500 to-emerald-600' },
            'text-purple-600': { bg: 'from-white to-purple-50 dark:from-slate-800 dark:to-purple-950/30', border: 'border-purple-200/80 dark:border-purple-800/60', shadow: 'shadow-purple-500/10 hover:shadow-purple-500/20', icon: 'from-purple-500 to-purple-600' },
            'text-orange-600': { bg: 'from-white to-orange-50 dark:from-slate-800 dark:to-orange-950/30', border: 'border-orange-200/80 dark:border-orange-800/60', shadow: 'shadow-orange-500/10 hover:shadow-orange-500/20', icon: 'from-orange-500 to-orange-600' },
            'text-sky-600': { bg: 'from-white to-sky-50 dark:from-slate-800 dark:to-sky-950/30', border: 'border-sky-200/80 dark:border-sky-800/60', shadow: 'shadow-sky-500/10 hover:shadow-sky-500/20', icon: 'from-sky-500 to-sky-600' },
            'text-yellow-600': { bg: 'from-white to-yellow-50 dark:from-slate-800 dark:to-yellow-950/30', border: 'border-yellow-200/80 dark:border-yellow-800/60', shadow: 'shadow-yellow-500/10 hover:shadow-yellow-500/20', icon: 'from-yellow-500 to-yellow-600' },
            'text-indigo-600': { bg: 'from-white to-indigo-50 dark:from-slate-800 dark:to-indigo-950/30', border: 'border-indigo-200/80 dark:border-indigo-800/60', shadow: 'shadow-indigo-500/10 hover:shadow-indigo-500/20', icon: 'from-indigo-500 to-indigo-600' },
            'text-red-600': { bg: 'from-white to-red-50 dark:from-slate-800 dark:to-red-950/30', border: 'border-red-200/80 dark:border-red-800/60', shadow: 'shadow-red-500/10 hover:shadow-red-500/20', icon: 'from-red-500 to-red-600' },
          };
          const colors = colorMap[metric.color] || { bg: 'from-white to-slate-50 dark:from-slate-800 dark:to-slate-900', border: 'border-slate-200/80 dark:border-slate-700/60', shadow: 'shadow-slate-500/10', icon: 'from-slate-500 to-slate-600' };

          return (
            <div
              key={metric.title}
              className={`p-4 rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} shadow-lg ${colors.shadow} hover:shadow-xl hover:scale-[1.02] transition-all duration-200`}
            >
              <div className={`flex items-center gap-2.5 mb-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className={`p-2 rounded-xl bg-gradient-to-br ${colors.icon} shadow-md`}>
                  <IconComponent className="h-4 w-4 text-white" />
                </div>
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 truncate">{metric.title}</p>
              </div>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">{metric.value}</p>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-1.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm grid grid-cols-5 lg:grid-cols-9 gap-1">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.overview")}</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <Bot className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.agents")}</span>
          </TabsTrigger>
          <TabsTrigger value="customers" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.customers")}</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <LineChart className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.trends")}</span>
          </TabsTrigger>
          <TabsTrigger value="token-usage" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <Coins className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Token Usage</span>
          </TabsTrigger>
          <TabsTrigger value="reopens" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.reopens")}</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.alerts")}</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="optimization" className="rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-orange-500/25 text-slate-600 dark:text-slate-400 font-medium transition-all duration-200 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("reports.tabs.optimization")}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Status Distribution */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/30">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                    <Activity className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.overview.conversationStatus")}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.overview.conversationStatusDesc")}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {conversationStatus.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 inline-block mb-3">
                        <Activity className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                    </div>
                  ) : (
                    conversationStatus.map((item) => (
                      <div key={item.status} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`w-24 text-sm dark:text-white font-medium capitalize text-left`}>{item.status}</span>
                        <div className={`flex-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-3.5 ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className={`h-3.5 rounded-full ${getStatusColor(item.status)} transition-all shadow-sm`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold dark:text-white w-20 ${isRTL ? 'text-left' : 'text-right'}`}>{item.count} ({item.percentage}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Channel Distribution */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-orange-50/50 to-red-50/50 dark:from-orange-950/30 dark:to-red-950/30">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25">
                    <MessageSquare className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.overview.channelDistribution")}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.overview.channelDistributionDesc")}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {channelDistribution.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 inline-block mb-3">
                        <MessageSquare className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                    </div>
                  ) : (
                    channelDistribution.map((item) => (
                      <div key={item.channel} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`w-24 text-sm dark:text-white font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{getChannelEmoji(item.channel)}</span>
                          <span className="capitalize">{item.channel}</span>
                        </span>
                        <div className={`flex-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-3.5 ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className="h-3.5 rounded-full bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 transition-all shadow-sm"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold dark:text-white w-20 ${isRTL ? 'text-left' : 'text-right'}`}>{item.count} ({item.percentage}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Conversation Trends */}
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-purple-50/50 to-blue-50/50 dark:from-purple-950/30 dark:to-blue-950/30">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-blue-600 shadow-lg shadow-purple-500/25">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.overview.conversationTrends")}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.overview.conversationTrendsDesc")}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {conversationTrends.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                  <div className="text-center">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 inline-block mb-4">
                      <BarChart3 className="h-10 w-10 text-orange-500 dark:text-orange-400" />
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.overview.noConversationData")}</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversationTrends.map((item, index) => {
                    const maxCount = Math.max(...conversationTrends.map(t => t.count));
                    const barWidth = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
                    return (
                      <div key={index} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`w-24 text-xs dark:text-white font-medium text-left`}>{new Date(item.date).toLocaleDateString()}</span>
                        <div className={`flex-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-7 relative ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className={`h-7 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 dark:from-purple-600 dark:to-blue-600 transition-all flex items-center pr-3 shadow-sm ${isRTL ? 'justify-start pl-3' : 'justify-end'}`}
                            style={{ width: `${barWidth}%` }}
                          >
                            {barWidth > 15 && <span className={`text-xs text-white font-bold ${isRTL ? 'rotate-180' : ''}`}>{item.count}</span>}
                          </div>
                          {barWidth <= 15 && (
                            <span className={`absolute top-1/2 -translate-y-1/2 text-xs dark:text-white font-bold ${isRTL ? 'left-3 rotate-180' : 'right-3'}`}>{item.count}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/30">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.agents.agentPerformance")}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.agents.agentPerformanceDesc")}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {agentPerformance.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 inline-block mb-4">
                      <Users className="h-10 w-10 text-violet-500 dark:text-violet-400" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{t("reports.agents.noPerformanceData")}</p>
                  </div>
                ) : (
                  agentPerformance.map((agent) => (
                    <div key={agent.agent_id} className={`flex items-center justify-between p-5 border border-slate-200/80 dark:border-slate-700/60 rounded-2xl bg-gradient-to-r from-white to-slate-50 dark:from-slate-800/50 dark:to-slate-900/50 hover:shadow-lg hover:scale-[1.01] transition-all duration-200 ${isRTL ? 'flex-row-reverse' : ''}`}>
                      <div className={`flex items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
                          <span className="text-white font-bold text-base">
                            {agent.agent_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <h4 className="font-bold text-slate-800 dark:text-white">{agent.agent_name}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{agent.conversations} {t("reports.agents.conversationsThisWeek")}</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="text-center">
                          <p className="font-bold text-slate-800 dark:text-white text-lg">{agent.avg_response || "N/A"}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">{t("reports.agents.avgResponse")}</p>
                        </div>
                        <div className="text-center">
                          <div className={`flex items-center gap-1.5 justify-center`}>
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                            <span className="font-bold text-slate-800 dark:text-white text-lg">{agent.satisfaction || "N/A"}</span>
                          </div>
                          <p className="text-slate-500 dark:text-slate-400 text-xs">{t("reports.agents.rating")}</p>
                        </div>
                        <span className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-semibold shadow-md shadow-green-500/25">{t("reports.agents.active")}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Customer Satisfaction */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-yellow-50/50 to-amber-50/50 dark:from-yellow-950/30 dark:to-amber-950/30">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/25">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.customers.customerSatisfaction")}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.customers.satisfactionDesc")}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {customerSatisfaction.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 inline-block mb-3">
                        <Star className="h-8 w-8 text-yellow-500 dark:text-yellow-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                    </div>
                  ) : (
                    customerSatisfaction.map((item) => (
                      <div key={item.rating} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <span className="w-5 text-slate-800 dark:text-white font-bold">{item.rating}</span>
                        </div>
                        <div className={`flex-1 bg-slate-200/60 dark:bg-slate-700/60 rounded-full h-3.5 ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className="h-3.5 bg-gradient-to-r from-yellow-400 to-amber-500 dark:from-yellow-500 dark:to-amber-600 rounded-full transition-all shadow-sm"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-bold text-slate-700 dark:text-white w-14 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {item.percentage}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Top Issues */}
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-rose-50/50 to-pink-50/50 dark:from-rose-950/30 dark:to-pink-950/30">
                <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 shadow-lg shadow-rose-500/25">
                    <AlertCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.customers.topIssues")}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.customers.topIssuesDesc")}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  {topIssues.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="p-4 rounded-2xl bg-rose-100 dark:bg-rose-900/30 inline-block mb-3">
                        <AlertCircle className="h-8 w-8 text-rose-500 dark:text-rose-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                    </div>
                  ) : (
                    topIssues.map((item) => (
                      <div key={item.issue} className={`flex items-center justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 hover:shadow-md transition-shadow ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-sm font-medium text-slate-700 dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>{item.issue}</span>
                        <span className="px-3 py-1 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-bold shadow-sm">{item.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-teal-50/50 to-cyan-50/50 dark:from-teal-950/30 dark:to-cyan-950/30">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/25">
                  <LineChart className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.trends.conversationTrends")}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.trends.conversationTrendsDesc")}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-96 flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl border border-slate-200/60 dark:border-slate-700/50">
                <div className="text-center">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/30 dark:to-cyan-900/30 inline-block mb-4">
                    <BarChart3 className="h-12 w-12 text-teal-500 dark:text-teal-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{t("reports.trends.advancedCharts")}</p>
                </div>
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
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/30">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg shadow-amber-500/25">
                  <Bell className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.alerts.alerts")}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.alerts.alertsDesc")}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-5 rounded-xl border-l-4 text-left transition-all hover:shadow-md ${
                      alert.type === "critical"
                        ? "bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-500 shadow-red-500/10"
                        : "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-500 shadow-yellow-500/10"
                    }`}>
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`p-2 rounded-lg ${
                          alert.type === "critical"
                            ? "bg-red-100 dark:bg-red-900/50"
                            : "bg-yellow-100 dark:bg-yellow-900/50"
                        }`}>
                          <AlertCircle className={`h-5 w-5 ${
                            alert.type === "critical"
                              ? "text-red-600 dark:text-red-400"
                              : "text-yellow-600 dark:text-yellow-400"
                          }`} />
                        </div>
                        <div className="flex-1">
                          <p className={`font-semibold mb-1 ${
                            alert.type === "critical"
                              ? "text-red-800 dark:text-red-300"
                              : "text-yellow-800 dark:text-yellow-300"
                          }`}>{alert.message}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(alert.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 inline-block mb-4">
                    <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-medium">{t("reports.alerts.noActiveAlerts")}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200/60 dark:border-slate-700/50 bg-gradient-to-r from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/30">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
                  <Zap className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white">{t("reports.optimization.optimizationSuggestions")}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{t("reports.optimization.optimizationDesc")}</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              {optimizationSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {optimizationSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className={`p-5 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 text-left hover:shadow-lg transition-all`}>
                      <div className={`flex items-start gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex-shrink-0">
                          <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-800 dark:text-white mb-3">{suggestion.description}</p>
                          <div className="space-y-2">
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">{t("reports.optimization.type")}</span>
                              <span className="text-sm text-slate-600 dark:text-slate-400">{suggestion.suggestion_type}</span>
                            </div>
                            {suggestion.agent_id && (
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">{t("reports.optimization.agentId")}</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{suggestion.agent_id}</span>
                              </div>
                            )}
                            {suggestion.details && (
                              <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                                <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">{t("reports.optimization.details")}</span>
                                <span className="text-sm text-slate-600 dark:text-slate-400">{JSON.stringify(suggestion.details)}</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300">{t("reports.optimization.generated")}</span>
                              <span className="text-sm text-slate-600 dark:text-slate-400">{new Date(suggestion.created_at).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 inline-block mb-4">
                    <Zap className="h-12 w-12 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">{t("reports.optimization.noSuggestions")}</p>
                </div>
              )}
              <Button
                onClick={() => generateSuggestionsMutation.mutate()}
                className="mt-6 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all duration-200 px-6"
                disabled={generateSuggestionsMutation.isPending}
              >
                {generateSuggestionsMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    {t("reports.optimization.generating")}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    {t("reports.optimization.generateNew")}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
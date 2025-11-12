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
  Filter
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
            `w-[200px] font-normal dark:bg-slate-800 dark:border-slate-600 dark:text-white dark:hover:bg-slate-700 flex items-center ${isRTL ? 'flex-row-reverse justify-end text-right' : 'justify-start text-left'}`,
            !date && "text-muted-foreground dark:text-muted-foreground"
          )}
        >
          <CalendarIcon className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 dark:bg-slate-800 dark:border-slate-700">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleDateSelect}
          initialFocus
          className="dark:bg-slate-800"
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
      change: "+12%", // Placeholder, needs backend calculation
      trend: "up",
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: t("reports.metrics.avgResponseTime"),
      value: latencyData?.avg_response_time ?? "N/A",
      change: "-15%", // Placeholder
      trend: "down",
      icon: Clock,
      color: "text-green-600"
    },
    {
      title: t("reports.metrics.customerSatisfaction"),
      value: metricsData?.customer_satisfaction ?? "N/A",
      change: "+0.2", // Placeholder
      trend: "up",
      icon: Star,
      color: "text-yellow-600"
    },
    {
      title: t("reports.metrics.activeAgents"),
      value: metricsData?.active_agents ?? "N/A",
      change: "+3%", // Placeholder
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: t("reports.metrics.overallErrorRate"),
      value: errorRatesData?.overall_error_rate ?? "N/A",
      change: "",
      trend: "up",
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

  if (isLoadingMetrics || isLoadingAgentPerformance || isLoadingCustomerSatisfaction || isLoadingTopIssues || isLoadingErrorRates || isLoadingLatency || isLoadingAlerts || isLoadingOptimizationSuggestions || isLoadingConversationStatus || isLoadingConversationTrends || isLoadingChannelDistribution) return <div>{t("reports.loading")}</div>;
  if (isErrorMetrics || isErrorAgentPerformance || isErrorCustomerSatisfaction || isErrorTopIssues || isErrorErrorRates || isErrorLatency || isErrorAlerts || isErrorOptimizationSuggestions || isErrorConversationStatus || isErrorConversationTrends || isErrorChannelDistribution) return <div>{t("reports.error")}</div>;

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      {/* Header */}
      <div className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4`}>
        <div>
          <h2 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent mb-2">
            {t("reports.title")}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t("reports.subtitle")}</p>
        </div>
        <div className={`flex flex-wrap gap-2`}>
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
          <Button className={`bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white btn-hover-lift flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <Download className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {t("reports.export")}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title} className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800 hover:shadow-xl transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${
                    metric.title === "Total Sessions" ? "from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50" :
                    metric.title === "Avg Response Time" ? "from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50" :
                    metric.title === "Customer Satisfaction" ? "from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50" :
                    metric.title === "Active Agents" ? "from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50" :
                    "from-red-100 to-red-200 dark:from-red-900/50 dark:to-red-800/50"
                  } flex items-center justify-center shadow-sm`}>
                    <IconComponent className={`h-6 w-6 ${metric.color} dark:opacity-90`} />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1.5">{metric.title}</p>
                  <p className="text-2xl font-bold dark:text-white mb-2">{metric.value}</p>
                  {metric.change && (
                    <div className={`flex items-center`}>
                      {metric.trend === "up" ? (
                        <TrendingUp className={`h-3.5 w-3.5 text-green-500 dark:text-green-400 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      ) : (
                        <TrendingDown className={`h-3.5 w-3.5 text-red-500 dark:text-red-400 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                      )}
                      <span className={`text-xs font-medium ${
                        metric.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      }`}>
                        {metric.change}
                      </span>
                      <span className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? 'mr-1' : 'ml-1'}`}>{t("reports.vsLastMonth")}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 grid grid-cols-3 lg:grid-cols-7">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">{t("reports.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">{t("reports.tabs.agents")}</TabsTrigger>
          <TabsTrigger value="customers" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">{t("reports.tabs.customers")}</TabsTrigger>
          <TabsTrigger value="trends" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">{t("reports.tabs.trends")}</TabsTrigger>
          <TabsTrigger value="reopens" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">{t("reports.tabs.reopens")}</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">{t("reports.tabs.alerts")}</TabsTrigger>
          <TabsTrigger value="optimization" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400">{t("reports.tabs.optimization")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Conversation Status Distribution */}
            <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="dark:text-white text-left">{t("reports.overview.conversationStatus")}</CardTitle>
                <CardDescription className="dark:text-gray-400 text-left">{t("reports.overview.conversationStatusDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {conversationStatus.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                  ) : (
                    conversationStatus.map((item) => (
                      <div key={item.status} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`w-24 text-sm dark:text-white font-medium capitalize text-left`}>{item.status}</span>
                        <div className={`flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className={`h-3 rounded-full ${getStatusColor(item.status)} transition-all`}
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold dark:text-white w-16 ${isRTL ? 'text-left' : 'text-right'}`}>{item.count} ({item.percentage}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Channel Distribution */}
            <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="dark:text-white text-left">{t("reports.overview.channelDistribution")}</CardTitle>
                <CardDescription className="dark:text-gray-400 text-left">{t("reports.overview.channelDistributionDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {channelDistribution.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                  ) : (
                    channelDistribution.map((item) => (
                      <div key={item.channel} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`w-24 text-sm dark:text-white font-medium flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <span>{getChannelEmoji(item.channel)}</span>
                          <span className="capitalize">{item.channel}</span>
                        </span>
                        <div className={`flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3 ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-red-500 dark:from-orange-600 dark:to-red-600 transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold dark:text-white w-16 ${isRTL ? 'text-left' : 'text-right'}`}>{item.count} ({item.percentage}%)</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Conversation Trends */}
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="dark:text-white text-left">{t("reports.overview.conversationTrends")}</CardTitle>
              <CardDescription className="dark:text-gray-400 text-left">{t("reports.overview.conversationTrendsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {conversationTrends.length === 0 ? (
                <div className="h-64 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="text-center">
                    <BarChart3 className="h-16 w-16 text-orange-400 dark:text-orange-500 mx-auto mb-3" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">{t("reports.overview.noConversationData")}</span>
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
                        <div className={`flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className={`h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 dark:from-blue-600 dark:to-purple-600 transition-all flex items-center pr-2 ${isRTL ? 'justify-start pl-2' : 'justify-end'}`}
                            style={{ width: `${barWidth}%` }}
                          >
                            {barWidth > 15 && <span className={`text-xs text-white font-semibold ${isRTL ? 'rotate-180' : ''}`}>{item.count}</span>}
                          </div>
                          {barWidth <= 15 && (
                            <span className={`absolute top-1/2 -translate-y-1/2 text-xs dark:text-white font-semibold ${isRTL ? 'left-2 rotate-180' : 'right-2'}`}>{item.count}</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="dark:text-white text-left">{t("reports.agents.agentPerformance")}</CardTitle>
              <CardDescription className="dark:text-gray-400 text-left">{t("reports.agents.agentPerformanceDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {agentPerformance.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">{t("reports.agents.noPerformanceData")}</p>
                  </div>
                ) : (
                  agentPerformance.map((agent) => (
                    <div key={agent.agent_id} className={`flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900/50 hover:shadow-md transition-shadow `}>
                      <div className={`flex items-center gap-4 `}>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 flex items-center justify-center shadow-sm">
                          <span className="text-orange-600 dark:text-orange-400 font-bold text-sm">
                            {agent.agent_name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div className="text-left">
                          <h4 className="font-semibold dark:text-white">{agent.agent_name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{agent.conversations} {t("reports.agents.conversationsThisWeek")}</p>
                        </div>
                      </div>

                      <div className={`flex items-center gap-6 text-sm `}>
                        <div className="text-center">
                          <p className="font-semibold dark:text-white">{agent.avg_response || "N/A"}</p>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">{t("reports.agents.avgResponse")}</p>
                        </div>
                        <div className="text-center">
                          <div className={`flex items-center gap-1 justify-center `}>
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-semibold dark:text-white">{agent.satisfaction || "N/A"}</span>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 text-xs">{t("reports.agents.rating")}</p>
                        </div>
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800">{t("reports.agents.active")}</Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="dark:text-white text-left">{t("reports.customers.customerSatisfaction")}</CardTitle>
                <CardDescription className="dark:text-gray-400 text-left">{t("reports.customers.satisfactionDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {customerSatisfaction.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                  ) : (
                    customerSatisfaction.map((item) => (
                      <div key={item.rating} className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={`flex items-center gap-1.5 ${isRTL ? 'flex-row-reverse' : ''}`}>
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                          <span className="w-4 dark:text-white font-medium">{item.rating}</span>
                        </div>
                        <div className={`flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 ${isRTL ? 'rotate-180' : ''}`}>
                          <div
                            className="h-2.5 bg-yellow-500 dark:bg-yellow-600 rounded-full transition-all"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold dark:text-white w-12 ${isRTL ? 'text-left' : 'text-right'}`}>
                          {item.percentage}%
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
                <CardTitle className="dark:text-white text-left">{t("reports.customers.topIssues")}</CardTitle>
                <CardDescription className="dark:text-gray-400 text-left">{t("reports.customers.topIssuesDesc")}</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {topIssues.length === 0 ? (
                    <p className="text-center py-8 text-slate-500 dark:text-slate-400">{t("reports.noDataAvailable")}</p>
                  ) : (
                    topIssues.map((item) => (
                      <div key={item.issue} className={`flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className={`text-sm dark:text-white ${isRTL ? 'text-right' : 'text-left'}`}>{item.issue}</span>
                        <Badge variant="outline" className="dark:border-orange-500 dark:text-orange-400">{item.count}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="dark:text-white text-left">{t("reports.trends.conversationTrends")}</CardTitle>
              <CardDescription className="dark:text-gray-400 text-left">{t("reports.trends.conversationTrendsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-96 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-orange-400 dark:text-orange-500 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">{t("reports.trends.advancedCharts")}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reopens" className="space-y-6">
          <ReopenAnalytics />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="dark:text-white text-left">{t("reports.alerts.alerts")}</CardTitle>
              <CardDescription className="dark:text-gray-400 text-left">{t("reports.alerts.alertsDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-lg border text-left ${
                      alert.type === "critical"
                        ? "bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border-red-200 dark:border-red-800"
                        : "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800"
                    }`}>
                      <p className="font-semibold mb-1">{alert.message}</p>
                      <p className="text-sm opacity-80">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400">{t("reports.alerts.noActiveAlerts")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card className="card-shadow-lg border-slate-200 dark:border-slate-700 dark:bg-slate-800">
            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
              <CardTitle className="dark:text-white text-left">{t("reports.optimization.optimizationSuggestions")}</CardTitle>
              <CardDescription className="dark:text-gray-400 text-left">{t("reports.optimization.optimizationDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {optimizationSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {optimizationSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className={`p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-left`}>
                      <p className="font-semibold dark:text-white mb-2">{suggestion.description}</p>
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{t("reports.optimization.type")}</span> {suggestion.suggestion_type}
                        </p>
                        {suggestion.agent_id && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{t("reports.optimization.agentId")}</span> {suggestion.agent_id}
                          </p>
                        )}
                        {suggestion.details && (
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <span className="font-medium">{t("reports.optimization.details")}</span> {JSON.stringify(suggestion.details)}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-medium">{t("reports.optimization.generated")}</span> {new Date(suggestion.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-8 w-8 text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mb-4">{t("reports.optimization.noSuggestions")}</p>
                </div>
              )}
              <Button
                onClick={() => generateSuggestionsMutation.mutate()}
                className="mt-4 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white"
                disabled={generateSuggestionsMutation.isPending}
              >
                {generateSuggestionsMutation.isPending ? t("reports.optimization.generating") : t("reports.optimization.generateNew")}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
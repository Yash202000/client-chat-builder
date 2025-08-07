
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
  Calendar,
  Download,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";

export const Reports = () => {
  const { authFetch, companyId } = useAuth();

  const { data: metricsData, isLoading: isLoadingMetrics, isError: isErrorMetrics } = useQuery({
    queryKey: ['overallMetrics', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/metrics?start_date=2024-01-01&end_date=2024-12-31`, {
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
    queryKey: ['agentPerformance', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/agent-performance?start_date=2024-01-01&end_date=2024-12-31`, {
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
    queryKey: ['customerSatisfaction', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/customer-satisfaction?start_date=2024-01-01&end_date=2024-12-31`, {
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
    queryKey: ['topIssues', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/top-issues?start_date=2024-01-01&end_date=2024-12-31`, {
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
    queryKey: ['errorRates', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/error-rates?start_date=2024-01-01&end_date=2024-12-31`, {
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
    queryKey: ['latency', companyId],
    queryFn: async () => {
      if (!companyId) return null;
      const response = await authFetch(`/api/v1/reports/latency?start_date=2024-01-01&end_date=2024-12-31`, {
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

  const metrics = [
    {
      title: "Total Conversations",
      value: metricsData?.total_conversations || "N/A",
      change: "+12%", // Placeholder, needs backend calculation
      trend: "up",
      icon: MessageSquare,
      color: "text-blue-600"
    },
    {
      title: "Avg Response Time",
      value: latencyData?.avg_response_time || "N/A",
      change: "-15%", // Placeholder
      trend: "down",
      icon: Clock,
      color: "text-green-600"
    },
    {
      title: "Customer Satisfaction",
      value: metricsData?.customer_satisfaction || "N/A",
      change: "+0.2", // Placeholder
      trend: "up",
      icon: Star,
      color: "text-yellow-600"
    },
    {
      title: "Active Agents",
      value: metricsData?.active_agents || "N/A",
      change: "+3%", // Placeholder
      trend: "up",
      icon: Users,
      color: "text-purple-600"
    },
    {
      title: "Overall Error Rate",
      value: errorRatesData?.overall_error_rate || "N/A",
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

  if (isLoadingMetrics || isLoadingAgentPerformance || isLoadingCustomerSatisfaction || isLoadingTopIssues || isLoadingErrorRates || isLoadingLatency || isLoadingAlerts || isLoadingOptimizationSuggestions) return <div>Loading reports...</div>;
  if (isErrorMetrics || isErrorAgentPerformance || isErrorCustomerSatisfaction || isErrorTopIssues || isErrorErrorRates || isErrorLatency || isErrorAlerts || isErrorOptimizationSuggestions) return <div>Error loading reports.</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics & Reports</h2>
          <p className="text-gray-600">Track performance and insights</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          return (
            <Card key={metric.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.title}</p>
                    <p className="text-3xl font-bold mt-1">{metric.value}</p>
                    <div className="flex items-center mt-2">
                      {metric.trend === "up" ? (
                        <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className={`text-sm ${
                        metric.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}>
                        {metric.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">vs last month</span>
                    </div>
                  </div>
                  <IconComponent className={`h-8 w-8 ${metric.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agent Performance</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Conversation Volume</CardTitle>
                <CardDescription>Daily conversation trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
                  <BarChart3 className="h-16 w-16 text-gray-400" />
                  <span className="ml-4 text-gray-500">Chart visualization would go here</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Response Time Distribution</CardTitle>
                <CardDescription>How quickly agents respond</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { range: "< 1 min", percentage: 45, color: "bg-green-500" },
                    { range: "1-3 min", percentage: 35, color: "bg-yellow-500" },
                    { range: "3-5 min", percentage: 15, color: "bg-orange-500" },
                    { range: "> 5 min", percentage: 5, color: "bg-red-500" }
                  ].map((item) => (
                    <div key={item.range} className="flex items-center gap-3">
                      <span className="w-16 text-sm">{item.range}</span>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agent Performance</CardTitle>
              <CardDescription>Individual agent metrics and statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {agentPerformance.map((agent) => (
                  <div key={agent.agent_id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {agent.agent_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium">{agent.agent_name}</h4>
                        <p className="text-sm text-gray-600">{agent.conversations} conversations this week</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="font-medium">{agent.avg_response || "N/A"}</p>
                        <p className="text-gray-600">Avg Response</p>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-500" />
                          <span className="font-medium">{agent.satisfaction || "N/A"}</span>
                        </div>
                        <p className="text-gray-600">Rating</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
                <CardDescription>Satisfaction ratings over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customerSatisfaction.map((item) => (
                    <div key={item.rating} className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="w-4">{item.rating}</span>
                      </div>
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 bg-yellow-500 rounded-full"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {item.percentage}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Issues</CardTitle>
                <CardDescription>Most common customer inquiries</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topIssues.map((item) => (
                    <div key={item.issue} className="flex items-center justify-between">
                      <span className="text-sm">{item.issue}</span>
                      <Badge variant="outline">{item.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Trends</CardTitle>
              <CardDescription>Weekly and monthly conversation patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 flex items-center justify-center bg-gray-50 rounded">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Advanced trend analysis charts would be displayed here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alerts</CardTitle>
              <CardDescription>Critical notifications and warnings</CardDescription>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert) => (
                    <div key={alert.id} className={`p-4 rounded-md ${
                      alert.type === "critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                    }`}>
                      <p className="font-medium">{alert.message}</p>
                      <p className="text-sm">{new Date(alert.timestamp).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No active alerts.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Suggestions</CardTitle>
              <CardDescription>AI-powered recommendations for improving agent performance.</CardDescription>
            </CardHeader>
            <CardContent>
              {optimizationSuggestions.length > 0 ? (
                <div className="space-y-4">
                  {optimizationSuggestions.map((suggestion) => (
                    <div key={suggestion.id} className="p-4 border rounded-md bg-blue-50">
                      <p className="font-medium">{suggestion.description}</p>
                      <p className="text-sm text-gray-600">Type: {suggestion.suggestion_type}</p>
                      {suggestion.agent_id && <p className="text-sm text-gray-600">Agent ID: {suggestion.agent_id}</p>}
                      {suggestion.details && <p className="text-sm text-gray-600">Details: {JSON.stringify(suggestion.details)}</p>}
                      <p className="text-sm text-gray-600">Generated: {new Date(suggestion.created_at).toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">No optimization suggestions available.</p>
              )}
              <Button 
                onClick={() => generateSuggestionsMutation.mutate()} 
                className="mt-4"
                disabled={generateSuggestionsMutation.isPending}
              >
                {generateSuggestionsMutation.isPending ? "Generating..." : "Generate New Suggestions"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

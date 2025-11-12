import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from "@/hooks/useAuth";
import { TrendingUp, RotateCcw, Timer, Percent } from 'lucide-react';

interface ReopenAnalyticsData {
  total_conversations_reopened: number;
  total_reopen_events: number;
  average_reopens_per_conversation: number;
  average_time_to_reopen_hours: number;
  reopen_rate_percentage: number;
}

export const ReopenAnalytics: React.FC = () => {
  const { user, authFetch } = useAuth();
  const companyId = user?.company_id;

  const { data: analytics, isLoading } = useQuery<ReopenAnalyticsData>({
    queryKey: ['reopenAnalytics', companyId],
    queryFn: async () => {
      if (!companyId) throw new Error('No company ID');
      const response = await authFetch('/api/v1/conversations/analytics/reopens');
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
    enabled: !!companyId,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!analytics) {
    return null;
  }

  const metrics = [
    {
      title: 'Conversations Reopened',
      value: analytics.total_conversations_reopened,
      icon: RotateCcw,
      description: 'Unique conversations that were reopened',
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
    {
      title: 'Total Reopen Events',
      value: analytics.total_reopen_events,
      icon: TrendingUp,
      description: 'Total number of reopen actions',
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Avg. Reopens per Conv.',
      value: analytics.average_reopens_per_conversation.toFixed(2),
      icon: Timer,
      description: 'Average times a conversation is reopened',
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Reopen Rate',
      value: `${analytics.reopen_rate_percentage.toFixed(1)}%`,
      icon: Percent,
      description: 'Percentage of conversations reopened',
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Conversation Reopen Analytics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track how often resolved conversations are reopened by customers
          </p>
        </div>
        {analytics.average_time_to_reopen_hours > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Avg. Time to Reopen</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {analytics.average_time_to_reopen_hours.toFixed(1)}h
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <Card
              key={index}
              className="card-shadow hover:shadow-lg transition-all duration-200 transform hover:scale-105"
            >
              <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                  <Icon className={`h-4 w-4 ${metric.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${metric.color} mb-1`}>
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {analytics.reopen_rate_percentage > 10 && (
        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/30">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-1">
                  High Reopen Rate Detected
                </h3>
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  {analytics.reopen_rate_percentage.toFixed(1)}% of your conversations are being reopened.
                  Consider reviewing your resolution process or implementing proactive follow-ups to reduce reopens.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

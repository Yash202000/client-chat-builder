import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

interface AnalyticsData {
  leadStats: {
    total_leads: number;
    mql_count: number;
    sql_count: number;
    opportunity_count: number;
    customer_count: number;
    lost_count: number;
    avg_score: number;
    total_pipeline_value: number;
    qualified_count: number;
    unqualified_count: number;
  };
  campaignStats: {
    total_campaigns: number;
    active_campaigns: number;
    total_contacts_reached: number;
    avg_engagement_rate: number;
    total_revenue: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [leadsRes, campaignsRes] = await Promise.all([
        axios.get('/api/v1/leads/stats', { headers }),
        axios.get('/api/v1/campaigns/', { headers }),
      ]);

      const campaigns = campaignsRes.data;
      const activeCampaigns = campaigns.filter((c: any) => c.status === 'active');
      const totalReached = campaigns.reduce((sum: number, c: any) => sum + (c.contacts_reached || 0), 0);
      const totalRevenue = campaigns.reduce((sum: number, c: any) => sum + (parseFloat(c.total_revenue) || 0), 0);

      setData({
        leadStats: leadsRes.data,
        campaignStats: {
          total_campaigns: campaigns.length,
          active_campaigns: activeCampaigns.length,
          total_contacts_reached: totalReached,
          avg_engagement_rate: campaigns.length > 0
            ? campaigns.reduce((sum: number, c: any) => sum + (c.contacts_engaged || 0), 0) / totalReached * 100
            : 0,
          total_revenue: totalRevenue,
        },
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const conversionRate = data.leadStats.total_leads > 0
    ? ((data.leadStats.customer_count || 0) / data.leadStats.total_leads) * 100
    : 0;

  const qualificationRate = data.leadStats.total_leads > 0
    ? ((data.leadStats.qualified_count || 0) / data.leadStats.total_leads) * 100
    : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <BarChart3 className="h-8 w-8" />
          CRM Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive view of your CRM performance and metrics
        </p>
      </div>

      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data.campaignStats.total_revenue || 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600 mt-2">
              <ArrowUpRight className="h-3 w-3" />
              <span>From campaigns</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data.leadStats.total_pipeline_value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.leadStats.opportunity_count || 0} opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.leadStats.customer_count || 0} / {data.leadStats.total_leads || 0} leads
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Lead Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.leadStats.avg_score ? data.leadStats.avg_score.toFixed(0) : 0}/100
            </div>
            <Progress value={data.leadStats.avg_score || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Lead Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel Analysis</CardTitle>
          <CardDescription>Track leads through your sales pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Total Leads</span>
                <span className="text-muted-foreground">{data.leadStats.total_leads || 0}</span>
              </div>
              <Progress value={100} className="bg-gray-100" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Marketing Qualified (MQL)</span>
                <span className="text-muted-foreground">
                  {data.leadStats.mql_count || 0} ({data.leadStats.total_leads > 0
                    ? ((data.leadStats.mql_count / data.leadStats.total_leads) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
              <Progress
                value={data.leadStats.total_leads > 0
                  ? (data.leadStats.mql_count / data.leadStats.total_leads) * 100
                  : 0}
                className="bg-blue-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Sales Qualified (SQL)</span>
                <span className="text-muted-foreground">
                  {data.leadStats.sql_count || 0} ({data.leadStats.total_leads > 0
                    ? ((data.leadStats.sql_count / data.leadStats.total_leads) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
              <Progress
                value={data.leadStats.total_leads > 0
                  ? (data.leadStats.sql_count / data.leadStats.total_leads) * 100
                  : 0}
                className="bg-purple-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Opportunities</span>
                <span className="text-muted-foreground">
                  {data.leadStats.opportunity_count || 0} ({data.leadStats.total_leads > 0
                    ? ((data.leadStats.opportunity_count / data.leadStats.total_leads) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
              <Progress
                value={data.leadStats.total_leads > 0
                  ? (data.leadStats.opportunity_count / data.leadStats.total_leads) * 100
                  : 0}
                className="bg-yellow-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Customers</span>
                <span className="text-muted-foreground">
                  {data.leadStats.customer_count || 0} ({conversionRate.toFixed(1)}%)
                </span>
              </div>
              <Progress
                value={conversionRate}
                className="bg-green-100"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Campaign Overview</CardTitle>
            <CardDescription>Active campaign metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Total Campaigns</span>
              <Badge variant="secondary">{data.campaignStats.total_campaigns}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Active Campaigns</span>
              <Badge>{data.campaignStats.active_campaigns}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Total Contacts Reached</span>
              <Badge variant="outline">{data.campaignStats.total_contacts_reached.toLocaleString()}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">Avg. Engagement Rate</span>
              <Badge variant="outline">{data.campaignStats.avg_engagement_rate.toFixed(1)}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lead Quality Metrics</CardTitle>
            <CardDescription>Lead qualification breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Qualified Leads</span>
                <span className="text-sm text-muted-foreground">
                  {data.leadStats.qualified_count || 0} ({qualificationRate.toFixed(1)}%)
                </span>
              </div>
              <Progress value={qualificationRate} className="bg-green-100" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Unqualified Leads</span>
                <span className="text-sm text-muted-foreground">
                  {data.leadStats.unqualified_count || 0} ({data.leadStats.total_leads > 0
                    ? (((data.leadStats.unqualified_count || 0) / data.leadStats.total_leads) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
              <Progress
                value={data.leadStats.total_leads > 0
                  ? ((data.leadStats.unqualified_count || 0) / data.leadStats.total_leads) * 100
                  : 0}
                className="bg-red-100"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lost Opportunities</span>
                <span className="text-sm text-muted-foreground">
                  {data.leadStats.lost_count || 0} ({data.leadStats.total_leads > 0
                    ? (((data.leadStats.lost_count || 0) / data.leadStats.total_leads) * 100).toFixed(1)
                    : 0}%)
                </span>
              </div>
              <Progress
                value={data.leadStats.total_leads > 0
                  ? ((data.leadStats.lost_count || 0) / data.leadStats.total_leads) * 100
                  : 0}
                className="bg-gray-100"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
          <CardDescription>Performance highlights and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {conversionRate >= 10 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <ArrowUpRight className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">Strong Conversion Rate</p>
                  <p className="text-sm text-green-700">
                    Your {conversionRate.toFixed(1)}% conversion rate is excellent. Keep up the great work!
                  </p>
                </div>
              </div>
            )}

            {(data.leadStats.avg_score || 0) >= 70 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">High Lead Quality</p>
                  <p className="text-sm text-blue-700">
                    Average lead score of {(data.leadStats.avg_score || 0).toFixed(0)} indicates high-quality leads in your pipeline.
                  </p>
                </div>
              </div>
            )}

            {data.campaignStats.active_campaigns === 0 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <ArrowDownRight className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900">No Active Campaigns</p>
                  <p className="text-sm text-yellow-700">
                    Consider launching new campaigns to engage your leads and drive conversions.
                  </p>
                </div>
              </div>
            )}

            {data.leadStats.total_leads === 0 && (
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Users className="h-5 w-5 text-gray-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Get Started</p>
                  <p className="text-sm text-gray-700">
                    Start by adding leads to your CRM to track them through your sales pipeline.
                  </p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

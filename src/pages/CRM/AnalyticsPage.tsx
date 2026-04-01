import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
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
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
      </div>
    );
  }

  const conversionRate = data.leadStats.total_leads > 0
    ? ((data.leadStats.customer_count || 0) / data.leadStats.total_leads) * 100
    : 0;

  const qualificationRate = data.leadStats.total_leads > 0
    ? ((data.leadStats.qualified_count || 0) / data.leadStats.total_leads) * 100
    : 0;

  return (
    <div className="min-h-full bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">CRM Analytics</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comprehensive view of your CRM performance and metrics</p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* Overview Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Revenue', value: `$${(data.campaignStats.total_revenue || 0).toLocaleString()}`, sub: 'From campaigns', icon: DollarSign, iconBg: 'bg-green-50 dark:bg-green-900/20', iconColor: 'text-green-600 dark:text-green-400' },
            { label: 'Pipeline Value', value: `$${(data.leadStats.total_pipeline_value || 0).toLocaleString()}`, sub: `${data.leadStats.opportunity_count || 0} opportunities`, icon: Target, iconBg: 'bg-blue-50 dark:bg-blue-900/20', iconColor: 'text-blue-600 dark:text-blue-400' },
            { label: 'Conversion Rate', value: `${conversionRate.toFixed(1)}%`, sub: `${data.leadStats.customer_count || 0} / ${data.leadStats.total_leads || 0} leads`, icon: TrendingUp, iconBg: 'bg-purple-50 dark:bg-purple-900/20', iconColor: 'text-purple-600 dark:text-purple-400' },
            { label: 'Avg. Lead Score', value: `${data.leadStats.avg_score ? data.leadStats.avg_score.toFixed(0) : 0}/100`, sub: null, icon: BarChart3, iconBg: 'bg-violet-50 dark:bg-violet-900/20', iconColor: 'text-violet-600 dark:text-violet-400', progress: data.leadStats.avg_score || 0 },
          ].map(({ label, value, sub, icon: Icon, iconBg, iconColor, progress }) => (
            <div key={label} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{label}</span>
                <div className={`h-10 w-10 rounded-lg ${iconBg} flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">{value}</div>
              {sub && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>}
              {progress !== undefined && <Progress value={progress} className="mt-2" />}
            </div>
          ))}
        </div>

        {/* Lead Funnel */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Lead Funnel Analysis</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track leads through your sales pipeline</p>
          </div>
          <div className="p-6 space-y-4">
            {[
              { label: 'Total Leads', count: data.leadStats.total_leads || 0, pct: 100 },
              { label: 'Marketing Qualified (MQL)', count: data.leadStats.mql_count || 0, pct: data.leadStats.total_leads > 0 ? (data.leadStats.mql_count / data.leadStats.total_leads) * 100 : 0 },
              { label: 'Sales Qualified (SQL)', count: data.leadStats.sql_count || 0, pct: data.leadStats.total_leads > 0 ? (data.leadStats.sql_count / data.leadStats.total_leads) * 100 : 0 },
              { label: 'Opportunities', count: data.leadStats.opportunity_count || 0, pct: data.leadStats.total_leads > 0 ? (data.leadStats.opportunity_count / data.leadStats.total_leads) * 100 : 0 },
              { label: 'Customers', count: data.leadStats.customer_count || 0, pct: conversionRate },
            ].map(({ label, count, pct }) => (
              <div key={label} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <span className="text-slate-500 dark:text-slate-400">{count} ({pct.toFixed(1)}%)</span>
                </div>
                <Progress value={pct} />
              </div>
            ))}
          </div>
        </div>

        {/* Campaign + Lead Quality */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Campaign Overview</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Active campaign metrics</p>
            </div>
            <div className="p-6 space-y-3">
              {[
                { label: 'Total Campaigns', value: data.campaignStats.total_campaigns },
                { label: 'Active Campaigns', value: data.campaignStats.active_campaigns },
                { label: 'Total Contacts Reached', value: data.campaignStats.total_contacts_reached.toLocaleString() },
                { label: 'Avg. Engagement Rate', value: `${data.campaignStats.avg_engagement_rate.toFixed(1)}%` },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">Lead Quality Metrics</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Lead qualification breakdown</p>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Qualified Leads', count: data.leadStats.qualified_count || 0, pct: qualificationRate },
                { label: 'Unqualified Leads', count: data.leadStats.unqualified_count || 0, pct: data.leadStats.total_leads > 0 ? ((data.leadStats.unqualified_count || 0) / data.leadStats.total_leads) * 100 : 0 },
                { label: 'Lost Opportunities', count: data.leadStats.lost_count || 0, pct: data.leadStats.total_leads > 0 ? ((data.leadStats.lost_count || 0) / data.leadStats.total_leads) * 100 : 0 },
              ].map(({ label, count, pct }) => (
                <div key={label} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                    <span className="text-slate-500 dark:text-slate-400">{count} ({pct.toFixed(1)}%)</span>
                  </div>
                  <Progress value={pct} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Insights */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Key Insights</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Performance highlights and recommendations</p>
          </div>
          <div className="p-6 space-y-3">
            {conversionRate >= 10 && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <ArrowUpRight className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Strong Conversion Rate</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Your {conversionRate.toFixed(1)}% conversion rate is excellent. Keep up the great work!</p>
                </div>
              </div>
            )}
            {(data.leadStats.avg_score || 0) >= 70 && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <TrendingUp className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">High Lead Quality</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Average lead score of {(data.leadStats.avg_score || 0).toFixed(0)} indicates high-quality leads in your pipeline.</p>
                </div>
              </div>
            )}
            {data.campaignStats.active_campaigns === 0 && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <ArrowDownRight className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">No Active Campaigns</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Consider launching new campaigns to engage your leads and drive conversions.</p>
                </div>
              </div>
            )}
            {data.leadStats.total_leads === 0 && (
              <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <Users className="h-4 w-4 text-slate-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">Get Started</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Start by adding leads to your CRM to track them through your sales pipeline.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

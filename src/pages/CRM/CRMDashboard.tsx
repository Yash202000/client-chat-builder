import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Send,
  TrendingUp,
  DollarSign,
  Target,
  Star,
  ArrowUpRight,
  BarChart3,
  Activity,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import axios from 'axios';

interface DashboardData {
  leadStats: {
    total_leads: number;
    mql_count: number;
    sql_count: number;
    opportunity_count: number;
    customer_count: number;
    avg_score: number;
    total_pipeline_value: number;
  };
  recentLeads: any[];
  activeCampaigns: any[];
  topPerformers: any[];
}

export default function CRMDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const [leadStatsRes, recentLeadsRes, campaignsRes] = await Promise.all([
        axios.get('/api/v1/leads/stats', { headers }),
        axios.get('/api/v1/leads/', { headers, params: { limit: 5 } }),
        axios.get('/api/v1/campaigns/active', { headers, params: { limit: 5 } }),
      ]);

      setData({
        leadStats: leadStatsRes.data,
        recentLeads: recentLeadsRes.data,
        activeCampaigns: campaignsRes.data,
        topPerformers: [], // Will be populated when we have performance data
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  const conversionRate =
    data.leadStats.total_leads > 0
      ? (((data.leadStats.customer_count || 0) / data.leadStats.total_leads) * 100).toFixed(1)
      : 0;

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">CRM Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your sales pipeline and campaign performance
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leadStats.total_leads}</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                {data.leadStats.mql_count} MQL
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {data.leadStats.sql_count} SQL
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(data.leadStats.total_pipeline_value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.leadStats.opportunity_count} active opportunities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <p className="text-xs text-muted-foreground mt-2">
              {data.leadStats.customer_count} customers won
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Lead Score</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.leadStats.avg_score ? data.leadStats.avg_score.toFixed(0) : 0}/100</div>
            <Progress value={data.leadStats.avg_score || 0} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Leads */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest leads added to the pipeline</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/crm/leads')}
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.recentLeads.slice(0, 5).map((lead: any) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                >
                  <div className="flex-1">
                    <div className="font-medium">{lead.contact?.name || 'Unknown'}</div>
                    <div className="text-sm text-muted-foreground">
                      {lead.contact?.email}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{lead.score}/100</Badge>
                    <Badge>{lead.stage}</Badge>
                  </div>
                </div>
              ))}
              {data.recentLeads.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No leads yet. Create your first lead to get started.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Active Campaigns */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Active Campaigns</CardTitle>
                <CardDescription>Currently running campaigns</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/crm/campaigns')}
              >
                View All
                <ArrowUpRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.activeCampaigns.map((campaign: any) => (
                <div
                  key={campaign.id}
                  className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => navigate(`/dashboard/crm/campaigns/${campaign.id}`)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{campaign.name}</div>
                    <Badge variant="secondary">{campaign.campaign_type}</Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Progress</span>
                      <span>
                        {campaign.contacts_reached}/{campaign.total_contacts}
                      </span>
                    </div>
                    <Progress
                      value={
                        campaign.total_contacts > 0
                          ? (campaign.contacts_reached / campaign.total_contacts) * 100
                          : 0
                      }
                    />
                  </div>
                </div>
              ))}
              {data.activeCampaigns.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No active campaigns. Create a campaign to start engaging contacts.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pipeline Stages */}
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
          <CardDescription>Lead distribution across pipeline stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { stage: 'Lead', count: data.leadStats.total_leads - data.leadStats.mql_count - data.leadStats.sql_count - data.leadStats.opportunity_count - data.leadStats.customer_count, color: 'bg-gray-500' },
              { stage: 'MQL', count: data.leadStats.mql_count, color: 'bg-blue-500' },
              { stage: 'SQL', count: data.leadStats.sql_count, color: 'bg-purple-500' },
              { stage: 'Opportunity', count: data.leadStats.opportunity_count, color: 'bg-yellow-500' },
              { stage: 'Customer', count: data.leadStats.customer_count, color: 'bg-green-500' },
              { stage: 'Lost', count: 0, color: 'bg-red-500' },
            ].map((item) => (
              <div key={item.stage} className="text-center">
                <div className="text-2xl font-bold">{item.count}</div>
                <div className="text-sm text-muted-foreground mt-1">{item.stage}</div>
                <div className={`h-2 rounded-full ${item.color} mt-2`} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/crm/contacts')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Contacts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Manage contacts and convert them to leads
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/crm/leads')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and qualify leads, track pipeline progress
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/crm/campaigns')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Campaigns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Create and manage multi-channel campaigns
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/dashboard/crm/analytics')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View analytics, reports, and metrics
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

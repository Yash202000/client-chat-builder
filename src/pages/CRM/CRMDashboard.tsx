import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users, Send, TrendingUp, TrendingDown, DollarSign,
  Target, Star, ArrowUpRight, BarChart3, UserPlus,
  Zap, CircleDollarSign, Percent, Loader2, LayoutDashboard,
  ArrowRight, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import axios from 'axios';

interface DashboardData {
  leadStats: {
    total_leads: number;
    lead_count: number;
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
  recentLeads: any[];
  activeCampaigns: any[];
}

const STAGE_META: Record<string, { color: string; dot: string; label?: string }> = {
  lead:        { color: 'text-slate-500',   dot: '#94a3b8' },
  mql:         { color: 'text-blue-600',    dot: '#3b82f6' },
  sql:         { color: 'text-violet-600',  dot: '#7c3aed' },
  opportunity: { color: 'text-orange-600',  dot: '#f97316' },
  customer:    { color: 'text-emerald-600', dot: '#10b981' },
  lost:        { color: 'text-red-500',     dot: '#ef4444' },
};

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
}

export default function CRMDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [leadStatsRes, recentLeadsRes, campaignsRes] = await Promise.all([
        axios.get('/api/v1/leads/stats', { headers }),
        axios.get('/api/v1/leads/', { headers, params: { limit: 5 } }),
        axios.get('/api/v1/campaigns/active', { headers, params: { limit: 5 } }).catch(() => ({ data: [] })),
      ]);
      setData({
        leadStats: leadStatsRes.data,
        recentLeads: recentLeadsRes.data,
        activeCampaigns: campaignsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const conversionRate = data.leadStats.total_leads > 0
    ? (((data.leadStats.customer_count || 0) / data.leadStats.total_leads) * 100).toFixed(1)
    : 0;

  const metrics = [
    {
      title: t('crm.dashboard.stats.totalLeads'),
      value: data.leadStats.total_leads,
      subtext: `${data.leadStats.qualified_count || 0} ${t('crm.leads.qualification.qualified').toLowerCase()}`,
      icon: Users,
      trend: '+12%', trendUp: true,
    },
    {
      title: t('crm.dashboard.stats.pipelineValue'),
      value: `$${(data.leadStats.total_pipeline_value || 0).toLocaleString()}`,
      subtext: `${data.leadStats.opportunity_count} ${t('crm.leads.stages.opportunity').toLowerCase()}`,
      icon: CircleDollarSign,
      trend: '+8%', trendUp: true,
    },
    {
      title: t('crm.dashboard.stats.conversionRate'),
      value: `${conversionRate}%`,
      subtext: `${data.leadStats.customer_count} ${t('crm.dashboard.customersWon')}`,
      icon: Percent,
      trend: '+2.3%', trendUp: true,
    },
    {
      title: t('crm.leads.stats.avgScore'),
      value: `${data.leadStats.avg_score ? data.leadStats.avg_score.toFixed(0) : 0}/100`,
      subtext: t('crm.leads.fields.score'),
      icon: Star,
      trend: '+5', trendUp: true,
    },
  ];

  const pipelineStages = [
    { stage: 'lead',        label: t('crm.leads.stages.new'),         count: data.leadStats.lead_count || 0 },
    { stage: 'mql',         label: 'MQL',                              count: data.leadStats.mql_count || 0 },
    { stage: 'sql',         label: 'SQL',                              count: data.leadStats.sql_count || 0 },
    { stage: 'opportunity', label: t('crm.leads.stages.opportunity'),  count: data.leadStats.opportunity_count || 0 },
    { stage: 'customer',    label: t('crm.leads.stages.customer'),     count: data.leadStats.customer_count || 0 },
    { stage: 'lost',        label: t('crm.leads.stages.lost'),         count: data.leadStats.lost_count || 0 },
  ];
  const maxStageCount = Math.max(...pipelineStages.map(s => s.count), 1);

  const quickActions = [
    { title: t('crm.contacts.title'),                  description: t('crm.dashboard.quickActions.contactsDesc'),  icon: Users,    path: '/dashboard/crm/contacts' },
    { title: t('crm.leads.title'),                     description: t('crm.dashboard.quickActions.leadsDesc'),     icon: UserPlus, path: '/dashboard/crm/leads' },
    { title: t('crm.campaigns.title'),                 description: t('crm.dashboard.quickActions.campaignsDesc'), icon: Send,     path: '/dashboard/crm/campaigns' },
    { title: t('crm.dashboard.quickActions.analytics'),description: t('crm.dashboard.quickActions.analyticsDesc'),icon: BarChart3, path: '/dashboard/crm/analytics' },
  ];

  return (
    <div className="min-h-full bg-background">

      {/* ── Page header ─────────────────────────────────────────────── */}
      <div className="bg-card border-b border-border px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-muted dark:bg-white/[0.09] border border-border dark:border-white/[0.07] flex items-center justify-center flex-shrink-0">
            <LayoutDashboard className="h-4.5 w-4.5 text-foreground/60 dark:text-white/70" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground leading-tight">
              {t('crm.dashboard.title')}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('crm.dashboard.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6">

        {/* ── Metric cards ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <div key={metric.title}
                className="p-5 rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-all duration-200 row-hover-active">
                <div className="flex items-start justify-between mb-4">
                  <div className="h-9 w-9 rounded-lg bg-muted dark:bg-white/[0.09] border border-border dark:border-white/[0.07] flex items-center justify-center flex-shrink-0">
                    <Icon className="h-4 w-4 text-foreground/60 dark:text-white/70" />
                  </div>
                  <div className={cn(
                    'flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
                    metric.trendUp
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                      : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                  )}>
                    {metric.trendUp
                      ? <TrendingUp className="h-3 w-3" />
                      : <TrendingDown className="h-3 w-3" />}
                    {metric.trend}
                  </div>
                </div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-1">
                  {metric.title}
                </p>
                <p className="text-2xl font-bold text-foreground mb-0.5 tabular-nums">{metric.value}</p>
                <p className="text-xs text-muted-foreground">{metric.subtext}</p>
              </div>
            );
          })}
        </div>

        {/* ── Pipeline overview ────────────────────────────────────── */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">{t('crm.dashboard.pipelineOverview')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('crm.dashboard.pipelineDescription')}</p>
            </div>
            <button
              onClick={() => navigate('/dashboard/crm/leads')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              {pipelineStages.map((item) => {
                const meta = STAGE_META[item.stage];
                const pct = Math.round((item.count / maxStageCount) * 100);
                return (
                  <div
                    key={item.stage}
                    className="rounded-xl border border-border bg-background p-4 row-hover-active cursor-pointer transition-all text-center group"
                    onClick={() => navigate(`/dashboard/crm/leads?stage=${item.stage}`)}
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: meta.dot }} />
                      <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground transition-colors truncate">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums mb-2">{item.count}</p>
                    <div className="h-1 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, backgroundColor: meta.dot, opacity: 0.7 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Recent Leads + Active Campaigns ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Recent Leads */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('crm.dashboard.recentLeads')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('crm.dashboard.recentLeadsDesc')}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/crm/leads')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('crm.common.showMore')} <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {data.recentLeads.slice(0, 5).map((lead: any) => {
                const meta = STAGE_META[lead.stage] || STAGE_META.lead;
                return (
                  <div
                    key={lead.id}
                    className="flex items-center gap-3 px-6 py-3 row-hover-active cursor-pointer"
                    onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                  >
                    <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-muted-foreground">
                        {getInitials(lead.contact?.name || '')}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{lead.contact?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground truncate">{lead.contact?.email}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-muted border border-border">
                        <Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />
                        <span className="text-[10px] font-semibold text-foreground tabular-nums">{lead.score}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                        <span className={cn('text-[10px] font-semibold uppercase', meta.color)}>
                          {lead.stage ?? '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
              {data.recentLeads.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                    <Users className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('crm.leads.noLeads')}</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => navigate('/dashboard/crm/leads')}
                  >
                    {t('crm.leads.noLeadsMessage')}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-foreground">{t('crm.dashboard.activeCampaigns')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('crm.dashboard.activeCampaignsDesc')}</p>
              </div>
              <button
                onClick={() => navigate('/dashboard/crm/campaigns')}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('crm.common.showMore')} <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="divide-y divide-border/50">
              {data.activeCampaigns.map((campaign: any) => {
                const progress = campaign.total_contacts > 0
                  ? (campaign.contacts_reached / campaign.total_contacts) * 100
                  : 0;
                const engagedPct = campaign.contacts_reached > 0
                  ? ((campaign.contacts_engaged / campaign.contacts_reached) * 100).toFixed(0)
                  : 0;
                const convertedPct = campaign.contacts_reached > 0
                  ? ((campaign.contacts_converted / campaign.contacts_reached) * 100).toFixed(0)
                  : 0;
                return (
                  <div
                    key={campaign.id}
                    className="px-6 py-4 row-hover-active cursor-pointer"
                    onClick={() => navigate(`/dashboard/crm/campaigns/${campaign.id}`)}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <p className="text-sm font-medium text-foreground truncate flex-1 mr-3">{campaign.name}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {t('crm.campaigns.status.active')}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{t('crm.campaigns.progress')}</span>
                        <span className="font-medium text-foreground tabular-nums">
                          {campaign.contacts_reached}/{campaign.total_contacts}
                        </span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          <span>{engagedPct}% {t('crm.dashboard.engaged')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          <span>{convertedPct}% {t('crm.dashboard.converted')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {data.activeCampaigns.length === 0 && (
                <div className="flex flex-col items-center py-10 gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center">
                    <Send className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('crm.dashboard.noActiveCampaigns')}</p>
                  <button
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
                    onClick={() => navigate('/dashboard/crm/campaigns/new')}
                  >
                    {t('crm.campaigns.addCampaign')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Quick actions ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <div
                key={action.title}
                className="p-4 rounded-xl border border-border bg-card cursor-pointer row-hover-active group flex items-center gap-3"
                onClick={() => navigate(action.path)}
              >
                <div className="h-9 w-9 rounded-lg bg-muted dark:bg-white/[0.09] border border-border dark:border-white/[0.07] flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-foreground/60 dark:text-white/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{action.title}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

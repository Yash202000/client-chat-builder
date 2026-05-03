import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare, Users, CheckCircle2, TrendingUp,
  Bot, Phone, Clock, Star, ArrowRight, Activity,
  Inbox, BarChart3, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Metrics {
  total_sessions: number;
  active_conversations: number;
  resolved_conversations: number;
  resolution_rate: string;
  customer_satisfaction: number;
  active_agents: number;
  available_users: number;
  total_users: number;
  agent_availability_rate: string;
  unattended_conversations: number;
}

interface Summary {
  total_sessions: number;
  resolved_sessions: number;
  resolution_rate: number;
  sessions_per_channel: { channel: string; count: number }[];
  sessions_by_status: { status: string; count: number }[];
  daily_volume: { date: string; count: number }[];
  sessions_per_agent: { agent: string; count: number }[];
  days: number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const CHANNEL_COLORS: Record<string, string> = {
  web_chat: '#6366f1',
  whatsapp: '#22c55e',
  instagram: '#f43f5e',
  messenger: '#3b82f6',
  telegram: '#06b6d4',
  twilio_voice: '#f97316',
  email: '#8b5cf6',
  sms: '#eab308',
  api: '#64748b',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#6366f1',
  resolved: '#22c55e',
  pending: '#f59e0b',
  archived: '#94a3b8',
  waiting_for_agent: '#f97316',
};

function StatCard({
  label, value, sub, icon: Icon, color, onClick,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; onClick?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-5 flex items-start justify-between gap-4 ${onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
    >
      <div>
        <p className="text-xs text-muted-foreground font-medium mb-1.5">{label}</p>
        <p className="text-3xl font-bold text-foreground tracking-tight">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
      </div>
      <div className={`h-11 w-11 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </motion.div>
  );
}

function QuickLink({ label, sub, icon: Icon, color, to }: {
  label: string; sub: string; icon: React.ElementType; color: string; to: string;
}) {
  const navigate = useNavigate();
  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => navigate(to)}
      className="flex items-center gap-3 p-4 bg-card border border-border rounded-xl hover:border-primary/40 hover:bg-muted/30 transition-all text-left w-full group"
    >
      <div className={`h-9 w-9 rounded-lg ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="h-4 w-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{sub}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </motion.button>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export const DashboardPage = () => {
  const { authFetch, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['dashboard-metrics'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/reports/metrics');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const { data: summary } = useQuery<Summary>({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/reports/summary?days=7');
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    refetchInterval: 60_000,
  });

  const firstName = user?.first_name || user?.email?.split('@')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    {
      label: 'Total Conversations (today)',
      value: metrics?.total_sessions ?? '—',
      sub: `${metrics?.active_conversations ?? 0} active`,
      icon: MessageSquare,
      color: 'bg-violet-500',
      path: '/dashboard/conversations',
    },
    {
      label: 'Resolution Rate',
      value: metrics?.resolution_rate ?? '—',
      sub: `${metrics?.resolved_conversations ?? 0} resolved`,
      icon: CheckCircle2,
      color: 'bg-emerald-500',
      path: '/dashboard/reports',
    },
    {
      label: 'Agents Online',
      value: `${metrics?.available_users ?? 0} / ${metrics?.total_users ?? 0}`,
      sub: metrics?.agent_availability_rate ?? '',
      icon: Users,
      color: 'bg-blue-500',
      path: '/dashboard/team',
    },
    {
      label: 'Needs Attention',
      value: metrics?.unattended_conversations ?? '—',
      sub: 'unattended conversations',
      icon: Clock,
      color: 'bg-amber-500',
      path: '/dashboard/conversations',
    },
    {
      label: 'Customer Satisfaction',
      value: metrics?.customer_satisfaction ? metrics.customer_satisfaction.toFixed(1) + ' ★' : '—',
      sub: 'avg feedback rating',
      icon: Star,
      color: 'bg-yellow-500',
      path: '/dashboard/reports',
    },
    {
      label: 'Active AI Agents',
      value: metrics?.active_agents ?? '—',
      sub: 'agents deployed',
      icon: Bot,
      color: 'bg-primary',
      path: '/dashboard/agents',
    },
  ];

  const quickLinks = [
    { label: 'Conversations', sub: 'View live customer conversations', icon: Inbox, color: 'bg-violet-500', to: '/dashboard/conversations' },
    { label: 'Agent Builder', sub: 'Create and configure AI agents', icon: Bot, color: 'bg-primary', to: '/dashboard/agents' },
    { label: 'Reports', sub: 'Analytics and performance metrics', icon: BarChart3, color: 'bg-emerald-500', to: '/dashboard/reports' },
    { label: 'Team', sub: 'Manage users and roles', icon: Users, color: 'bg-blue-500', to: '/dashboard/team' },
    { label: 'CRM', sub: 'Contacts, leads and campaigns', icon: TrendingUp, color: 'bg-orange-500', to: '/dashboard/crm' },
    { label: 'AI Tools', sub: 'Custom AI utilities', icon: Zap, color: 'bg-cyan-500', to: '/dashboard/ai-tools' },
  ];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 flex-shrink-0">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {greeting}, {firstName} 👋
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Here's what's happening with your workspace today
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-muted-foreground">Live</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statCards.map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <StatCard
                label={card.label}
                value={card.value}
                sub={card.sub}
                icon={card.icon}
                color={card.color}
                onClick={() => navigate(card.path)}
              />
            </motion.div>
          ))}
        </div>

        {/* Charts row */}
        {summary && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Daily volume — area chart */}
            <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="h-4 w-4 text-violet-500" />
                <h3 className="text-sm font-semibold text-foreground">Conversation volume — last 7 days</h3>
                <span className="ml-auto text-xs text-muted-foreground">
                  {summary.total_sessions} total · {summary.resolution_rate}% resolved
                </span>
              </div>
              {summary.daily_volume.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={summary.daily_volume} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={d => d.slice(5)} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <RTooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Area type="monotone" dataKey="count" name="Sessions" stroke="#6366f1" strokeWidth={2} fill="url(#volGrad)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              )}
            </div>

            {/* Channel breakdown — donut */}
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-4 w-4 text-orange-500" />
                <h3 className="text-sm font-semibold text-foreground">By channel</h3>
              </div>
              {summary.sessions_per_channel.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={130}>
                    <PieChart>
                      <Pie
                        data={summary.sessions_per_channel}
                        dataKey="count"
                        nameKey="channel"
                        cx="50%"
                        cy="50%"
                        innerRadius={38}
                        outerRadius={60}
                        paddingAngle={2}
                      >
                        {summary.sessions_per_channel.map((entry, i) => (
                          <Cell key={entry.channel} fill={CHANNEL_COLORS[entry.channel] ?? `hsl(${i * 47 % 360},60%,55%)`} />
                        ))}
                      </Pie>
                      <RTooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-1.5 mt-2">
                    {summary.sessions_per_channel.slice(0, 4).map(ch => (
                      <div key={ch.channel} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: CHANNEL_COLORS[ch.channel] ?? '#6366f1' }} />
                          <span className="text-muted-foreground capitalize">{ch.channel.replace('_', ' ')}</span>
                        </div>
                        <span className="font-semibold text-foreground">{ch.count}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-sm text-muted-foreground">No data yet</div>
              )}
            </div>
          </div>
        )}

        {/* Bottom row: agent leaderboard + quick links */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Agent leaderboard */}
          {summary && summary.sessions_per_agent.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Users className="h-4 w-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-foreground">Agent leaderboard</h3>
                <button
                  onClick={() => navigate('/dashboard/reports')}
                  className="ml-auto text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Full report <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              <div className="space-y-3">
                {summary.sessions_per_agent.slice(0, 5).map((row, i) => (
                  <div key={row.agent} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4 text-right">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground truncate">{row.agent}</span>
                        <span className="text-xs font-bold text-violet-500 ml-2">{row.count}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-cyan-500 rounded-full"
                          style={{ width: `${(row.count / summary.sessions_per_agent[0].count) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick links */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground mb-3">Quick access</h3>
            {quickLinks.map(link => (
              <QuickLink key={link.to} {...link} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

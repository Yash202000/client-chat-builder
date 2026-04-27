import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  BarChart3, Phone, CheckCircle, Clock, TrendingDown,
  Star, Users, AlertCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';

// ── Types ─────────────────────────────────────────────────────────────────────

interface DayData { date: string; calls: number; completed: number; }
interface AgentData { agent_id: number; agent_name: string; calls: number; avg_duration: number; }

interface Analytics {
  total_calls: number;
  inbound: number;
  outbound: number;
  completed: number;
  no_answer: number;
  failed: number;
  avg_handle_time_secs: number;
  avg_speed_to_answer_secs: number;
  abandonment_rate: number;
  csat_avg: number;
  by_day: DayData[];
  by_agent: AgentData[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(secs: number): string {
  if (!secs) return '0s';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

const PIE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#6366f1', '#64748b'];

const RANGE_OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
  { label: '6m', days: 180 },
  { label: '1y', days: 365 },
];

// ── Stat card ─────────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color, sub,
}: { label: string; value: string | number; icon: React.ElementType; color: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-5"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium mb-1">{label}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
        <div className={`h-10 w-10 rounded-xl ${color} flex items-center justify-center`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
      </div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function CallAnalyticsPage() {
  const { t } = useTranslation();
  const { authFetch } = useAuth();
  const [days, setDays] = useState(30);

  const { data, isLoading } = useQuery<Analytics>({
    queryKey: ['call-analytics', days],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/voice/supervisor/analytics?days=${days}`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
  });

  const pieData = data
    ? [
        { name: t('analytics.completed'), value: data.completed },
        { name: t('analytics.noAnswer'), value: data.no_answer },
        { name: t('analytics.failed'), value: data.failed },
      ].filter(d => d.value > 0)
    : [];

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 flex-shrink-0">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5 text-primary" />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{t('analytics.title')}</h1>
            <p className="text-xs text-muted-foreground">{t('analytics.subtitle')}</p>
          </div>
        </div>
        {/* Day range selector */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.days}
              onClick={() => setDays(opt.days)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                days === opt.days
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-16">{t('analytics.loading')}</div>
        ) : data ? (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard label={t('analytics.totalCalls')} value={data.total_calls} icon={Phone} color="bg-blue-500" sub={`${data.inbound} ${t('analytics.inbound')} / ${data.outbound} ${t('analytics.outbound')}`} />
              <StatCard label={t('analytics.completed')} value={data.completed} icon={CheckCircle} color="bg-emerald-500" />
              <StatCard label={t('analytics.avgHandleTime')} value={fmt(data.avg_handle_time_secs)} icon={Clock} color="bg-violet-500" />
              <StatCard label={t('analytics.avgSpeedAnswer')} value={fmt(data.avg_speed_to_answer_secs)} icon={TrendingDown} color="bg-amber-500" />
              <StatCard
                label={t('analytics.abandonmentRate')}
                value={`${(data.abandonment_rate * 100).toFixed(1)}%`}
                icon={AlertCircle}
                color="bg-red-500"
              />
              <StatCard
                label={t('analytics.csatAvg')}
                value={data.csat_avg > 0 ? data.csat_avg.toFixed(1) : '—'}
                icon={Star}
                color="bg-yellow-500"
                sub={data.csat_avg > 0 ? t('analytics.outOf5') : t('analytics.noData')}
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bar chart: calls by day */}
              <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">{t('analytics.callsByDay')}</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={data.by_day} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={d => d.slice(5)}
                    />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                    <RTooltip
                      contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                    />
                    <Bar dataKey="calls" name={t('analytics.totalCalls')} fill="#6366f1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="completed" name={t('analytics.completed')} fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie chart: status breakdown */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">{t('analytics.statusBreakdown')}</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="45%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {pieData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                      <RTooltip
                        contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex items-center justify-center text-sm text-muted-foreground">
                    {t('analytics.noData')}
                  </div>
                )}
              </div>
            </div>

            {/* Per-agent table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-border/60">
                <Users className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">{t('analytics.byAgent')}</h3>
              </div>
              {data.by_agent.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">{t('analytics.noData')}</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/30">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground">{t('analytics.agent')}</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">{t('analytics.calls')}</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground">{t('analytics.avgDuration')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.by_agent.map(row => (
                        <tr key={row.agent_id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                          <td className="px-5 py-3 font-medium text-foreground">{row.agent_name || `Agent ${row.agent_id}`}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{row.calls}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground font-mono">{fmt(row.avg_duration)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

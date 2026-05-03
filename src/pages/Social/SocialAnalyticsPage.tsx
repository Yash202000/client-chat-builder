import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3, TrendingUp, Eye, Heart, MessageCircle,
  Share2, Linkedin, Instagram, Facebook, RefreshCw,
  Loader2, FileText, Zap, Users,
} from 'lucide-react';

/* ─── animations ──────────────────────────────────────────── */
const ANIM = `
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes bar-grow {
    from { transform: scaleY(0); }
    to   { transform: scaleY(1); }
  }
  @keyframes count-in {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up  { animation: fade-up  0.4s ease both; }
  .count-in { animation: count-in 0.5s ease both; }
  .bar-col  { transform-origin: bottom; animation: bar-grow 0.6s cubic-bezier(.22,1,.36,1) both; }
`;

/* ─── helpers ─────────────────────────────────────────────── */
const authFetch = async (url: string) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

const fmt = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M`
  : n >= 1_000   ? `${(n / 1_000).toFixed(1)}K`
  : String(n);

/* ─── platform meta ───────────────────────────────────────── */
const PLAT: Record<string, { label: string; color: string; gradient: string; Icon: typeof Linkedin }> = {
  linkedin:  { label: 'LinkedIn',  color: '#0A66C2', gradient: 'linear-gradient(135deg,#0A66C2,#0A8CF0)', Icon: Linkedin  },
  instagram: { label: 'Instagram', color: '#C13584', gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', Icon: Instagram },
  facebook:  { label: 'Facebook',  color: '#1877F2', gradient: 'linear-gradient(135deg,#1877F2,#42a5f5)', Icon: Facebook  },
};

/* ─── Skeleton ────────────────────────────────────────────── */
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
);

/* ─── Inline bar chart ────────────────────────────────────── */
function MiniBarChart({ data, color }: { data: { label: string; value: number }[]; color: string }) {
  if (!data.length) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end gap-0.5 h-16 w-full">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-0.5 group relative h-full justify-end">
          <div
            className="bar-col w-full rounded-t-sm min-h-[2px] transition-opacity group-hover:opacity-80"
            style={{
              height: `${Math.max((d.value / max) * 100, 4)}%`,
              background: color,
              animationDelay: `${i * 0.02}s`,
            }}
          />
          {/* tooltip */}
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex flex-col items-center z-10 pointer-events-none">
            <div className="bg-foreground text-background text-[9px] font-medium px-1.5 py-0.5 rounded whitespace-nowrap">
              {d.label}: {fmt(d.value)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Stat card ───────────────────────────────────────────── */
function StatCard({
  icon: Icon, label, value, sub, delay = 0,
}: { icon: typeof BarChart3; label: string; value: string | number; sub?: string; delay?: number }) {
  return (
    <div
      className="fade-up rounded-2xl border border-border bg-card p-5 flex flex-col gap-3"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="h-7 w-7 rounded-xl bg-muted flex items-center justify-center">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      <div>
        <p className="count-in text-3xl font-bold tracking-tight text-foreground" style={{ animationDelay: `${delay + 0.1}s` }}>
          {typeof value === 'number' ? fmt(value) : value}
        </p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/* ─── Post row ────────────────────────────────────────────── */
function PostRow({ post, rank }: { post: any; rank: number }) {
  const meta = PLAT[post.platform] ?? PLAT.linkedin;
  const Icon = meta.Icon;
  const engagements = (post.likes ?? 0) + (post.comments ?? 0) + (post.shares ?? 0);
  const date = post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—';

  return (
    <div className="fade-up grid grid-cols-[28px_24px_1fr] sm:grid-cols-[28px_24px_1fr_repeat(4,60px)] items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors group border border-transparent hover:border-border">
      {/* Rank */}
      <span className="text-xs font-bold text-muted-foreground/40 tabular-nums text-center">
        {rank <= 3 ? ['🥇','🥈','🥉'][rank - 1] : `#${rank}`}
      </span>

      {/* Platform icon */}
      <div className="h-6 w-6 rounded-md flex items-center justify-center shrink-0" style={{ background: meta.gradient }}>
        <Icon className="h-3.5 w-3.5 text-white" />
      </div>

      {/* Content */}
      <div className="min-w-0">
        <p className="text-xs text-foreground line-clamp-1 leading-snug">{post.content_preview || <span className="italic text-muted-foreground">No text</span>}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] text-muted-foreground">{date}</span>
          {post.url && (
            <a href={post.url} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
              ↗ view
            </a>
          )}
          {post.source === 'platform_direct' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">direct</span>
          )}
        </div>
      </div>

      {/* Stats */}
      {[
        { icon: Heart,         val: post.likes       ?? 0 },
        { icon: MessageCircle, val: post.comments    ?? 0 },
        { icon: Share2,        val: post.shares      ?? 0 },
        { icon: Eye,           val: post.impressions ?? 0 },
      ].map(({ icon: SIcon, val }, i) => (
        <div key={i} className="hidden sm:flex items-center justify-end gap-1">
          <SIcon className="h-2.5 w-2.5 text-muted-foreground/50 shrink-0" />
          <span className="text-[11px] font-medium text-foreground tabular-nums">{fmt(val)}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── main page ───────────────────────────────────────────── */
export default function SocialAnalyticsPage() {
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [days, setDays] = useState(30);
  const [showPlatformPosts, setShowPlatformPosts] = useState(false);

  /* fetch connected accounts */
  const { data: accountsData, isLoading: accountsLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => authFetch('/api/v1/social/accounts'),
  });
  const accounts: any[] = Array.isArray(accountsData) ? accountsData : [];

  /* active account */
  const activeAccount = selectedAccountId
    ? accounts.find(a => a.id === selectedAccountId)
    : null;

  const accountParam = selectedAccountId ? `&account_id=${selectedAccountId}` : '';

  /* overview */
  const { data: overview, isLoading: overviewLoading, refetch } = useQuery({
    queryKey: ['social-analytics-overview', selectedAccountId, days],
    queryFn: () => authFetch(`/api/v1/social/analytics/overview?days=${days}${accountParam}`),
  });

  /* AgentConnect posts */
  const { data: postsRaw, isLoading: postsLoading } = useQuery({
    queryKey: ['social-analytics-posts', selectedAccountId, days],
    queryFn: () => authFetch(`/api/v1/social/analytics/posts?days=${days}${accountParam}&limit=20`),
  });
  const acPosts: any[] = Array.isArray(postsRaw) ? postsRaw : (postsRaw?.posts ?? []);

  /* Platform-direct posts (LinkedIn posts made outside AgentConnect) */
  const { data: platformData, isLoading: platformLoading, refetch: refetchPlatform, error: platformError } = useQuery({
    queryKey: ['platform-posts', selectedAccountId],
    queryFn: () => authFetch(`/api/v1/social/accounts/${selectedAccountId}/platform-posts?limit=50`),
    enabled: !!selectedAccountId && showPlatformPosts,
    retry: false,
  });
  const platformPosts: any[] = platformData?.posts ?? [];

  /* Merge: platform posts + AgentConnect posts (dedupe by content) */
  const posts = showPlatformPosts && selectedAccountId
    ? [
        ...platformPosts,
        ...acPosts.filter(p => !platformPosts.some((pp: any) => pp.content_preview === p.content_preview)),
      ]
    : acPosts;

  /* build chart data from posts (group by date) */
  const chartData = (() => {
    const byDate: Record<string, number> = {};
    for (const p of posts) {
      const d = p.published_at ? new Date(p.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null;
      if (d) byDate[d] = (byDate[d] ?? 0) + (p.likes ?? 0) + (p.comments ?? 0) + (p.shares ?? 0);
    }
    return Object.entries(byDate).slice(-14).map(([label, value]) => ({ label, value }));
  })();

  const activeMeta = activeAccount ? (PLAT[activeAccount.platform] ?? PLAT.linkedin) : null;
  const chartColor = activeMeta?.color ?? 'hsl(var(--primary))';

  return (
    <>
      <style>{ANIM}</style>
      <div className="h-full flex flex-col bg-background overflow-hidden">

        {/* ── Top bar ── */}
        <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-2.5 sm:py-3 border-b border-border bg-card">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h1 className="text-lg font-semibold text-foreground tracking-tight">Social Analytics</h1>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {activeAccount ? `Viewing — ${activeAccount.account_name}` : 'Select an account to view detailed stats'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sync from platform button — only when a LinkedIn account is selected */}
            {selectedAccountId && activeAccount?.platform === 'linkedin' && (
              <div className="relative group">
                <button
                  onClick={() => { setShowPlatformPosts(true); refetchPlatform(); }}
                  disabled={platformLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors border bg-card disabled:opacity-50"
                  style={
                    platformError
                      ? { borderColor: 'hsl(var(--destructive))', color: 'hsl(var(--destructive))' }
                      : showPlatformPosts && !platformError
                      ? { borderColor: '#0A66C2', color: '#0A66C2' }
                      : {}
                  }
                  title={platformError ? (platformError as any)?.message : undefined}
                >
                  {platformLoading
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Linkedin className="h-3 w-3" />}
                  {platformError
                    ? 'Sync unavailable'
                    : showPlatformPosts
                    ? 'LinkedIn synced'
                    : 'Sync LinkedIn posts'}
                </button>
                {/* Tooltip for error */}
                {platformError && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 z-20 rounded-xl border border-border bg-card p-3 shadow-lg hidden group-hover:block">
                    <p className="text-[11px] font-semibold text-foreground mb-1">LinkedIn sync requires additional access</p>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Reading your LinkedIn posts requires <span className="font-medium text-foreground">Marketing Developer Platform</span> access.
                      Apply at <span className="font-medium text-foreground">linkedin.com/developers</span> → your app → Products → Request access.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Date range */}
            {(['7','30','90'] as const).map(d => (
              <button
                key={d}
                onClick={() => setDays(Number(d))}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                  days === Number(d)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {d}d
              </button>
            ))}
            <button
              onClick={() => refetch()}
              className="ml-1 h-8 w-8 rounded-lg bg-muted flex items-center justify-center hover:bg-muted/70 transition-colors"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${overviewLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ── Account tabs ── */}
        <div className="shrink-0 flex items-center gap-1 px-4 sm:px-6 py-2.5 border-b border-border bg-background overflow-x-auto">
          <button
            onClick={() => setSelectedAccountId(null)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              !selectedAccountId
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            All Accounts
          </button>

          {accountsLoading
            ? [1, 2].map(i => <Skeleton key={i} className="h-9 w-32 rounded-xl" />)
            : accounts.map(acct => {
                const meta = PLAT[acct.platform] ?? PLAT.linkedin;
                const Icon = meta.Icon;
                const active = selectedAccountId === acct.id;
                return (
                  <button
                    key={acct.id}
                    onClick={() => setSelectedAccountId(active ? null : acct.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                      active ? 'text-white shadow-sm' : 'bg-card text-muted-foreground hover:text-foreground border-border hover:bg-muted'
                    }`}
                    style={active ? { background: meta.gradient, borderColor: 'transparent' } : {}}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {acct.account_name}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${active ? 'bg-white/20' : 'bg-muted'}`}>
                      {acct.platform}
                    </span>
                  </button>
                );
              })}
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {overviewLoading ? (
              [0,1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)
            ) : (
              <>
                <StatCard icon={FileText}   label="Total Posts"   value={overview?.total_posts ?? 0}       sub={`${overview?.published_posts ?? 0} published`} delay={0}    />
                <StatCard icon={Eye}        label="Impressions"   value={overview?.total_impressions ?? 0} sub="total reach"      delay={0.05} />
                <StatCard icon={Zap}        label="Engagements"   value={overview?.total_engagements ?? 0} sub="likes + comments + shares" delay={0.1}  />
                <StatCard icon={TrendingUp} label="Eng. Rate"     value={`${overview?.engagement_rate ?? 0}%`} sub="of impressions" delay={0.15} />
              </>
            )}
          </div>

          {/* Engagement chart + breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Chart */}
            <div className="lg:col-span-2 fade-up rounded-2xl border border-border bg-card p-5" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">Engagement over time</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Daily likes + comments + shares</p>
                </div>
                {activeMeta && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 rounded-full" style={{ background: activeMeta.color }} />
                    <span className="text-[10px] text-muted-foreground font-medium">{activeMeta.label}</span>
                  </div>
                )}
              </div>
              {overviewLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : chartData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-16 gap-1">
                  <TrendingUp className="h-5 w-5 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground">No published posts in this period</p>
                </div>
              ) : (
                <MiniBarChart data={chartData} color={chartColor} />
              )}
              {/* x-axis labels */}
              {chartData.length > 0 && (
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-muted-foreground">{chartData[0]?.label}</span>
                  <span className="text-[9px] text-muted-foreground">{chartData[chartData.length - 1]?.label}</span>
                </div>
              )}
            </div>

            {/* Breakdown */}
            <div className="fade-up rounded-2xl border border-border bg-card p-5 space-y-4" style={{ animationDelay: '0.25s' }}>
              <p className="text-sm font-semibold text-foreground">Breakdown</p>
              {overviewLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-8 rounded-xl" />)}</div>
              ) : (
                <div className="space-y-3">
                  {[
                    { label: 'Likes',    icon: Heart,         val: overview?.total_likes    ?? 0 },
                    { label: 'Comments', icon: MessageCircle, val: overview?.total_comments ?? 0 },
                    { label: 'Shares',   icon: Share2,        val: overview?.total_shares   ?? 0 },
                  ].map(({ label, icon: Icon, val }) => {
                    const total = (overview?.total_engagements ?? 1) || 1;
                    const pct = Math.round((val / total) * 100);
                    return (
                      <div key={label} className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[11px] text-muted-foreground">{label}</span>
                          </div>
                          <span className="text-xs font-semibold text-foreground tabular-nums">{fmt(val)}</span>
                        </div>
                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%`, background: chartColor }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              {/* Scheduled */}
              {!overviewLoading && (overview?.scheduled_posts ?? 0) > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-muted-foreground">Scheduled</span>
                    <span className="text-xs font-semibold text-foreground">{overview.scheduled_posts} posts</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Posts table */}
          <div className="fade-up rounded-2xl border border-border bg-card overflow-hidden" style={{ animationDelay: '0.3s' }}>
            {/* Header */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {showPlatformPosts && selectedAccountId ? 'All Posts (LinkedIn + AgentConnect)' : 'Top Posts'}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {showPlatformPosts && selectedAccountId
                    ? 'Posts from your LinkedIn account and AgentConnect'
                    : `By total engagement in last ${days} days`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {showPlatformPosts && selectedAccountId && (
                  <button
                    onClick={() => setShowPlatformPosts(false)}
                    className="text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    show AgentConnect only
                  </button>
                )}
                <span className="text-[10px] bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-medium">
                  {posts.length} posts
                </span>
              </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[28px_24px_1fr] sm:grid-cols-[28px_24px_1fr_repeat(4,60px)] gap-3 px-4 py-2 border-b border-border">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 text-center">#</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Plat</span>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60">Content</span>
              {['Likes','Cmts','Shares','Views'].map(h => (
                <span key={h} className="hidden sm:block text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/60 text-right">{h}</span>
              ))}
            </div>

            {/* Rows */}
            <div className="divide-y divide-border/50">
              {postsLoading ? (
                [1,2,3,4].map(i => (
                  <div key={i} className="px-4 py-3 flex gap-3 items-center">
                    <Skeleton className="h-4 w-5 rounded" />
                    <Skeleton className="h-6 w-6 rounded-md" />
                    <Skeleton className="h-4 flex-1 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                    <Skeleton className="h-4 w-10 rounded" />
                  </div>
                ))
              ) : posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
                    <FileText className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-foreground">No published posts</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Posts you publish will appear here with their stats</p>
                  </div>
                </div>
              ) : (
                posts.map((post, i) => (
                  <PostRow key={post.id} post={post} rank={i + 1} />
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

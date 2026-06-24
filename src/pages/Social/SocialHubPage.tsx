import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Linkedin,
  Instagram,
  Facebook,
  Plus,
  Calendar,
  TrendingUp,
  BarChart3,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowRight,
  Megaphone,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const authFetch = async (url: string) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

const RedditIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
);
const TwitterXIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
);

const PLATFORM_ICONS = {
  linkedin:  { Icon: Linkedin,     color: 'text-blue-600',   bg: 'bg-blue-100 dark:bg-blue-900'    },
  instagram: { Icon: Instagram,    color: 'text-pink-500',   bg: 'bg-pink-100 dark:bg-pink-900'    },
  facebook:  { Icon: Facebook,     color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900' },
  reddit:    { Icon: RedditIcon,   color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900' },
  twitter:   { Icon: TwitterXIcon, color: 'text-zinc-800',   bg: 'bg-zinc-100 dark:bg-zinc-800'    },
};

const StatusBadge = ({ status }: { status: string }) => {
  const { t } = useTranslation();
  const map: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    published: { label: t('social.status.published'), className: 'border-green-400 text-green-600', icon: CheckCircle2 },
    scheduled: { label: t('social.status.scheduled'), className: 'border-blue-400 text-blue-600', icon: Clock },
    draft: { label: t('social.status.draft'), className: 'border-slate-400 text-slate-500', icon: FileText },
    failed: { label: t('social.status.failed'), className: 'border-red-400 text-red-500', icon: AlertCircle },
  };
  const cfg = map[status] ?? map['draft'];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
};

export default function SocialHubPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const { data: accountsData } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => authFetch(`/api/v1/social/accounts`),
  });

  const { data: postsData } = useQuery({
    queryKey: ['social-posts-recent'],
    queryFn: () => authFetch(`/api/v1/social/posts?limit=10`),
  });

  const { data: analyticsData } = useQuery({
    queryKey: ['social-analytics-overview'],
    queryFn: () => authFetch(`/api/v1/social/analytics/overview`),
  });

  const accounts = Array.isArray(accountsData) ? accountsData : (accountsData?.accounts ?? []);
  const posts = postsData?.posts ?? [];
  const analytics = analyticsData ?? {};

  const kpis = [
    { label: t('social.postsThisWeek'), value: analytics.posts_this_week ?? 0, icon: FileText, color: 'text-blue-600' },
    { label: t('social.scheduled'), value: analytics.scheduled_count ?? 0, icon: Clock, color: 'text-violet-500' },
    { label: t('social.totalEngagements'), value: analytics.total_engagements ?? 0, icon: TrendingUp, color: 'text-green-500' },
    { label: t('social.totalReach'), value: analytics.total_reach ?? 0, icon: BarChart3, color: 'text-purple-500' },
  ];

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 max-w-6xl mx-auto space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            {t('social.title')}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 hidden sm:block">
            {t('social.subtitle')}
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/social/compose')} className="gap-2 flex-shrink-0">
          <Plus className="h-4 w-4" /><span className="hidden sm:inline">{t('social.newPost')}</span>
        </Button>
      </div>

      {/* Connected Accounts Strip */}
      <div className="flex flex-wrap gap-3">
        {(['linkedin', 'instagram', 'facebook'] as const).map(platform => {
          const cfg = PLATFORM_ICONS[platform];
          const Icon = cfg.Icon;
          const platformAccounts = accounts.filter((a: any) => a.platform === platform);
          return (
            <div
              key={platform}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer hover:shadow-sm transition-shadow ${
                platformAccounts.length ? 'border-slate-200 dark:border-slate-700' : 'border-dashed border-slate-300 dark:border-slate-600 opacity-60'
              }`}
              onClick={() => navigate('/dashboard/social/accounts')}
            >
              <div className={`p-1 rounded ${cfg.bg}`}>
                <Icon className={`h-4 w-4 ${cfg.color}`} />
              </div>
              <div>
                <p className="text-xs font-medium capitalize">{platform}</p>
                <p className="text-xs text-slate-400">
                  {platformAccounts.length ? t('social.connected', { count: platformAccounts.length }) : t('social.notConnected')}
                </p>
              </div>
            </div>
          );
        })}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
          onClick={() => navigate('/dashboard/social/accounts')}
        >
          {t('social.manageAccounts')} <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">{kpi.label}</p>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
                <p className="text-2xl font-bold mt-1">
                  {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">{t('social.recentPosts')}</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/dashboard/calendar')}>
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <FileText className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">{t('social.noPosts')}</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => navigate('/dashboard/social/compose')}>
                  <Plus className="h-3.5 w-3.5" /> {t('social.createFirstPost')}
                </Button>
              </div>
            ) : (
              <div className="divide-y dark:divide-slate-700">
                {posts.map((post: any) => {
                  const cfg = PLATFORM_ICONS[post.platform as keyof typeof PLATFORM_ICONS] ?? PLATFORM_ICONS.linkedin;
                  const PlatformIcon = cfg.Icon;
                  return (
                    <div key={post.id} className="p-3 flex items-start gap-3">
                      <div className={`p-1.5 rounded-md shrink-0 ${cfg.bg}`}>
                        <PlatformIcon className={`h-4 w-4 ${cfg.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-2">{post.content}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={post.status} />
                          {post.scheduled_at && (
                            <span className="text-xs text-slate-400">
                              {new Date(post.scheduled_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('social.quickActionsTitle')}</h3>
          {[
            { label: t('social.quickActions.compose'), description: t('social.quickActions.composeDesc'), icon: Plus, url: '/dashboard/social/compose', color: 'bg-purple-500' },
            { label: t('social.quickActions.trending'), description: t('social.quickActions.trendingDesc'), icon: TrendingUp, url: '/dashboard/social/trending', color: 'bg-blue-500' },
            { label: t('social.quickActions.calendar'), description: t('social.quickActions.calendarDesc'), icon: Calendar, url: '/dashboard/calendar',        color: 'bg-green-500' },
            { label: t('social.quickActions.linkedinLeads'), description: t('social.quickActions.linkedinLeadsDesc'), icon: Linkedin, url: '/dashboard/crm/linkedin-leads', color: 'bg-blue-600' },
          ].map(action => {
            const Icon = action.icon;
            return (
              <button
                key={action.url}
                onClick={() => navigate(action.url)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
              >
                <div className={`p-2 rounded-lg ${action.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white">{action.label}</p>
                  <p className="text-xs text-slate-500">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 ml-auto" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

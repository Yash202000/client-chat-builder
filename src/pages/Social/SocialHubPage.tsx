import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
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

const PLATFORM_ICONS = {
  linkedin: { Icon: Linkedin, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900' },
  instagram: { Icon: Instagram, color: 'text-pink-500', bg: 'bg-pink-100 dark:bg-pink-900' },
  facebook: { Icon: Facebook, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900' },
};

const StatusBadge = ({ status }: { status: string }) => {
  const map: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    published: { label: 'Published', className: 'border-green-400 text-green-600', icon: CheckCircle2 },
    scheduled: { label: 'Scheduled', className: 'border-blue-400 text-blue-600', icon: Clock },
    draft: { label: 'Draft', className: 'border-slate-400 text-slate-500', icon: FileText },
    failed: { label: 'Failed', className: 'border-red-400 text-red-500', icon: AlertCircle },
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
    { label: 'Posts This Week', value: analytics.posts_this_week ?? 0, icon: FileText, color: 'text-blue-600' },
    { label: 'Scheduled', value: analytics.scheduled_count ?? 0, icon: Clock, color: 'text-amber-500' },
    { label: 'Total Engagements', value: analytics.total_engagements ?? 0, icon: TrendingUp, color: 'text-green-500' },
    { label: 'Total Reach', value: analytics.total_reach ?? 0, icon: BarChart3, color: 'text-purple-500' },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-purple-600" />
            Marketing Hub
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage your social presence, create content, and track performance.
          </p>
        </div>
        <Button onClick={() => navigate('/dashboard/social/compose')} className="gap-2">
          <Plus className="h-4 w-4" />
          New Post
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
                  {platformAccounts.length ? `${platformAccounts.length} connected` : 'Not connected'}
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
          Manage accounts <ArrowRight className="h-3 w-3" />
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
              <CardTitle className="text-base">Recent Posts</CardTitle>
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => navigate('/dashboard/social/calendar')}>
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="p-0">
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <FileText className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No posts yet</p>
                <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => navigate('/dashboard/social/compose')}>
                  <Plus className="h-3.5 w-3.5" /> Create your first post
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
          <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Quick Actions</h3>
          {[
            { label: 'Compose New Post', description: 'Write and schedule posts for all platforms', icon: Plus, url: '/dashboard/social/compose', color: 'bg-purple-500' },
            { label: 'Find Trending Topics', description: 'Discover viral content and generate AI posts', icon: TrendingUp, url: '/dashboard/social/trending', color: 'bg-blue-500' },
            { label: 'Content Calendar', description: 'View and manage your publishing schedule', icon: Calendar, url: '/dashboard/social/calendar', color: 'bg-green-500' },
            { label: 'Import LinkedIn Leads', description: 'Turn LinkedIn profiles into CRM leads', icon: Linkedin, url: '/dashboard/crm/linkedin-leads', color: 'bg-blue-600' },
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

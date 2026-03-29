import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Linkedin, Instagram,
  Facebook, List, CalendarDays, Pencil, Trash2, Clock,
  CheckCircle2, FileText, AlertCircle,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

/* ─── fonts ─────────────────────────────────────────────── */
const FONT_STYLE = `

`;

/* ─── data ───────────────────────────────────────────────── */
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, ...options.headers },
  });
  if (!res.ok) throw new Error('Request failed');
  if (res.status === 204) return null;
  return res.json();
};

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

const PLATFORMS: Record<string, { Icon: typeof Linkedin; color: string; light: string; label: string }> = {
  linkedin:  { Icon: Linkedin,  color: '#0A66C2', light: 'rgba(10,102,194,0.12)',  label: 'LinkedIn'  },
  instagram: { Icon: Instagram, color: '#E1306C', light: 'rgba(225,48,108,0.11)', label: 'Instagram' },
  facebook:  { Icon: Facebook,  color: '#1877F2', light: 'rgba(24,119,242,0.11)', label: 'Facebook'  },
};

const STATUS_META: Record<string, { icon: typeof Clock; color: string; bg: string; label: string }> = {
  draft:     { icon: FileText,     color: '#94A3B8', bg: '#F1F5F9', label: 'Draft'     },
  scheduled: { icon: Clock,        color: '#D97706', bg: '#FFFBEB', label: 'Scheduled' },
  published: { icon: CheckCircle2, color: '#059669', bg: '#ECFDF5', label: 'Published' },
  failed:    { icon: AlertCircle,  color: '#E11D48', bg: '#FFF1F2', label: 'Failed'    },
};

/* ─── sub-components ─────────────────────────────────────── */
function PostChip({ post, onEdit, onDelete }: { post: any; onEdit: () => void; onDelete: () => void }) {
  const [deleting, setDeleting] = useState(false);
  const plat = PLATFORMS[post.platform] ?? PLATFORMS.linkedin;
  const status = STATUS_META[post.status] ?? STATUS_META.draft;
  const Icon = plat.Icon;

  if (deleting) return null;

  return (
    <div
      className="group relative flex items-center gap-1 rounded-md overflow-hidden cursor-pointer select-none"
      style={{ borderLeft: `3px solid ${plat.color}`, background: status.bg }}
      onClick={e => { e.stopPropagation(); onEdit(); }}
    >
      <Icon className="h-2.5 w-2.5 shrink-0 ml-1" style={{ color: plat.color }} />
      <span className="flex-1 text-[10px] font-medium truncate py-0.5 pr-1"
        style={{ color: '#374151' }}>
        {post.content?.slice(0, 22) ?? 'Post'}
      </span>
      {/* Hover actions */}
      <div className="hidden group-hover:flex absolute right-0 top-0 bottom-0 items-center gap-px px-0.5 bg-white/90 dark:bg-zinc-900/90 rounded-r-md border-l border-zinc-100 dark:border-zinc-800">
        <button className="p-0.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700"
          onClick={e => { e.stopPropagation(); onEdit(); }}>
          <Pencil className="h-2.5 w-2.5" />
        </button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="p-0.5 rounded hover:bg-red-50 text-zinc-400 hover:text-red-500"
              onClick={e => e.stopPropagation()}>
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent onClick={e => e.stopPropagation()}>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this post?</AlertDialogTitle>
              <AlertDialogDescription>This permanently deletes the {post.status} post.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-500 hover:bg-red-600" onClick={() => { setDeleting(true); onDelete(); }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────── */
export default function ContentCalendarPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [viewMode, setViewMode] = useState<'month' | 'list'>('month');
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  const startDate = new Date(year, month, 1).toISOString();
  const endDate   = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: postsData } = useQuery({
    queryKey: ['social-posts-calendar', year, month],
    queryFn: () => authFetch(`/api/v1/social/posts?from_date=${encodeURIComponent(startDate)}&to_date=${encodeURIComponent(endDate)}&limit=200`),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => authFetch(`/api/v1/social/posts/${id}`, { method: 'DELETE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['social-posts-calendar'] }); toast({ title: 'Post deleted' }); },
    onError: () => toast({ title: 'Failed to delete', variant: 'destructive' }),
  });

  const allPosts: any[] = Array.isArray(postsData) ? postsData : (postsData?.posts ?? []);
  const posts = platformFilter === 'all' ? allPosts : allPosts.filter(p => p.platform === platformFilter);

  const prevMonth = () => month === 0 ? (setMonth(11), setYear(y => y - 1)) : setMonth(m => m - 1);
  const nextMonth = () => month === 11 ? (setMonth(0), setYear(y => y + 1)) : setMonth(m => m + 1);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const getPostsForDay = (day: number) =>
    posts.filter((p: any) => {
      const d = new Date(p.scheduled_at ?? p.published_at ?? p.created_at);
      return d.getFullYear() === year && d.getMonth() === month && d.getDate() === day;
    });

  const composeUrl = (day?: number) =>
    day
      ? `/dashboard/social/compose?date=${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
      : '/dashboard/social/compose';

  /* summary stats */
  const scheduled  = allPosts.filter(p => p.status === 'scheduled').length;
  const published  = allPosts.filter(p => p.status === 'published').length;
  const drafts     = allPosts.filter(p => p.status === 'draft').length;

  return (
    <>
      <style>{FONT_STYLE}</style>

      <div className="flex flex-col h-full bg-[#FAFAF8] dark:bg-zinc-950 overflow-hidden"
        style={{ }}>

        {/* ── Top bar ── */}
        <div className="shrink-0 flex items-center justify-between px-6 py-3
          bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">

          {/* Left: title + nav */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth}
                className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <h2 style={{ }}
                className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-none tracking-tight min-w-[200px] text-center">
                {MONTHS[month]} <span className="text-zinc-400 dark:text-zinc-500 font-normal">{year}</span>
              </h2>
              <button onClick={nextMonth}
                className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Stats pills */}
            <div className="hidden md:flex items-center gap-2 pl-4 border-l border-zinc-200 dark:border-zinc-700">
              {[
                { count: scheduled, label: 'Scheduled', color: '#D97706', bg: '#FFFBEB' },
                { count: published, label: 'Published',  color: '#059669', bg: '#ECFDF5' },
                { count: drafts,    label: 'Drafts',     color: '#94A3B8', bg: '#F8FAFC' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: s.bg, color: s.color }}>
                  <span className="text-sm font-bold" style={{ }}>{s.count}</span>
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Right: view toggle + platform filter + new post */}
          <div className="flex items-center gap-2">
            {/* Platform filter */}
            <div className="hidden sm:flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
              {[{ key: 'all', label: 'All' }, ...Object.entries(PLATFORMS).map(([k, v]) => ({ key: k, label: v.label }))].map(p => (
                <button key={p.key} onClick={() => setPlatformFilter(p.key)}
                  className="px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                  style={platformFilter === p.key
                    ? { background: p.key === 'all' ? '#18181b' : PLATFORMS[p.key]?.color ?? '#18181b', color: '#fff' }
                    : { color: '#71717a' }
                  }>
                  {p.label}
                </button>
              ))}
            </div>

            {/* View mode */}
            <div className="flex bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg">
              <button onClick={() => setViewMode('month')}
                className="p-1.5 rounded-md transition-all"
                style={viewMode === 'month' ? { background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#71717a' }}>
                <CalendarDays className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode('list')}
                className="p-1.5 rounded-md transition-all"
                style={viewMode === 'list' ? { background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' } : { color: '#71717a' }}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>

            <button onClick={() => navigate(composeUrl())}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
              style={{ background: 'linear-gradient(135deg,#18181b,#374151)', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              <Plus className="h-3.5 w-3.5" /> New Post
            </button>
          </div>
        </div>

        {/* ── Calendar body ── */}
        <div className="flex-1 overflow-auto px-4 pb-4 pt-3">
          {viewMode === 'month' ? (
            <div className="h-full flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">

              {/* Day headers */}
              <div className="grid grid-cols-7 border-b border-zinc-100 dark:border-zinc-800">
                {DAYS_SHORT.map((d, i) => (
                  <div key={d} className="py-2 text-center">
                    <span className="text-[10px] font-semibold tracking-widest uppercase"
                      style={{ color: i === 0 || i === 6 ? '#CBD5E1' : '#94A3B8' }}>
                      {d}
                    </span>
                  </div>
                ))}
              </div>

              {/* Grid */}
              <div className="flex-1 grid grid-cols-7" style={{
                gridAutoRows: '1fr',
                borderRight: '1px solid transparent',
              }}>
                {/* Empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`e-${i}`} className="border-b border-r border-zinc-100 dark:border-zinc-800"
                    style={{ background: '#FAFAF8' }} />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayPosts = getPostsForDay(day);
                  const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;
                  const isWeekend = new Date(year, month, day).getDay() % 6 === 0;

                  return (
                    <div key={day}
                      className="group relative border-b border-r border-zinc-100 dark:border-zinc-800 p-1.5 min-h-[90px] transition-colors cursor-pointer"
                      style={{ background: isToday ? 'rgba(251,191,36,0.06)' : isWeekend ? '#FAFAF8' : 'white' }}
                      onClick={() => navigate(composeUrl(day))}
                    >
                      {/* Day number */}
                      <div className="flex items-start justify-between mb-1">
                        <span
                          className="h-6 w-6 flex items-center justify-center rounded-full text-xs font-semibold transition-colors"
                          style={isToday
                            ? { background: '#18181b', color: '#fff' }
                            : { color: isWeekend ? '#CBD5E1' : '#6B7280' }
                          }
                        >
                          {day}
                        </span>
                        {/* Hover compose button */}
                        <button
                          className="opacity-0 group-hover:opacity-100 h-5 w-5 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
                          onClick={e => { e.stopPropagation(); navigate(composeUrl(day)); }}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Post chips */}
                      <div className="space-y-0.5">
                        {dayPosts.slice(0, 3).map((post: any) => (
                          <PostChip
                            key={post.id}
                            post={post}
                            onEdit={() => navigate(`/dashboard/social/compose?edit=${post.id}`)}
                            onDelete={() => deleteMutation.mutate(post.id)}
                          />
                        ))}
                        {dayPosts.length > 3 && (
                          <div className="text-[10px] font-medium pl-1.5" style={{ color: '#94A3B8' }}>
                            +{dayPosts.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          ) : (
            /* ── List view ── */
            <div className="max-w-3xl mx-auto space-y-1">
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="h-16 w-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                    <CalendarDays className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-zinc-700 dark:text-zinc-300"
                      style={{ }}>
                      Nothing scheduled this month
                    </p>
                    <p className="text-sm text-zinc-400 mt-1">Start planning your content</p>
                  </div>
                  <button onClick={() => navigate(composeUrl())}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: '#18181b' }}>
                    <Plus className="h-4 w-4" /> Create Post
                  </button>
                </div>
              ) : (
                (() => {
                  // Group by date
                  const grouped: Record<string, any[]> = {};
                  posts.forEach((post: any) => {
                    const d = new Date(post.scheduled_at ?? post.published_at ?? post.created_at);
                    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                    if (!grouped[key]) grouped[key] = [];
                    grouped[key].push(post);
                  });

                  return Object.entries(grouped)
                    .sort(([a], [b]) => {
                      const [ay, am, ad] = a.split('-').map(Number);
                      const [by, bm, bd] = b.split('-').map(Number);
                      return new Date(ay, am, ad).getTime() - new Date(by, bm, bd).getTime();
                    })
                    .map(([key, dayPosts]) => {
                      const [y, m, d] = key.split('-').map(Number);
                      const date = new Date(y, m, d);
                      const isToday = date.toDateString() === today.toDateString();

                      return (
                        <div key={key}>
                          {/* Date separator */}
                          <div className="flex items-center gap-3 py-2 sticky top-0 bg-[#FAFAF8] dark:bg-zinc-950 z-10">
                            <div className="flex items-center gap-2.5">
                              <div className="h-8 w-8 rounded-lg flex flex-col items-center justify-center shrink-0"
                                style={{ background: isToday ? '#18181b' : '#F1F5F9', color: isToday ? '#fff' : '#64748B' }}>
                                <span className="text-[9px] font-semibold uppercase leading-none">
                                  {date.toLocaleDateString('en', { weekday: 'short' })}
                                </span>
                                <span className="text-sm font-bold leading-tight"
                                  style={{ }}>
                                  {date.getDate()}
                                </span>
                              </div>
                              <span className="text-xs font-medium text-zinc-400">
                                {date.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                          </div>

                          {/* Posts for this day */}
                          <div className="space-y-1 pb-1">
                            {dayPosts.map((post: any) => {
                              const plat = PLATFORMS[post.platform] ?? PLATFORMS.linkedin;
                              const status = STATUS_META[post.status] ?? STATUS_META.draft;
                              const StatusIcon = status.icon;
                              const PlatIcon = plat.Icon;
                              const postDate = new Date(post.scheduled_at ?? post.published_at ?? post.created_at);

                              return (
                                <div key={post.id}
                                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-700 hover:shadow-sm transition-all cursor-pointer group"
                                  style={{ borderLeft: `3px solid ${plat.color}` }}
                                  onClick={() => navigate(`/dashboard/social/compose?edit=${post.id}`)}
                                >
                                  {/* Platform icon */}
                                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                                    style={{ background: plat.light }}>
                                    <PlatIcon className="h-3.5 w-3.5" style={{ color: plat.color }} />
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate font-medium">
                                      {post.content ?? 'No content'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                                        <Clock className="h-2.5 w-2.5" />
                                        {postDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      <span className="text-zinc-200 dark:text-zinc-700">·</span>
                                      <span className="text-[10px]" style={{ color: plat.color }}>{plat.label}</span>
                                    </div>
                                  </div>

                                  {/* Status badge */}
                                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-semibold shrink-0"
                                    style={{ background: status.bg, color: status.color }}>
                                    <StatusIcon className="h-2.5 w-2.5" />
                                    {status.label}
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                                      onClick={e => { e.stopPropagation(); navigate(`/dashboard/social/compose?edit=${post.id}`); }}>
                                      <Pencil className="h-3 w-3" />
                                    </button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <button className="h-6 w-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-red-500 hover:bg-red-50"
                                          onClick={e => e.stopPropagation()}>
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
                                          <AlertDialogDescription>This permanently deletes the {post.status} post.</AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                          <AlertDialogAction className="bg-red-500 hover:bg-red-600"
                                            onClick={() => deleteMutation.mutate(post.id)}>Delete</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                })()
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

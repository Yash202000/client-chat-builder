import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  TrendingUp, Search, Linkedin, Instagram, Facebook,
  Loader2, Copy, Send, Sparkles, Hash, Link2,
  Zap, Radio, Globe, ThumbsUp, MessageSquare, Repeat2, User,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

/* ─── animations ─────────────────────────────────────────────── */
const FONTS = `
  @keyframes fade-in-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ticker-scroll {
    0%   { transform: translateY(0); }
    100% { transform: translateY(-50%); }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0; }
  }
  @keyframes result-in {
    from { opacity: 0; transform: translateX(8px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  .trend-item { animation: fade-in-up 0.35s ease both; }
  .result-card { animation: result-in 0.4s ease both; }
  .live-dot { animation: blink 1.4s step-end infinite; }
`;

/* ─── helpers ────────────────────────────────────────────────── */
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || `Request failed: ${res.status}`);
  }
  return res.json();
};

const TONES: { key: string; i18nKey: string }[] = [
  { key: 'Professional',  i18nKey: 'social.trending.tones.professional'  },
  { key: 'Conversational', i18nKey: 'social.trending.tones.conversational' },
  { key: 'Inspirational', i18nKey: 'social.trending.tones.inspirational'  },
  { key: 'Educational',   i18nKey: 'social.trending.tones.educational'    },
  { key: 'Humorous',      i18nKey: 'social.trending.tones.humorous'       },
  { key: 'Provocative',   i18nKey: 'social.trending.tones.provocative'    },
];
const PLATFORMS = ['linkedin', 'instagram', 'facebook'] as const;
type Platform = typeof PLATFORMS[number];

/* Platform brand — inline style only, not theme */
const PLATFORM_META: Record<Platform, { label: string; maxChars: number; color: string; gradient: string; Icon: typeof Linkedin }> = {
  linkedin:  { label: 'LinkedIn',  maxChars: 3000, color: '#0A66C2', gradient: 'linear-gradient(135deg,#0A66C2,#0A8CF0)', Icon: Linkedin  },
  instagram: { label: 'Instagram', maxChars: 2200, color: '#C13584', gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', Icon: Instagram },
  facebook:  { label: 'Facebook',  maxChars: 500,  color: '#1877F2', gradient: 'linear-gradient(135deg,#1877F2,#42a5f5)', Icon: Facebook  },
};

const SOURCES = [
  { key: 'all' as const,         i18nKey: 'social.trending.allSources', Icon: Globe },
  { key: 'hackernews' as const,  i18nKey: 'social.trending.hackerNews', Icon: TrendingUp },
  { key: 'google_news' as const, i18nKey: 'social.trending.googleNews', Icon: Search },
  { key: 'linkedin' as const,    i18nKey: 'social.trending.linkedin',   Icon: Linkedin },
];

interface PlatformContent { content: string; hashtags: string[]; char_count?: number; character_count?: number; }

/* ─── ResultCard ─────────────────────────────────────────────── */
function ResultCard({ platform, content, onUpdate, onCopy, onSend }: {
  platform: Platform;
  content: PlatformContent | undefined;
  onUpdate: (text: string) => void;
  onCopy: () => void;
  onSend: () => void;
}) {
  const meta = PLATFORM_META[platform];
  const charCount = content?.char_count ?? content?.character_count ?? content?.content?.length ?? 0;
  const pct = Math.min(100, (charCount / meta.maxChars) * 100);
  const PlatIcon = meta.Icon;
  const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';

  return (
    <div className="result-card flex flex-col rounded-2xl border border-border bg-card overflow-hidden"
      style={{ borderTop: `3px solid ${meta.color}` }}>

      {/* Platform header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md flex items-center justify-center"
            style={{ background: meta.gradient }}>
            <PlatIcon className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold text-foreground"
            >
            {meta.label}
          </span>
        </div>
        {content && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1 rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }} />
            </div>
            <span className="text-[10px] font-medium tracking-tight text-muted-foreground tabular-nums">
              {charCount}/{meta.maxChars}
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 p-4">
        {!content ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center">
              <PlatIcon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground font-medium tracking-tight">awaiting generation</p>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              className="w-full text-sm text-foreground bg-muted/40 border border-border rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
              rows={6}
              value={content.content}
              onChange={e => onUpdate(e.target.value)}
            />
            {content.hashtags?.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {content.hashtags.map((tag: string) => (
                  <span key={tag}
                    className="inline-flex items-center gap-0.5 text-[10px] font-medium tracking-tight px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
                    <Hash className="h-2 w-2" />{tag.replace('#', '')}
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <button onClick={onCopy}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium transition-colors border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-muted">
                <Copy className="h-3 w-3" /> Copy
              </button>
              <button onClick={onSend}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all text-white"
                style={{ background: meta.gradient, boxShadow: `0 3px 12px ${meta.color}30` }}>
                <Send className="h-3 w-3" /> Send to Composer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────── */
export default function TrendingPostsPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [topic, setTopic] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [tone, setTone] = useState('Professional');
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['linkedin']);
  const [generated, setGenerated] = useState<Partial<Record<Platform, PlatformContent>>>({});
  const [selectedTrend, setSelectedTrend] = useState<any | null>(null);
  const [fetchedContent, setFetchedContent] = useState<{ title: string; description: string; body_text: string; image: string } | null>(null);
  const [fetchingContent, setFetchingContent] = useState(false);
  const [trendSource, setTrendSource] = useState<'all' | 'hackernews' | 'google_news' | 'linkedin'>('all');
  const [trendQuery, setTrendQuery] = useState('business technology');
  const [inputMode, setInputMode] = useState<'topic' | 'url'>('topic');
  const [leftTab, setLeftTab] = useState<'trending' | 'linkedin-search'>('trending');
  const [liKeyword, setLiKeyword] = useState('');
  const [liSortBy, setLiSortBy] = useState<'RECENCY' | 'RELEVANCE'>('RECENCY');
  const [liSearchEnabled, setLiSearchEnabled] = useState(false);

  const { data: linkedinTrends, isLoading: trendsLoading, refetch: refetchTrends } = useQuery({
    queryKey: ['linkedin-trending', trendSource, trendQuery],
    queryFn: () => authFetch(`/api/v1/social/trending/linkedin?source=${trendSource}&query=${encodeURIComponent(trendQuery)}`),
  });

  const { data: liSearchData, isLoading: liSearchLoading, refetch: runLiSearch, error: liSearchError } = useQuery({
    queryKey: ['linkedin-search', liKeyword, liSortBy],
    queryFn: () => authFetch(`/api/v1/social/search-linkedin?keyword=${encodeURIComponent(liKeyword)}&sort_by=${liSortBy}&limit=20`),
    enabled: liSearchEnabled && !!liKeyword,
    retry: false,
  });

  const generateMutation = useMutation({
    mutationFn: (payload: object) => authFetch(`/api/v1/social/ai/generate-from-topic`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (data) => setGenerated(data.platforms ?? data.content ?? data),
    onError: (err: any) => toast({ title: t('social.trending.generationFailed'), description: err.message, variant: 'destructive' }),
  });

  const generateFromUrlMutation = useMutation({
    mutationFn: (payload: object) => authFetch(`/api/v1/social/ai/generate-from-url`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: (data) => setGenerated(data.platforms ?? data.content ?? data),
    onError: (err: any) => toast({ title: t('social.trending.generationFailed'), description: err.message, variant: 'destructive' }),
  });

  const isGenerating = generateMutation.isPending || generateFromUrlMutation.isPending;

  const handleGenerate = (overrideTopic?: string) => {
    const activeTopic = overrideTopic ?? topic;
    if (!activeTopic && !sourceUrl) {
      toast({ title: t('social.trending.enterTopicOrUrl'), variant: 'destructive' }); return;
    }
    if (sourceUrl && !overrideTopic) {
      generateFromUrlMutation.mutate({ source_url: sourceUrl, target_platforms: selectedPlatforms, adaptation_style: tone });
    } else {
      generateMutation.mutate({ topic: activeTopic, tone, target_platforms: selectedPlatforms, include_hashtags: true });
    }
  };

  const handleTrendClick = (item: any) => {
    setSelectedTrend(item);
    setFetchedContent(null);
    setGenerated({});
    setTopic(item.title ?? item.keyword ?? '');
    setSourceUrl('');
    setInputMode('topic');
  };

  // Auto-fetch article content when a trend with a URL is selected
  useEffect(() => {
    if (!selectedTrend?.url) return;
    setFetchingContent(true);
    const token = localStorage.getItem('accessToken');
    fetch(`/api/v1/social/extract-url?url=${encodeURIComponent(selectedTrend.url)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(data => setFetchedContent(data))
      .catch(() => setFetchedContent(null))
      .finally(() => setFetchingContent(false));
  }, [selectedTrend]);

  const handleRemix = () => {
    if (!selectedTrend) return;
    const bodyText = fetchedContent?.body_text?.trim() ?? '';
    const description = fetchedContent?.description || selectedTrend.description || '';
    const title = fetchedContent?.title || selectedTrend.title || selectedTrend.keyword || '';

    if (bodyText.length > 150) {
      generateMutation.mutate({
        topic: `${title}\n\n${bodyText}`,
        tone,
        target_platforms: selectedPlatforms,
        include_hashtags: true,
      });
    } else if (description) {
      generateMutation.mutate({
        topic: `${title}\n\n${description}`,
        tone,
        target_platforms: selectedPlatforms,
        include_hashtags: true,
      });
    } else if (selectedTrend.url) {
      generateFromUrlMutation.mutate({
        source_url: selectedTrend.url,
        target_platforms: selectedPlatforms,
        adaptation_style: tone,
      });
    } else {
      handleGenerate(title);
    }
  };

  const togglePlatform = (p: Platform) =>
    setSelectedPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  const copyToClipboard = (platform: Platform) => {
    const c = generated[platform];
    if (!c) return;
    navigator.clipboard.writeText(`${c.content}\n\n${c.hashtags?.join(' ') ?? ''}`);
    toast({ title: t('social.trending.copiedToClipboard') });
  };

  const sendToComposer = (platform: Platform) => {
    const c = generated[platform];
    if (!c) return;
    navigate(`/dashboard/social/compose?${new URLSearchParams({ platform, content: c.content, hashtags: (c.hashtags ?? []).join(',') })}`);
  };

  const trends = linkedinTrends?.items ?? (Array.isArray(linkedinTrends) ? linkedinTrends : []);

  return (
    <>
      <style>{FONTS}</style>

      <div className="h-full flex flex-col bg-background overflow-hidden">

        {/* ── Masthead ── */}
        <div className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-primary" />
                <h1 className="text-lg font-semibold text-foreground tracking-tight">
                  {t('social.trending.title')}
                </h1>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('social.trending.subtitle')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="live-dot h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
            <span className="text-[10px] font-medium tracking-tight text-muted-foreground uppercase tracking-widest">Live Feed</span>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex-1 overflow-hidden">
          <div className="flex h-full overflow-x-auto">

          {/* ══ LEFT — Trend Discovery ══ */}
          <div className="w-72 min-w-[288px] shrink-0 flex flex-col border-r border-border bg-card overflow-hidden">

            {/* Tab switcher */}
            <div className="flex border-b border-border">
              <button onClick={() => setLeftTab('trending')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors border-b-2 ${leftTab === 'trending' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                <TrendingUp className="h-3 w-3" /> Trending
              </button>
              <button onClick={() => setLeftTab('linkedin-search')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-colors border-b-2 ${leftTab === 'linkedin-search' ? 'border-[#0A66C2] text-[#0A66C2]' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                <Linkedin className="h-3 w-3" /> Search Posts
              </button>
            </div>

            {leftTab === 'trending' ? (<>
              {/* Source selector */}
              <div className="px-3 pt-3 pb-2 border-b border-border">
                <div className="grid grid-cols-2 gap-1">
                  {SOURCES.map(s => {
                    const SIcon = s.Icon;
                    return (
                      <button key={s.key} onClick={() => setTrendSource(s.key)}
                        className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[10px] font-medium tracking-tight transition-colors ${
                          trendSource === s.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}>
                        <SIcon className="h-3 w-3 shrink-0" />
                        {t(s.i18nKey)}
                      </button>
                    );
                  })}
                </div>
                {(trendSource === 'google_news' || trendSource === 'all') && (
                  <div className="mt-2 flex items-center gap-1.5 border border-border rounded-lg px-2 py-1.5 bg-background">
                    <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                    <input
                      className="flex-1 text-[11px] bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                      placeholder={t('social.trending.searchTopic')}
                      value={trendQuery}
                      onChange={e => setTrendQuery(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && refetchTrends()}
                    />
                  </div>
                )}
              </div>

              {/* Trend list */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
                {trendsLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">scanning feeds...</span>
                  </div>
                ) : trends.length > 0 ? (
                  trends.slice(0, 20).map((item: any, i: number) => (
                    <button key={i} onClick={() => handleTrendClick(item)} disabled={isGenerating}
                      className={`trend-item w-full group flex items-start gap-2.5 px-2 py-2.5 rounded-xl text-left disabled:opacity-40 ${selectedTrend === item ? 'team-channel-active' : 'row-hover-active'}`}
                      style={{ animationDelay: `${i * 0.03}s` }}>
                      <span className="shrink-0 text-muted-foreground/30 text-2xl font-bold select-none leading-none mt-0.5">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                          {item.title ?? item.keyword}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">{item.source?.replace('_', ' ')}</span>
                          {item.engagement > 0 && (
                            <span className="text-[9px] text-muted-foreground">· {item.engagement > 1000 ? `${(item.engagement/1000).toFixed(1)}k` : item.engagement} pts</span>
                          )}
                        </div>
                      </div>
                      <Zap className="h-3 w-3 text-muted-foreground/0 group-hover:text-primary shrink-0 mt-0.5 transition-all" />
                    </button>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <TrendingUp className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground text-center">No signals found</p>
                  </div>
                )}
              </div>
            </>) : (<>
              {/* LinkedIn post search */}
              <div className="px-3 pt-3 pb-2 border-b border-border space-y-2">
                {/* Keyword */}
                <div className="flex items-center gap-1.5 border border-border rounded-lg px-2 py-1.5 bg-background">
                  <Search className="h-3 w-3 text-muted-foreground shrink-0" />
                  <input
                    className="flex-1 text-[11px] bg-transparent focus:outline-none text-foreground placeholder:text-muted-foreground"
                    placeholder={t('social.trending.searchLinkedin')}
                    value={liKeyword}
                    onChange={e => setLiKeyword(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { setLiSearchEnabled(true); runLiSearch(); } }}
                  />
                </div>
                {/* Filters row */}
                <div className="flex gap-1.5">
                  {(['RECENCY', 'RELEVANCE'] as const).map(v => (
                    <button key={v} onClick={() => setLiSortBy(v)}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-medium transition-colors ${liSortBy === v ? 'bg-[#0A66C2] text-white' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
                      {v === 'RECENCY' ? 'Recent' : 'Relevant'}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => { setLiSearchEnabled(true); runLiSearch(); }}
                  disabled={!liKeyword || liSearchLoading}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: '#0A66C2' }}>
                  {liSearchLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Search className="h-3 w-3" />}
                  {liSearchLoading ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Results */}
              <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                {liSearchError ? (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 mt-2 space-y-2">
                    <p className="text-xs font-semibold text-destructive">LinkedIn search unavailable</p>
                    {(liSearchError as any)?.message?.includes('No active LinkedIn account') || (liSearchError as any)?.message?.includes('connect') ? (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        No LinkedIn account connected. Go to{' '}
                        <button onClick={() => window.location.href = '/dashboard/social/accounts'}
                          className="font-medium text-foreground underline underline-offset-2">
                          Social Accounts
                        </button>{' '}
                        and connect your LinkedIn account first.
                      </p>
                    ) : (liSearchError as any)?.message?.includes('token expired') || (liSearchError as any)?.message?.includes('401') ? (
                      <p className="text-[11px] text-muted-foreground">
                        LinkedIn token expired. Reconnect your account in{' '}
                        <button onClick={() => window.location.href = '/dashboard/social/accounts'}
                          className="font-medium text-foreground underline underline-offset-2">
                          Social Accounts
                        </button>.
                      </p>
                    ) : (liSearchError as any)?.message?.includes('review') || (liSearchError as any)?.message?.includes('permissions') ? (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {(liSearchError as any)?.message}
                      </p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">{(liSearchError as any)?.message ?? 'Search failed.'}</p>
                    )}
                  </div>
                ) : !liSearchEnabled || (!liSearchLoading && !liSearchData) ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2 mt-4">
                    <Linkedin className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground text-center">Enter a keyword and search</p>
                  </div>
                ) : liSearchLoading ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground">Searching LinkedIn...</span>
                  </div>
                ) : (liSearchData?.posts ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-40 gap-2">
                    <Linkedin className="h-6 w-6 text-muted-foreground/30" />
                    <p className="text-[10px] text-muted-foreground text-center">No posts found for "{liKeyword}"</p>
                  </div>
                ) : (
                  <>
                    {liSearchData?.notice && (
                      <div className="px-2.5 py-2.5 rounded-xl bg-muted/60 border border-border mb-2 space-y-0.5">
                        <p className="text-[10px] font-semibold text-foreground">LinkedIn post search — pending review</p>
                        <p className="text-[10px] text-muted-foreground leading-relaxed">
                          Showing Google News results for <span className="font-medium text-foreground">"{liKeyword}"</span> until LinkedIn partner API is approved.
                        </p>
                      </div>
                    )}
                  {(liSearchData?.posts ?? []).map((post: any, i: number) => (
                    <button key={i} onClick={() => handleTrendClick(post)} disabled={isGenerating}
                      className={`trend-item w-full group text-left rounded-xl px-2.5 py-2.5 disabled:opacity-40 space-y-1.5 ${selectedTrend === post ? 'team-channel-active' : 'row-hover-active'}`}
                      style={{ animationDelay: `${i * 0.03}s` }}>
                      {/* Author */}
                      <div className="flex items-center gap-1.5">
                        {post.author_avatar
                          ? <img src={post.author_avatar} className="h-5 w-5 rounded-full object-cover" alt="" />
                          : <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center"><User className="h-2.5 w-2.5 text-muted-foreground" /></div>
                        }
                        <span className="text-[10px] font-medium text-foreground truncate">{post.author || 'LinkedIn User'}</span>
                      </div>
                      {/* Post snippet */}
                      <p className="text-[11px] text-foreground leading-snug line-clamp-3 group-hover:text-primary transition-colors">
                        {post.title}
                      </p>
                      {/* Stats */}
                      <div className="flex items-center gap-2.5">
                        {post.engagement > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                            <ThumbsUp className="h-2.5 w-2.5" />{post.engagement > 1000 ? `${(post.engagement/1000).toFixed(1)}k` : post.engagement}
                          </span>
                        )}
                        {post.comments > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                            <MessageSquare className="h-2.5 w-2.5" />{post.comments}
                          </span>
                        )}
                        {post.reposts > 0 && (
                          <span className="flex items-center gap-0.5 text-[9px] text-muted-foreground">
                            <Repeat2 className="h-2.5 w-2.5" />{post.reposts}
                          </span>
                        )}
                        <Zap className="h-2.5 w-2.5 text-muted-foreground/0 group-hover:text-primary ml-auto transition-all" />
                      </div>
                    </button>
                  ))
                  }
                  </>
                )}
              </div>
            </>)}
          </div>

          {/* ══ CENTER — Studio Controls ══ */}
          <div className="w-64 min-w-[256px] shrink-0 flex flex-col border-r border-border bg-background overflow-y-auto">
            <div className="p-4 space-y-4">
              {/* Mode toggle */}
              <div className="flex rounded-xl border border-border overflow-hidden bg-card p-0.5 gap-0.5">
                {(['topic', 'url'] as const).map(m => (
                  <button key={m} onClick={() => setInputMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-medium tracking-tight transition-colors ${
                      inputMode === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                    }`}>
                    {m === 'topic' ? 'Topic' : 'URL'}
                  </button>
                ))}
              </div>

              {/* Input */}
              {inputMode === 'topic' ? (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium tracking-tight uppercase tracking-widest text-muted-foreground">Topic / Keyword</label>
                  <textarea
                    className="w-full text-xs text-foreground bg-card border border-border rounded-xl px-3 py-2.5 resize-none focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground leading-relaxed"
                    rows={3}
                    placeholder="e.g. AI trends 2025, remote work..."
                    value={topic}
                    onChange={e => { setTopic(e.target.value); setSourceUrl(''); }}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-medium tracking-tight uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                    <Link2 className="h-2.5 w-2.5" /> Viral Post URL
                  </label>
                  <input
                    className="w-full text-xs text-foreground bg-card border border-border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground"
                    placeholder="https://linkedin.com/posts/..."
                    value={sourceUrl}
                    onChange={e => { setSourceUrl(e.target.value); setTopic(''); }}
                  />
                </div>
              )}

              {/* Tone */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-tight uppercase tracking-widest text-muted-foreground">Tone</label>
                <div className="grid grid-cols-2 gap-1">
                  {TONES.map(tone_ => (
                    <button key={tone_.key} onClick={() => setTone(tone_.key)}
                      className={`py-1.5 rounded-lg text-[10px] font-medium tracking-tight transition-colors ${
                        tone === tone_.key
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}>
                      {t(tone_.i18nKey)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Platforms */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-medium tracking-tight uppercase tracking-widest text-muted-foreground">Platforms</label>
                <div className="space-y-1.5">
                  {PLATFORMS.map(p => {
                    const meta = PLATFORM_META[p];
                    const PIcon = meta.Icon;
                    const selected = selectedPlatforms.includes(p);
                    return (
                      <button key={p} onClick={() => togglePlatform(p)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${selected ? 'border-transparent' : 'border-border bg-card hover:bg-muted'}`}
                        style={selected ? { borderColor: `${meta.color}50`, background: `${meta.color}08` } : undefined}>
                        <div className="h-5 w-5 rounded-md flex items-center justify-center shrink-0"
                          style={selected ? { background: meta.gradient } : { background: 'hsl(var(--muted))' }}>
                          <PIcon className={`h-3 w-3 ${selected ? 'text-white' : 'text-muted-foreground'}`} />
                        </div>
                        <span className="text-[11px] font-medium tracking-tight text-foreground flex-1 text-left">{meta.label}</span>
                        <div className={`h-3.5 w-3.5 rounded-full border-2 transition-all ${
                          selected ? 'border-primary bg-primary' : 'border-border'
                        }`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generate button */}
              <button
                onClick={() => handleGenerate()}
                disabled={isGenerating || selectedPlatforms.length === 0}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'hsl(var(--primary))' }}>
                {isGenerating
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  : <><Sparkles className="h-4 w-4" /> Generate Content</>
                }
              </button>
            </div>
          </div>

          {/* ══ RIGHT — Preview / Results ══ */}
          <div className="flex-1 min-w-[320px] overflow-y-auto p-5">
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Remixing for {selectedPlatforms.join(', ')}...</p>
              </div>

            ) : Object.keys(generated).length > 0 ? (
              /* Generated results */
              <div className="space-y-4">
                {/* Back to trend button */}
                {selectedTrend && (
                  <button
                    onClick={() => setGenerated({})}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    ← back to trend preview
                  </button>
                )}
                <div className={`grid gap-4 ${selectedPlatforms.length === 1 ? 'grid-cols-1 max-w-2xl' : selectedPlatforms.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                  {selectedPlatforms.map((platform, i) => (
                    <div key={platform} style={{ animationDelay: `${i * 0.08}s` }}>
                      <ResultCard
                        platform={platform}
                        content={generated[platform]}
                        onUpdate={text => setGenerated(prev => ({ ...prev, [platform]: { ...prev[platform]!, content: text } }))}
                        onCopy={() => copyToClipboard(platform)}
                        onSend={() => sendToComposer(platform)}
                      />
                    </div>
                  ))}
                </div>
              </div>

            ) : selectedTrend ? (
              /* Trend preview card */
              <div className="max-w-2xl mx-auto space-y-4 result-card">
                {/* Trend card */}
                <div className="rounded-2xl border border-border bg-card overflow-hidden">
                  {/* Header */}
                  <div className="px-5 py-3 border-b border-border flex items-center gap-2">
                    <TrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground">
                      {selectedTrend.source?.replace('_', ' ') ?? 'Trending'}
                    </span>
                    {selectedTrend.engagement > 0 && (
                      <>
                        <span className="text-border">·</span>
                        <span className="text-[10px] text-muted-foreground">
                          {selectedTrend.engagement > 1000
                            ? `${(selectedTrend.engagement / 1000).toFixed(1)}k`
                            : selectedTrend.engagement} pts
                        </span>
                      </>
                    )}
                    {selectedTrend.url && (
                      <a href={selectedTrend.url} target="_blank" rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors">
                        <Globe className="h-3 w-3" /> View original
                      </a>
                    )}
                  </div>

                  {/* OG image */}
                  {(fetchedContent?.image || selectedTrend.image) && (
                    <img
                      src={fetchedContent?.image || selectedTrend.image}
                      alt=""
                      className="w-full h-40 object-cover"
                      onError={e => (e.currentTarget.style.display = 'none')}
                    />
                  )}

                  {/* Title + content */}
                  <div className="px-5 py-4 space-y-3">
                    <h2 className="text-base font-semibold text-foreground leading-snug">
                      {fetchedContent?.title || selectedTrend.title || selectedTrend.keyword}
                    </h2>

                    {fetchingContent ? (
                      <div className="flex items-center gap-2 py-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">Fetching article content...</span>
                      </div>
                    ) : (fetchedContent?.body_text?.trim().length ?? 0) > 150 ? (
                      /* Full article body — editable so user can trim before remixing */
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Article content</p>
                        <textarea
                          className="w-full text-xs text-foreground bg-muted/40 border border-border rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary leading-relaxed"
                          rows={10}
                          value={fetchedContent!.body_text}
                          onChange={e => setFetchedContent(prev => prev ? { ...prev, body_text: e.target.value } : prev)}
                        />
                        <p className="text-[10px] text-muted-foreground">Edit the content above before remixing if needed.</p>
                      </div>
                    ) : (fetchedContent?.description || selectedTrend.description) ? (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {fetchedContent?.description || selectedTrend.description}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">
                        Article preview not available — click "Remix with AI" to generate content from the headline.
                      </p>
                    )}
                  </div>
                </div>

                {/* Platform selector inline */}
                <div className="rounded-2xl border border-border bg-card px-5 py-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Generate for</p>
                  <div className="flex gap-2 flex-wrap">
                    {PLATFORMS.map(p => {
                      const meta = PLATFORM_META[p];
                      const PIcon = meta.Icon;
                      const sel = selectedPlatforms.includes(p);
                      return (
                        <button key={p} onClick={() => togglePlatform(p)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${sel ? 'border-transparent text-white' : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                          style={sel ? { background: meta.gradient } : undefined}>
                          <PIcon className="h-3 w-3" /> {meta.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Remix button */}
                  <button
                    onClick={handleRemix}
                    disabled={isGenerating || selectedPlatforms.length === 0}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-primary-foreground transition-all disabled:opacity-50"
                    style={{ background: 'hsl(var(--primary))' }}
                  >
                    <Zap className="h-4 w-4" />
                    Remix with AI
                  </button>
                </div>
              </div>

            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="text-center max-w-xs">
                  <p className="text-base font-semibold text-foreground">Pick a trending topic</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Click any topic from the feed to preview it, then remix it into platform-ready posts with AI
                  </p>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>
    </>
  );
}

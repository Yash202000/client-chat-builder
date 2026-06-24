import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  Linkedin, Instagram, Facebook,
  Hash, Calendar, Send, Save, Clock,
  Loader2, X, Plus, Sparkles, Eye, EyeOff,
  Link2, ImagePlus, ExternalLink, Globe,
  AlertTriangle, AlertCircle, CheckCircle2,
} from 'lucide-react';

function TwitterXIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.741l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

function RedditIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
    </svg>
  );
}
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import PostAIAssistant from '@/components/PostAIAssistant';

const toLocalInputValue = (isoString: string): string => {
  const d = new Date(isoString);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toUTCISOString = (localValue: string): string => new Date(localValue).toISOString();

const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error('Request failed');
  return res.json();
};

const PLATFORMS = [
  {
    key: 'linkedin', label: 'LinkedIn', Icon: Linkedin, maxChars: 3000,
    color: '#0A66C2', bg: 'rgba(10,102,194,0.08)', border: 'rgba(10,102,194,0.25)',
    gradient: 'linear-gradient(135deg, #0A66C2, #0073b1)',
    supportsImage: true, requiresImage: false,
  },
  {
    key: 'instagram', label: 'Instagram', Icon: Instagram, maxChars: 2200,
    color: '#E1306C', bg: 'rgba(225,48,108,0.07)', border: 'rgba(225,48,108,0.22)',
    gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)',
    supportsImage: true, requiresImage: true,
  },
  {
    key: 'facebook', label: 'Facebook', Icon: Facebook, maxChars: 63206,
    color: '#1877F2', bg: 'rgba(24,119,242,0.07)', border: 'rgba(24,119,242,0.22)',
    gradient: 'linear-gradient(135deg, #1877F2, #42a5f5)',
    supportsImage: true, requiresImage: false,
  },
  {
    key: 'reddit', label: 'Reddit', Icon: RedditIcon, maxChars: 40000,
    color: '#FF4500', bg: 'rgba(255,69,0,0.07)', border: 'rgba(255,69,0,0.22)',
    gradient: 'linear-gradient(135deg, #FF4500, #FF6534)',
    supportsImage: false, requiresImage: false,
  },
  {
    key: 'twitter', label: 'X', Icon: TwitterXIcon, maxChars: 280,
    color: '#000000', bg: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.18)',
    gradient: 'linear-gradient(135deg, #000000, #333333)',
    supportsImage: false, requiresImage: false,
  },
];

interface SocialAccount {
  id: number; platform: string; account_name: string; status: string;
  metadata_?: { avatar_url?: string };
}

/** SVG arc character counter */
function CharArc({ pct }: { pct: number }) {
  const r = 16, c = 2 * Math.PI * r;
  const fill = c - (c * Math.min(pct, 100)) / 100;
  const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#22c55e';
  return (
    <svg width="40" height="40" className="rotate-[-90deg]">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3" />
      <circle cx="20" cy="20" r={r} fill="none" stroke={color} strokeWidth="3"
        strokeDasharray={c} strokeDashoffset={fill}
        style={{ transition: 'stroke-dashoffset 0.3s, stroke 0.3s' }}
        strokeLinecap="round" />
    </svg>
  );
}

export default function PostComposerPage() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [activeTab, setActiveTab] = useState('linkedin');
  const [contents, setContents] = useState<Record<string, string>>({ linkedin: '', instagram: '', facebook: '', reddit: '', twitter: '' });
  const [hashtags, setHashtags] = useState<Record<string, string[]>>({ linkedin: [], instagram: [], facebook: [], reddit: [], twitter: [] });
  const [redditSubreddit, setRedditSubreddit] = useState('');
  const [redditTitle, setRedditTitle] = useState('');
  const [hashtagInput, setHashtagInput] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [mediaInput, setMediaInput] = useState('');
  const [prefilled, setPrefilled] = useState(false);
  const [aiOpen, setAiOpen] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  // Cross-post state
  const [crossPost, setCrossPost] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<string>>(new Set());
  const [showPrePublishModal, setShowPrePublishModal] = useState(false);

  const { data: editPost, isError: editNotFound } = useQuery({
    queryKey: ['social-post', editId],
    queryFn: () => authFetch(`/api/v1/social/posts/${editId}`),
    enabled: !!editId,
    retry: false,
  });

  useEffect(() => {
    if (editNotFound) navigate('/dashboard/social/calendar');
  }, [editNotFound]);

  useEffect(() => {
    if (editPost && !prefilled) {
      const p = editPost.platform ?? 'linkedin';
      setActiveTab(p);
      setContents(prev => ({ ...prev, [p]: editPost.content ?? '' }));
      setHashtags(prev => ({ ...prev, [p]: editPost.hashtags ?? [] }));
      if (editPost.social_account_id) setSelectedAccountId(String(editPost.social_account_id));
      if (editPost.scheduled_at) {
        setScheduleMode(true);
        setScheduledAt(toLocalInputValue(editPost.scheduled_at));
      }
      if (editPost.source_url) setLinkUrl(editPost.source_url);
      if (editPost.media_urls?.length) setMediaUrls(editPost.media_urls);
      if (editPost.post_metadata?.subreddit) setRedditSubreddit(editPost.post_metadata.subreddit);
      if (editPost.post_metadata?.title) setRedditTitle(editPost.post_metadata.title);
      setPrefilled(true);
    }
  }, [editPost]);

  useEffect(() => {
    if (editId) return;
    const platform = searchParams.get('platform') ?? 'linkedin';
    const content = searchParams.get('content');
    const tagsRaw = searchParams.get('hashtags');
    if (content) { setContents(prev => ({ ...prev, [platform]: content })); setActiveTab(platform); }
    if (tagsRaw) setHashtags(prev => ({ ...prev, [platform]: tagsRaw.split(',').filter(Boolean) }));
  }, []);

  const { data: accountsData } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => authFetch(`/api/v1/social/accounts`),
  });

  const accounts: SocialAccount[] = Array.isArray(accountsData) ? accountsData : (accountsData?.accounts ?? []);
  const connectedPlatforms = new Set(accounts.filter(a => a.status === 'active').map(a => a.platform));
  const availablePlatforms = PLATFORMS.filter(p => connectedPlatforms.has(p.key));
  const activeAccounts = accounts.filter(a => a.status === 'active' && a.platform === activeTab);

  // Auto-switch platform
  useEffect(() => {
    if (availablePlatforms.length > 0 && !connectedPlatforms.has(activeTab))
      setActiveTab(availablePlatforms[0].key);
  }, [accountsData]);

  // Auto-select account when only one exists
  useEffect(() => {
    if (activeAccounts.length === 1 && !selectedAccountId)
      setSelectedAccountId(String(activeAccounts[0].id));
  }, [activeAccounts.length, activeTab]);

  const saveMutation = useMutation({
    mutationFn: (payload: object) => editId
      ? authFetch(`/api/v1/social/posts/${editId}`, { method: 'PUT', body: JSON.stringify(payload) })
      : authFetch(`/api/v1/social/posts`, { method: 'POST', body: JSON.stringify(payload) }),
    onSuccess: () => { toast({ title: t('social.composer.draftSaved') }); navigate('/dashboard/social/calendar'); },
    onError: () => toast({ title: t('social.composer.saveFailed'), variant: 'destructive' }),
  });

  const publishMutation = useMutation({
    mutationFn: async (payload: object) => {
      if (editId) {
        await authFetch(`/api/v1/social/posts/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        return authFetch(`/api/v1/social/posts/${editId}/publish`, { method: 'POST' });
      }
      const post = await authFetch(`/api/v1/social/posts`, { method: 'POST', body: JSON.stringify(payload) });
      return authFetch(`/api/v1/social/posts/${post.id}/publish`, { method: 'POST' });
    },
    onSuccess: () => { toast({ title: t('social.composer.published') }); navigate('/dashboard/social'); },
    onError: () => toast({ title: t('social.composer.publishFailed'), variant: 'destructive' }),
  });

  const scheduleMutation = useMutation({
    mutationFn: async (payload: object & { scheduled_at: string }) => {
      if (editId) {
        await authFetch(`/api/v1/social/posts/${editId}`, { method: 'PUT', body: JSON.stringify(payload) });
        return authFetch(`/api/v1/social/posts/${editId}/schedule`, { method: 'POST', body: JSON.stringify({ scheduled_at: payload.scheduled_at }) });
      }
      const post = await authFetch(`/api/v1/social/posts`, { method: 'POST', body: JSON.stringify(payload) });
      return authFetch(`/api/v1/social/posts/${post.id}/schedule`, { method: 'POST', body: JSON.stringify({ scheduled_at: payload.scheduled_at }) });
    },
    onSuccess: () => { toast({ title: t('social.composer.postScheduled') }); navigate('/dashboard/social/calendar'); },
    onError: () => toast({ title: t('social.composer.publishFailed'), variant: 'destructive' }),
  });

  const crossPublishMutation = useMutation({
    mutationFn: async () => {
      const platforms = Array.from(selectedPlatforms).filter(p => connectedPlatforms.has(p));
      const results = await Promise.allSettled(
        platforms.map(async (platform) => {
          const account = accounts.find(a => a.status === 'active' && a.platform === platform);
          if (!account) throw new Error(`No active ${platform} account`);
          const payload = {
            social_account_id: account.id,
            platform,
            content: contents[activeTab],
            hashtags: hashtags[activeTab],
            ai_generated: false,
            ...(linkUrl.trim() ? { source_url: linkUrl.trim() } : {}),
            ...(mediaUrls.length ? { media_urls: mediaUrls } : {}),
            ...(platform === 'reddit' ? { post_metadata: { subreddit: redditSubreddit.trim().replace(/^r\//, ''), title: redditTitle.trim() || contents[activeTab].slice(0, 300) } } : {}),
          };
          const post = await authFetch('/api/v1/social/posts', { method: 'POST', body: JSON.stringify(payload) });
          return authFetch(`/api/v1/social/posts/${post.id}/publish`, { method: 'POST' });
        })
      );
      const ok = results.filter(r => r.status === 'fulfilled').length;
      const fail = results.filter(r => r.status === 'rejected').length;
      return { ok, fail };
    },
    onSuccess: ({ ok, fail }) => {
      toast({ title: `Published to ${ok} platform${ok !== 1 ? 's' : ''}${fail ? ` · ${fail} failed` : ''}` });
      setShowPrePublishModal(false);
      navigate('/dashboard/social');
    },
    onError: () => toast({ title: 'Publish failed', variant: 'destructive' }),
  });

  const buildPayload = (platform = activeTab) => ({
    social_account_id: selectedAccountId ? parseInt(selectedAccountId) : null,
    platform,
    content: contents[platform],
    hashtags: hashtags[platform],
    ai_generated: false,
    ...(linkUrl.trim() ? { source_url: linkUrl.trim() } : {}),
    ...(mediaUrls.length ? { media_urls: mediaUrls } : {}),
    ...(scheduleMode && scheduledAt ? { scheduled_at: toUTCISOString(scheduledAt) } : {}),
    ...(platform === 'reddit' ? {
      post_metadata: {
        subreddit: redditSubreddit.trim().replace(/^r\//, ''),
        title: redditTitle.trim() || contents['reddit'].slice(0, 300),
      }
    } : {}),
  });

  const isBusy = saveMutation.isPending || publishMutation.isPending || scheduleMutation.isPending || crossPublishMutation.isPending;
  const activePlatform = PLATFORMS.find(p => p.key === activeTab)!

  const getValidation = (platform: string) => {
    const p = PLATFORMS.find(pl => pl.key === platform);
    const content = contents[platform] || '';
    const errors: string[] = [];
    const warnings: string[] = [];
    if (!content.trim()) errors.push('Content required');
    if (p && content.length > p.maxChars) errors.push(`Over ${p.maxChars} char limit by ${content.length - p.maxChars}`);
    if (platform === 'instagram' && mediaUrls.length === 0) errors.push('Image required for Instagram');
    if (platform === 'reddit' && !redditSubreddit.trim()) errors.push('Subreddit is required');
    if (platform === 'twitter' && mediaUrls.length > 0) warnings.push('Images not supported on free tier');
    return { errors, warnings, valid: errors.length === 0 };
  };
  const activeValidation = getValidation(activeTab);;
  const charCount = contents[activeTab].length;
  const pct = Math.min(100, (charCount / activePlatform.maxChars) * 100);
  const selectedAccount = activeAccounts.find(a => String(a.id) === selectedAccountId) ?? activeAccounts[0];
  const previewName = selectedAccount?.account_name ?? 'Your Name';
  const previewAvatar = selectedAccount?.metadata_?.avatar_url ?? null;

  // ── Pre-publish confirmation modal ──
  const PrePublishModal = () => {
    const platforms = Array.from(selectedPlatforms).filter(p => connectedPlatforms.has(p));
    const allValid = platforms.every(p => {
      const v = getValidation(p);
      return v.valid;
    });
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/70">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Review & Publish</h2>
              <p className="text-[11px] text-zinc-400 mt-0.5">Publishing to {platforms.length} platform{platforms.length !== 1 ? 's' : ''}</p>
            </div>
            <button onClick={() => setShowPrePublishModal(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {platforms.map(pk => {
              const p = PLATFORMS.find(pl => pl.key === pk)!;
              const account = accounts.find(a => a.status === 'active' && a.platform === pk);
              const v = getValidation(pk);
              const Icon = p.Icon;
              return (
                <div key={pk} className="rounded-xl border p-3 flex items-start gap-3"
                  style={{ borderColor: v.valid ? p.border : 'rgba(239,68,68,0.3)', background: v.valid ? p.bg : 'rgba(254,242,242,0.5)' }}>
                  <div className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0 text-white"
                    style={{ background: p.gradient }}>
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{p.label}</span>
                      {account && <span className="text-[10px] text-zinc-400 truncate">· {account.account_name}</span>}
                      {v.valid
                        ? <CheckCircle2 className="h-3.5 w-3.5 text-green-500 ml-auto shrink-0" />
                        : <AlertCircle className="h-3.5 w-3.5 text-red-400 ml-auto shrink-0" />}
                    </div>
                    {v.errors.map(e => <p key={e} className="text-[10px] text-red-500 mt-0.5">✗ {e}</p>)}
                    {v.warnings.map(w => <p key={w} className="text-[10px] text-amber-500 mt-0.5">⚠ {w}</p>)}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-zinc-100 dark:border-zinc-800 flex gap-2.5 shrink-0">
            <button onClick={() => setShowPrePublishModal(false)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors">
              Back
            </button>
            <button
              onClick={() => crossPublishMutation.mutate()}
              disabled={!allValid || crossPublishMutation.isPending}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ background: allValid ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#9ca3af', boxShadow: allValid ? '0 4px 14px #16a34a35' : 'none' }}
            >
              {crossPublishMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {crossPublishMutation.isPending ? 'Publishing…' : `Confirm & Publish`}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full overflow-hidden bg-zinc-50 dark:bg-zinc-950">
      {showPrePublishModal && <PrePublishModal />}

      {/* ── Main area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">

        {/* Top bar */}
        <div className="flex items-center justify-between px-3 sm:px-5 py-2 sm:py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <div className="shrink-0">
              <h1 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {editId ? 'Edit Post' : 'Compose'}
              </h1>
              <p className="text-[10px] sm:text-xs text-zinc-400 hidden sm:block">{editId ? 'Update your post' : 'Create · Schedule · Publish'}</p>
            </div>

            {/* Platform switcher */}
            <div className="flex items-center gap-0.5 sm:gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 sm:p-1 rounded-xl overflow-x-auto">
              {availablePlatforms.length === 0 ? (
                <button onClick={() => navigate('/dashboard/social/accounts')}
                  className="text-xs text-violet-600 px-3 py-1.5 font-medium whitespace-nowrap">
                  Connect →
                </button>
              ) : availablePlatforms.map(p => {
                const Icon = p.Icon;
                const active = activeTab === p.key;
                return (
                  <button key={p.key} onClick={() => setActiveTab(p.key)}
                    className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 whitespace-nowrap"
                    style={active ? {
                      background: p.gradient, color: '#fff',
                      boxShadow: `0 2px 8px ${p.color}40`,
                    } : { color: '#71717a' }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Cross-post toggle */}
            {availablePlatforms.length > 1 && (
              <button
                onClick={() => {
                  const next = !crossPost;
                  setCrossPost(next);
                  if (next && selectedPlatforms.size === 0)
                    setSelectedPlatforms(new Set(availablePlatforms.map(p => p.key)));
                }}
                className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                style={crossPost
                  ? { background: 'linear-gradient(135deg,#16a34a,#15803d)', color: '#fff', boxShadow: '0 2px 8px #16a34a40' }
                  : { color: '#16a34a', border: '1px solid #bbf7d0', backgroundColor: '#f0fdf4' }
                }
              >
                <Globe className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Cross-post</span>
              </button>
            )}
            <button
              onClick={() => setShowPreview(v => !v)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              {showPreview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">Preview</span>
            </button>
            <button
              onClick={() => setAiOpen(o => !o)}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
              style={aiOpen
                ? { background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', boxShadow: '0 2px 8px #7c3aed40' }
                : { color: '#7c3aed', border: '1px solid #e9d5ff', backgroundColor: '#faf5ff' }
              }
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Assistant</span>
            </button>
          </div>
        </div>

        {/* Cross-post platform selector strip */}
        {crossPost && (
          <div className="flex items-center gap-2 px-3 sm:px-5 py-2 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 shrink-0 overflow-x-auto">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold shrink-0">Post to:</span>
            {availablePlatforms.map(p => {
              const sel = selectedPlatforms.has(p.key);
              const Icon = p.Icon;
              return (
                <button key={p.key}
                  onClick={() => setSelectedPlatforms(prev => {
                    const next = new Set(prev);
                    next.has(p.key) ? next.delete(p.key) : next.add(p.key);
                    return next;
                  })}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all duration-200 shrink-0"
                  style={sel
                    ? { background: p.gradient, color: '#fff', borderColor: 'transparent', boxShadow: `0 2px 6px ${p.color}35` }
                    : { borderColor: '#e4e4e7', color: '#71717a', background: 'transparent' }
                  }
                >
                  <Icon className="h-3.5 w-3.5" />
                  {p.label}
                  {sel && <CheckCircle2 className="h-3 w-3" />}
                </button>
              );
            })}
          </div>
        )}

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Writing area */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto"
            style={{ backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e5e7eb 28px)', backgroundSize: '100% 28px' }}>
            <div className="flex-1 px-6 pt-5 pb-0">
              {showPreview ? (
                /* Preview mode */
                <div className="max-w-lg mx-auto">
                  <div className="rounded-xl border overflow-hidden shadow-sm bg-white dark:bg-zinc-900"
                    style={{ borderColor: activePlatform.border }}>
                    <div className="p-4 flex items-center gap-3" style={{ background: activePlatform.bg }}>
                      {previewAvatar
                        ? <img src={previewAvatar} className="h-10 w-10 rounded-full object-cover ring-2 ring-white" alt="" />
                        : <div className="h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                          style={{ background: activePlatform.gradient }}>{previewName[0]?.toUpperCase()}</div>
                      }
                      <div>
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{previewName}</p>
                        <p className="text-xs text-zinc-400 flex items-center gap-1">
                          <activePlatform.Icon className="h-3 w-3" style={{ color: activePlatform.color }} />
                          {activePlatform.label}
                        </p>
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {contents[activeTab] || <span className="italic text-zinc-400">Your post will appear here...</span>}
                      </p>
                      {hashtags[activeTab].length > 0 && (
                        <p className="mt-3 text-sm font-medium" style={{ color: activePlatform.color }}>
                          {hashtags[activeTab].map(t => `#${t}`).join(' ')}
                        </p>
                      )}
                    </div>
                    {linkUrl && (
                      <div className="mx-4 mb-3 rounded-lg border border-zinc-200 dark:border-zinc-700 overflow-hidden">
                        <div className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 flex items-center gap-2">
                          <ExternalLink className="h-3 w-3 text-zinc-400 shrink-0" />
                          <a href={linkUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-blue-500 truncate hover:underline">{linkUrl}</a>
                        </div>
                      </div>
                    )}
                    {mediaUrls.length > 0 && (
                      <div className="mx-4 mb-3 flex gap-2 overflow-x-auto">
                        {mediaUrls.map((url, i) => (
                          <div key={i} className="shrink-0 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-800 h-32 w-48">
                            <img src={url} alt="" className="h-full w-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="px-4 pb-3 flex items-center gap-4 text-xs text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2">
                      <span>👍 Like</span><span>💬 Comment</span><span>🔁 Share</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Write mode */
                <textarea
                  ref={textareaRef}
                  className="w-full h-full min-h-[320px] resize-none bg-transparent text-zinc-800 dark:text-zinc-200 text-[15px] leading-7 focus:outline-none placeholder:text-zinc-300 dark:placeholder:text-zinc-600 font-[system-ui]"
                  placeholder={`Start writing your ${activePlatform.label} post...\n\nTip: Open AI Assistant to refine your content through chat →`}
                  value={contents[activeTab]}
                  onChange={e => setContents(prev => ({ ...prev, [activeTab]: e.target.value }))}
                />
              )}
            </div>

            {/* Attachment toolbar */}
            <div className="px-6 py-2 flex items-center gap-3 border-t border-zinc-100 dark:border-zinc-800">
              {/* Link */}
              <button
                onClick={() => setShowLinkInput(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${showLinkInput || linkUrl ? 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <Link2 className="h-3.5 w-3.5" /> Add Link
              </button>

              {/* Media URL */}
              <button
                onClick={() => setShowMediaInput(v => !v)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${showMediaInput || mediaUrls.length > 0 ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' : 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                <ImagePlus className="h-3.5 w-3.5" /> Add Image
              </button>

              {/* Media chips */}
              {mediaUrls.map((url, i) => (
                <span key={i} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 max-w-[140px]">
                  <ImagePlus className="h-3 w-3 shrink-0" />
                  <span className="truncate">{url.split('/').pop()}</span>
                  <button onClick={() => setMediaUrls(prev => prev.filter((_, j) => j !== i))} className="ml-0.5 hover:text-red-400">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </span>
              ))}
            </div>

            {/* Media URL input (expanded) */}
            {showMediaInput && (
              <div className="px-6 pb-2 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-900">
                  <ImagePlus className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="url"
                    className="flex-1 text-xs bg-transparent focus:outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                    placeholder="https://example.com/image.jpg"
                    value={mediaInput}
                    onChange={e => setMediaInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && mediaInput.trim()) {
                        setMediaUrls(prev => [...prev, mediaInput.trim()]);
                        setMediaInput('');
                        setShowMediaInput(false);
                      }
                    }}
                    autoFocus
                  />
                  {mediaInput && (
                    <button onClick={() => setMediaInput('')} className="text-zinc-400 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    if (mediaInput.trim()) {
                      setMediaUrls(prev => [...prev, mediaInput.trim()]);
                      setMediaInput('');
                      setShowMediaInput(false);
                    }
                  }}
                  className="text-xs px-2.5 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-white font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            )}

            {/* Link input (expanded) */}
            {showLinkInput && (
              <div className="px-6 pb-2 flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-2 bg-zinc-50 dark:bg-zinc-900">
                  <ExternalLink className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <input
                    type="url"
                    className="flex-1 text-xs bg-transparent focus:outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                    placeholder="https://example.com/article..."
                    value={linkUrl}
                    onChange={e => setLinkUrl(e.target.value)}
                  />
                  {linkUrl && (
                    <button onClick={() => setLinkUrl('')} className="text-zinc-400 hover:text-red-400">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Hashtag + char counter bar */}
            <div className="sticky bottom-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 px-6 py-3">
              <div className="flex items-center gap-3">
                {/* Hashtag input */}
                <div className="flex items-center gap-2 flex-1">
                  <Hash className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                  <div className="flex flex-wrap gap-1.5 flex-1 items-center">
                    {hashtags[activeTab].map(tag => (
                      <span key={tag}
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: activePlatform.bg, color: activePlatform.color, border: `1px solid ${activePlatform.border}` }}
                      >
                        #{tag}
                        <button onClick={() => setHashtags(prev => ({ ...prev, [activeTab]: prev[activeTab].filter(t => t !== tag) }))}>
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    ))}
                    <input
                      className="text-xs bg-transparent focus:outline-none text-zinc-600 dark:text-zinc-400 placeholder:text-zinc-300 min-w-[120px]"
                      placeholder="Add hashtag, press Enter..."
                      value={hashtagInput}
                      onChange={e => setHashtagInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const tag = hashtagInput.trim().replace(/^#/, '');
                          if (tag && !hashtags[activeTab].includes(tag))
                            setHashtags(prev => ({ ...prev, [activeTab]: [...prev[activeTab], tag] }));
                          setHashtagInput('');
                        }
                      }}
                    />
                  </div>
                </div>

                {/* Char counter arc */}
                <div className="relative shrink-0 flex items-center justify-center">
                  <CharArc pct={pct} />
                  <span className="absolute text-[9px] font-semibold text-zinc-500" style={{ rotate: '90deg' }}>
                    {pct > 85 ? Math.round(100 - pct) + '%' : ''}
                  </span>
                </div>
                <span className="text-xs text-zinc-400 shrink-0 tabular-nums">{charCount}/{activePlatform.maxChars}</span>
              </div>
            </div>
          </div>

          {/* Publish sidebar */}
          <div className="hidden lg:flex lg:w-64 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-col overflow-y-auto">

            {/* Account */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-3">Posting as</p>
              {activeAccounts.length === 0 ? (
                <button onClick={() => navigate('/dashboard/social/accounts')}
                  className="w-full text-left text-xs text-blue-500 underline">
                  Connect {activePlatform.label} account →
                </button>
              ) : activeAccounts.length === 1 ? (
                <div className="flex items-center gap-2.5">
                  {selectedAccount?.metadata_?.avatar_url
                    ? <img src={selectedAccount.metadata_.avatar_url} className="h-8 w-8 rounded-full object-cover" alt="" />
                    : <div className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ background: activePlatform.gradient }}>{previewName[0]?.toUpperCase()}</div>
                  }
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">{previewName}</p>
                    <p className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <activePlatform.Icon className="h-2.5 w-2.5" style={{ color: activePlatform.color }} />
                      {activePlatform.label}
                    </p>
                  </div>
                </div>
              ) : (
                <select
                  className="w-full text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-transparent focus:outline-none focus:ring-1 text-zinc-700 dark:text-zinc-300"
                  style={{ '--tw-ring-color': activePlatform.color } as any}
                  value={selectedAccountId}
                  onChange={e => setSelectedAccountId(e.target.value)}
                >
                  <option value="">Select account...</option>
                  {activeAccounts.map(a => <option key={a.id} value={String(a.id)}>{a.account_name}</option>)}
                </select>
              )}
            </div>

            {/* Twitter free-tier notice */}
            {activeTab === 'twitter' && (
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold mb-2">X (Twitter) — Free tier</p>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  280 character limit · text only · 1,500 tweets/month
                </p>
              </div>
            )}

            {/* Reddit-specific fields */}
            {activeTab === 'reddit' && (
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">Reddit details</p>
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium block mb-1">Subreddit <span className="text-red-400">*</span></label>
                  <div className="flex items-center border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                    <span className="px-2 text-xs text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border-r border-zinc-200 dark:border-zinc-700 h-full flex items-center py-2">r/</span>
                    <input
                      className="flex-1 text-xs px-2.5 py-2 bg-transparent focus:outline-none text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                      placeholder="AskIndia"
                      value={redditSubreddit}
                      onChange={e => setRedditSubreddit(e.target.value.replace(/^r\//, ''))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-medium block mb-1">Post title</label>
                  <input
                    className="w-full text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-orange-400 text-zinc-700 dark:text-zinc-300 placeholder:text-zinc-400"
                    placeholder="Leave blank to use post text"
                    value={redditTitle}
                    onChange={e => setRedditTitle(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="p-4 border-b border-zinc-100 dark:border-zinc-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold flex items-center gap-1.5">
                  <Clock className="h-3 w-3" /> Schedule
                </span>
                <Switch checked={scheduleMode} onCheckedChange={setScheduleMode}
                  className="scale-75 origin-right" />
              </div>
              {scheduleMode && (
                <input
                  type="datetime-local"
                  className="w-full text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-400 text-zinc-700 dark:text-zinc-300"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                />
              )}
            </div>

            {/* Validation */}
            {(activeValidation.errors.length > 0 || activeValidation.warnings.length > 0) && (
              <div className="px-4 pb-0 pt-2 space-y-1.5">
                {activeValidation.errors.map(e => (
                  <div key={e} className="flex items-center gap-1.5 text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 rounded-lg px-2.5 py-1.5">
                    <AlertCircle className="h-3 w-3 shrink-0" /> {e}
                  </div>
                ))}
                {activeValidation.warnings.map(w => (
                  <div key={w} className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-2.5 py-1.5">
                    <AlertTriangle className="h-3 w-3 shrink-0" /> {w}
                  </div>
                ))}
              </div>
            )}

            {/* Actions */}
            <div className="p-4 space-y-2.5 mt-auto">
              <button
                disabled={isBusy || !contents[activeTab] || (!crossPost && !activeValidation.valid)}
                onClick={() => {
                  if (crossPost) {
                    setShowPrePublishModal(true);
                    return;
                  }
                  const payload = buildPayload();
                  if (scheduleMode && scheduledAt) {
                    scheduleMutation.mutate({ ...payload, scheduled_at: toUTCISOString(scheduledAt) });
                  } else {
                    publishMutation.mutate(payload);
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: isBusy ? '#9ca3af' : crossPost ? 'linear-gradient(135deg,#16a34a,#15803d)' : activePlatform.gradient,
                  boxShadow: contents[activeTab] ? crossPost ? '0 4px 14px #16a34a35' : `0 4px 14px ${activePlatform.color}35` : 'none',
                }}
              >
                {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : scheduleMode ? <Calendar className="h-4 w-4" /> : crossPost ? <Globe className="h-4 w-4" /> : <Send className="h-4 w-4" />}
                {crossPost ? `Post to ${selectedPlatforms.size} platform${selectedPlatforms.size !== 1 ? 's' : ''}` : scheduleMode ? 'Schedule' : 'Publish Now'}
              </button>

              {!crossPost && (
                <button
                  disabled={isBusy || !contents[activeTab]}
                  onClick={() => saveMutation.mutate({ ...buildPayload(), status: 'draft' })}
                  className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Draft
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Mobile publish bar — bottom of vertical flex column, visible only on < lg */}
        <div className="lg:hidden shrink-0 flex items-center gap-2 px-3 py-2.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          {activeAccounts.length > 1 && (
            <select
              className="flex-1 text-xs border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-2 bg-transparent focus:outline-none text-zinc-700 dark:text-zinc-300 min-w-0"
              value={selectedAccountId}
              onChange={e => setSelectedAccountId(e.target.value)}
            >
              <option value="">Select account...</option>
              {activeAccounts.map(a => <option key={a.id} value={String(a.id)}>{a.account_name}</option>)}
            </select>
          )}
          <button
            disabled={isBusy || !contents[activeTab]}
            onClick={() => {
              const payload = buildPayload();
              if (scheduleMode && scheduledAt) {
                scheduleMutation.mutate({ ...payload, scheduled_at: toUTCISOString(scheduledAt) });
              } else {
                publishMutation.mutate(payload);
              }
            }}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-semibold text-white flex-1 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: isBusy ? '#9ca3af' : activePlatform.gradient }}
          >
            {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Publish
          </button>
          <button
            disabled={isBusy || !contents[activeTab]}
            onClick={() => saveMutation.mutate({ ...buildPayload(), status: 'draft' })}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-sm text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40"
          >
            <Save className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── AI Assistant — desktop sidebar (xl+) ── */}
      {aiOpen && (
        <div className="hidden xl:block xl:w-[340px] shrink-0 h-full border-l border-zinc-200 dark:border-zinc-800">
          <PostAIAssistant
            open={aiOpen}
            onClose={() => setAiOpen(false)}
            platform={activeTab}
            currentContent={contents[activeTab]}
            onApply={(content, tags) => {
              setContents(prev => ({ ...prev, [activeTab]: content }));
              if (tags && tags.length > 0)
                setHashtags(prev => ({ ...prev, [activeTab]: tags.map(t => t.replace('#', '')) }));
            }}
          />
        </div>
      )}

      {/* ── AI Assistant — mobile/tablet bottom sheet (< xl) ── */}
      {aiOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setAiOpen(false)} />
          <div className="relative flex flex-col rounded-t-2xl overflow-hidden shadow-2xl" style={{ height: '78vh' }}>
            <PostAIAssistant
              open={aiOpen}
              onClose={() => setAiOpen(false)}
              platform={activeTab}
              currentContent={contents[activeTab]}
              onApply={(content, tags) => {
                setContents(prev => ({ ...prev, [activeTab]: content }));
                if (tags && tags.length > 0)
                  setHashtags(prev => ({ ...prev, [activeTab]: tags.map(t => t.replace('#', '')) }));
                setAiOpen(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Linkedin, Instagram, Facebook,
  Clock, Trash2, Zap, Shield, Users, Wifi, WifiOff,
} from 'lucide-react';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { BACKEND_URL } from '@/config/env';

/* ─── fonts + keyframes ──────────────────────────────────────── */
const FONTS = `


  @keyframes pulse-ring {
    0%   { transform: scale(1);   opacity: 0.5; }
    70%  { transform: scale(2.4); opacity: 0; }
    100% { transform: scale(2.4); opacity: 0; }
  }
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scan-light {
    0%   { top: 0;    opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }
  .ch-card { animation: fade-up 0.45s ease both; }
  .ch-card:nth-child(1) { animation-delay: 0.05s; }
  .ch-card:nth-child(2) { animation-delay: 0.14s; }
  .ch-card:nth-child(3) { animation-delay: 0.23s; }
  .ch-card:hover .scan-line { animation: scan-light 2s linear infinite; }
  .scan-line { opacity: 0; }
`;

/* ─── helpers ────────────────────────────────────────────────── */
const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const res = await fetch(url, {
    ...options,
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...options.headers },
  });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  if (res.status === 204 || res.headers.get('content-length') === '0') return null;
  return res.json();
};

interface SocialAccount {
  id: number;
  platform: 'linkedin' | 'instagram' | 'facebook';
  account_name: string;
  account_type: string;
  status: 'active' | 'expired' | 'disconnected';
  token_expires_at: string | null;
  scopes: string[];
  metadata_: { followers?: number; avatar_url?: string } | null;
  created_at: string;
}

/* Platform brand colors — these are product-specific, not theme colors */
const PLATFORMS = {
  linkedin: {
    label: 'LinkedIn', Icon: Linkedin, channel: 'CH·01', tagline: 'Professional network',
    accent: '#0A66C2', gradient: 'linear-gradient(135deg,#0A66C2,#0A8CF0)', glow: '10,102,194',
    scopes: ['w_member_social', 'r_liteprofile'],
  },
  instagram: {
    label: 'Instagram', Icon: Instagram, channel: 'CH·02', tagline: 'Visual storytelling',
    accent: '#C13584', gradient: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', glow: '193,53,132',
    scopes: ['instagram_basic', 'content_publish'],
  },
  facebook: {
    label: 'Facebook', Icon: Facebook, channel: 'CH·03', tagline: 'Page broadcasting',
    accent: '#1877F2', gradient: 'linear-gradient(135deg,#1877F2,#42a5f5)', glow: '24,119,242',
    scopes: ['pages_manage_posts', 'pages_read_engagement'],
  },
} as const;

/* ─── PulseDot ───────────────────────────────────────────────── */
function PulseDot({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      {active && (
        <div className="absolute inset-0 rounded-full"
          style={{ background: color, animation: 'pulse-ring 2.2s ease-out infinite' }} />
      )}
      <div className={`relative w-2 h-2 rounded-full transition-all duration-300 ${active ? '' : 'bg-muted-foreground/30'}`}
        style={active ? { background: color, boxShadow: `0 0 5px ${color}` } : undefined} />
    </div>
  );
}

/* ─── SignalBars ─────────────────────────────────────────────── */
function SignalBars({ color, active }: { color: string; active: boolean }) {
  return (
    <div className="flex items-end gap-0.5">
      {[3, 5, 7, 9].map((h, i) => (
        <div key={i} className={`w-1 rounded-sm transition-all duration-300 ${active ? '' : 'bg-muted-foreground/25'}`}
          style={active ? { height: h, background: `${color}${['66', '88', 'aa', 'ff'][i]}` } : { height: h }} />
      ))}
    </div>
  );
}

/* ─── AccountRow ─────────────────────────────────────────────── */
function AccountRow({ account, cfg, onDisconnect }: {
  account: SocialAccount;
  cfg: typeof PLATFORMS[keyof typeof PLATFORMS];
  onDisconnect: () => void;
}) {
  const isExpiring = account.token_expires_at &&
    new Date(account.token_expires_at) < new Date(Date.now() + 7 * 86400000);
  const isActive = account.status === 'active';
  const Icon = cfg.Icon;

  return (
    <div className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors
      bg-muted/50 hover:bg-muted border border-border">

      {/* Avatar */}
      <div className="relative shrink-0">
        {account.metadata_?.avatar_url
          ? <img src={account.metadata_.avatar_url.startsWith('data:') ? account.metadata_.avatar_url : `${BACKEND_URL}/api/v1/proxy/image-proxy?url=${encodeURIComponent(account.metadata_.avatar_url)}`} alt=""
              className="h-8 w-8 rounded-full object-cover ring-2 ring-background" />
          : <div className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: cfg.gradient }}>
              {account.account_name[0]?.toUpperCase()}
            </div>
        }
        <div className="absolute -bottom-0.5 -right-0.5">
          <PulseDot color={isActive ? '#22c55e' : '#ef4444'} active={isActive} />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground truncate"
          style={{ }}>
          {account.account_name}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
            {account.account_type}
          </span>
          {account.metadata_?.followers != null && (
            <>
              <span className="text-border">·</span>
              <span className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                <Users className="h-2.5 w-2.5" />{account.metadata_.followers.toLocaleString()}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Status + delete */}
      <div className="shrink-0 flex items-center gap-2">
        {isExpiring && isActive && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1
            bg-warning/10 text-warning border border-warning/30">
            <Clock className="h-2.5 w-2.5" />EXPIRING
          </span>
        )}
        {!isActive && (
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1
            bg-destructive/10 text-destructive border border-destructive/25">
            <WifiOff className="h-2.5 w-2.5" />{account.status.toUpperCase()}
          </span>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="h-6 w-6 rounded-md flex items-center justify-center transition-all
              text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 className="h-3 w-3" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Disconnect account?</AlertDialogTitle>
              <AlertDialogDescription asChild>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>You are about to disconnect <strong className="text-foreground">{account.account_name}</strong> from HeyGenAlly.</p>
                  <p className="text-destructive font-medium">⚠ All posts associated with this account will be permanently deleted and cannot be recovered.</p>
                  <p>Are you sure you want to continue?</p>
                </div>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={onDisconnect}>Yes, disconnect & delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────────── */
export default function SocialAccountsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState<string | null>(null);

  const { data: accountsData, isLoading } = useQuery({
    queryKey: ['social-accounts'],
    queryFn: () => authFetch(`/api/v1/social/accounts`),
  });

  const accounts: SocialAccount[] = Array.isArray(accountsData) ? accountsData : (accountsData?.accounts ?? []);

  const disconnectMutation = useMutation({
    mutationFn: (id: number) => authFetch(`/api/v1/social/accounts/${id}`, { method: 'DELETE' }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['social-accounts'] }); toast({ title: 'Account disconnected' }); },
    onError: () => toast({ title: 'Failed to disconnect', variant: 'destructive' }),
  });

  const handleConnect = (platform: string) => {
    setConnecting(platform);
    const token = localStorage.getItem('accessToken');
    window.location.href = `/api/v1/social/auth/${platform}/connect?token=${token}`;
  };

  const totalActive = accounts.filter(a => a.status === 'active').length;

  return (
    <>
      <style>{FONTS}</style>

      <div className="min-h-full flex flex-col bg-background"
        style={{ }}>

        {/* ── Top bar ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0 bg-card border-b border-border">
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono tracking-widest uppercase text-muted-foreground">
              Social Channels
            </span>
            <span className="text-border">·</span>
            <span className="text-[11px] font-mono text-muted-foreground">
              {isLoading ? '—' : `${totalActive} / 3 active`}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-muted-foreground">
            <Shield className="h-3 w-3" /> tokens encrypted
          </div>
        </div>

        {/* ── Channel grid ── */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 p-4 sm:p-6">
          {(Object.entries(PLATFORMS) as [keyof typeof PLATFORMS, typeof PLATFORMS[keyof typeof PLATFORMS]][]).map(([key, cfg]) => {
            const platformAccounts = accounts.filter(a => a.platform === key);
            const hasActive = platformAccounts.some(a => a.status === 'active');
            const Icon = cfg.Icon;

            return (
              <div key={key} className="ch-card relative flex flex-col rounded-2xl overflow-hidden bg-card border border-border transition-shadow duration-300"
                style={hasActive ? {
                  borderColor: `${cfg.accent}44`,
                  boxShadow: `0 0 0 1px ${cfg.accent}18, 0 8px 32px rgba(${cfg.glow},0.10)`,
                } : undefined}>

                {/* Scan line — purely decorative, platform brand color */}
                <div className="scan-line absolute left-0 right-0 h-px pointer-events-none z-10"
                  style={{ background: `linear-gradient(90deg,transparent,${cfg.accent}50,transparent)` }} />

                {/* Platform header */}
                <div className="px-5 pt-5 pb-4 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-mono tracking-[0.18em] uppercase"
                      style={{ color: hasActive ? cfg.accent : undefined }}
                      className={hasActive ? '' : 'text-muted-foreground'}>
                      {cfg.channel}
                    </span>
                    <div className="flex items-center gap-2">
                      <SignalBars color={cfg.accent} active={hasActive} />
                      <PulseDot color={cfg.accent} active={hasActive} />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${hasActive ? '' : 'bg-muted'}`}
                      style={hasActive ? {
                        background: cfg.gradient,
                        boxShadow: `0 4px 14px rgba(${cfg.glow},0.30)`,
                      } : undefined}>
                      <Icon className={`h-5 w-5 transition-colors duration-300 ${hasActive ? '' : 'text-muted-foreground'}`}
                        style={hasActive ? { color: '#fff' } : undefined} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-foreground leading-none"
                        style={{ }}>
                        {cfg.label}
                      </h2>
                      <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{cfg.tagline}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 mt-3">
                    {cfg.scopes.map(s => (
                      <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Accounts list */}
                <div className="flex-1 px-4 py-3 space-y-2">
                  {isLoading ? (
                    <div className="flex items-center gap-2 py-4">
                      <div className="h-1.5 w-1.5 rounded-full animate-pulse"
                        style={{ background: cfg.accent }} />
                      <span className="text-[11px] font-mono text-muted-foreground">scanning...</span>
                    </div>
                  ) : platformAccounts.length > 0 ? (
                    platformAccounts.map(acc => (
                      <AccountRow key={acc.id} account={acc} cfg={cfg}
                        onDisconnect={() => disconnectMutation.mutate(acc.id)} />
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                      <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-muted border border-border">
                        <WifiOff className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="text-[11px] font-mono text-muted-foreground">no signal</span>
                    </div>
                  )}
                </div>

                {/* Connect / Add button */}
                <div className="px-4 pb-4 pt-1">
                  {hasActive ? (
                    <button
                      onClick={() => handleConnect(key)}
                      disabled={connecting === key}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-[11px] font-mono tracking-wider transition-colors
                        border border-border bg-transparent text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      <Zap className="h-3 w-3" />
                      {connecting === key ? 'CONNECTING...' : '+ ADD ACCOUNT'}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(key)}
                      disabled={connecting === key}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white tracking-wider transition-all duration-300 disabled:opacity-60"
                      style={{
                        background: cfg.gradient,
                        boxShadow: `0 4px 18px rgba(${cfg.glow},0.28)`,
                        letterSpacing: '0.07em',
                      }}
                    >
                      {connecting === key
                        ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        : <Wifi className="h-4 w-4" />
                      }
                      {connecting === key ? 'CONNECTING' : 'CONNECT'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Footer ── */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 shrink-0 border-t border-border bg-card">
          <div className="flex items-center gap-4">
            {(Object.entries(PLATFORMS) as [keyof typeof PLATFORMS, typeof PLATFORMS[keyof typeof PLATFORMS]][]).map(([key, cfg]) => {
              const live = accounts.some(a => a.platform === key && a.status === 'active');
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <div className={`h-1.5 w-1.5 rounded-full transition-all duration-500 ${live ? '' : 'bg-muted-foreground/30'}`}
                    style={live ? { background: cfg.accent, boxShadow: `0 0 4px ${cfg.accent}` } : undefined} />
                  <span className="text-[10px] font-mono text-muted-foreground">{cfg.channel}</span>
                </div>
              );
            })}
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">
            {totalActive === 0 ? 'no channels live' : `${totalActive} channel${totalActive > 1 ? 's' : ''} broadcasting`}
          </span>
        </div>
      </div>
    </>
  );
}

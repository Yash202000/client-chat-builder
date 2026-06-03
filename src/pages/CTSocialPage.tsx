import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus, Copy, CheckCircle2, Pencil, Trash2, ExternalLink,
  MousePointerClick, Users, Link2, BarChart3,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// ── channel meta ─────────────────────────────────────────────────────────────

type Channel = 'whatsapp' | 'instagram' | 'telegram' | 'messenger';

const CHANNEL_META: Record<Channel, {
  label: string;
  color: string;
  accent: string;
  handleLabel: string;
  handlePlaceholder: string;
  handleHint: string;
  hasPrefill: boolean;
  prefillLabel?: string;
  prefillPlaceholder?: string;
  icon: React.ReactNode;
}> = {
  whatsapp: {
    label: 'WhatsApp',
    color: 'text-green-600',
    accent: 'bg-green-500',
    handleLabel: 'Phone Number',
    handlePlaceholder: '919876543210',
    handleHint: 'Country code + number, no spaces. e.g. 919876543210',
    hasPrefill: true,
    prefillLabel: 'Pre-filled Message',
    prefillPlaceholder: "Hi, I'm interested in your offer!",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
  },
  instagram: {
    label: 'Instagram',
    color: 'text-pink-600',
    accent: 'bg-pink-500',
    handleLabel: 'Instagram Username',
    handlePlaceholder: 'yourbrand',
    handleHint: 'Enter your Instagram username without @.',
    hasPrefill: false,
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  telegram: {
    label: 'Telegram',
    color: 'text-sky-600',
    accent: 'bg-sky-500',
    handleLabel: 'Bot or Channel Username',
    handlePlaceholder: 'yourbotname',
    handleHint: 'Enter your Telegram bot or channel username without @.',
    hasPrefill: true,
    prefillLabel: 'Start Parameter',
    prefillPlaceholder: 'summer_sale',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
      </svg>
    ),
  },
  messenger: {
    label: 'Messenger',
    color: 'text-blue-600',
    accent: 'bg-blue-500',
    handleLabel: 'Facebook Page Username',
    handlePlaceholder: 'yourpagename',
    handleHint: 'Enter your Facebook Page username or Page ID.',
    hasPrefill: true,
    prefillLabel: 'Ref Parameter',
    prefillPlaceholder: 'summer_campaign',
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
      </svg>
    ),
  },
};

const CHANNEL_TABS = ['all', 'whatsapp', 'instagram', 'telegram', 'messenger'] as const;
type ChannelTab = typeof CHANNEL_TABS[number];

// ── types ─────────────────────────────────────────────────────────────────────

interface CTSLink {
  id: number;
  link_key: string;
  channel: Channel;
  name: string;
  handle: string;
  prefill_message: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  auto_tag: string | null;
  workflow_id: number | null;
  click_count: number;
  contact_count: number;
  is_active: boolean;
  created_at: string;
  short_url: string;
  channel_url: string;
}

interface CTSClick {
  id: number;
  referrer_url: string | null;
  contact_id: number | null;
  clicked_at: string;
  converted_at: string | null;
}

const DEFAULT_FORM = {
  channel: 'whatsapp' as Channel,
  name: '',
  handle: '',
  prefill_message: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  auto_tag: '',
};

// ── helpers ───────────────────────────────────────────────────────────────────

const toAbsoluteUrl = (url: string) =>
  url.startsWith('/') ? `${window.location.origin}${url}` : url;

const CopyButton: React.FC<{ text: string; label?: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
      className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
    >
      {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {label && <span>{copied ? 'Copied!' : label}</span>}
    </button>
  );
};

const ChannelBadge: React.FC<{ channel: Channel }> = ({ channel }) => {
  const meta = CHANNEL_META[channel];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 ${meta.color}`}>
      {meta.icon}
      {meta.label}
    </span>
  );
};

// ── page ─────────────────────────────────────────────────────────────────────

export default function CTSocialPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [activeTab, setActiveTab] = useState<ChannelTab>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLink, setEditLink] = useState<CTSLink | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [clicksLink, setClicksLink] = useState<CTSLink | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CTSLink | null>(null);

  const channelFilter = activeTab === 'all' ? undefined : activeTab;

  const { data: links = [], isLoading } = useQuery<CTSLink[]>({
    queryKey: ['cts-links', channelFilter],
    queryFn: async () => {
      const url = channelFilter ? `/api/v1/cts?channel=${channelFilter}` : '/api/v1/cts';
      const res = await authFetch(url);
      if (!res.ok) throw new Error('Failed to load links');
      return res.json();
    },
  });

  const { data: clicks = [] } = useQuery<CTSClick[]>({
    queryKey: ['cts-clicks', clicksLink?.id],
    enabled: !!clicksLink,
    queryFn: async () => {
      const res = await authFetch(`/api/v1/cts/${clicksLink!.id}/clicks`);
      if (!res.ok) throw new Error('Failed to load clicks');
      return res.json();
    },
  });

  const createMut = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await authFetch('/api/v1/cts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cts-links'] }); closeDialog(); toast({ title: 'Link created' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Record<string, any> }) => {
      const res = await authFetch(`/api/v1/cts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cts-links'] }); closeDialog(); toast({ title: 'Link updated' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/v1/cts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cts-links'] }); setDeleteTarget(null); toast({ title: 'Link deleted' }); },
  });

  const openCreate = () => { setEditLink(null); setForm({ ...DEFAULT_FORM }); setDialogOpen(true); };
  const openEdit = (l: CTSLink) => {
    setEditLink(l);
    setForm({
      channel: l.channel,
      name: l.name,
      handle: l.handle,
      prefill_message: l.prefill_message || '',
      utm_source: l.utm_source || '',
      utm_medium: l.utm_medium || '',
      utm_campaign: l.utm_campaign || '',
      utm_content: l.utm_content || '',
      auto_tag: l.auto_tag || '',
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditLink(null); };

  const handleSave = () => {
    if (!form.handle.trim()) { toast({ title: `${CHANNEL_META[form.channel].handleLabel} required`, variant: 'destructive' }); return; }
    if (!form.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    const payload: Record<string, any> = {};
    Object.entries(form).forEach(([k, v]) => {
      if (v !== '') payload[k] = k === 'channel' ? v : v;
    });
    if (editLink) updateMut.mutate({ id: editLink.id, payload });
    else createMut.mutate(payload);
  };

  const set = (key: keyof typeof DEFAULT_FORM, val: string) => setForm(f => ({ ...f, [key]: val }));

  const totalClicks = links.reduce((s, l) => s + l.click_count, 0);
  const totalContacts = links.reduce((s, l) => s + l.contact_count, 0);
  const convRate = totalClicks > 0 ? ((totalContacts / totalClicks) * 100).toFixed(1) : '0';

  const activeMeta = CHANNEL_META[form.channel];

  return (
    <div className="p-3 sm:p-6 max-w-5xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
            Click to Social
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Trackable short links for any social channel — measure every click and attribute contacts.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 self-start sm:self-auto shrink-0">
          <Plus className="w-4 h-4" /> New Link
        </Button>
      </div>

      {/* Stats strip */}
      {links.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { label: 'Total Clicks', value: totalClicks, icon: MousePointerClick, color: 'text-blue-500' },
            { label: 'Contacts Created', value: totalContacts, icon: Users, color: 'text-green-500' },
            { label: 'Conversion Rate', value: `${convRate}%`, icon: BarChart3, color: 'text-purple-500' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-4">
                <stat.icon className={`w-5 h-5 sm:w-8 sm:h-8 ${stat.color} opacity-80 shrink-0`} />
                <div className="min-w-0">
                  <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Channel tabs */}
      <div className="flex border-b border-border overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
        {CHANNEL_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap shrink-0 ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'all' ? 'All Channels' : CHANNEL_META[tab as Channel].label}
          </button>
        ))}
      </div>

      {/* Links list */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading links…</div>
      ) : links.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Link2 className="w-8 h-8 text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-200">No links yet</p>
              <p className="text-sm text-gray-400 mt-1">Create a link, share it anywhere, and track every click.</p>
            </div>
            <Button onClick={openCreate} className="gap-2">
              <Plus className="w-4 h-4" /> Create Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {links.map(link => {
            const meta = CHANNEL_META[link.channel];
            return (
              <Card key={link.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 flex-shrink-0 ${meta.accent}`} />
                    <div className="flex-1 p-4">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{link.name}</h3>
                            <ChannelBadge channel={link.channel} />
                            <Badge
                              variant={link.is_active ? 'default' : 'secondary'}
                              className={link.is_active
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs'
                                : 'text-xs'}
                            >
                              {link.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                            {link.utm_campaign && <Badge variant="outline" className="text-xs">{link.utm_campaign}</Badge>}
                            {link.auto_tag && <Badge variant="outline" className="text-xs">tag: {link.auto_tag}</Badge>}
                          </div>

                          {/* Handle */}
                          <p className="text-xs text-gray-400 mt-1">
                            <span className={`font-medium ${meta.color}`}>{meta.label}:</span> {link.handle}
                          </p>

                          {/* Short URL */}
                          <div className="flex items-center gap-2 mt-1.5">
                            <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-gray-700 dark:text-gray-300 truncate max-w-[150px] sm:max-w-xs">
                              {toAbsoluteUrl(link.short_url)}
                            </code>
                            <CopyButton text={toAbsoluteUrl(link.short_url)} label="Copy" />
                          </div>

                          {link.prefill_message && (
                            <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">"{link.prefill_message}"</p>
                          )}

                          {/* Stats */}
                          <div className="flex items-center gap-3 sm:gap-4 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <MousePointerClick className="w-3 h-3" /> {link.click_count} clicks
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Users className="w-3 h-3" /> {link.contact_count} contacts
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(link.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button size="sm" variant="outline" onClick={() => setClicksLink(link)} title="View clicks">
                            <BarChart3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => window.open(link.channel_url, '_blank')} title="Test link">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => openEdit(link)}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(link)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent aria-describedby={undefined} className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editLink ? 'Edit Link' : 'Create Social Link'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
              <TabsTrigger value="attribution" className="flex-1">UTM / Attribution</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              {/* Channel selector — only shown on create */}
              {!editLink && (
                <div className="grid gap-2">
                  <Label>Channel <span className="text-red-500">*</span></Label>
                  <Select value={form.channel} onValueChange={v => set('channel', v as Channel)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(CHANNEL_META) as Channel[]).map(ch => (
                        <SelectItem key={ch} value={ch}>
                          <span className="flex items-center gap-2">
                            {CHANNEL_META[ch].icon}
                            {CHANNEL_META[ch].label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid gap-2">
                <Label>Link Name <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer Sale Campaign" />
              </div>

              <div className="grid gap-2">
                <Label>{activeMeta.handleLabel} <span className="text-red-500">*</span></Label>
                <Input
                  value={form.handle}
                  onChange={e => set('handle', e.target.value)}
                  placeholder={activeMeta.handlePlaceholder}
                />
                <p className="text-xs text-gray-400">{activeMeta.handleHint}</p>
              </div>

              {activeMeta.hasPrefill && (
                <div className="grid gap-2">
                  <Label>{activeMeta.prefillLabel}</Label>
                  <Input
                    value={form.prefill_message}
                    onChange={e => set('prefill_message', e.target.value)}
                    placeholder={activeMeta.prefillPlaceholder}
                  />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Auto-Tag Contacts</Label>
                <Input value={form.auto_tag} onChange={e => set('auto_tag', e.target.value)} placeholder="e.g. summer-sale" />
                <p className="text-xs text-gray-400">Applied automatically when the contact first messages you.</p>
              </div>
            </TabsContent>

            <TabsContent value="attribution" className="space-y-4 mt-4">
              <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                UTM parameters are stored in the contact's CRM record for campaign attribution reporting.
              </p>
              {[
                { key: 'utm_source', label: 'UTM Source', placeholder: 'e.g. instagram' },
                { key: 'utm_medium', label: 'UTM Medium', placeholder: 'e.g. bio_link' },
                { key: 'utm_campaign', label: 'UTM Campaign', placeholder: 'e.g. summer_sale_2025' },
                { key: 'utm_content', label: 'UTM Content', placeholder: 'e.g. button_v1' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="grid gap-2">
                  <Label>{label}</Label>
                  <Input
                    value={form[key as keyof typeof DEFAULT_FORM] as string}
                    onChange={e => set(key as keyof typeof DEFAULT_FORM, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}>
              {createMut.isPending || updateMut.isPending ? 'Saving…' : editLink ? 'Update' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clicks detail dialog */}
      <Dialog open={!!clicksLink} onOpenChange={() => setClicksLink(null)}>
        <DialogContent aria-describedby={undefined} className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Clicks — {clicksLink?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{clicksLink?.click_count}</p>
              <p className="text-xs text-gray-500">Total Clicks</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">{clicksLink?.contact_count}</p>
              <p className="text-xs text-gray-500">Contacts Created</p>
            </div>
          </div>
          {clicks.length === 0 ? (
            <p className="text-center text-gray-400 py-8 text-sm">No clicks yet.</p>
          ) : (
            <div className="space-y-2">
              {clicks.map(click => (
                <div key={click.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                  <div>
                    <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(click.clicked_at), { addSuffix: true })}</p>
                    {click.referrer_url && (
                      <p className="text-xs text-gray-400 truncate max-w-xs mt-0.5">{click.referrer_url}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {click.converted_at ? (
                      <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs">Converted</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">Clicked</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent aria-describedby={undefined} className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Link</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Delete <strong>{deleteTarget?.name}</strong>? This link will stop working immediately.
          </p>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
              disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

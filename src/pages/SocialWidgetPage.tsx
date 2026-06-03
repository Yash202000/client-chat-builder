import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Copy, Plus, Pencil, Trash2, CheckCircle2, ExternalLink, Zap, Loader2 } from 'lucide-react';

// ── types ─────────────────────────────────────────────────────────────────────

interface SocialWidget {
  id: number;
  widget_key: string;
  channel: string;
  name: string;
  handle: string;
  greeting_text: string;
  subtext: string;
  button_label: string;
  button_color: string;
  button_text_color: string;
  position: 'bottom-right' | 'bottom-left';
  show_tooltip: boolean;
  show_agent_avatar: boolean;
  agent_avatar_url: string | null;
  agent_name: string | null;
  is_active: boolean;
  channel_url: string;
  embed_snippet: string;
}

export interface ChannelMeta {
  channel: 'instagram' | 'telegram' | 'messenger';
  label: string;
  handleLabel: string;
  handlePlaceholder: string;
  handleHint: string;
  defaultColor: string;
  icon: React.ReactNode;
  defaultGreeting: string;
  defaultSubtext: string;
  defaultButtonLabel: string;
}

// ── icons ─────────────────────────────────────────────────────────────────────

const InstagramIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={color}>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const TelegramIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={color}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

const MessengerIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={color}>
    <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.301 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/>
  </svg>
);

const ICON_MAP: Record<string, React.FC<{ color: string }>> = {
  instagram: InstagramIcon,
  telegram: TelegramIcon,
  messenger: MessengerIcon,
};

// ── form default ──────────────────────────────────────────────────────────────

function makeDefaultForm(meta: ChannelMeta) {
  return {
    name: '',
    handle: '',
    greeting_text: meta.defaultGreeting,
    subtext: meta.defaultSubtext,
    button_label: meta.defaultButtonLabel,
    button_color: meta.defaultColor,
    button_text_color: '#FFFFFF',
    position: 'bottom-right' as 'bottom-right' | 'bottom-left',
    show_tooltip: true,
    show_agent_avatar: false,
    agent_avatar_url: '',
    agent_name: '',
  };
}

type Form = ReturnType<typeof makeDefaultForm>;

// ── snippet copy box ──────────────────────────────────────────────────────────

const SnippetBox: React.FC<{ snippet: string }> = ({ snippet }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative">
      <pre className="bg-gray-900 text-green-400 text-xs rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all pr-10 leading-relaxed">
        {snippet}
      </pre>
      <button onClick={copy} className="absolute top-2 right-2 text-gray-400 hover:text-white transition-colors">
        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
      </button>
    </div>
  );
};

// ── live preview ──────────────────────────────────────────────────────────────

const LivePreview: React.FC<{ form: Form; meta: ChannelMeta }> = ({ form, meta }) => {
  const isRight = form.position === 'bottom-right';
  const Icon = ICON_MAP[meta.channel];

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 pt-5 pb-3 shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Zap className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold">Live Preview</span>
        </div>
        <p className="text-xs text-muted-foreground">Changes reflect in real-time</p>
      </div>

      <div className="flex-1 px-5 pb-5 flex flex-col min-h-0">
        <div className="flex-1 rounded-xl border border-border overflow-hidden flex flex-col shadow-sm min-h-0">
          {/* Browser chrome */}
          <div className="bg-muted/60 border-b border-border px-3 py-2 flex items-center gap-2 shrink-0">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 bg-background rounded-md px-3 py-1 text-xs text-muted-foreground font-mono">
              preview.localhost
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 relative bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 overflow-hidden">
            <div className="p-5 space-y-2 opacity-20">
              <div className="h-3 bg-slate-400 rounded w-2/3" />
              <div className="h-2 bg-slate-300 rounded w-full" />
              <div className="h-2 bg-slate-300 rounded w-5/6" />
              <div className="h-2 bg-slate-300 rounded w-4/5" />
              <div className="h-8 bg-slate-400 rounded w-1/3 mt-4" />
              <div className="h-2 bg-slate-300 rounded w-full mt-4" />
              <div className="h-2 bg-slate-300 rounded w-3/4" />
            </div>

            {form.show_tooltip && (
              <div className={`absolute bottom-16 ${isRight ? 'right-4' : 'left-4'} bg-white dark:bg-slate-700 rounded-xl shadow-lg p-3 max-w-[160px] text-xs border border-border`}>
                {form.show_agent_avatar && form.agent_avatar_url && (
                  <img src={form.agent_avatar_url} alt="" className="w-6 h-6 rounded-full object-cover mb-1.5" />
                )}
                <p className="font-semibold text-gray-800 dark:text-gray-100 leading-tight">
                  {form.greeting_text || 'Chat with us!'}
                </p>
                {form.agent_name && <p className="text-gray-400 text-[10px] mt-0.5">{form.agent_name}</p>}
                <p className="text-gray-400 mt-0.5 leading-tight">{form.subtext}</p>
              </div>
            )}

            <div
              className={`absolute bottom-4 ${isRight ? 'right-4' : 'left-4'} w-12 h-12 rounded-full flex items-center justify-center shadow-xl`}
              style={{ background: form.button_color }}
            >
              <Icon color={form.button_text_color} />
            </div>
          </div>
        </div>

        {/* Position indicator */}
        <div className="mt-3 shrink-0">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium">Widget Position</p>
          <div className="flex gap-2">
            {(['bottom-left', 'bottom-right'] as const).map(pos => (
              <div key={pos} className={`flex-1 text-xs py-1.5 px-2 rounded-md border text-center ${
                form.position === pos
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border text-muted-foreground'
              }`}>
                {pos === 'bottom-left' ? 'Bottom Left' : 'Bottom Right'}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── section helper ────────────────────────────────────────────────────────────

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="space-y-3">
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
    {children}
  </div>
);

// ── main page ─────────────────────────────────────────────────────────────────

export default function SocialWidgetPage({ meta }: { meta: ChannelMeta }) {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  // null = not editing (list view), defined = editing/creating
  const [editWidget, setEditWidget] = useState<SocialWidget | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState<Form>(() => makeDefaultForm(meta));
  const [previewForm, setPreviewForm] = useState<Form>(() => makeDefaultForm(meta));
  const [deleteTarget, setDeleteTarget] = useState<SocialWidget | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: widgets = [], isLoading, refetch } = useQuery<SocialWidget[]>({
    queryKey: ['social-widgets', meta.channel],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/social-widget?channel=${meta.channel}`);
      if (!res.ok) throw new Error('Failed to load widgets');
      return res.json();
    },
  });

  // When not editing, sync preview to first widget or defaults
  useEffect(() => {
    if (!isCreating && widgets.length > 0) {
      const w = widgets[0];
      setPreviewForm({
        name: w.name, handle: w.handle,
        greeting_text: w.greeting_text, subtext: w.subtext,
        button_label: w.button_label, button_color: w.button_color,
        button_text_color: w.button_text_color, position: w.position,
        show_tooltip: w.show_tooltip, show_agent_avatar: w.show_agent_avatar,
        agent_avatar_url: w.agent_avatar_url || '', agent_name: w.agent_name || '',
      });
    } else if (!isCreating) {
      setPreviewForm(makeDefaultForm(meta));
    }
  }, [widgets, isCreating, meta]);

  // While editing, preview tracks the form live
  useEffect(() => {
    if (isCreating) setPreviewForm(form);
  }, [form, isCreating]);

  const createMut = useMutation({
    mutationFn: async (payload: Form) => {
      const res = await authFetch('/api/v1/social-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, channel: meta.channel }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { toast({ title: 'Widget created' }); cancelEdit(); refetch(); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Form> }) => {
      const res = await authFetch(`/api/v1/social-widget/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { toast({ title: 'Saved' }); cancelEdit(); refetch(); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/v1/social-widget/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => { setDeleteTarget(null); toast({ title: 'Widget deleted' }); refetch(); },
  });

  const startCreate = () => {
    const f = makeDefaultForm(meta);
    setEditWidget(null);
    setForm(f);
    setIsCreating(true);
  };

  const startEdit = (w: SocialWidget) => {
    const f: Form = {
      name: w.name, handle: w.handle,
      greeting_text: w.greeting_text, subtext: w.subtext,
      button_label: w.button_label, button_color: w.button_color,
      button_text_color: w.button_text_color, position: w.position,
      show_tooltip: w.show_tooltip, show_agent_avatar: w.show_agent_avatar,
      agent_avatar_url: w.agent_avatar_url || '', agent_name: w.agent_name || '',
    };
    setEditWidget(w);
    setForm(f);
    setIsCreating(true);
  };

  const cancelEdit = () => { setIsCreating(false); setEditWidget(null); };

  const handleSave = () => {
    if (!form.handle.trim()) { toast({ title: `${meta.handleLabel} required`, variant: 'destructive' }); return; }
    if (editWidget) updateMut.mutate({ id: editWidget.id, payload: form });
    else createMut.mutate(form);
  };

  const set = (key: keyof Form, val: unknown) => setForm(f => ({ ...f, [key]: val }));
  const Icon = ICON_MAP[meta.channel];
  const isBusy = createMut.isPending || updateMut.isPending;

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">

      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <div className={`${showPreview ? 'hidden md:flex' : 'flex'} flex-col flex-1 border-r border-border min-h-0`}>

        {/* Header */}
        <div className="shrink-0 px-4 py-3 border-b border-border flex items-center justify-between bg-background gap-2">
          {isCreating ? (
            <>
              <button onClick={cancelEdit} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors shrink-0">
                ← {editWidget ? 'Back' : 'Cancel'}
              </button>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPreview(p => !p)} className="md:hidden text-xs border border-border rounded-md px-2 py-1 text-muted-foreground hover:bg-muted transition-colors">
                  Preview
                </button>
                <Button size="sm" onClick={handleSave} disabled={isBusy} className="text-white text-xs" style={{ background: meta.defaultColor }}>
                  {isBusy ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving…</> : editWidget ? 'Update' : 'Create'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">{meta.label} Widgets</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPreview(p => !p)} className="md:hidden text-xs border border-border rounded-md px-2 py-1 text-muted-foreground hover:bg-muted transition-colors">
                  Preview
                </button>
                <Button size="sm" onClick={startCreate} className="text-white text-xs gap-1" style={{ background: meta.defaultColor }}>
                  <Plus className="h-3 w-3" /> New
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── List section (always visible) ── */}
          {!isCreating && (
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: `${meta.defaultColor}18` }}>
                    <Icon color={meta.defaultColor} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No widgets yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Create one to embed on your site</p>
                  </div>
                  <Button size="sm" onClick={startCreate} className="text-white gap-1 mt-1" style={{ background: meta.defaultColor }}>
                    <Plus className="h-3 w-3" /> Create Widget
                  </Button>
                </div>
              ) : (
                widgets.map(w => (
                  <div key={w.id} className="rounded-lg border overflow-hidden">
                    <div className="flex items-stretch">
                      <div className="w-1 shrink-0" style={{ background: w.button_color }} />
                      <div className="flex-1 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-sm font-medium truncate">{w.name}</span>
                              <Badge variant={w.is_active ? 'default' : 'secondary'}
                                className={`text-[10px] px-1.5 py-0 ${w.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}`}>
                                {w.is_active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">@{w.handle.replace(/^@/, '')}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(w.channel_url, '_blank')}>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => startEdit(w)}>
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => setDeleteTarget(w)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2">
                          <SnippetBox snippet={w.embed_snippet} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Form section (when creating/editing) ── */}
          {isCreating && (
            <div className="p-4 space-y-6">
              <Section title="Basic">
                <div className="space-y-1.5">
                  <Label className="text-xs">Widget Name</Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder={`e.g. ${meta.label} Support`} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{meta.handleLabel} <span className="text-red-500">*</span></Label>
                  <Input value={form.handle} onChange={e => set('handle', e.target.value)} placeholder={meta.handlePlaceholder} className="h-8 text-sm" />
                  <p className="text-[11px] text-muted-foreground">{meta.handleHint}</p>
                </div>
              </Section>

              <Section title="Tooltip Bubble">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Tooltip</Label>
                  <Switch checked={form.show_tooltip} onCheckedChange={v => set('show_tooltip', v)} />
                </div>
                {form.show_tooltip && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Greeting Text</Label>
                      <Input value={form.greeting_text} onChange={e => set('greeting_text', e.target.value)} className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Subtext</Label>
                      <Input value={form.subtext} onChange={e => set('subtext', e.target.value)} className="h-8 text-sm" />
                    </div>
                  </>
                )}
              </Section>

              <Section title="Agent Avatar">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Show Avatar</Label>
                  <Switch checked={form.show_agent_avatar} onCheckedChange={v => set('show_agent_avatar', v)} />
                </div>
                {form.show_agent_avatar && (
                  <>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Avatar URL</Label>
                      <Input value={form.agent_avatar_url} onChange={e => set('agent_avatar_url', e.target.value)} placeholder="https://..." className="h-8 text-sm" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Agent Name</Label>
                      <Input value={form.agent_name} onChange={e => set('agent_name', e.target.value)} placeholder="e.g. Sarah" className="h-8 text-sm" />
                    </div>
                  </>
                )}
              </Section>

              <Section title="Style">
                <div className="space-y-1.5">
                  <Label className="text-xs">Button Label</Label>
                  <Input value={form.button_label} onChange={e => set('button_label', e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Position</Label>
                  <Select value={form.position} onValueChange={v => set('position', v as Form['position'])}>
                    <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Button Color</Label>
                    <div className="flex gap-1.5 items-center">
                      <input type="color" value={form.button_color} onChange={e => set('button_color', e.target.value)} className="w-7 h-7 rounded cursor-pointer border p-0.5" />
                      <Input value={form.button_color} onChange={e => set('button_color', e.target.value)} className="h-7 text-xs font-mono" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Icon Color</Label>
                    <div className="flex gap-1.5 items-center">
                      <input type="color" value={form.button_text_color} onChange={e => set('button_text_color', e.target.value)} className="w-7 h-7 rounded cursor-pointer border p-0.5" />
                      <Input value={form.button_text_color} onChange={e => set('button_text_color', e.target.value)} className="h-7 text-xs font-mono" />
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>

      {/* ── Right panel — always live preview ──────────────────────────────── */}
      <div className={`${showPreview ? 'flex' : 'hidden md:flex'} flex-col flex-1 md:flex-none md:w-[300px] lg:w-[380px] md:shrink-0 overflow-hidden`}>
        {/* Mobile back button */}
        <div className="md:hidden shrink-0 px-4 py-2 border-b border-border flex items-center bg-background">
          <button onClick={() => setShowPreview(false)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            ← Edit
          </button>
        </div>
        <LivePreview form={previewForm} meta={meta} />
      </div>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader><DialogTitle>Delete Widget</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">
            Delete <strong>{deleteTarget?.name}</strong>? The embed snippet will stop working immediately.
          </p>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)} disabled={deleteMut.isPending}>
              {deleteMut.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

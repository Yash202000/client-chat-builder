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

interface Widget {
  id: number;
  widget_key: string;
  name: string;
  phone_number: string;
  prefill_message: string | null;
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
  wa_url: string;
  embed_snippet: string;
}

const DEFAULT_FORM = {
  name: '',
  phone_number: '',
  prefill_message: '',
  greeting_text: 'Chat with us on WhatsApp!',
  subtext: 'Typically replies within minutes',
  button_label: 'Chat on WhatsApp',
  button_color: '#25D366',
  button_text_color: '#FFFFFF',
  position: 'bottom-right' as 'bottom-right' | 'bottom-left',
  show_tooltip: true,
  show_agent_avatar: false,
  agent_avatar_url: '',
  agent_name: '',
};

type Form = typeof DEFAULT_FORM;

// ── icons ─────────────────────────────────────────────────────────────────────

const WaIcon = ({ color }: { color: string }) => (
  <svg viewBox="0 0 24 24" width="24" height="24" fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.533 5.854L.057 23.448a.75.75 0 0 0 .916.916l5.594-1.476A11.953 11.953 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.528-5.208-1.443l-.374-.222-3.878 1.023 1.023-3.878-.222-.374A9.953 9.953 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

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

const LivePreview: React.FC<{ form: Form }> = ({ form }) => {
  const isRight = form.position === 'bottom-right';

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
              <WaIcon color={form.button_text_color} />
            </div>
          </div>
        </div>

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

export default function WhatsAppWidgetPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false);
  const [editWidget, setEditWidget] = useState<Widget | null>(null);
  const [form, setForm] = useState<Form>({ ...DEFAULT_FORM });
  const [previewForm, setPreviewForm] = useState<Form>({ ...DEFAULT_FORM });
  const [deleteTarget, setDeleteTarget] = useState<Widget | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const { data: widgets = [], isLoading, refetch } = useQuery<Widget[]>({
    queryKey: ['wa-widgets'],
    queryFn: async () => {
      const res = await authFetch('/api/v1/wa-widget');
      if (!res.ok) throw new Error('Failed to load widgets');
      return res.json();
    },
  });

  // Preview tracks first widget when not editing
  useEffect(() => {
    if (!isCreating && widgets.length > 0) {
      const w = widgets[0];
      setPreviewForm({
        name: w.name, phone_number: w.phone_number,
        prefill_message: w.prefill_message || '',
        greeting_text: w.greeting_text, subtext: w.subtext,
        button_label: w.button_label, button_color: w.button_color,
        button_text_color: w.button_text_color, position: w.position,
        show_tooltip: w.show_tooltip, show_agent_avatar: w.show_agent_avatar,
        agent_avatar_url: w.agent_avatar_url || '', agent_name: w.agent_name || '',
      });
    } else if (!isCreating) {
      setPreviewForm({ ...DEFAULT_FORM });
    }
  }, [widgets, isCreating]);

  // Preview tracks form live while editing
  useEffect(() => {
    if (isCreating) setPreviewForm(form);
  }, [form, isCreating]);

  const createMut = useMutation({
    mutationFn: async (payload: Form) => {
      const res = await authFetch('/api/v1/wa-widget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { toast({ title: 'Widget created' }); cancelEdit(); refetch(); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Form> }) => {
      const res = await authFetch(`/api/v1/wa-widget/${id}`, {
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
      const res = await authFetch(`/api/v1/wa-widget/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => { setDeleteTarget(null); toast({ title: 'Widget deleted' }); refetch(); },
  });

  const startCreate = () => { setEditWidget(null); setForm({ ...DEFAULT_FORM }); setIsCreating(true); };
  const startEdit = (w: Widget) => {
    setEditWidget(w);
    setForm({
      name: w.name, phone_number: w.phone_number,
      prefill_message: w.prefill_message || '', greeting_text: w.greeting_text,
      subtext: w.subtext, button_label: w.button_label,
      button_color: w.button_color, button_text_color: w.button_text_color,
      position: w.position, show_tooltip: w.show_tooltip,
      show_agent_avatar: w.show_agent_avatar,
      agent_avatar_url: w.agent_avatar_url || '', agent_name: w.agent_name || '',
    });
    setIsCreating(true);
  };
  const cancelEdit = () => { setIsCreating(false); setEditWidget(null); };

  const handleSave = () => {
    if (!form.phone_number.trim()) { toast({ title: 'Phone number required', variant: 'destructive' }); return; }
    if (editWidget) updateMut.mutate({ id: editWidget.id, payload: form });
    else createMut.mutate(form);
  };

  const set = (key: keyof Form, val: unknown) => setForm(f => ({ ...f, [key]: val }));
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
                <Button size="sm" onClick={handleSave} disabled={isBusy} className="bg-green-600 hover:bg-green-700 text-white text-xs">
                  {isBusy ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Saving…</> : editWidget ? 'Update' : 'Create'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <span className="text-sm font-medium">WhatsApp Widgets</span>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowPreview(p => !p)} className="md:hidden text-xs border border-border rounded-md px-2 py-1 text-muted-foreground hover:bg-muted transition-colors">
                  Preview
                </button>
                <Button size="sm" onClick={startCreate} className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1">
                  <Plus className="h-3 w-3" /> New
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* List */}
          {!isCreating && (
            <div className="p-4 space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : widgets.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-green-50 dark:bg-green-900/20">
                    <WaIcon color="#25D366" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">No widgets yet</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Create one to embed on your site</p>
                  </div>
                  <Button size="sm" onClick={startCreate} className="bg-green-600 hover:bg-green-700 text-white gap-1 mt-1">
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
                            <p className="text-xs text-muted-foreground mt-0.5">+{w.phone_number.replace(/\D/g, '')}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(w.wa_url, '_blank')}>
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

          {/* Form */}
          {isCreating && (
            <div className="p-4 space-y-6">
              <Section title="Basic">
                <div className="space-y-1.5">
                  <Label className="text-xs">Widget Name</Label>
                  <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Support Widget" className="h-8 text-sm" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">WhatsApp Phone Number <span className="text-red-500">*</span></Label>
                  <Input value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="919876543210" className="h-8 text-sm" />
                  <p className="text-[11px] text-muted-foreground">Country code + number, no spaces. E.g. 919876543210</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Pre-filled Message (optional)</Label>
                  <Input value={form.prefill_message} onChange={e => set('prefill_message', e.target.value)} placeholder="Hi, I need help with..." className="h-8 text-sm" />
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
        <div className="md:hidden shrink-0 px-4 py-2 border-b border-border flex items-center justify-between bg-background">
          <button onClick={() => setShowPreview(false)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            ← Edit
          </button>
        </div>
        <LivePreview form={previewForm} />
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

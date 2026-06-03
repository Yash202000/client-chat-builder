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
import {
  Plus, Copy, CheckCircle2, Pencil, Trash2, ExternalLink,
  MousePointerClick, Users, Link2, BarChart3, ChevronRight,
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { formatDistanceToNow } from 'date-fns';

interface CTWALink {
  id: number;
  link_key: string;
  name: string;
  phone_number: string;
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
  wa_url: string;
}

interface CTWAClick {
  id: number;
  referrer_url: string | null;
  contact_id: number | null;
  clicked_at: string;
  converted_at: string | null;
}

const DEFAULT_FORM = {
  name: '',
  phone_number: '',
  prefill_message: '',
  utm_source: '',
  utm_medium: '',
  utm_campaign: '',
  utm_content: '',
  auto_tag: '',
  workflow_id: '',
};

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

export default function CTWAPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLink, setEditLink] = useState<CTWALink | null>(null);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [clicksLink, setClicksLink] = useState<CTWALink | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CTWALink | null>(null);

  const { data: links = [], isLoading } = useQuery<CTWALink[]>({
    queryKey: ['ctwa-links'],
    queryFn: async () => {
      const res = await authFetch(`/api/v1/ctwa`);
      if (!res.ok) throw new Error('Failed to load links');
      return res.json();
    },
  });

  const { data: clicks = [] } = useQuery<CTWAClick[]>({
    queryKey: ['ctwa-clicks', clicksLink?.id],
    enabled: !!clicksLink,
    queryFn: async () => {
      const res = await authFetch(`/api/v1/ctwa/${clicksLink!.id}/clicks`);
      if (!res.ok) throw new Error('Failed to load clicks');
      return res.json();
    },
  });

  const createMut = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await authFetch(`/api/v1/ctwa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ctwa-links'] }); closeDialog(); toast({ title: 'Link created' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const updateMut = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Record<string, any> }) => {
      const res = await authFetch(`/api/v1/ctwa/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ctwa-links'] }); closeDialog(); toast({ title: 'Link updated' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`/api/v1/ctwa/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['ctwa-links'] }); setDeleteTarget(null); toast({ title: 'Link deleted' }); },
  });

  const openCreate = () => { setEditLink(null); setForm({ ...DEFAULT_FORM }); setDialogOpen(true); };
  const openEdit = (l: CTWALink) => {
    setEditLink(l);
    setForm({
      name: l.name, phone_number: l.phone_number,
      prefill_message: l.prefill_message || '', utm_source: l.utm_source || '',
      utm_medium: l.utm_medium || '', utm_campaign: l.utm_campaign || '',
      utm_content: l.utm_content || '', auto_tag: l.auto_tag || '',
      workflow_id: l.workflow_id?.toString() || '',
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditLink(null); };

  const handleSave = () => {
    if (!form.phone_number.trim()) { toast({ title: 'Phone number required', variant: 'destructive' }); return; }
    if (!form.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    const payload: Record<string, any> = {};
    Object.entries(form).forEach(([k, v]) => { if (v !== '') payload[k] = v === '' ? null : (k === 'workflow_id' ? parseInt(v) || null : v); });
    if (editLink) updateMut.mutate({ id: editLink.id, payload });
    else createMut.mutate(payload);
  };

  const set = (key: keyof typeof DEFAULT_FORM, val: string) => setForm(f => ({ ...f, [key]: val }));

  const totalClicks = links.reduce((s, l) => s + l.click_count, 0);
  const totalContacts = links.reduce((s, l) => s + l.contact_count, 0);
  const convRate = totalClicks > 0 ? ((totalContacts / totalClicks) * 100).toFixed(1) : '0';

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <MousePointerClick className="w-6 h-6 text-green-500" />
            Click to WhatsApp
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Trackable short links that open WhatsApp and attribute contacts to campaigns.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4" /> New Link
        </Button>
      </div>

      {/* Stats strip */}
      {links.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Clicks', value: totalClicks, icon: MousePointerClick, color: 'text-blue-500' },
            { label: 'Contacts Created', value: totalContacts, icon: Users, color: 'text-green-500' },
            { label: 'Conversion Rate', value: `${convRate}%`, icon: BarChart3, color: 'text-purple-500' },
          ].map(stat => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Links list */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading links…</div>
      ) : links.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Link2 className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-200">No CTWA links yet</p>
              <p className="text-sm text-gray-400 mt-1">Create a link, share it anywhere, and track every click.</p>
            </div>
            <Button onClick={openCreate} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4" /> Create Link
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {links.map(link => (
            <Card key={link.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className="w-1.5 flex-shrink-0 bg-green-500" />
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{link.name}</h3>
                          <Badge variant={link.is_active ? 'default' : 'secondary'}
                            className={link.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs' : 'text-xs'}>
                            {link.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                          {link.utm_campaign && <Badge variant="outline" className="text-xs">{link.utm_campaign}</Badge>}
                          {link.auto_tag && <Badge variant="outline" className="text-xs">tag: {link.auto_tag}</Badge>}
                        </div>

                        {/* Short URL */}
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-mono text-gray-700 dark:text-gray-300 truncate max-w-xs">
                            {toAbsoluteUrl(link.short_url)}
                          </code>
                          <CopyButton text={toAbsoluteUrl(link.short_url)} label="Copy" />
                        </div>

                        {link.prefill_message && (
                          <p className="text-xs text-gray-400 mt-1 truncate max-w-sm">"{link.prefill_message}"</p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 mt-2">
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
                      <div className="flex gap-2 flex-shrink-0">
                        <Button size="sm" variant="outline" onClick={() => setClicksLink(link)} title="View clicks">
                          <BarChart3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => window.open(link.wa_url, '_blank')} title="Test link">
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
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editLink ? 'Edit Link' : 'Create CTWA Link'}</DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic">
            <TabsList className="w-full">
              <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
              <TabsTrigger value="attribution" className="flex-1">UTM / Attribution</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid gap-2">
                <Label>Link Name <span className="text-red-500">*</span></Label>
                <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Summer Sale Campaign" />
              </div>
              <div className="grid gap-2">
                <Label>WhatsApp Phone Number <span className="text-red-500">*</span></Label>
                <Input value={form.phone_number} onChange={e => set('phone_number', e.target.value)} placeholder="919876543210" />
                <p className="text-xs text-gray-400">Country code + number, no spaces. e.g. 919876543210</p>
              </div>
              <div className="grid gap-2">
                <Label>Pre-filled Message</Label>
                <Input value={form.prefill_message} onChange={e => set('prefill_message', e.target.value)} placeholder="Hi, I'm interested in your summer offer!" />
              </div>
              <div className="grid gap-2">
                <Label>Auto-Tag Contacts</Label>
                <Input value={form.auto_tag} onChange={e => set('auto_tag', e.target.value)} placeholder="e.g. summer-sale" />
                <p className="text-xs text-gray-400">Applied automatically when the contact messages for the first time.</p>
              </div>
            </TabsContent>

            <TabsContent value="attribution" className="space-y-4 mt-4">
              <p className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                These UTM parameters are stored in the contact's CRM record for campaign attribution reporting.
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
                    value={form[key as keyof typeof DEFAULT_FORM]}
                    onChange={e => set(key as keyof typeof DEFAULT_FORM, e.target.value)}
                    placeholder={placeholder}
                  />
                </div>
              ))}
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeDialog}>Cancel</Button>
            <Button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending}
              className="bg-green-600 hover:bg-green-700 text-white">
              {createMut.isPending || updateMut.isPending ? 'Saving…' : editLink ? 'Update' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clicks detail dialog */}
      <Dialog open={!!clicksLink} onOpenChange={() => setClicksLink(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
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
        <DialogContent className="max-w-sm">
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

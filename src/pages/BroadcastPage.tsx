import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Plus, Send, Trash2, Users, CheckCircle2, XCircle,
  Clock, Radio, BarChart3, MessageSquare, Phone, CalendarClock, Mail,
} from 'lucide-react';
import { API_BASE_URL } from '@/config/api';
import { formatDistanceToNow, format } from 'date-fns';

interface Segment { id: number; name: string; contact_count: number; }
interface Broadcast {
  id: number; name: string; channel: string; message: string; subject: string | null;
  segment_id: number | null; status: string;
  total_contacts: number; sent_count: number; failed_count: number; skipped_count: number;
  scheduled_at: string | null; started_at: string | null; completed_at: string | null;
  created_at: string;
}
interface BroadcastContact {
  contact_id: number; contact_name: string | null; contact_phone: string | null;
  status: string; error_message: string | null; sent_at: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.FC<any> }> = {
  draft:     { label: 'Draft',     color: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300', icon: Clock },
  scheduled: { label: 'Scheduled', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock },
  running:   { label: 'Sending…',  color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: Radio },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle2 },
  failed:    { label: 'Failed',    color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400', icon: XCircle },
};

const DEFAULT_FORM = { name: '', channel: 'whatsapp', message: '', subject: '', segment_id: 'all' };

const CHANNEL_COLOR: Record<string, string> = {
  whatsapp: 'bg-green-500',
  sms: 'bg-blue-500',
  email: 'bg-amber-500',
};

export default function BroadcastPage() {
  const { authFetch } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [detailBroadcast, setDetailBroadcast] = useState<Broadcast | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Broadcast | null>(null);

  // Auto-refresh running broadcasts
  const hasRunning = true; // always allow refetch

  const { data: broadcasts = [], isLoading } = useQuery<Broadcast[]>({
    queryKey: ['broadcasts'],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/broadcasts`);
      if (!res.ok) throw new Error('Failed');
      return res.json();
    },
    refetchInterval: (query) => {
      const data = query.state.data as Broadcast[] | undefined;
      return data?.some(b => b.status === 'running') ? 3000 : false;
    },
  });

  const { data: segments = [] } = useQuery<Segment[]>({
    queryKey: ['segments-list'],
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/segments`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.segments || data;
    },
  });

  const { data: detailContacts = [] } = useQuery<BroadcastContact[]>({
    queryKey: ['broadcast-contacts', detailBroadcast?.id],
    enabled: !!detailBroadcast,
    queryFn: async () => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/broadcasts/${detailBroadcast!.id}/contacts?limit=200`);
      if (!res.ok) return [];
      return res.json();
    },
  });

  const createMut = useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/broadcasts`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcasts'] });
      setDialogOpen(false);
      setForm({ ...DEFAULT_FORM });
      setScheduleEnabled(false);
      setScheduledAt('');
      toast({ title: 'Broadcast created' });
    },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const sendMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/broadcasts/${id}/send`, { method: 'POST' });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['broadcasts'] }); toast({ title: 'Broadcast started' }); },
    onError: (e: Error) => toast({ title: 'Error', description: e.message, variant: 'destructive' }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await authFetch(`${API_BASE_URL}/api/v1/broadcasts/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['broadcasts'] }); setDeleteTarget(null); toast({ title: 'Broadcast deleted' }); },
  });

  const handleCreate = () => {
    if (!form.name.trim()) { toast({ title: 'Name required', variant: 'destructive' }); return; }
    if (form.channel === 'email' && !form.subject.trim()) { toast({ title: 'Subject required for email campaigns', variant: 'destructive' }); return; }
    if (!form.message.trim()) { toast({ title: 'Message required', variant: 'destructive' }); return; }
    if (scheduleEnabled && !scheduledAt) {
      toast({ title: 'Scheduled time required', description: 'Please pick a date and time.', variant: 'destructive' });
      return;
    }
    const payload: Record<string, any> = {
      name: form.name, channel: form.channel, message: form.message,
    };
    if (form.channel === 'email' && form.subject.trim()) payload.subject = form.subject;
    if (form.segment_id && form.segment_id !== 'all') payload.segment_id = parseInt(form.segment_id);
    if (scheduleEnabled && scheduledAt) {
      payload.scheduled_at = new Date(scheduledAt).toISOString();
    }
    createMut.mutate(payload);
  };

  const set = (k: keyof typeof DEFAULT_FORM, v: string) => setForm(f => ({ ...f, [k]: v }));

  const charCount = form.message.length;
  const msgCount = Math.ceil(charCount / 160) || 1;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Radio className="w-6 h-6 text-green-500" />
            Broadcast
          </h1>
          <p className="text-sm text-gray-500 mt-1">Send one-time WhatsApp, SMS, or Email blasts to a segment or all contacts.</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
          <Plus className="w-4 h-4" /> New Broadcast
        </Button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-400">Loading…</div>
      ) : broadcasts.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-green-500" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-gray-700 dark:text-gray-200">No broadcasts yet</p>
              <p className="text-sm text-gray-400 mt-1">Send a WhatsApp, SMS, or Email blast to your entire contact list or a specific segment.</p>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              <Plus className="w-4 h-4" /> Create Broadcast
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {broadcasts.map(b => {
            const cfg = STATUS_CONFIG[b.status] || STATUS_CONFIG.draft;
            const Icon = cfg.icon;
            const progress = b.total_contacts > 0
              ? Math.round(((b.sent_count + b.failed_count + b.skipped_count) / b.total_contacts) * 100) : 0;
            const convRate = b.total_contacts > 0 ? Math.round((b.sent_count / b.total_contacts) * 100) : 0;

            return (
              <Card key={b.id} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => setDetailBroadcast(b)}>
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className={`w-1.5 flex-shrink-0 ${CHANNEL_COLOR[b.channel] ?? 'bg-gray-400'}`} />
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-gray-900 dark:text-white">{b.name}</h3>
                            <Badge className={`text-xs ${cfg.color} border-0`}>
                              <Icon className="w-3 h-3 mr-1" />{cfg.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs capitalize">{b.channel}</Badge>
                          </div>
                          <p className="text-sm text-gray-500 mt-1 truncate max-w-lg">"{b.message}"</p>

                          {/* Progress bar for running */}
                          {b.status === 'running' && b.total_contacts > 0 && (
                            <div className="mt-2 space-y-1">
                              <Progress value={progress} className="h-1.5" />
                              <p className="text-xs text-gray-400">{b.sent_count + b.failed_count} / {b.total_contacts} processed</p>
                            </div>
                          )}

                          {/* Scheduled time */}
                          {b.status === 'scheduled' && b.scheduled_at && (
                            <div className="flex items-center gap-1 mt-1.5">
                              <CalendarClock className="w-3.5 h-3.5 text-blue-500" />
                              <span className="text-xs text-blue-600 dark:text-blue-400">
                                Scheduled for {format(new Date(b.scheduled_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          )}

                          {/* Stats for completed */}
                          {b.status === 'completed' && (
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {b.sent_count} sent</span>
                              {b.failed_count > 0 && <span className="text-xs text-red-500 flex items-center gap-1"><XCircle className="w-3 h-3" /> {b.failed_count} failed</span>}
                              {b.skipped_count > 0 && <span className="text-xs text-gray-400 flex items-center gap-1"><Users className="w-3 h-3" /> {b.skipped_count} skipped</span>}
                              <span className="text-xs text-gray-400">{convRate}% delivery</span>
                            </div>
                          )}

                          <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(b.created_at), { addSuffix: true })}</p>
                        </div>

                        <div className="flex gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                          {(b.status === 'draft' || b.status === 'scheduled') && (
                            <Button size="sm" className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => sendMut.mutate(b.id)} disabled={sendMut.isPending}>
                              <Send className="w-3.5 h-3.5" /> Send Now
                            </Button>
                          )}
                          {b.status !== 'running' && (
                            <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600"
                              onClick={() => setDeleteTarget(b)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
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

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>New Broadcast</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid gap-2">
              <Label>Broadcast Name <span className="text-red-500">*</span></Label>
              <Input value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Ramadan Offer 2025" />
            </div>
            <div className="grid gap-2">
              <Label>Channel</Label>
              <Select value={form.channel} onValueChange={v => { set('channel', v); set('subject', ''); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {form.channel === 'email' && (
              <div className="grid gap-2">
                <Label>Subject <span className="text-red-500">*</span></Label>
                <Input
                  value={form.subject}
                  onChange={e => set('subject', e.target.value)}
                  placeholder="e.g. Exclusive offer just for you, {{name}}!"
                />
              </div>
            )}
            <div className="grid gap-2">
              <Label>Target Segment <span className="text-gray-400 font-normal">(optional — leave blank for all contacts)</span></Label>
              <Select value={form.segment_id} onValueChange={v => set('segment_id', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={form.channel === 'email' ? 'All contacts with email' : 'All contacts with phone number'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All contacts</SelectItem>
                  {segments.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name} {s.contact_count !== undefined && `(${s.contact_count})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Message <span className="text-red-500">*</span></Label>
              <Textarea
                value={form.message}
                onChange={e => set('message', e.target.value)}
                placeholder="Hi {{name}}, we have an exclusive offer just for you! 🎉"
                rows={5}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>Use <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{name}}"}</code> to personalise
                  {form.channel === 'email' && <> · subject line also supports <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">{"{{name}}"}</code></>}
                </span>
                <span>{charCount} chars {form.channel === 'sms' && `· ${msgCount} SMS`}</span>
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <CalendarClock className="w-4 h-4 text-gray-500" />
                  Schedule for later
                </Label>
                <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
              </div>
              {scheduleEnabled && (
                <Input
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={e => setScheduledAt(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="mt-1"
                />
              )}
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => { setDialogOpen(false); setScheduleEnabled(false); setScheduledAt(''); }}>Cancel</Button>
            <Button onClick={handleCreate} disabled={createMut.isPending} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
              {createMut.isPending ? 'Creating…' : scheduleEnabled
                ? <><CalendarClock className="w-4 h-4" /> Schedule</>
                : <><Plus className="w-4 h-4" /> Create</>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail / delivery log dialog */}
      <Dialog open={!!detailBroadcast} onOpenChange={() => setDetailBroadcast(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {detailBroadcast?.name}
              {detailBroadcast && (
                <Badge className={`text-xs ${STATUS_CONFIG[detailBroadcast.status]?.color} border-0 ml-2`}>
                  {STATUS_CONFIG[detailBroadcast.status]?.label}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {detailBroadcast && (
            <div className="space-y-4 mt-2">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Sent', value: detailBroadcast.sent_count, color: 'text-green-600' },
                  { label: 'Failed', value: detailBroadcast.failed_count, color: 'text-red-500' },
                  { label: 'Skipped', value: detailBroadcast.skipped_count, color: 'text-gray-400' },
                ].map(s => (
                  <div key={s.label} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                    <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                    <p className="text-xs text-gray-500">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Message preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                <p className="text-xs text-gray-500 mb-1">Message</p>
                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{detailBroadcast.message}</p>
              </div>

              {/* Contact delivery log */}
              {detailContacts.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Delivery Log</p>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                    {detailContacts.map(c => (
                      <div key={c.contact_id} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-800 rounded-lg text-sm">
                        <div className="flex items-center gap-2">
                          {detailBroadcast?.channel === 'email'
                            ? <Mail className="w-3.5 h-3.5 text-gray-400" />
                            : <Phone className="w-3.5 h-3.5 text-gray-400" />}
                          <div>
                            <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{c.contact_name || 'Unknown'}</p>
                            <p className="text-xs text-gray-400">{c.contact_phone}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          {c.status === 'sent' && <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs border-0">Sent</Badge>}
                          {c.status === 'failed' && <Badge className="bg-red-100 text-red-600 text-xs border-0" title={c.error_message || ''}>Failed</Badge>}
                          {c.status === 'skipped' && <Badge variant="secondary" className="text-xs">{detailBroadcast?.channel === 'email' ? 'No email' : 'No phone'}</Badge>}
                          {c.status === 'pending' && <Badge variant="outline" className="text-xs">Pending</Badge>}
                          {c.sent_at && <p className="text-xs text-gray-400 mt-0.5">{formatDistanceToNow(new Date(c.sent_at), { addSuffix: true })}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Delete Broadcast</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 dark:text-gray-300">Delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.</p>
          <DialogFooter className="mt-4">
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

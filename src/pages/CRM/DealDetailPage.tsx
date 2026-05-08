import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Edit3, Check, X, DollarSign, Building2,
  User, CalendarDays, FileText, TrendingUp, Loader2, Ticket,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface DealStage { id: number; name: string; probability: number; color: string }
interface Pipeline { id: number; name: string; stages: DealStage[] }

interface Deal {
  id: number;
  title: string;
  amount?: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  stage_id: number;
  pipeline_id: number;
  contact?: { id: number; name: string; email: string };
  account?: { id: number; name: string };
  owner?: { id: number; full_name: string; email: string };
  expected_close_date?: string;
  actual_close_date?: string;
  won_reason?: string;
  lost_reason?: string;
  description?: string;
  created_at: string;
  updated_at: string;
  stage?: { id: number; name: string; probability: number; color: string };
}

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  won: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  lost: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
};

function fmtMoney(amount?: number, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Deal> & { contact_id?: number | null; account_id?: number | null }>({});
  const [contacts, setContacts] = useState<{ id: number; name: string; email: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);

  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  const { data: linkedTickets = [] } = useQuery({
    queryKey: ['deal-tickets', id],
    queryFn: () => axios.get(`/api/v1/tickets/?deal_id=${id}&limit=50`, { headers }).then(r => r.data),
    enabled: !!id,
  });

  useEffect(() => { fetchDeal(); fetchContactsAndAccounts(); }, [id]);

  const fetchContactsAndAccounts = async () => {
    try {
      const [cr, ar] = await Promise.all([
        axios.get('/api/v1/contacts/', { headers, params: { limit: 200 } }),
        axios.get('/api/v1/accounts/', { headers, params: { limit: 200 } }),
      ]);
      setContacts(cr.data);
      setAccounts(ar.data);
    } catch { /* non-fatal */ }
  };

  const fetchDeal = async () => {
    try {
      const res = await axios.get(`/api/v1/deals/${id}`, { headers });
      setDeal(res.data);
      setForm({ ...res.data, contact_id: res.data.contact?.id ?? null, account_id: res.data.account?.id ?? null });
      const plRes = await axios.get(`/api/v1/pipelines/${res.data.pipeline_id}`, { headers });
      setPipeline(plRes.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load deal', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/v1/deals/${id}`, form, { headers });
      setDeal(res.data);
      setForm(res.data);
      setEditing(false);
      toast({ title: 'Deal updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update deal', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const markAs = async (status: 'won' | 'lost') => {
    const reason = prompt(`Reason for marking as ${status}? (optional)`);
    try {
      const payload: any = { status };
      if (status === 'won' && reason) payload.won_reason = reason;
      if (status === 'lost' && reason) payload.lost_reason = reason;
      const res = await axios.put(`/api/v1/deals/${id}`, payload, { headers });
      setDeal(res.data);
      toast({ title: `Deal marked as ${status}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to update deal', variant: 'destructive' });
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!deal) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Deal not found</p>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{deal.title}</h1>
            <p className="text-sm text-muted-foreground">Deal #{deal.id}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deal.status === 'open' && (
            <>
              <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50 dark:hover:bg-red-950"
                onClick={() => markAs('lost')}><X className="h-3.5 w-3.5 mr-1" /> Mark Lost</Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => markAs('won')}><Check className="h-3.5 w-3.5 mr-1" /> Mark Won</Button>
            </>
          )}
          {!editing ? (
            <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
              <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm(deal); }}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
                Save
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-4">Deal Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Title</Label>
                {editing ? (
                  <Input value={form.title ?? ''} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="bg-background border-border" />
                ) : (
                  <p className="text-sm text-foreground font-medium">{deal.title}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Amount</Label>
                {editing ? (
                  <Input type="number" value={(form.amount as any) ?? ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || undefined })}
                    className="bg-background border-border" />
                ) : (
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {fmtMoney(deal.amount, deal.currency)}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Stage</Label>
                {editing ? (
                  <Select value={form.stage_id?.toString()} onValueChange={v => setForm({ ...form, stage_id: parseInt(v) })}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(pipeline?.stages ?? []).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: deal.stage?.color }} />
                    <span className="text-sm text-foreground">{deal.stage?.name ?? '—'}</span>
                    <span className="text-xs text-muted-foreground">({deal.stage?.probability}%)</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Status</Label>
                {editing ? (
                  <Select value={form.status} onValueChange={v => setForm({ ...form, status: v as any })}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="won">Won</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full border font-medium', STATUS_COLORS[deal.status])}>
                    {deal.status}
                  </span>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Expected Close</Label>
                {editing ? (
                  <Input type="date" value={form.expected_close_date?.split('T')[0] ?? ''}
                    onChange={e => setForm({ ...form, expected_close_date: e.target.value })}
                    className="bg-background border-border" />
                ) : (
                  <p className="text-sm text-foreground">
                    {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Currency</Label>
                {editing ? (
                  <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                    <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {['USD', 'EUR', 'GBP', 'INR', 'AED'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-foreground">{deal.currency}</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1.5">
              <Label className="text-xs text-muted-foreground">Description</Label>
              {editing ? (
                <Textarea value={form.description ?? ''} rows={3}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="bg-background border-border" />
              ) : (
                <p className="text-sm text-muted-foreground">{deal.description || '—'}</p>
              )}
            </div>

            {(deal.won_reason || deal.lost_reason) && (
              <div className="mt-4 pt-4 border-t border-border">
                <Label className="text-xs text-muted-foreground">
                  {deal.status === 'won' ? 'Won Reason' : 'Lost Reason'}
                </Label>
                <p className="text-sm text-foreground mt-1">{deal.won_reason || deal.lost_reason}</p>
              </div>
            )}
          </div>

          {/* Linked Tickets */}
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">Linked Tickets</h2>
                {linkedTickets.length > 0 && (
                  <span className="text-xs bg-muted rounded-full px-2 py-0.5">{linkedTickets.length}</span>
                )}
              </div>
              <Link to="/dashboard/tickets">
                <Button variant="outline" size="sm" className="h-7 text-xs">View All</Button>
              </Link>
            </div>
            {linkedTickets.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No tickets linked to this deal.
              </p>
            ) : (
              <div className="space-y-2">
                {linkedTickets.map((t: any) => (
                  <Link key={t.id} to={`/dashboard/tickets/${t.project?.key}/${t.ticket_number}`}>
                    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">{t.ticket_number}</span>
                      <span className="flex-1 text-sm truncate">{t.title}</span>
                      {t.status && (
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ backgroundColor: t.status.color + '20', color: t.status.color }}>
                          {t.status.name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Contact */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <User className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm text-foreground">Contact</h3>
            </div>
            {editing ? (
              <Select
                value={form.contact_id?.toString() ?? '__none__'}
                onValueChange={(v) => setForm({ ...form, contact_id: v === '__none__' ? null : parseInt(v) })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="No contact" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.name} — {c.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : deal.contact ? (
              <div className="cursor-pointer hover:bg-muted rounded-lg p-2 -m-2 transition-colors"
                onClick={() => navigate(`/dashboard/crm/contacts`)}>
                <p className="font-medium text-sm text-foreground">{deal.contact.name}</p>
                <p className="text-xs text-muted-foreground">{deal.contact.email}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No contact — click Edit to add</p>
            )}
          </div>

          {/* Account */}
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-medium text-sm text-foreground">Account</h3>
              </div>
            </div>
            {editing ? (
              <Select
                value={form.account_id?.toString() ?? '__none__'}
                onValueChange={(v) => setForm({ ...form, account_id: v === '__none__' ? null : parseInt(v) })}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue placeholder="No account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : deal.account ? (
              <div className="cursor-pointer hover:bg-muted rounded-lg p-2 -m-2 transition-colors"
                onClick={() => navigate(`/dashboard/crm/accounts/${deal.account!.id}`)}>
                <p className="font-medium text-sm text-foreground">{deal.account.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Click to view →</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No account linked — click Edit to add</p>
            )}
          </div>

          {/* Meta */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3">
            <h3 className="font-medium text-sm text-foreground">Info</h3>
            <div>
              <p className="text-xs text-muted-foreground">Owner</p>
              <p className="text-sm text-foreground">{deal.owner?.full_name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pipeline</p>
              <p className="text-sm text-foreground">{pipeline?.name ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm text-foreground">{new Date(deal.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm text-foreground">{new Date(deal.updated_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

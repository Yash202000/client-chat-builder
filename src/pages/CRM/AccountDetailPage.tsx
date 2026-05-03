import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Edit3, Check, Building2, Globe, Phone,
  MapPin, Users, TrendingUp, Loader2, DollarSign, User, UserPlus, Unlink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';

interface Account {
  id: number;
  name: string;
  domain?: string;
  industry?: string;
  employee_count?: number;
  annual_revenue?: number;
  phone?: string;
  website?: string;
  address_street?: string;
  address_city?: string;
  address_state?: string;
  address_country?: string;
  address_zip?: string;
  description?: string;
  owner?: { id: number; full_name: string; email: string };
  contacts: { id: number; name: string; email: string; job_title?: string; phone_number?: string }[];
}

interface Deal {
  id: number;
  title: string;
  amount?: number;
  currency: string;
  status: string;
  stage?: { name: string; color: string };
  expected_close_date?: string;
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Media', 'Consulting', 'Other',
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400',
  won: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
  lost: 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400',
};

function fmtMoney(amount?: number, currency = 'USD') {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);
}

export default function AccountDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [account, setAccount] = useState<Account | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Partial<Account>>({});
  const [allContacts, setAllContacts] = useState<{ id: number; name: string; email: string }[]>([]);
  const [linkContactId, setLinkContactId] = useState('');
  const [linking, setLinking] = useState(false);

  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  useEffect(() => { fetchAccount(); fetchDeals(); fetchAllContacts(); }, [id]);

  const fetchAllContacts = async () => {
    try {
      const res = await axios.get('/api/v1/contacts/', { headers, params: { limit: 200 } });
      setAllContacts(res.data);
    } catch {}
  };

  const handleLinkContact = async () => {
    if (!linkContactId) return;
    setLinking(true);
    try {
      await axios.put(`/api/v1/contacts/${linkContactId}`, { account_id: parseInt(id!) }, { headers });
      toast({ title: 'Contact linked to company' });
      setLinkContactId('');
      fetchAccount();
    } catch {
      toast({ title: 'Error', description: 'Failed to link contact', variant: 'destructive' });
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkContact = async (contactId: number) => {
    try {
      await axios.put(`/api/v1/contacts/${contactId}`, { account_id: null }, { headers });
      toast({ title: 'Contact unlinked' });
      fetchAccount();
    } catch {
      toast({ title: 'Error', description: 'Failed to unlink contact', variant: 'destructive' });
    }
  };

  const fetchAccount = async () => {
    try {
      const res = await axios.get(`/api/v1/accounts/${id}`, { headers });
      setAccount(res.data);
      setForm(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load account', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchDeals = async () => {
    try {
      const res = await axios.get('/api/v1/deals/', { headers, params: { account_id: id, limit: 100 } });
      setDeals(res.data);
    } catch {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await axios.put(`/api/v1/accounts/${id}`, form, { headers });
      setAccount(res.data);
      setForm(res.data);
      setEditing(false);
      toast({ title: 'Company updated' });
    } catch {
      toast({ title: 'Error', description: 'Failed to update company', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
    </div>
  );

  if (!account) return (
    <div className="flex items-center justify-center h-full">
      <p className="text-muted-foreground">Company not found</p>
    </div>
  );

  const totalDealValue = deals.filter(d => d.status === 'open').reduce((s, d) => s + (d.amount ?? 0), 0);

  return (
    <div className="flex flex-col h-full bg-background overflow-auto">
      {/* Header */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">{account.name}</h1>
              {account.domain && <p className="text-sm text-muted-foreground">{account.domain}</p>}
            </div>
          </div>
        </div>
        {!editing ? (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <Edit3 className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => { setEditing(false); setForm(account); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Check className="h-3.5 w-3.5 mr-1" />}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4 px-6 py-4 border-b border-border">
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground mb-1">Contacts</p>
          <p className="text-lg font-bold text-foreground">{account.contacts?.length ?? 0}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground mb-1">Open Deals</p>
          <p className="text-lg font-bold text-foreground">{deals.filter(d => d.status === 'open').length}</p>
        </div>
        <div className="rounded-xl bg-card border border-border p-3">
          <p className="text-xs text-muted-foreground mb-1">Pipeline Value</p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(totalDealValue)}</p>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Details */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="font-semibold text-foreground mb-4">Company Info</h2>
            <div className="space-y-3">
              {[
                { label: 'Name', key: 'name', type: 'text' },
                { label: 'Domain', key: 'domain', type: 'text' },
                { label: 'Phone', key: 'phone', type: 'text' },
                { label: 'Website', key: 'website', type: 'text' },
                { label: 'Employees', key: 'employee_count', type: 'number' },
              ].map(({ label, key, type }) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {editing ? (
                    <Input type={type} value={(form as any)[key] ?? ''}
                      onChange={e => setForm({ ...form, [key]: type === 'number' ? parseInt(e.target.value) || undefined : e.target.value })}
                      className="bg-background border-border h-8 text-sm" />
                  ) : (
                    <p className="text-sm text-foreground">{(account as any)[key] ?? '—'}</p>
                  )}
                </div>
              ))}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Industry</p>
                {editing ? (
                  <Select value={(form as any).industry ?? ''} onValueChange={v => setForm({ ...form, industry: v })}>
                    <SelectTrigger className="bg-background border-border h-8 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-foreground">{account.industry ?? '—'}</p>
                )}
              </div>
              {[
                { label: 'City', key: 'address_city' },
                { label: 'Country', key: 'address_country' },
              ].map(({ label, key }) => (
                <div key={key} className="space-y-1">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {editing ? (
                    <Input value={(form as any)[key] ?? ''}
                      onChange={e => setForm({ ...form, [key]: e.target.value })}
                      className="bg-background border-border h-8 text-sm" />
                  ) : (
                    <p className="text-sm text-foreground">{(account as any)[key] ?? '—'}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs: Contacts + Deals */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="contacts">
            <TabsList className="bg-muted mb-4">
              <TabsTrigger value="contacts" className="data-[state=active]:bg-card">
                Contacts ({account.contacts?.length ?? 0})
              </TabsTrigger>
              <TabsTrigger value="deals" className="data-[state=active]:bg-card">
                Deals ({deals.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="contacts">
              {/* Link existing contact */}
              <div className="flex items-center gap-2 mb-3">
                <Select value={linkContactId} onValueChange={setLinkContactId}>
                  <SelectTrigger className="flex-1 h-9 text-sm bg-card border-border">
                    <SelectValue placeholder="Select a contact to link…" />
                  </SelectTrigger>
                  <SelectContent>
                    {allContacts
                      .filter(c => !(account.contacts ?? []).some(ac => ac.id === c.id))
                      .map(c => (
                        <SelectItem key={c.id} value={c.id.toString()} className="text-sm">
                          {c.name} — {c.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  onClick={handleLinkContact}
                  disabled={!linkContactId || linking}
                  className="h-9 gap-1.5"
                >
                  {linking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
                  Link
                </Button>
              </div>
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Name</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Email</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Title</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Phone</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(account.contacts ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                          No contacts linked — use the selector above to link one
                        </TableCell>
                      </TableRow>
                    ) : (account.contacts ?? []).map(c => (
                      <TableRow key={c.id} className="border-border hover:bg-muted/40">
                        <TableCell className="font-medium text-sm text-foreground cursor-pointer"
                          onClick={() => navigate(`/dashboard/crm/contacts`)}>
                          {c.name ?? '—'}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.email ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.job_title ?? '—'}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.phone_number ?? '—'}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                            title="Unlink contact"
                            onClick={() => handleUnlinkContact(c.id)}
                          >
                            <Unlink className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="deals">
              <div className="rounded-xl border border-border overflow-hidden bg-card">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground font-medium">Deal</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Stage</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Close Date</TableHead>
                      <TableHead className="text-muted-foreground font-medium">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                          No deals linked to this company
                        </TableCell>
                      </TableRow>
                    ) : deals.map(d => (
                      <TableRow key={d.id}
                        className="border-border hover:bg-muted/40 cursor-pointer"
                        onClick={() => navigate(`/dashboard/crm/deals/${d.id}`)}>
                        <TableCell className="font-medium text-sm text-foreground">{d.title}</TableCell>
                        <TableCell className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                          {fmtMoney(d.amount, d.currency)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.stage?.color }} />
                            <span className="text-sm text-foreground">{d.stage?.name ?? '—'}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-medium', STATUS_COLORS[d.status] ?? '')}>
                            {d.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

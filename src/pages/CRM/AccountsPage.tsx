import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Plus, Search, Globe, Phone, Users, Loader2,
  MapPin, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
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
  address_city?: string;
  address_country?: string;
  contact_count: number;
  owner?: { id: number; full_name: string };
}

const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Manufacturing', 'Retail',
  'Education', 'Real Estate', 'Media', 'Consulting', 'Other',
];

export default function AccountsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [newAccount, setNewAccount] = useState({
    name: '', domain: '', industry: '', employee_count: '',
    phone: '', website: '', address_city: '', address_country: '', description: '',
  });

  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  useEffect(() => { fetchAccounts(); }, [search, industryFilter]);

  const fetchAccounts = async () => {
    try {
      const params: any = { limit: 200 };
      if (search) params.query = search;
      if (industryFilter !== 'all') params.industry = industryFilter;
      const res = await axios.get('/api/v1/accounts/', { headers, params });
      setAccounts(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load accounts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newAccount.name) return;
    try {
      await axios.post('/api/v1/accounts/', {
        name: newAccount.name,
        domain: newAccount.domain || null,
        industry: newAccount.industry || null,
        employee_count: newAccount.employee_count ? parseInt(newAccount.employee_count) : null,
        phone: newAccount.phone || null,
        website: newAccount.website || null,
        address_city: newAccount.address_city || null,
        address_country: newAccount.address_country || null,
      }, { headers });
      toast({ title: 'Account created' });
      setCreateOpen(false);
      setNewAccount({ name: '', domain: '', industry: '', employee_count: '', phone: '', website: '', address_city: '', address_country: '', description: '' });
      fetchAccounts();
    } catch {
      toast({ title: 'Error', description: 'Failed to create account', variant: 'destructive' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Companies</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{accounts.length} accounts</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-1.5 px-2.5 sm:px-4">
            <Plus className="h-4 w-4" /><span className="hidden sm:inline">New Company</span>
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative w-full sm:flex-1 sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search companies..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background border-border w-full" />
          </div>
          <Select value={industryFilter} onValueChange={setIndustryFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-background border-border">
              <SelectValue placeholder="All industries" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground font-medium">Company</TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">Industry</TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">Location</TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Employees</TableHead>
                  <TableHead className="text-muted-foreground font-medium">Contacts</TableHead>
                  <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence>
                  {accounts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-16">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                          <p className="text-base font-medium text-foreground">No accounts yet</p>
                          <p className="text-sm text-muted-foreground">Add your first account to get started.</p>
                          <Button variant="outline" size="sm" className="mt-1" onClick={() => setCreateOpen(true)}>
                            <Plus className="h-3.5 w-3.5 mr-1.5" /> Add Account
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : accounts.map((acc, i) => (
                    <motion.tr key={acc.id}
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, delay: i * 0.02 }}
                      className="border-border hover:bg-muted/40 transition-colors cursor-pointer"
                      onClick={() => navigate(`/dashboard/crm/accounts/${acc.id}`)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-medium text-sm text-foreground">{acc.name}</p>
                            {acc.domain && <p className="text-xs text-muted-foreground">{acc.domain}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">{acc.industry ?? '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                        {[acc.address_city, acc.address_country].filter(Boolean).join(', ') || '—'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">
                        {acc.employee_count?.toLocaleString() ?? '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm text-foreground">{acc.contact_count}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{acc.owner?.full_name ?? '—'}</TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
            </div>
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">New Company</DialogTitle>
            <DialogDescription className="text-muted-foreground">Add a B2B account to your CRM</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Company Name <span className="text-red-500">*</span></Label>
              <Input placeholder="Acme Inc." value={newAccount.name}
                onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                className="bg-background border-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Domain</Label>
                <Input placeholder="acme.com" value={newAccount.domain}
                  onChange={e => setNewAccount({ ...newAccount, domain: e.target.value })}
                  className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Select value={newAccount.industry} onValueChange={v => setNewAccount({ ...newAccount, industry: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Employees</Label>
                <Input type="number" placeholder="50" value={newAccount.employee_count}
                  onChange={e => setNewAccount({ ...newAccount, employee_count: e.target.value })}
                  className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input placeholder="+1 234 567 8900" value={newAccount.phone}
                  onChange={e => setNewAccount({ ...newAccount, phone: e.target.value })}
                  className="bg-background border-border" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Website</Label>
              <Input placeholder="https://acme.com" value={newAccount.website}
                onChange={e => setNewAccount({ ...newAccount, website: e.target.value })}
                className="bg-background border-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input placeholder="New York" value={newAccount.address_city}
                  onChange={e => setNewAccount({ ...newAccount, address_city: e.target.value })}
                  className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Input placeholder="United States" value={newAccount.address_country}
                  onChange={e => setNewAccount({ ...newAccount, address_country: e.target.value })}
                  className="bg-background border-border" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!newAccount.name}>
                <Plus className="h-4 w-4 mr-2" /> Create Company
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

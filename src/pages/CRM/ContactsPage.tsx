import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  MoreVertical,
  Mail,
  Phone,
  Building2,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  UserPlus,
  UserCheck,
  UserX,
  Eye,
  Edit,
  Trash2,
  Tag,
  Contact,
  Loader2,
  FileText,
  GitBranch,
  DollarSign,
  Activity,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { TagSelector } from '@/components/TagSelector';
import { motion, AnimatePresence } from 'framer-motion';
import CsvImportDialog from '@/components/CsvImportDialog';
import { downloadCsv } from '@/utils/csvExport';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  company?: string;
  company_id: number;
  account_id?: number;
  account?: { id: number; name: string };
  lead_source?: string;
  lifecycle_stage?: string;
  has_lead?: boolean;
  tags?: Array<{ id: number; name: string; color: string }>;
  tag_ids?: number[];
}

interface ContactStats {
  total_contacts: number;
  contacts_with_leads: number;
  contacts_without_leads: number;
}

interface TimelineItem {
  id: number;
  activity_type: string;
  title: string;
  description?: string;
  entity_type?: string;
  entity_id?: number;
  user_id?: number;
  occurred_at: string;
  source: 'activity' | 'note';
}

export default function ContactsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [stats, setStats] = useState<ContactStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_lead' | 'without_lead'>('all');
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [convertingContact, setConvertingContact] = useState<Contact | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewingContact, setViewingContact] = useState<Contact | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editData, setEditData] = useState({ name: '', email: '', phone_number: '', company: '' });
  const [newContact, setNewContact] = useState({ name: '', email: '', phone_number: '', company: '', account_id: '' });
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);
  const [bulkAccountId, setBulkAccountId] = useState('');
  const [bulkLinking, setBulkLinking] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [leadData, setLeadData] = useState({ deal_value: '', source: '', notes: '' });
  const [viewingContactTagIds, setViewingContactTagIds] = useState<number[]>([]);

  // Activity timeline state
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [newActivity, setNewActivity] = useState({
    activity_type: 'note',
    title: '',
    description: '',
  });
  const [loggingActivity, setLoggingActivity] = useState(false);

  useEffect(() => {
    fetchContacts();
    fetchStats();
  }, [filterTagIds]);

  const fetchContacts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      // Build query params including tag_ids
      const params = new URLSearchParams();
      if (filterTagIds.length > 0) {
        filterTagIds.forEach(id => params.append('tag_ids', id.toString()));
      }
      const queryString = params.toString();
      const url = `/api/v1/contacts/${queryString ? `?${queryString}` : ''}`;
      const response = await axios.get(url, { headers });
      const leadsResponse = await axios.get('/api/v1/leads/', { headers });
      const leadContactIds = new Set(leadsResponse.data.map((lead: any) => lead.contact_id));
      const contactsWithLeadStatus = response.data.map((contact: Contact) => ({
        ...contact,
        has_lead: leadContactIds.has(contact.id),
      }));
      setContacts(contactsWithLeadStatus);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast({ title: 'Error', description: 'Failed to fetch contacts', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [contactsRes, leadsRes] = await Promise.all([
        axios.get('/api/v1/contacts/', { headers }),
        axios.get('/api/v1/leads/', { headers }),
      ]);
      const leadContactIds = new Set(leadsRes.data.map((lead: any) => lead.contact_id));
      const totalContacts = contactsRes.data.length;
      const contactsWithLeads = leadContactIds.size;
      setStats({
        total_contacts: totalContacts,
        contacts_with_leads: contactsWithLeads,
        contacts_without_leads: totalContacts - contactsWithLeads,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleViewDetails = (contact: Contact) => {
    setViewingContact(contact);
    // Set tag IDs from either tag_ids array or from tags objects
    const tagIds = contact.tag_ids || contact.tags?.map((t) => t.id) || [];
    setViewingContactTagIds(tagIds);
    setViewDialogOpen(true);
    // Reset timeline state on open
    setTimelineItems([]);
    setNewActivity({ activity_type: 'note', title: '', description: '' });
  };

  const fetchTimeline = async (contactId: number) => {
    setTimelineLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get(`/api/v1/contacts/${contactId}/timeline`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTimelineItems(res.data);
    } catch (err) {
      console.error('Error fetching timeline:', err);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleLogActivity = async () => {
    if (!viewingContact || !newActivity.title.trim()) return;
    setLoggingActivity(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(
        `/api/v1/contacts/${viewingContact.id}/timeline`,
        {
          activity_type: newActivity.activity_type,
          title: newActivity.title,
          description: newActivity.description || undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewActivity({ activity_type: 'note', title: '', description: '' });
      await fetchTimeline(viewingContact.id);
      toast({ title: 'Activity logged', description: 'Activity has been added to the timeline.' });
    } catch (err) {
      console.error('Error logging activity:', err);
      toast({ title: 'Error', description: 'Failed to log activity', variant: 'destructive' });
    } finally {
      setLoggingActivity(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="h-4 w-4 text-blue-500" />;
      case 'email_sent':
      case 'email_opened': return <Mail className="h-4 w-4 text-purple-500" />;
      case 'call': return <Phone className="h-4 w-4 text-green-500" />;
      case 'meeting': return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'sequence_enrolled':
      case 'sequence_step': return <GitBranch className="h-4 w-4 text-indigo-500" />;
      case 'deal_created': return <DollarSign className="h-4 w-4 text-emerald-500" />;
      case 'lead_created': return <UserPlus className="h-4 w-4 text-cyan-500" />;
      case 'campaign_sent': return <Mail className="h-4 w-4 text-pink-500" />;
      case 'task': return <CheckCircle2 className="h-4 w-4 text-yellow-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleContactTagsChange = async (tagIds: number[]) => {
    if (!viewingContact) return;

    const previousTagIds = [...viewingContactTagIds];
    setViewingContactTagIds(tagIds);

    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Determine which tags to add/remove
      const tagsToAdd = tagIds.filter(id => !previousTagIds.includes(id));
      const tagsToRemove = previousTagIds.filter(id => !tagIds.includes(id));

      // Add new tags
      for (const tagId of tagsToAdd) {
        await axios.post(`/api/v1/tags/${tagId}/assign`, {
          entity_type: 'contact',
          entity_ids: [viewingContact.id]
        }, { headers });
      }

      // Remove tags
      for (const tagId of tagsToRemove) {
        await axios.post(`/api/v1/tags/${tagId}/unassign`, {
          entity_type: 'contact',
          entity_ids: [viewingContact.id]
        }, { headers });
      }

      toast({
        title: t('crm.common.success'),
        description: t('crm.tags.updated'),
      });
    } catch (error) {
      console.error('Error updating tags:', error);
      toast({
        title: t('crm.common.error'),
        description: t('crm.tags.saveError'),
        variant: 'destructive',
      });
      // Revert on error
      setViewingContactTagIds(previousTagIds);
    }
  };

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact);
    setEditData({
      name: contact.name,
      email: contact.email,
      phone_number: contact.phone_number || '',
      company: contact.company || '',
    });
    setEditDialogOpen(true);
  };

  const submitEditContact = async () => {
    if (!editingContact) return;
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`/api/v1/contacts/${editingContact.id}`, {
        name: editData.name,
        email: editData.email,
        phone_number: editData.phone_number || null,
        company: editData.company || null,
      }, { headers });
      toast({ title: 'Success', description: `Contact ${editData.name} updated successfully` });
      setEditDialogOpen(false);
      setEditData({ name: '', email: '', phone_number: '', company: '' });
      setEditingContact(null);
      fetchContacts();
    } catch (error: any) {
      console.error('Error updating contact:', error);
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to update contact', variant: 'destructive' });
    }
  };

  const fetchAccounts = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };
      const res = await axios.get('/api/v1/accounts/', { headers, params: { limit: 200 } });
      setAccounts(res.data);
    } catch { /* non-fatal */ }
  };

  const handleBulkLinkAccount = async () => {
    if (!bulkAccountId || selectedContacts.length === 0) return;
    setBulkLinking(true);
    const token = localStorage.getItem('accessToken');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      await Promise.all(
        selectedContacts.map(cid =>
          axios.put(`/api/v1/contacts/${cid}`, { account_id: parseInt(bulkAccountId) }, { headers })
        )
      );
      const acct = accounts.find(a => a.id.toString() === bulkAccountId);
      toast({ title: `Linked ${selectedContacts.length} contact(s) to ${acct?.name ?? 'account'}` });
      setBulkAccountId('');
      setSelectedContacts([]);
      fetchContacts();
    } catch {
      toast({ title: 'Error', description: 'Failed to link some contacts', variant: 'destructive' });
    } finally {
      setBulkLinking(false);
    }
  };

  const handleCreateContact = async () => {
    if (!newContact.name || !newContact.email) {
      toast({ title: 'Validation Error', description: 'Name and email are required', variant: 'destructive' });
      return;
    }
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/v1/contacts/', {
        name: newContact.name,
        email: newContact.email,
        phone_number: newContact.phone_number || null,
        company: newContact.company || null,
        account_id: newContact.account_id ? parseInt(newContact.account_id) : null,
      }, { headers });
      toast({ title: 'Success', description: 'Contact created successfully' });
      setCreateDialogOpen(false);
      setNewContact({ name: '', email: '', phone_number: '', company: '', account_id: '' });
      fetchContacts();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating contact:', error);
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to create contact', variant: 'destructive' });
    }
  };

  const handleConvertToLead = (contact: Contact) => {
    setConvertingContact(contact);
    setConvertDialogOpen(true);
  };

  const submitConversion = async () => {
    if (!convertingContact) return;
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post('/api/v1/leads/', {
        contact_id: convertingContact.id,
        deal_value: leadData.deal_value ? parseFloat(leadData.deal_value) : null,
        source: leadData.source || null,
        notes: leadData.notes || null,
      }, { headers });
      toast({ title: 'Success', description: `${convertingContact.name} converted to lead successfully` });
      setConvertDialogOpen(false);
      setLeadData({ deal_value: '', source: '', notes: '' });
      setConvertingContact(null);
      fetchContacts();
      fetchStats();
    } catch (error: any) {
      console.error('Error converting to lead:', error);
      toast({ title: 'Error', description: error.response?.data?.detail || 'Failed to convert to lead', variant: 'destructive' });
    }
  };

  const toggleSelectContact = (contactId: number) => {
    setSelectedContacts((prev) =>
      prev.includes(contactId) ? prev.filter((id) => id !== contactId) : [...prev, contactId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map((c) => c.id));
    }
  };

  const filteredContacts = contacts.filter((contact) => {
    const matchesSearch =
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'with_lead' && contact.has_lead) ||
      (filterStatus === 'without_lead' && !contact.has_lead);
    return matchesSearch && matchesFilter;
  });

  const handleExportContacts = () => {
    const rows = filteredContacts.map((c) => {
      const nameParts = (c.name ?? '').trim().split(' ');
      const first_name = nameParts[0] ?? '';
      const last_name = nameParts.slice(1).join(' ');
      return {
        first_name,
        last_name,
        email: c.email,
        phone_number: c.phone_number ?? '',
        company: c.account?.name ?? c.company ?? '',
        job_title: (c as any).job_title ?? '',
        lead_source: c.lead_source ?? '',
        lifecycle_stage: c.lifecycle_stage ?? '',
        created_at: (c as any).created_at ?? '',
      };
    });
    downloadCsv('contacts.csv', rows, [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone_number', label: 'Phone' },
      { key: 'company', label: 'Company' },
      { key: 'job_title', label: 'Job Title' },
      { key: 'lead_source', label: 'Lead Source' },
      { key: 'lifecycle_stage', label: 'Lifecycle Stage' },
      { key: 'created_at', label: 'Created At' },
    ]);
  };

  const metrics = [
    {
      title: t('crm.contacts.stats.total'),
      value: stats?.total_contacts || 0,
      subtext: t('crm.contacts.allInDatabase'),
      icon: Users,
      gradient: 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: t('crm.contacts.withLeads'),
      value: stats?.contacts_with_leads || 0,
      subtext: t('crm.contacts.alreadyConverted'),
      icon: UserCheck,
      gradient: 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50',
      iconColor: 'text-green-600 dark:text-green-400',
      trend: '+15%',
      trendUp: true,
    },
    {
      title: t('crm.contacts.withoutLeads'),
      value: stats?.contacts_without_leads || 0,
      subtext: t('crm.contacts.readyToConvert'),
      icon: UserPlus,
      gradient: 'from-orange-100 to-orange-200 dark:from-orange-900/50 dark:to-orange-800/50',
      iconColor: 'text-orange-600 dark:text-orange-400',
      trend: '-3%',
      trendUp: false,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact header: pills row + actions on same line */}
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        {/* Left: stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-semibold text-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {stats?.total_contacts || 0}<span className="hidden sm:inline"> Total</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <UserCheck className="h-3.5 w-3.5" />
            {stats?.contacts_with_leads || 0}<span className="hidden sm:inline"> With Leads</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400">
            <UserPlus className="h-3.5 w-3.5" />
            {stats?.contacts_without_leads || 0}<span className="hidden sm:inline"> Without Leads</span>
          </span>
        </div>
        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-xs" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.common.import')}</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2 sm:px-3 text-xs" onClick={() => handleExportContacts()}>
            <Download className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.common.export')}</span>
          </Button>
          <Button size="sm" onClick={() => { setCreateDialogOpen(true); fetchAccounts(); }} className="h-8 px-2 sm:px-3 text-xs">
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.contacts.addContact')}</span>
          </Button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('crm.contacts.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/40 border-border w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-full sm:w-44 h-8 text-sm bg-muted/40 border-border">
            <SelectValue placeholder={t('crm.contacts.filters.byStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('crm.contacts.filters.all')}</SelectItem>
            <SelectItem value="without_lead">{t('crm.contacts.withoutLeads')}</SelectItem>
            <SelectItem value="with_lead">{t('crm.contacts.withLeads')}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-md px-3 py-1.5 w-full sm:w-auto">
          <Tag className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <TagSelector
            entityType="contact"
            selectedTagIds={filterTagIds}
            onTagsChange={setFilterTagIds}
            showCreateOption={false}
            maxDisplay={3}
          />
          {filterTagIds.length > 0 && (
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-xs" onClick={() => setFilterTagIds([])}>
              {t('common.clear')}
            </Button>
          )}
        </div>
        {selectedContacts.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="text-xs text-muted-foreground font-medium">
              {selectedContacts.length} selected
            </span>
            <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
              <Select
                value={bulkAccountId}
                onValueChange={setBulkAccountId}
                onOpenChange={(open) => { if (open && accounts.length === 0) fetchAccounts(); }}
              >
                <SelectTrigger className="h-8 text-xs flex-1 sm:w-44 bg-background border-border">
                  <SelectValue placeholder="Assign to company…" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()} className="text-xs">{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                className="h-8 px-3 text-xs gap-1 flex-shrink-0"
                disabled={!bulkAccountId || bulkLinking}
                onClick={handleBulkLinkAccount}
              >
                {bulkLinking ? <Loader2 className="h-3 w-3 animate-spin" /> : <Building2 className="h-3 w-3" />}
                Link
              </Button>
            </div>
            <Button size="sm" variant="outline" className="h-8 px-3 text-xs"
              onClick={() => toast({ title: 'Coming Soon', description: 'Bulk conversion will be available soon' })}>
              {t('crm.contacts.convertToLeads', { count: selectedContacts.length })}
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden flex-1">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
              <TableHead className="w-10">
                <Checkbox
                  checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('crm.contacts.fields.fullName')}</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">{t('crm.contacts.fields.email')}</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">{t('crm.contacts.fields.phone')}</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">{t('crm.contacts.fields.company')}</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">{t('crm.contacts.fields.status')}</TableHead>
              <TableHead className="w-10"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filteredContacts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-16">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center">
                        <Users className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground font-medium">{t('crm.contacts.noContacts')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContacts.map((contact, i) => (
                  <motion.tr
                    key={contact.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.18, delay: i * 0.03 }}
                    className="border-border hover:bg-muted/40 transition-colors group"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedContacts.includes(contact.id)}
                        onCheckedChange={() => toggleSelectContact(contact.id)}
                      />
                    </TableCell>
                    <TableCell className="font-semibold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary flex-shrink-0">
                          {contact.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-sm">{contact.name}</span>
                            {/* Mobile-only status dot */}
                            <span className={cn(
                              'flex-shrink-0 h-1.5 w-1.5 rounded-full sm:hidden',
                              contact.has_lead ? 'bg-emerald-500' : 'bg-violet-400'
                            )} />
                          </div>
                          {/* Mobile-only sub-info */}
                          <span className="text-xs text-muted-foreground truncate block sm:hidden">{contact.email}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate max-w-[160px] lg:max-w-none">{contact.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {contact.phone_number ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                          {contact.phone_number}
                        </div>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {(contact.account || contact.company) ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                          {contact.account ? (
                            <span
                              className="cursor-pointer hover:text-foreground hover:underline transition-colors"
                              onClick={() => navigate(`/dashboard/crm/accounts/${contact.account!.id}`)}
                            >
                              {contact.account.name}
                            </span>
                          ) : contact.company}
                        </div>
                      ) : <span className="text-muted-foreground/50">—</span>}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {contact.has_lead ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3 w-3" />{t('crm.contacts.hasLead')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-medium text-violet-600 dark:text-violet-400">
                          <UserPlus className="h-3 w-3" />{t('crm.contacts.noLead')}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 hover:bg-muted">
                            <MoreVertical className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuLabel>{t('crm.common.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleViewDetails(contact)}>
                            <Eye className="h-4 w-4 mr-2" />{t('crm.common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditContact(contact)}>
                            <Edit className="h-4 w-4 mr-2" />{t('crm.contacts.editContact')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!contact.has_lead ? (
                            <DropdownMenuItem onClick={() => handleConvertToLead(contact)} className="text-blue-600 dark:text-blue-400">
                              <ArrowRight className="h-4 w-4 mr-2" />{t('crm.contacts.actions.createLead')}
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => navigate('/dashboard/crm/leads')}>
                              <ArrowRight className="h-4 w-4 mr-2" />{t('crm.common.view')} {t('crm.leads.title')}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive">
                            <Trash2 className="h-4 w-4 mr-2" />{t('crm.contacts.deleteContact')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Create Contact Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('crm.contacts.addContact')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground">
              {t('crm.contacts.addContactDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-foreground font-medium">{t('crm.contacts.fields.fullName')} <span className="text-red-500">*</span></Label>
              <Input placeholder="John Doe" value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="rounded-xl bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">{t('crm.contacts.fields.email')} <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="john@example.com" value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="rounded-xl bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">{t('crm.contacts.fields.phone')}</Label>
              <Input placeholder="+1 234 567 8900" value={newContact.phone_number}
                onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })}
                className="rounded-xl bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">{t('crm.contacts.fields.company')}</Label>
              <Input placeholder="Acme Inc." value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                className="rounded-xl bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground font-medium">Link to Account</Label>
              <Select value={newContact.account_id} onValueChange={(v) => setNewContact({ ...newContact, account_id: v })}>
                <SelectTrigger className="rounded-xl bg-background border-border">
                  <SelectValue placeholder="Select account (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setNewContact({ name: '', email: '', phone_number: '', company: '', account_id: '' }); }}
              className="rounded-xl">
              {t('crm.common.cancel')}
            </Button>
            <Button onClick={handleCreateContact}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg">
              <Plus className="h-4 w-4 mr-2" />{t('crm.contacts.addContact')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Lead Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t('crm.contacts.actions.createLead')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('crm.contacts.convertingContact', { name: convertingContact?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('crm.leads.fields.dealValue')} ($)</Label>
              <Input type="number" placeholder="10000" value={leadData.deal_value}
                onChange={(e) => setLeadData({ ...leadData, deal_value: e.target.value })}
                className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.leads.fields.source')}</Label>
              <Select value={leadData.source} onValueChange={(value) => setLeadData({ ...leadData, source: value })}>
                <SelectTrigger className="bg-background border-border"><SelectValue placeholder={t('crm.leads.selectSource')} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">{t('crm.leads.sources.website')}</SelectItem>
                  <SelectItem value="referral">{t('crm.leads.sources.referral')}</SelectItem>
                  <SelectItem value="social_media">{t('crm.leads.sources.social')}</SelectItem>
                  <SelectItem value="email_campaign">{t('crm.leads.sources.email')}</SelectItem>
                  <SelectItem value="cold_call">{t('crm.leads.sources.phone')}</SelectItem>
                  <SelectItem value="event">{t('crm.campaigns.types.event')}</SelectItem>
                  <SelectItem value="partner">{t('crm.leads.sources.referral')}</SelectItem>
                  <SelectItem value="other">{t('crm.leads.sources.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('crm.leads.fields.notes')}</Label>
              <Textarea placeholder={t('crm.leads.notesPlaceholder')} value={leadData.notes}
                onChange={(e) => setLeadData({ ...leadData, notes: e.target.value })} rows={3}
                className="bg-background border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConvertDialogOpen(false); setLeadData({ deal_value: '', source: '', notes: '' }); setConvertingContact(null); }}>
              {t('crm.common.cancel')}
            </Button>
            <Button onClick={submitConversion}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
              <ArrowRight className="h-4 w-4 mr-2" />{t('crm.contacts.actions.createLead')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Contact Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-full max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-foreground">{t('crm.leads.detail.contactInfo')}</DialogTitle>
          </DialogHeader>

          {/* Contact avatar / name header */}
          <div className="flex items-center gap-4 pb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {viewingContact?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">{viewingContact?.name}</h3>
              <p className="text-sm text-muted-foreground">{viewingContact?.email}</p>
            </div>
          </div>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="w-full">
              <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
              <TabsTrigger
                value="activity"
                className="flex-1"
                onClick={() => { if (viewingContact) fetchTimeline(viewingContact.id); }}
              >
                Activity
              </TabsTrigger>
            </TabsList>

            {/* ── Details Tab ── */}
            <TabsContent value="details">
              <div className="space-y-3 pt-2">
                {viewingContact?.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{viewingContact.phone_number}</span>
                  </div>
                )}
                {viewingContact?.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-foreground">{viewingContact.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{t('crm.contacts.fields.status')}:</span>
                  {viewingContact?.has_lead ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">{t('crm.contacts.hasLead')}</Badge>
                  ) : (
                    <Badge className="bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">{t('crm.contacts.noLead')}</Badge>
                  )}
                </div>
                {/* Tags Section */}
                <div className="pt-3 border-t border-border">
                  <Label className="text-sm text-muted-foreground mb-2 block">{t('crm.tags.title')}:</Label>
                  <TagSelector
                    entityType="contact"
                    selectedTagIds={viewingContactTagIds}
                    onTagsChange={handleContactTagsChange}
                  />
                </div>
              </div>
            </TabsContent>

            {/* ── Activity Tab ── */}
            <TabsContent value="activity">
              <div className="space-y-3 pt-2">
                {/* Log new activity form */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Log Activity</p>
                  <Select
                    value={newActivity.activity_type}
                    onValueChange={(v) => setNewActivity({ ...newActivity, activity_type: v })}
                  >
                    <SelectTrigger className="h-8 text-sm bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="note">Note</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Title *"
                    value={newActivity.title}
                    onChange={(e) => setNewActivity({ ...newActivity, title: e.target.value })}
                    className="h-8 text-sm bg-background border-border"
                  />
                  <Textarea
                    placeholder="Description (optional)"
                    value={newActivity.description}
                    onChange={(e) => setNewActivity({ ...newActivity, description: e.target.value })}
                    rows={2}
                    className="text-sm bg-background border-border resize-none"
                  />
                  <Button
                    size="sm"
                    disabled={loggingActivity || !newActivity.title.trim()}
                    onClick={handleLogActivity}
                    className="h-7 px-3 text-xs bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {loggingActivity ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                    Log Activity
                  </Button>
                </div>

                {/* Timeline list */}
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : timelineItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No activity yet.</p>
                ) : (
                  <div className="relative pl-5 space-y-4 max-h-64 overflow-y-auto pr-1">
                    {/* Vertical line */}
                    <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
                    {timelineItems.map((item) => (
                      <div key={`${item.source}-${item.id}`} className="relative flex gap-3">
                        {/* Dot */}
                        <div className="absolute -left-3 mt-0.5 h-5 w-5 rounded-full bg-background border border-border flex items-center justify-center">
                          {getActivityIcon(item.activity_type)}
                        </div>
                        <div className="pl-2">
                          <p className="text-sm font-medium text-foreground leading-tight">{item.title}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatRelativeDate(item.occurred_at)}
                            {item.source === 'note' && (
                              <span className="ml-1 text-[10px] bg-muted px-1 rounded">note</span>
                            )}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              {t('crm.common.cancel')}
            </Button>
            {!viewingContact?.has_lead && (
              <Button onClick={() => { setViewDialogOpen(false); if (viewingContact) handleConvertToLead(viewingContact); }}
                className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
                <ArrowRight className="h-4 w-4 mr-2" />{t('crm.contacts.actions.createLead')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contact Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t('crm.contacts.editContact')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('crm.contacts.editContactDescription', { name: editingContact?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.fullName')} <span className="text-red-500">*</span></Label>
              <Input placeholder="John Doe" value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.email')} <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="john@example.com" value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.phone')}</Label>
              <Input placeholder="+1 234 567 8900" value={editData.phone_number}
                onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.company')}</Label>
              <Input placeholder="Acme Inc." value={editData.company}
                onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                className="bg-background border-border" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditData({ name: '', email: '', phone_number: '', company: '' }); setEditingContact(null); }}>
              {t('crm.common.cancel')}
            </Button>
            <Button onClick={submitEditContact}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />{t('crm.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        mode="contacts"
        onImported={fetchContacts}
      />
    </div>
  );
}

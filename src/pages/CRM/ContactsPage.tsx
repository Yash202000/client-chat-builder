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
  RefreshCw,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { TagSelector } from '@/components/TagSelector';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  company?: string;
  company_id: number;
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
  const [newContact, setNewContact] = useState({ name: '', email: '', phone_number: '', company: '' });
  const [leadData, setLeadData] = useState({ deal_value: '', source: '', notes: '' });
  const [viewingContactTagIds, setViewingContactTagIds] = useState<number[]>([]);

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
      }, { headers });
      toast({ title: 'Success', description: 'Contact created successfully' });
      setCreateDialogOpen(false);
      setNewContact({ name: '', email: '', phone_number: '', company: '' });
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 inline-block mb-4">
            <RefreshCw className="h-12 w-12 text-blue-500 dark:text-blue-400 animate-spin" />
          </div>
          <p className="text-lg font-medium text-slate-600 dark:text-slate-400">{t('crm.common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-xl shadow-blue-500/25">
            <Contact className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('crm.contacts.title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t('crm.contacts.subtitle')}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200/80 dark:border-slate-600/80 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all">
            <Upload className="h-4 w-4 mr-2" />
            {t('crm.common.import')}
          </Button>
          <Button variant="outline" className="rounded-xl border-slate-200/80 dark:border-slate-600/80 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm hover:shadow-md transition-all">
            <Download className="h-4 w-4 mr-2" />
            {t('crm.common.export')}
          </Button>
          <Button
            onClick={() => setCreateDialogOpen(true)}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-[1.02] transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.contacts.addContact')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          const colorMap = {
            'text-blue-600 dark:text-blue-400': { bg: 'from-white to-blue-50 dark:from-slate-800 dark:to-blue-950/30', border: 'border-blue-200/80 dark:border-blue-800/60', shadow: 'shadow-blue-500/10 hover:shadow-blue-500/20', icon: 'from-blue-500 to-blue-600' },
            'text-green-600 dark:text-green-400': { bg: 'from-white to-green-50 dark:from-slate-800 dark:to-green-950/30', border: 'border-green-200/80 dark:border-green-800/60', shadow: 'shadow-green-500/10 hover:shadow-green-500/20', icon: 'from-green-500 to-emerald-600' },
            'text-orange-600 dark:text-orange-400': { bg: 'from-white to-orange-50 dark:from-slate-800 dark:to-orange-950/30', border: 'border-orange-200/80 dark:border-orange-800/60', shadow: 'shadow-orange-500/10 hover:shadow-orange-500/20', icon: 'from-orange-500 to-red-600' },
          };
          const colors = colorMap[metric.iconColor] || { bg: 'from-white to-slate-50 dark:from-slate-800 dark:to-slate-900', border: 'border-slate-200/80 dark:border-slate-700/60', shadow: 'shadow-slate-500/10', icon: 'from-slate-500 to-slate-600' };

          return (
            <div
              key={metric.title}
              className={`p-6 rounded-2xl border ${colors.border} bg-gradient-to-br ${colors.bg} shadow-xl ${colors.shadow} hover:shadow-2xl hover:scale-[1.02] transition-all duration-300`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${colors.icon} shadow-lg`}>
                  <IconComponent className="h-6 w-6 text-white" />
                </div>
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${metric.trendUp ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                  {metric.trendUp ? (
                    <TrendingUp className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={`text-xs font-bold ${metric.trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {metric.trend}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {metric.title}
                </p>
                <p className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{metric.value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{metric.subtext}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters and Actions */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg p-5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('crm.contacts.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-xl border-slate-200/80 dark:border-slate-600/80 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-[200px] rounded-xl border-slate-200/80 dark:border-slate-600/80 bg-white dark:bg-slate-800">
              <SelectValue placeholder={t('crm.contacts.filters.byStatus')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('crm.contacts.filters.all')}</SelectItem>
              <SelectItem value="without_lead">{t('crm.contacts.withoutLeads')}</SelectItem>
              <SelectItem value="with_lead">{t('crm.contacts.withLeads')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-600/80 rounded-xl px-4 py-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <TagSelector
              entityType="contact"
              selectedTagIds={filterTagIds}
              onTagsChange={setFilterTagIds}
              showCreateOption={false}
              maxDisplay={3}
            />
            {filterTagIds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs rounded-lg"
                onClick={() => setFilterTagIds([])}
              >
                {t('common.clear')}
              </Button>
            )}
          </div>
          {selectedContacts.length > 0 && (
            <Button
              onClick={() => toast({ title: 'Coming Soon', description: 'Bulk conversion will be available soon' })}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25"
            >
              {t('crm.contacts.convertToLeads', { count: selectedContacts.length })}
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 border-slate-200/60 dark:border-slate-700/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={selectedContacts.length === filteredContacts.length && filteredContacts.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">{t('crm.contacts.fields.fullName')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">{t('crm.contacts.fields.email')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">{t('crm.contacts.fields.phone')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">{t('crm.contacts.fields.company')}</TableHead>
              <TableHead className="font-bold text-slate-700 dark:text-slate-300">{t('crm.contacts.fields.status')}</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContacts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-16">
                  <div className="flex flex-col items-center">
                    <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 mb-4">
                      <Users className="h-10 w-10 text-slate-400 dark:text-slate-500" />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('crm.contacts.noContacts')}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredContacts.map((contact) => (
                <TableRow key={contact.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors border-slate-200/60 dark:border-slate-700/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={() => toggleSelectContact(contact.id)}
                    />
                  </TableCell>
                  <TableCell className="font-semibold text-slate-800 dark:text-white">{contact.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                        <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      {contact.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contact.phone_number ? (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
                          <Phone className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                        </div>
                        {contact.phone_number}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.company ? (
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                        <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                          <Building2 className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                        </div>
                        {contact.company}
                      </div>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {contact.has_lead ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-semibold shadow-sm">
                        <CheckCircle2 className="h-3 w-3 mr-1.5" />
                        {t('crm.contacts.hasLead')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-semibold shadow-sm">
                        <UserPlus className="h-3 w-3 mr-1.5" />
                        {t('crm.contacts.noLead')}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl dark:bg-slate-800 dark:border-slate-700">
                        <DropdownMenuLabel>{t('crm.common.actions')}</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleViewDetails(contact)} className="rounded-lg">
                          <Eye className="h-4 w-4 mr-2" />
                          {t('crm.common.view')}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEditContact(contact)} className="rounded-lg">
                          <Edit className="h-4 w-4 mr-2" />
                          {t('crm.contacts.editContact')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {!contact.has_lead ? (
                          <DropdownMenuItem onClick={() => handleConvertToLead(contact)} className="text-blue-600 dark:text-blue-400 rounded-lg">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {t('crm.contacts.actions.createLead')}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem onClick={() => navigate('/dashboard/crm/leads')} className="rounded-lg">
                            <ArrowRight className="h-4 w-4 mr-2" />
                            {t('crm.common.view')} {t('crm.leads.title')}
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600 dark:text-red-400 rounded-lg">
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('crm.contacts.deleteContact')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Contact Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-md rounded-2xl dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                <UserPlus className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('crm.contacts.addContact')}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 dark:text-slate-400">
              {t('crm.contacts.addContactDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 font-medium">{t('crm.contacts.fields.fullName')} <span className="text-red-500">*</span></Label>
              <Input placeholder="John Doe" value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="rounded-xl border-slate-200/80 dark:border-slate-600/80 dark:bg-slate-900" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 font-medium">{t('crm.contacts.fields.email')} <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="john@example.com" value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                className="rounded-xl border-slate-200/80 dark:border-slate-600/80 dark:bg-slate-900" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 font-medium">{t('crm.contacts.fields.phone')}</Label>
              <Input placeholder="+1 234 567 8900" value={newContact.phone_number}
                onChange={(e) => setNewContact({ ...newContact, phone_number: e.target.value })}
                className="rounded-xl border-slate-200/80 dark:border-slate-600/80 dark:bg-slate-900" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 font-medium">{t('crm.contacts.fields.company')}</Label>
              <Input placeholder="Acme Inc." value={newContact.company}
                onChange={(e) => setNewContact({ ...newContact, company: e.target.value })}
                className="rounded-xl border-slate-200/80 dark:border-slate-600/80 dark:bg-slate-900" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setNewContact({ name: '', email: '', phone_number: '', company: '' }); }}
              className="rounded-xl dark:bg-slate-700 dark:border-slate-600">
              {t('crm.common.cancel')}
            </Button>
            <Button onClick={handleCreateContact}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25">
              <Plus className="h-4 w-4 mr-2" />{t('crm.contacts.addContact')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Convert to Lead Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t('crm.contacts.actions.createLead')}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('crm.contacts.convertingContact', { name: convertingContact?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('crm.leads.fields.dealValue')} ($)</Label>
              <Input type="number" placeholder="10000" value={leadData.deal_value}
                onChange={(e) => setLeadData({ ...leadData, deal_value: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.leads.fields.source')}</Label>
              <Select value={leadData.source} onValueChange={(value) => setLeadData({ ...leadData, source: value })}>
                <SelectTrigger className="dark:bg-slate-900 dark:border-slate-600"><SelectValue placeholder={t('crm.leads.selectSource')} /></SelectTrigger>
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
                className="dark:bg-slate-900 dark:border-slate-600" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConvertDialogOpen(false); setLeadData({ deal_value: '', source: '', notes: '' }); setConvertingContact(null); }}
              className="dark:bg-slate-700 dark:border-slate-600">
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
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold dark:text-white">{t('crm.leads.detail.contactInfo')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/50 dark:to-red-900/50 flex items-center justify-center">
                <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {viewingContact?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-semibold dark:text-white">{viewingContact?.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{viewingContact?.email}</p>
              </div>
            </div>
            <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-700">
              {viewingContact?.phone_number && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <span className="dark:text-gray-300">{viewingContact.phone_number}</span>
                </div>
              )}
              {viewingContact?.company && (
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="dark:text-gray-300">{viewingContact.company}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('crm.contacts.fields.status')}:</span>
                {viewingContact?.has_lead ? (
                  <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">{t('crm.contacts.hasLead')}</Badge>
                ) : (
                  <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">{t('crm.contacts.noLead')}</Badge>
                )}
              </div>
              {/* Tags Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                <Label className="text-sm text-gray-500 dark:text-gray-400 mb-2 block">{t('crm.tags.title')}:</Label>
                <TagSelector
                  entityType="contact"
                  selectedTagIds={viewingContactTagIds}
                  onTagsChange={handleContactTagsChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)} className="dark:bg-slate-700 dark:border-slate-600">
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
        <DialogContent className="max-w-md dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t('crm.contacts.editContact')}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('crm.contacts.editContactDescription', { name: editingContact?.name })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.fullName')} <span className="text-red-500">*</span></Label>
              <Input placeholder="John Doe" value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.email')} <span className="text-red-500">*</span></Label>
              <Input type="email" placeholder="john@example.com" value={editData.email}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.phone')}</Label>
              <Input placeholder="+1 234 567 8900" value={editData.phone_number}
                onChange={(e) => setEditData({ ...editData, phone_number: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600" />
            </div>
            <div className="space-y-2">
              <Label>{t('crm.contacts.fields.company')}</Label>
              <Input placeholder="Acme Inc." value={editData.company}
                onChange={(e) => setEditData({ ...editData, company: e.target.value })}
                className="dark:bg-slate-900 dark:border-slate-600" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setEditData({ name: '', email: '', phone_number: '', company: '' }); setEditingContact(null); }}
              className="dark:bg-slate-700 dark:border-slate-600">
              {t('crm.common.cancel')}
            </Button>
            <Button onClick={submitEditContact}
              className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
              <CheckCircle2 className="h-4 w-4 mr-2" />{t('crm.common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

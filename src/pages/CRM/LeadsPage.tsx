import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  MoreVertical,
  Star,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Check,
  ChevronsUpDown,
  AlertCircle,
  X,
  GripVertical,
  Target,
  UserCheck,
  CircleDollarSign,
  Percent,
  LayoutGrid,
  List,
  Tag,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { TagSelector } from '@/components/TagSelector';

interface Lead {
  id: number;
  contact_id: number;
  contact?: {
    name: string;
    email: string;
    phone_number?: string;
  };
  stage: string;
  score: number;
  deal_value?: number;
  qualification_status: string;
  source?: string;
  assignee_id?: number;
  created_at: string;
  stage_changed_at?: string;
}

interface LeadStats {
  total_leads: number;
  lead_count: number;
  mql_count: number;
  sql_count: number;
  opportunity_count: number;
  customer_count: number;
  lost_count: number;
  avg_score: number;
  total_pipeline_value: number;
  qualified_count: number;
  unqualified_count: number;
}

interface Contact {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  company?: string;
}

const STAGE_LABELS: Record<string, string> = {
  lead: 'Lead',
  mql: 'MQL',
  sql: 'SQL',
  opportunity: 'Opportunity',
  customer: 'Customer',
  lost: 'Lost',
};

const STAGE_COLORS: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  mql: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  sql: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  opportunity: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
  customer: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  lost: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

const STAGE_GRADIENTS: Record<string, string> = {
  lead: 'from-slate-500 to-slate-600',
  mql: 'from-blue-500 to-blue-600',
  sql: 'from-purple-500 to-purple-600',
  opportunity: 'from-amber-500 to-amber-600',
  customer: 'from-green-500 to-green-600',
  lost: 'from-red-500 to-red-600',
};

export default function LeadsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing');
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [openCombobox, setOpenCombobox] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [contactsWithoutLeads, setContactsWithoutLeads] = useState(0);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone_number: '',
    company: '',
    deal_value: '',
    source: '',
    notes: '',
  });

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [selectedStage, filterTagIds]);

  useEffect(() => {
    if (createDialogOpen) {
      fetchAvailableContacts();
    }
  }, [createDialogOpen]);

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const params: any = {};
      if (selectedStage !== 'all') {
        params.stage = selectedStage;
      }
      if (filterTagIds.length > 0) {
        params.tag_ids = filterTagIds;
      }
      const response = await axios.get('/api/v1/leads/', { params, headers, paramsSerializer: { indexes: null } });
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch leads',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/v1/leads/stats', { headers });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchAvailableContacts = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get('/api/v1/leads/available-contacts', { headers });
      setAvailableContacts(response.data);
      setContactsWithoutLeads(response.data.length);
    } catch (error) {
      console.error('Error fetching available contacts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch available contacts',
        variant: 'destructive',
      });
    }
  };

  const handleQualifyLead = async (leadId: number) => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.post(`/api/v1/leads/${leadId}/qualify`, {}, { headers });
      toast({
        title: 'Success',
        description: 'Lead qualified successfully',
      });
      fetchLeads();
      fetchStats();
    } catch (error) {
      console.error('Error qualifying lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to qualify lead',
        variant: 'destructive',
      });
    }
  };

  const handleCreateLead = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      if (createMode === 'existing') {
        if (!selectedContactId) {
          toast({
            title: 'Validation Error',
            description: 'Please select a contact',
            variant: 'destructive',
          });
          return;
        }
        const leadData = {
          contact_id: parseInt(selectedContactId),
          deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : null,
          source: newLead.source || null,
          notes: newLead.notes || null,
        };
        await axios.post('/api/v1/leads/', leadData, { headers });
      } else {
        if (!newLead.name || !newLead.email) {
          toast({
            title: 'Validation Error',
            description: 'Name and email are required',
            variant: 'destructive',
          });
          return;
        }
        const leadData = {
          contact: {
            name: newLead.name,
            email: newLead.email,
            phone_number: newLead.phone_number || null,
            company: newLead.company || null,
          },
          deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : null,
          source: newLead.source || null,
          notes: newLead.notes || null,
        };
        await axios.post('/api/v1/leads/with-contact', leadData, { headers });
      }

      toast({ title: 'Success', description: 'Lead created successfully' });
      setSelectedContactId('');
      setNewLead({ name: '', email: '', phone_number: '', company: '', deal_value: '', source: '', notes: '' });
      setCreateDialogOpen(false);
      fetchLeads();
      fetchStats();
    } catch (error: any) {
      console.error('Error creating lead:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.detail || 'Failed to create lead',
        variant: 'destructive',
      });
    }
  };

  const filteredLeads = leads.filter((lead) =>
    lead.contact?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.contact?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const leadsByStage = Object.keys(STAGE_LABELS).reduce((acc, stage) => {
    acc[stage] = filteredLeads.filter((lead) => lead.stage === stage);
    return acc;
  }, {} as Record<string, Lead[]>);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const leadId = parseInt(draggableId.replace('lead-', ''));
    const newStage = destination.droppableId;

    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead.id === leadId ? { ...lead, stage: newStage } : lead))
    );

    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      await axios.put(`/api/v1/leads/${leadId}/stage`, { stage: newStage }, { headers });
      toast({ title: 'Success', description: `Lead moved to ${STAGE_LABELS[newStage]}` });
      fetchStats();
    } catch (error) {
      console.error('Error updating lead stage:', error);
      fetchLeads();
      toast({ title: 'Error', description: 'Failed to update lead stage', variant: 'destructive' });
    }
  }, [toast]);

  const metrics = [
    {
      title: t('crm.dashboard.stats.totalLeads'),
      value: stats?.total_leads || 0,
      subtext: `${stats?.qualified_count || 0} ${t('crm.leads.qualification.qualified').toLowerCase()}`,
      icon: Users,
      gradient: 'from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50',
      iconColor: 'text-blue-600 dark:text-blue-400',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: t('crm.dashboard.stats.pipelineValue'),
      value: `$${(stats?.total_pipeline_value || 0).toLocaleString()}`,
      subtext: `${stats?.opportunity_count || 0} ${t('crm.leads.stages.opportunity').toLowerCase()}`,
      icon: CircleDollarSign,
      gradient: 'from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50',
      iconColor: 'text-green-600 dark:text-green-400',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: t('crm.leads.stats.avgScore'),
      value: `${stats?.avg_score ? stats.avg_score.toFixed(0) : 0}/100`,
      subtext: t('crm.leads.fields.score'),
      icon: Star,
      gradient: 'from-yellow-100 to-yellow-200 dark:from-yellow-900/50 dark:to-yellow-800/50',
      iconColor: 'text-yellow-600 dark:text-yellow-400',
      trend: '+5',
      trendUp: true,
    },
    {
      title: t('crm.dashboard.stats.conversionRate'),
      value: `${stats?.total_leads ? (((stats?.customer_count || 0) / stats.total_leads) * 100).toFixed(1) : 0}%`,
      subtext: `${stats?.customer_count || 0} ${t('crm.leads.stages.customer').toLowerCase()}`,
      icon: Percent,
      gradient: 'from-purple-100 to-purple-200 dark:from-purple-900/50 dark:to-purple-800/50',
      iconColor: 'text-purple-600 dark:text-purple-400',
      trend: '+2.3%',
      trendUp: true,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 inline-block mb-4">
            <RefreshCw className="h-12 w-12 text-purple-500 dark:text-purple-400 animate-spin" />
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
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-xl shadow-purple-500/25">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {t('crm.leads.title')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              {t('crm.leads.subtitle')}
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
            className="rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 hover:scale-[1.02] transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('crm.leads.addLead')}
          </Button>
        </div>
      </div>

      {/* Banner for Contacts Without Leads */}
      {showBanner && contactsWithoutLeads > 0 && (
        <div className="rounded-2xl border border-amber-200/80 dark:border-amber-800/60 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-4 shadow-lg shadow-amber-500/10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-md">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-amber-800 dark:text-amber-200 font-medium">
                {t('crm.leads.contactsWithoutLeads', { count: contactsWithoutLeads })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30"
                onClick={() => navigate('/dashboard/crm/contacts')}
              >
                {t('crm.contacts.title')}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowBanner(false)} className="rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/30">
                <X className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => {
          const IconComponent = metric.icon;
          const colorMap = {
            'text-blue-600 dark:text-blue-400': { bg: 'from-white to-blue-50 dark:from-slate-800 dark:to-blue-950/30', border: 'border-blue-200/80 dark:border-blue-800/60', shadow: 'shadow-blue-500/10 hover:shadow-blue-500/20', icon: 'from-blue-500 to-blue-600' },
            'text-green-600 dark:text-green-400': { bg: 'from-white to-green-50 dark:from-slate-800 dark:to-green-950/30', border: 'border-green-200/80 dark:border-green-800/60', shadow: 'shadow-green-500/10 hover:shadow-green-500/20', icon: 'from-green-500 to-emerald-600' },
            'text-yellow-600 dark:text-yellow-400': { bg: 'from-white to-yellow-50 dark:from-slate-800 dark:to-yellow-950/30', border: 'border-yellow-200/80 dark:border-yellow-800/60', shadow: 'shadow-yellow-500/10 hover:shadow-yellow-500/20', icon: 'from-yellow-500 to-amber-600' },
            'text-purple-600 dark:text-purple-400': { bg: 'from-white to-purple-50 dark:from-slate-800 dark:to-purple-950/30', border: 'border-purple-200/80 dark:border-purple-800/60', shadow: 'shadow-purple-500/10 hover:shadow-purple-500/20', icon: 'from-purple-500 to-indigo-600' },
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

      {/* Filters and View Toggle */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/60 bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-lg p-5">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={t('crm.leads.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 rounded-xl border-slate-200/80 dark:border-slate-600/80 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-purple-500/20 transition-all"
            />
          </div>
          <Select value={selectedStage} onValueChange={setSelectedStage}>
            <SelectTrigger className="w-[180px] rounded-xl border-slate-200/80 dark:border-slate-600/80 bg-white dark:bg-slate-800">
              <SelectValue placeholder={t('crm.leads.filters.byStage')} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">{t('crm.leads.filters.all')}</SelectItem>
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>{t(`crm.leads.stages.${value}`, label)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-600/80 rounded-xl px-4 py-2">
            <Tag className="h-4 w-4 text-slate-400" />
            <TagSelector
              entityType="lead"
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
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1.5 shadow-inner">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('kanban')}
              className={cn(
                "rounded-lg transition-all",
                view === 'kanban'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <LayoutGrid className="h-4 w-4 mr-1.5" />
              {t('crm.leads.views.kanban')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setView('table')}
              className={cn(
                "rounded-lg transition-all",
                view === 'table'
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-700'
              )}
            >
              <List className="h-4 w-4 mr-1.5" />
              {t('crm.leads.views.list')}
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban View */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(STAGE_LABELS).map(([stage, label]) => (
              <div key={stage} className="space-y-3">
                <div className="flex items-center justify-between px-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${STAGE_GRADIENTS[stage]}`} />
                    <h3 className="font-semibold text-sm dark:text-white">{t(`crm.leads.stages.${stage}`, label)}</h3>
                  </div>
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {leadsByStage[stage]?.length || 0}
                  </Badge>
                </div>
                <Droppable droppableId={stage}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "space-y-2 min-h-[300px] rounded-xl p-2 transition-all duration-200",
                        snapshot.isDraggingOver
                          ? "bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-dashed border-orange-400"
                          : "bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700"
                      )}
                    >
                      {leadsByStage[stage]?.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={`lead-${lead.id}`} index={index}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "cursor-pointer transition-all duration-200 border-slate-200 dark:border-slate-700 dark:bg-slate-800",
                                snapshot.isDragging
                                  ? "shadow-xl ring-2 ring-orange-400 rotate-2"
                                  : "hover:shadow-lg hover:-translate-y-0.5"
                              )}
                              onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                            >
                              <CardHeader className="p-3 space-y-1">
                                <div className="flex items-start justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <GripVertical className="h-3.5 w-3.5 text-slate-400" />
                                    </div>
                                    <CardTitle className="text-sm font-medium dark:text-white">
                                      {lead.contact?.name || 'Unknown'}
                                    </CardTitle>
                                  </div>
                                  <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/30 px-1.5 py-0.5 rounded">
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-xs font-medium text-yellow-700 dark:text-yellow-400">{lead.score}</span>
                                  </div>
                                </div>
                                <CardDescription className="text-xs pl-5 dark:text-gray-400">
                                  {lead.contact?.email}
                                </CardDescription>
                              </CardHeader>
                              <CardContent className="p-3 pt-0 space-y-2 pl-6">
                                {lead.deal_value && (
                                  <div className="flex items-center text-xs text-green-600 dark:text-green-400 font-medium">
                                    <DollarSign className="h-3 w-3 mr-0.5" />
                                    {lead.deal_value.toLocaleString()}
                                  </div>
                                )}
                                {lead.source && (
                                  <Badge variant="outline" className="text-xs border-slate-300 dark:border-slate-600">
                                    {lead.source}
                                  </Badge>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {leadsByStage[stage]?.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-2">
                            <Target className="h-5 w-5 text-slate-400" />
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{t('crm.leads.noLeadsInStage', { stage: t(`crm.leads.stages.${stage}`, label) })}</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {/* Table View */}
      {view === 'table' && (
        <Card className="border-slate-200 dark:border-slate-700 dark:bg-slate-800 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700">
                <TableHead className="font-semibold">{t('crm.leads.fields.name')}</TableHead>
                <TableHead className="font-semibold">{t('crm.leads.fields.email')}</TableHead>
                <TableHead className="font-semibold">{t('crm.leads.fields.stage')}</TableHead>
                <TableHead className="font-semibold">{t('crm.leads.fields.score')}</TableHead>
                <TableHead className="font-semibold">{t('crm.leads.fields.dealValue')}</TableHead>
                <TableHead className="font-semibold">{t('crm.leads.fields.source')}</TableHead>
                <TableHead className="font-semibold">{t('crm.common.status')}</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-slate-400" />
                      </div>
                      <p className="text-slate-500 dark:text-slate-400">{t('crm.leads.noLeads')}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeads.map((lead) => (
                  <TableRow
                    key={lead.id}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors"
                    onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                  >
                    <TableCell className="font-medium dark:text-white">{lead.contact?.name}</TableCell>
                    <TableCell className="dark:text-gray-300">{lead.contact?.email}</TableCell>
                    <TableCell>
                      <Badge className={cn("font-medium", STAGE_COLORS[lead.stage])}>
                        {STAGE_LABELS[lead.stage]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="dark:text-white">{lead.score}/100</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-green-600 dark:text-green-400 font-medium">
                      {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : '-'}
                    </TableCell>
                    <TableCell className="dark:text-gray-300">{lead.source || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={lead.qualification_status === 'qualified' ? 'default' : 'secondary'}
                        className={lead.qualification_status === 'qualified'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : ''}>
                        {lead.qualification_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="dark:bg-slate-800 dark:border-slate-700">
                          <DropdownMenuLabel>{t('crm.common.actions')}</DropdownMenuLabel>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/crm/leads/${lead.id}`); }}>
                            {t('crm.common.view')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleQualifyLead(lead.id); }}>
                            {t('crm.leads.actions.qualify')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 dark:text-red-400">{t('crm.leads.deleteLead')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto dark:bg-slate-800 dark:border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              {t('crm.leads.addLead')}
            </DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              {t('crm.leads.createLeadDescription')}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'existing' | 'new')}>
            <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900">
              <TabsTrigger value="existing" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                {t('crm.leads.fromExistingContact')}
              </TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                {t('crm.leads.newContact')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contact">{t('crm.leads.selectContact')} <span className="text-red-500">*</span></Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between dark:bg-slate-900 dark:border-slate-600">
                      {selectedContactId
                        ? availableContacts.find((c) => c.id.toString() === selectedContactId)?.name
                        : t('crm.leads.searchContacts')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0 dark:bg-slate-800 dark:border-slate-700" align="start">
                    <Command>
                      <CommandInput placeholder={t('crm.leads.searchByNameOrEmail')} />
                      <CommandList>
                        <CommandEmpty>
                          {availableContacts.length === 0 ? t('crm.contacts.noContacts') : t('crm.contacts.noContactsFound')}
                        </CommandEmpty>
                        <CommandGroup>
                          {availableContacts.map((contact) => (
                            <CommandItem
                              key={contact.id}
                              value={`${contact.name} ${contact.email}`}
                              onSelect={() => { setSelectedContactId(contact.id.toString()); setOpenCombobox(false); }}
                            >
                              <Check className={cn('mr-2 h-4 w-4', selectedContactId === contact.id.toString() ? 'opacity-100' : 'opacity-0')} />
                              <div className="flex flex-col">
                                <span className="font-medium">{contact.name}</span>
                                <span className="text-xs text-muted-foreground">{contact.email}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deal_value_existing">{t('crm.leads.fields.dealValue')} ($)</Label>
                  <Input id="deal_value_existing" type="number" placeholder="10000" value={newLead.deal_value}
                    onChange={(e) => setNewLead({ ...newLead, deal_value: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_existing">{t('crm.leads.fields.source')}</Label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes_existing">{t('crm.leads.fields.notes')}</Label>
                <Textarea id="notes_existing" placeholder={t('crm.leads.notesPlaceholder')} value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={3}
                  className="dark:bg-slate-900 dark:border-slate-600" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setSelectedContactId(''); setNewLead({ name: '', email: '', phone_number: '', company: '', deal_value: '', source: '', notes: '' }); }}
                  className="dark:bg-slate-700 dark:border-slate-600">
                  {t('crm.common.cancel')}
                </Button>
                <Button onClick={handleCreateLead} disabled={!selectedContactId}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />{t('crm.leads.addLead')}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="new" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('crm.leads.fields.name')} <span className="text-red-500">*</span></Label>
                  <Input id="name" placeholder="John Doe" value={newLead.name}
                    onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('crm.leads.fields.email')} <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" placeholder="john@example.com" value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('crm.leads.fields.phone')}</Label>
                  <Input id="phone" placeholder="+1 234 567 8900" value={newLead.phone_number}
                    onChange={(e) => setNewLead({ ...newLead, phone_number: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t('crm.leads.fields.company')}</Label>
                  <Input id="company" placeholder="Acme Inc." value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal_value">{t('crm.leads.fields.dealValue')} ($)</Label>
                  <Input id="deal_value" type="number" placeholder="10000" value={newLead.deal_value}
                    onChange={(e) => setNewLead({ ...newLead, deal_value: e.target.value })}
                    className="dark:bg-slate-900 dark:border-slate-600" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">{t('crm.leads.fields.source')}</Label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('crm.leads.fields.notes')}</Label>
                <Textarea id="notes" placeholder={t('crm.leads.notesPlaceholder')} value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={3}
                  className="dark:bg-slate-900 dark:border-slate-600" />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setNewLead({ name: '', email: '', phone_number: '', company: '', deal_value: '', source: '', notes: '' }); }}
                  className="dark:bg-slate-700 dark:border-slate-600">
                  {t('crm.common.cancel')}
                </Button>
                <Button onClick={handleCreateLead}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />{t('crm.leads.addLead')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

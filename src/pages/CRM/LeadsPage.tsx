import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Download,
  Upload,
  Star,
  DollarSign,
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
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import CsvImportDialog from '@/components/CsvImportDialog';
import { downloadCsv } from '@/utils/csvExport';
import { CustomFieldInput } from '@/components/CustomFieldInput';

interface WorkflowStatus { id: number; name: string; color: string; category: string; }
interface WorkflowTransition {
  id: number; name: string;
  from_status_id?: number | null; to_status_id: number;
  to_status?: WorkflowStatus;
  screen_fields?: Array<{ field: string; label: string; required: boolean }>;
  post_actions?: Record<string, any>;
}

interface Lead {
  id: number;
  contact_id: number;
  contact?: {
    name: string;
    email: string;
    phone_number?: string;
  };
  stage: string;
  status?: WorkflowStatus;
  available_transitions?: WorkflowTransition[];
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
  by_status: Record<string, number>;
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


// ── Inline Transition Dialog (reused from ticket system) ──────────────────────
function TransitionDropDialog({ open, transition, onClose, onSubmit }: {
  open: boolean;
  transition: WorkflowTransition;
  onClose: () => void;
  onSubmit: (fieldValues: Record<string, any>, comment: string) => Promise<void>;
}) {
  const [comment, setComment] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const setFv = (k: string, v: any) => setFieldValues(p => ({ ...p, [k]: v }));
  const fields = transition.screen_fields || [];
  const otherFields = fields.filter(f => f.field !== 'comment');
  const hasComment = fields.some(f => f.field === 'comment') || fields.length === 0;

  const submit = async () => {
    for (const sf of fields) {
      if (sf.required && sf.field !== 'comment' && !fieldValues[sf.field]) { alert(`${sf.label} is required`); return; }
      if (sf.required && sf.field === 'comment' && !comment.trim()) { alert('Comment is required'); return; }
    }
    setLoading(true);
    try { await onSubmit(fieldValues, comment); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transition.name}
            {transition.to_status && (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full text-white ml-2"
                style={{ backgroundColor: transition.to_status.color }}>
                <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                {transition.to_status.name}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {otherFields.map(sf => (
            <div key={sf.field} className="space-y-1.5">
              <Label className="text-sm font-medium">{sf.label}{sf.required && <span className="text-destructive ml-1">*</span>}</Label>
              <Input value={fieldValues[sf.field] || ''} onChange={e => setFv(sf.field, e.target.value)} />
            </div>
          ))}
          {hasComment && (
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Comment <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
              <Textarea placeholder="Add a comment…" rows={3} value={comment} onChange={e => setComment(e.target.value)} className="resize-none" />
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading} className="text-white"
            style={transition.to_status ? { backgroundColor: transition.to_status.color } : {}}>
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            {transition.name}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function LeadsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusId, setSelectedStatusId] = useState<string>('all');
  const [filterTagIds, setFilterTagIds] = useState<number[]>([]);
  // Workflow
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransition[]>([]);
  // Transition dialog
  const [pendingDrop, setPendingDrop] = useState<{ leadId: number; transition: WorkflowTransition } | null>(null);
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createMode, setCreateMode] = useState<'existing' | 'new'>('existing');
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [openCombobox, setOpenCombobox] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [contactsWithoutLeads, setContactsWithoutLeads] = useState(0);
  const [importOpen, setImportOpen] = useState(false);
  const [newLead, setNewLead] = useState({
    name: '',
    email: '',
    phone_number: '',
    company: '',
    deal_value: '',
    source: '',
    notes: '',
  });
  const [leadCF, setLeadCF] = useState<Record<string, any>>({});
  const [leadCFDefs, setLeadCFDefs] = useState<any[]>([]);
  const [leadHierarchyNodes, setLeadHierarchyNodes] = useState<any[]>([]);

  useEffect(() => {
    fetchWorkflow();
    fetchLeads();
    fetchStats();
    fetchLeadCustomFields();
  }, [selectedStatusId, filterTagIds]);

  useEffect(() => {
    if (createDialogOpen) {
      fetchAvailableContacts();
    }
  }, [createDialogOpen]);

  const fetchWorkflow = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const res = await axios.get('/api/v1/leads/workflow', { headers: { Authorization: `Bearer ${token}` } });
      setWorkflowStatuses(res.data.statuses || []);
      setWorkflowTransitions(res.data.transitions || []);
    } catch { /* silently ignore — falls back to empty */ }
  };

  const fetchLeads = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const params: any = {};
      if (selectedStatusId !== 'all') params.status_id = selectedStatusId;
      if (filterTagIds.length > 0) params.tag_ids = filterTagIds;
      const response = await axios.get('/api/v1/leads/', { params, headers, paramsSerializer: { indexes: null } });
      setLeads(response.data);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({ title: 'Error', description: 'Failed to fetch leads', variant: 'destructive' });
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

  const fetchLeadCustomFields = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };
      const [cfRes, htRes] = await Promise.all([
        axios.get('/api/v1/custom-fields/', { headers, params: { entity_type: 'lead' } }).catch(() => ({ data: [] })),
        axios.get('/api/v1/hierarchy/types', { headers }).catch(() => ({ data: [] })),
      ]);
      setLeadCFDefs(cfRes.data || []);
      const types: { id: number }[] = htRes.data || [];
      const nodeResponses = await Promise.all(
        types.map((t) => axios.get(`/api/v1/hierarchy/types/${t.id}/nodes`, { headers }).catch(() => ({ data: [] })))
      );
      setLeadHierarchyNodes(nodeResponses.flatMap((r: any) => r.data));
    } catch { /* non-fatal */ }
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
        const cfPayload = Object.fromEntries(Object.entries(leadCF).filter(([, v]) => v != null && v !== ''));
        const leadData = {
          contact_id: parseInt(selectedContactId),
          deal_value: newLead.deal_value ? parseFloat(newLead.deal_value) : null,
          source: newLead.source || null,
          notes: newLead.notes || null,
          custom_fields: Object.keys(cfPayload).length > 0 ? cfPayload : undefined,
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
        const cfPayload2 = Object.fromEntries(Object.entries(leadCF).filter(([, v]) => v != null && v !== ''));
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
          custom_fields: Object.keys(cfPayload2).length > 0 ? cfPayload2 : undefined,
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

  const handleExportLeads = () => {
    downloadCsv('leads.csv', filteredLeads as Record<string, any>[], [
      { key: 'contact.name', label: 'Contact Name' },
      { key: 'contact.email', label: 'Email' },
      { key: 'stage', label: 'Stage' },
      { key: 'score', label: 'Score' },
      { key: 'source', label: 'Source' },
      { key: 'assignee.full_name', label: 'Assignee' },
      { key: 'created_at', label: 'Created At' },
    ]);
  };

  const leadsByStatus = workflowStatuses.reduce((acc, s) => {
    acc[s.id] = filteredLeads.filter(lead => lead.status?.id === s.id);
    return acc;
  }, {} as Record<number, Lead[]>);

  const applyStatusChange = async (leadId: number, statusId: number, statusName: string) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.put(`/api/v1/leads/${leadId}/stage`, { status_id: statusId }, { headers: { Authorization: `Bearer ${token}` } });
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: workflowStatuses.find(s => s.id === statusId) } : l));
      toast({ title: 'Success', description: `Lead moved to ${statusName}` });
      fetchStats();
    } catch {
      fetchLeads();
      toast({ title: 'Error', description: 'Failed to update lead status', variant: 'destructive' });
    }
  };

  const submitTransitionDrop = async (fieldValues: Record<string, any>, comment: string) => {
    if (!pendingDrop) return;
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post(`/api/v1/leads/${pendingDrop.leadId}/transition`, {
        transition_id: pendingDrop.transition.id,
        comment: comment || undefined,
        field_values: Object.keys(fieldValues).length > 0 ? fieldValues : undefined,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast({ title: 'Success', description: `Lead moved to ${pendingDrop.transition.to_status?.name}` });
      setPendingDrop(null);
      fetchLeads(); fetchStats();
    } catch (e: any) {
      toast({ title: 'Error', description: e.response?.data?.detail || 'Transition failed', variant: 'destructive' });
    }
  };

  const handleDragEnd = useCallback((result: DropResult) => {
    const { destination, source, draggableId } = result;
    if (!destination || destination.droppableId === source.droppableId) return;

    const leadId = parseInt(draggableId.replace('lead-', ''));
    const newStatusId = parseInt(destination.droppableId);
    const newStatus = workflowStatuses.find(s => s.id === newStatusId);
    const lead = leads.find(l => l.id === leadId);
    if (!lead || !newStatus) return;

    const transition = workflowTransitions.find(t =>
      (t.from_status_id === lead.status?.id || t.from_status_id == null) && t.to_status_id === newStatusId
    );
    const hasFields = transition?.screen_fields && transition.screen_fields.length > 0;
    const hasPostActions = transition?.post_actions && Object.keys(transition.post_actions).length > 0;

    if (transition && (hasFields || hasPostActions)) {
      setPendingDrop({ leadId, transition });
    } else {
      applyStatusChange(leadId, newStatusId, newStatus.name);
    }
  }, [leads, workflowStatuses, workflowTransitions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Compact header: pills + actions */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        {/* Stat pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted border border-border text-xs font-semibold text-foreground">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {stats?.total_leads || 0} Leads
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CircleDollarSign className="h-3.5 w-3.5" />
            ${(stats?.total_pipeline_value || 0).toLocaleString()} Pipeline
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400">
            <Star className="h-3.5 w-3.5" />
            {stats?.avg_score ? stats.avg_score.toFixed(0) : 0}/100 Score
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs font-semibold text-violet-600 dark:text-violet-400">
            <Percent className="h-3.5 w-3.5" />
            {stats?.qualified_count || 0} Qualified
          </span>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.common.import')}</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3 text-xs" onClick={() => handleExportLeads()}>
            <Download className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.common.export')}</span>
          </Button>
          <Button size="sm" onClick={() => setCreateDialogOpen(true)} className="h-8 px-3 text-xs">
            <Plus className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.leads.addLead')}</span>
          </Button>
        </div>
      </div>

      {/* Contacts without leads banner */}
      {showBanner && contactsWithoutLeads > 0 && (
        <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 px-4 py-3 mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-4 w-4 text-violet-500 flex-shrink-0" />
            <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
              {t('crm.leads.contactsWithoutLeads', { count: contactsWithoutLeads })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 px-2.5 text-xs border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300" onClick={() => navigate('/dashboard/crm/contacts')}>
              {t('crm.contacts.title')}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setShowBanner(false)}>
              <X className="h-3.5 w-3.5 text-violet-500" />
            </Button>
          </div>
        </div>
      )}

      {/* Filter + view toggle bar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative w-full sm:flex-1 sm:min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder={t('crm.leads.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 h-8 text-sm bg-muted/40 border-border w-full"
          />
        </div>
        <Select value={selectedStatusId} onValueChange={setSelectedStatusId}>
          <SelectTrigger className="w-full sm:w-40 h-8 text-sm bg-muted/40 border-border">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {workflowStatuses.map(s => (
              <SelectItem key={s.id} value={String(s.id)}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  {s.name}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-md px-3 py-1.5 w-full sm:w-auto">
          <Tag className="h-3.5 w-3.5 text-muted-foreground" />
          <TagSelector
            entityType="lead"
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
        {/* View toggle */}
        <div className="flex items-center bg-muted rounded-lg p-0.5">
          <Button
            variant="ghost" size="sm"
            onClick={() => setView('kanban')}
            className={cn("h-7 px-2 sm:px-3 text-xs rounded-md transition-all", view === 'kanban' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            <LayoutGrid className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.leads.views.kanban')}</span>
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => setView('table')}
            className={cn("h-7 px-2 sm:px-3 text-xs rounded-md transition-all", view === 'table' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}
          >
            <List className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">{t('crm.leads.views.list')}</span>
          </Button>
        </div>
      </div>

      {/* Transition Dialog */}
      {pendingDrop && (
        <TransitionDropDialog
          open={!!pendingDrop}
          transition={pendingDrop.transition}
          onClose={() => setPendingDrop(null)}
          onSubmit={submitTransitionDrop}
        />
      )}

      {/* Kanban View */}
      {view === 'kanban' && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-3 flex-1 overflow-x-auto pb-2">
            {workflowStatuses.map(status => (
              <div key={status.id} className="flex flex-col min-h-0 w-52 flex-shrink-0">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: status.color }} />
                    <span className="font-semibold text-xs text-foreground">{status.name}</span>
                  </div>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {leadsByStatus[status.id]?.length || 0}
                  </span>
                </div>
                <Droppable droppableId={String(status.id)}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={cn(
                        "flex-1 space-y-2 min-h-[200px] rounded-xl p-2 transition-all duration-200",
                        snapshot.isDraggingOver
                          ? "bg-primary/5 border-2 border-dashed border-primary/30"
                          : "bg-muted/30 border border-border"
                      )}
                    >
                      {leadsByStatus[status.id]?.map((lead, index) => (
                        <Draggable key={lead.id} draggableId={`lead-${lead.id}`} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={cn(
                                "rounded-lg border bg-card p-3 cursor-pointer transition-all duration-200",
                                snapshot.isDragging
                                  ? "shadow-xl ring-2 ring-primary/30 rotate-1 border-primary/20"
                                  : "hover:shadow-md hover:-translate-y-0.5 border-border"
                              )}
                              onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                            >
                              <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-muted"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <GripVertical className="h-3 w-3 text-muted-foreground" />
                                  </div>
                                  <span className="text-xs font-semibold text-foreground leading-tight">
                                    {lead.contact?.name || 'Unknown'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-0.5 bg-violet-500/10 px-1.5 py-0.5 rounded">
                                  <Star className="h-2.5 w-2.5 text-violet-500 fill-violet-500" />
                                  <span className="text-xs font-medium text-violet-600 dark:text-violet-400">{lead.score}</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground ml-5 truncate mb-1.5">{lead.contact?.email}</p>
                              {lead.deal_value && (
                                <div className="flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium ml-5">
                                  <DollarSign className="h-3 w-3 mr-0.5" />
                                  {lead.deal_value.toLocaleString()}
                                </div>
                              )}
                              {lead.source && (
                                <span className="ml-5 mt-1 inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                                  {lead.source}
                                </span>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                      {(leadsByStatus[status.id]?.length || 0) === 0 && (
                        <div className="flex flex-col items-center justify-center py-6 text-center">
                          <Target className="h-6 w-6 text-muted-foreground/30 mb-1" />
                          <p className="text-xs text-muted-foreground/60">No leads</p>
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
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 border-border hover:bg-muted/50">
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('crm.leads.fields.name')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">{t('crm.leads.fields.email')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('crm.leads.fields.stage')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">{t('crm.leads.fields.score')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">{t('crm.leads.fields.dealValue')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden md:table-cell">{t('crm.leads.fields.source')}</TableHead>
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground hidden sm:table-cell">{t('crm.common.status')}</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12">
                      <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-2xl bg-muted border border-border flex items-center justify-center">
                          <Users className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">{t('crm.leads.noLeads')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.18, delay: i * 0.025 }}
                      className="border-border row-hover-active cursor-pointer"
                      onClick={() => navigate(`/dashboard/crm/leads/${lead.id}`)}
                    >
                      <TableCell className="font-medium text-foreground">
                        <div className="min-w-0">
                          <span className="block truncate">{lead.contact?.name}</span>
                          <span className="text-xs text-muted-foreground truncate block sm:hidden">{lead.contact?.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{lead.contact?.email}</TableCell>
                      <TableCell>
                        {lead.status ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                            style={{ backgroundColor: lead.status.color }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                            {lead.status.name}
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <div className="flex items-center gap-1.5">
                          <Star className="h-3 w-3 fill-violet-400 text-violet-400" />
                          <span className="text-sm text-foreground">{lead.score}/100</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium text-sm hidden md:table-cell">
                        {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : '—'}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm hidden md:table-cell">{lead.source || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                          lead.qualification_status === 'qualified' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-muted border border-border text-muted-foreground')}>
                          {lead.qualification_status}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg hover:bg-muted" onClick={(e) => { e.stopPropagation(); handleQualifyLead(lead.id); }}>
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Lead Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="w-full max-w-2xl flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl font-bold text-foreground">
              {t('crm.leads.addLead')}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {t('crm.leads.createLeadDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-y-auto flex-1 pr-1">
          <Tabs value={createMode} onValueChange={(v) => setCreateMode(v as 'existing' | 'new')}>
            <TabsList className="grid w-full grid-cols-2 bg-muted">
              <TabsTrigger value="existing" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                {t('crm.leads.fromExistingContact')}
              </TabsTrigger>
              <TabsTrigger value="new" className="data-[state=active]:bg-card data-[state=active]:text-foreground">
                {t('crm.leads.newContact')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="existing" className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="contact">{t('crm.leads.selectContact')} <span className="text-red-500">*</span></Label>
                <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={openCombobox} className="w-full justify-between bg-background border-border">
                      {selectedContactId
                        ? availableContacts.find((c) => c.id.toString() === selectedContactId)?.name
                        : t('crm.leads.searchContacts')}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
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
                    className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source_existing">{t('crm.leads.fields.source')}</Label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes_existing">{t('crm.leads.fields.notes')}</Label>
                <Textarea id="notes_existing" placeholder={t('crm.leads.notesPlaceholder')} value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={3}
                  className="bg-background border-border" />
              </div>

              {leadCFDefs.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Fields</p>
                  {leadCFDefs.map(def => (
                    <div key={def.id} className="space-y-1">
                      <Label className="text-xs">{def.label}{def.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                      <CustomFieldInput
                        definition={def}
                        value={leadCF[def.name] ?? null}
                        onChange={v => setLeadCF(cf => ({ ...cf, [def.name]: v }))}
                        hierarchyNodes={leadHierarchyNodes}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setSelectedContactId(''); setNewLead({ name: '', email: '', phone_number: '', company: '', deal_value: '', source: '', notes: '' }); }}>
                  {t('crm.common.cancel')}
                </Button>
                <Button onClick={handleCreateLead} disabled={!selectedContactId}>
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
                    className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t('crm.leads.fields.email')} <span className="text-red-500">*</span></Label>
                  <Input id="email" type="email" placeholder="john@example.com" value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('crm.leads.fields.phone')}</Label>
                  <Input id="phone" placeholder="+1 234 567 8900" value={newLead.phone_number}
                    onChange={(e) => setNewLead({ ...newLead, phone_number: e.target.value })}
                    className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">{t('crm.leads.fields.company')}</Label>
                  <Input id="company" placeholder="Acme Inc." value={newLead.company}
                    onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                    className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deal_value">{t('crm.leads.fields.dealValue')} ($)</Label>
                  <Input id="deal_value" type="number" placeholder="10000" value={newLead.deal_value}
                    onChange={(e) => setNewLead({ ...newLead, deal_value: e.target.value })}
                    className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">{t('crm.leads.fields.source')}</Label>
                  <Select value={newLead.source} onValueChange={(value) => setNewLead({ ...newLead, source: value })}>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t('crm.leads.fields.notes')}</Label>
                <Textarea id="notes" placeholder={t('crm.leads.notesPlaceholder')} value={newLead.notes}
                  onChange={(e) => setNewLead({ ...newLead, notes: e.target.value })} rows={3}
                  className="bg-background border-border" />
              </div>

              {leadCFDefs.length > 0 && (
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Fields</p>
                  {leadCFDefs.map(def => (
                    <div key={def.id} className="space-y-1">
                      <Label className="text-xs">{def.label}{def.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                      <CustomFieldInput
                        definition={def}
                        value={leadCF[def.name] ?? null}
                        onChange={v => setLeadCF(cf => ({ ...cf, [def.name]: v }))}
                        hierarchyNodes={leadHierarchyNodes}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setCreateDialogOpen(false); setNewLead({ name: '', email: '', phone_number: '', company: '', deal_value: '', source: '', notes: '' }); }}>
                  {t('crm.common.cancel')}
                </Button>
                <Button onClick={handleCreateLead}>
                  <Plus className="h-4 w-4 mr-2" />{t('crm.leads.addLead')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      <CsvImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        mode="leads"
        onImported={fetchLeads}
      />
    </div>
  );
}

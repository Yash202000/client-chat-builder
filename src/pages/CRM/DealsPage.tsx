import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, DollarSign, TrendingUp, LayoutGrid, List,
  CircleDollarSign, X, Loader2, Building2, User, CalendarDays, Download,
  KanbanSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { downloadCsv } from '@/utils/csvExport';
import { CustomFieldInput, CustomFieldDefinition, HierarchyNodeOption } from '@/components/CustomFieldInput';

interface DealStage {
  id: number;
  name: string;
  probability: number;
  color: string;
  position: number;
}

interface Pipeline {
  id: number;
  name: string;
  is_default: boolean;
  stages: DealStage[];
}

interface WorkflowStatus {
  id: number;
  name: string;
  color: string;
  category: string;
  position: number;
  is_default: boolean;
}

interface WorkflowTransition {
  id: number;
  name: string;
  from_status_id?: number | null;
  to_status_id: number;
  screen_fields?: { field: string; label: string; required: boolean }[];
}

interface Deal {
  id: number;
  title: string;
  amount?: number;
  currency: string;
  status: 'open' | 'won' | 'lost';
  stage_id?: number;
  pipeline_id?: number;
  contact?: { id: number; name: string; email: string };
  account?: { id: number; name: string };
  owner?: { id: number; full_name: string };
  expected_close_date?: string;
  created_at: string;
  stage?: { id: number; name: string; probability: number; color: string };
  wf_status?: WorkflowStatus;
  available_transitions?: WorkflowTransition[];
}

interface ForecastByStage {
  stage_id: number;
  stage_name: string;
  probability: number;
  deal_count: number;
  total_value: number;
  weighted_value: number;
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

export default function DealsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [forecast, setForecast] = useState<ForecastByStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [createOpen, setCreateOpen] = useState(false);
  const [contacts, setContacts] = useState<{ id: number; name: string; email: string }[]>([]);
  const [accounts, setAccounts] = useState<{ id: number; name: string }[]>([]);

  // Workflow state
  const [workflowStatuses, setWorkflowStatuses] = useState<WorkflowStatus[]>([]);
  const [workflowTransitions, setWorkflowTransitions] = useState<WorkflowTransition[]>([]);
  const [pendingTransition, setPendingTransition] = useState<{ deal: Deal; toStatusId: number; transition?: WorkflowTransition } | null>(null);
  const [transitionFields, setTransitionFields] = useState<Record<string, string>>({});
  const [transitionSaving, setTransitionSaving] = useState(false);

  const [newDeal, setNewDeal] = useState({
    title: '', amount: '', currency: 'USD',
    contact_id: '', account_id: '', expected_close_date: '', description: '',
  });

  const [dealCF, setDealCF] = useState<Record<string, any>>({});
  const [dealCFDefs, setDealCFDefs] = useState<CustomFieldDefinition[]>([]);
  const [dealHierarchyNodes, setDealHierarchyNodes] = useState<HierarchyNodeOption[]>([]);

  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  useEffect(() => { fetchPipelines(); fetchWorkflow(); }, []);

  useEffect(() => {
    if (selectedPipeline) { fetchDeals(); fetchForecast(); }
  }, [selectedPipeline]);

  const fetchWorkflow = async () => {
    try {
      const res = await axios.get('/api/v1/deals/workflow', { headers });
      setWorkflowStatuses(res.data.statuses ?? []);
      setWorkflowTransitions(res.data.transitions ?? []);
    } catch {}
  };

  const fetchPipelines = async () => {
    try {
      const res = await axios.get('/api/v1/pipelines/', { headers });
      let pls: Pipeline[] = res.data;
      if (pls.length === 0) {
        const created = await axios.post('/api/v1/pipelines/', { name: 'Sales Pipeline', is_default: true }, { headers });
        pls = [created.data];
      }
      setPipelines(pls);
      setSelectedPipeline(pls.find(p => p.is_default) ?? pls[0]);
    } catch {
      toast({ title: t('common.error'), description: t('deals.loadFailed'), variant: 'destructive' });
    }
  };

  const fetchDeals = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/deals/', { headers, params: { limit: 200 } });
      setDeals(res.data);
    } catch {
      toast({ title: t('common.error'), description: t('deals.loadDealsFailed'), variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchForecast = async () => {
    if (!selectedPipeline) return;
    try {
      const res = await axios.get('/api/v1/deals/forecast', { headers, params: { pipeline_id: selectedPipeline.id } });
      setForecast(res.data.by_stage ?? []);
    } catch {}
  };

  const fetchContactsAndAccounts = async () => {
    try {
      const [cr, ar] = await Promise.all([
        axios.get('/api/v1/contacts/', { headers, params: { limit: 200 } }),
        axios.get('/api/v1/accounts/', { headers, params: { limit: 200 } }),
      ]);
      setContacts(cr.data);
      setAccounts(ar.data);
    } catch {}
  };

  const fetchDealCustomFields = async () => {
    try {
      const [cfRes, nodeRes] = await Promise.all([
        axios.get('/api/v1/custom-fields/', { headers, params: { entity_type: 'deal' } }),
        axios.get('/api/v1/hierarchy/nodes', { headers, params: { limit: 1000 } }),
      ]);
      setDealCFDefs(cfRes.data);
      setDealHierarchyNodes(nodeRes.data?.items ?? nodeRes.data ?? []);
    } catch {}
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const dealId = parseInt(result.draggableId);
    const toStatusId = parseInt(result.destination.droppableId);
    if (result.source.droppableId === result.destination.droppableId) return;

    const deal = deals.find(d => d.id === dealId);
    if (!deal) return;

    const fromStatusId = deal.wf_status?.id;
    const transition = workflowTransitions.find(t =>
      t.to_status_id === toStatusId && (t.from_status_id == null || t.from_status_id === fromStatusId)
    );

    if (transition?.screen_fields?.length) {
      setPendingTransition({ deal, toStatusId, transition });
      setTransitionFields({});
      return;
    }

    // Direct move — optimistic update
    const toStatus = workflowStatuses.find(s => s.id === toStatusId);
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, wf_status: toStatus } : d));
    try {
      if (transition) {
        await axios.post(`/api/v1/deals/${dealId}/transition`, { transition_id: transition.id }, { headers });
      } else {
        await axios.put(`/api/v1/deals/${dealId}`, { status_id: toStatusId }, { headers });
      }
    } catch {
      fetchDeals();
      toast({ title: t('common.error'), description: t('deals.moveFailed'), variant: 'destructive' });
    }
  };

  const submitTransition = async () => {
    if (!pendingTransition) return;
    setTransitionSaving(true);
    try {
      const { deal, transition } = pendingTransition;
      if (transition) {
        await axios.post(`/api/v1/deals/${deal.id}/transition`, {
          transition_id: transition.id,
          field_values: transitionFields,
        }, { headers });
      } else {
        await axios.put(`/api/v1/deals/${deal.id}`, { status_id: pendingTransition.toStatusId }, { headers });
      }
      setPendingTransition(null);
      fetchDeals();
    } catch {
      toast({ title: t('common.error'), description: t('deals.transitionFailed'), variant: 'destructive' });
    } finally {
      setTransitionSaving(false);
    }
  };

  const handleCreateDeal = async () => {
    if (!newDeal.title) return;
    try {
      const cfPayload: Record<string, any> = {};
      for (const [k, v] of Object.entries(dealCF)) {
        if (v !== null && v !== undefined && v !== '') cfPayload[k] = v;
      }
      await axios.post('/api/v1/deals/', {
        title: newDeal.title,
        amount: newDeal.amount ? parseFloat(newDeal.amount) : null,
        currency: newDeal.currency,
        pipeline_id: selectedPipeline?.id ?? null,
        stage_id: selectedPipeline?.stages?.[0]?.id ?? null,
        contact_id: newDeal.contact_id ? parseInt(newDeal.contact_id) : null,
        account_id: newDeal.account_id ? parseInt(newDeal.account_id) : null,
        expected_close_date: newDeal.expected_close_date || null,
        description: newDeal.description || null,
        custom_fields: Object.keys(cfPayload).length > 0 ? cfPayload : undefined,
      }, { headers });
      toast({ title: t('deals.dealCreated') });
      setCreateOpen(false);
      setNewDeal({ title: '', amount: '', currency: 'USD', contact_id: '', account_id: '', expected_close_date: '', description: '' });
      setDealCF({});
      fetchDeals();
    } catch {
      toast({ title: t('common.error'), description: t('deals.createFailed'), variant: 'destructive' });
    }
  };

  const filteredDeals = deals.filter(d =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
    d.contact?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const dealsByStatus = (statusId: number) => filteredDeals.filter(d => d.wf_status?.id === statusId);
  const unassigned = filteredDeals.filter(d => !d.wf_status);

  const handleExportDeals = () => {
    downloadCsv('deals.csv', filteredDeals as Record<string, any>[], [
      { key: 'title', label: t('deals.columns.title') },
      { key: 'amount', label: t('deals.columns.amount') },
      { key: 'currency', label: t('deals.columns.currency') },
      { key: 'status', label: t('deals.columns.status') },
      { key: 'wf_status.name', label: t('deals.columns.stage') },
      { key: 'contact.name', label: t('deals.columns.contact') },
      { key: 'account.name', label: t('deals.columns.account') },
      { key: 'expected_close_date', label: t('deals.columns.expectedCloseDate') },
      { key: 'created_at', label: t('deals.columns.createdAt') },
    ]);
  };

  const totalOpen = deals.filter(d => d.status === 'open').reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalWeighted = forecast.reduce((s, f) => s + f.weighted_value, 0);

  const kanbanColumns = workflowStatuses.length > 0
    ? workflowStatuses.sort((a, b) => a.position - b.position)
    : [];

  return (
    <div className="flex flex-col h-full app-surface">
      {/* Header */}
      <div className="border-b border-border px-4 sm:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between mb-3 sm:mb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t('deals.title')}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your sales pipeline</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9 px-3 text-sm" onClick={() => handleExportDeals()}>
              <Download className="h-4 w-4 sm:mr-1.5" /><span className="hidden sm:inline"> Export</span>
            </Button>
            <Button onClick={() => { setCreateOpen(true); fetchContactsAndAccounts(); fetchDealCustomFields(); setDealCF({}); }} className="gap-2">
              <Plus className="h-4 w-4" /><span className="hidden sm:inline"> New Deal</span>
            </Button>
          </div>
        </div>

        {/* Forecast strip */}
        {forecast.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4 sm:grid-cols-4">
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Open Pipeline</p>
              <p className="text-lg font-bold text-foreground">{fmtMoney(totalOpen)}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Weighted Value</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{fmtMoney(totalWeighted)}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Open Deals</p>
              <p className="text-lg font-bold text-foreground">{deals.filter(d => d.status === 'open').length}</p>
            </div>
            <div className="rounded-xl bg-card border border-border p-3">
              <p className="text-xs text-muted-foreground mb-1">Won This Period</p>
              <p className="text-lg font-bold text-foreground">{fmtMoney(deals.filter(d => d.status === 'won').reduce((s, d) => s + (d.amount ?? 0), 0))}</p>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-full sm:flex-1 sm:min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('deals.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background border-border w-full" />
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-border p-1 bg-card">
            <Button variant={view === 'kanban' ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 p-0 rounded-md"
              onClick={() => setView('kanban')}><LayoutGrid className="h-3.5 w-3.5" /></Button>
            <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 p-0 rounded-md"
              onClick={() => setView('table')}><List className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : view === 'kanban' ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-4 p-3 sm:p-6 flex-1 overflow-x-auto overflow-y-hidden">
              {kanbanColumns.map(col => {
                const colDeals = dealsByStatus(col.id);
                const colTotal = colDeals.reduce((s, d) => s + (d.amount ?? 0), 0);
                return (
                  <div key={col.id} className="flex flex-col w-72 shrink-0">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
                        <span className="font-semibold text-sm text-foreground">{col.name}</span>
                        <span className="text-xs text-muted-foreground bg-muted rounded-full px-1.5 py-0.5">{colDeals.length}</span>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{fmtMoney(colTotal)}</span>
                    </div>
                    <Droppable droppableId={col.id.toString()}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={cn(
                            'flex-1 rounded-xl p-2 space-y-2 min-h-32 transition-colors overflow-y-auto',
                            snapshot.isDraggingOver ? 'bg-muted/80' : 'bg-muted/30'
                          )}
                        >
                          <AnimatePresence>
                            {colDeals.map((deal, index) => (
                              <Draggable key={deal.id} draggableId={deal.id.toString()} index={index}>
                                {(provided, snapshot) => (
                                  <motion.div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.15 }}
                                    className={cn(
                                      'bg-card border border-border rounded-xl p-3 cursor-pointer shadow-sm hover:shadow-md transition-shadow',
                                      snapshot.isDragging && 'shadow-lg rotate-1 opacity-90'
                                    )}
                                    onClick={() => navigate(`/dashboard/crm/deals/${deal.id}`)}
                                  >
                                    <p className="font-medium text-sm text-foreground leading-snug mb-2 line-clamp-2">{deal.title}</p>
                                    {deal.amount != null && (
                                      <div className="flex items-center gap-1 mb-2">
                                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                          {fmtMoney(deal.amount, deal.currency)}
                                        </span>
                                      </div>
                                    )}
                                    <div className="space-y-1">
                                      {deal.contact && (
                                        <div className="flex items-center gap-1.5">
                                          <User className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground truncate">{deal.contact.name}</span>
                                        </div>
                                      )}
                                      {deal.account && (
                                        <div className="flex items-center gap-1.5">
                                          <Building2 className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground truncate">{deal.account.name}</span>
                                        </div>
                                      )}
                                      {deal.expected_close_date && (
                                        <div className="flex items-center gap-1.5">
                                          <CalendarDays className="h-3 w-3 text-muted-foreground" />
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(deal.expected_close_date).toLocaleDateString()}
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-border flex items-center justify-between">
                                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-medium', STATUS_COLORS[deal.status])}>
                                        {deal.status}
                                      </span>
                                      {deal.owner && (
                                        <span className="text-xs text-muted-foreground truncate max-w-20">{deal.owner.full_name}</span>
                                      )}
                                    </div>
                                  </motion.div>
                                )}
                              </Draggable>
                            ))}
                          </AnimatePresence>
                          {provided.placeholder}
                          {colDeals.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                              <CircleDollarSign className="h-6 w-6 text-muted-foreground/40 mb-2" />
                              <p className="text-xs text-muted-foreground">No deals</p>
                            </div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        ) : (
          /* Table view */
          <div className="p-3 sm:p-6 overflow-auto flex-1">
            <div className="rounded-xl border border-border overflow-hidden bg-card">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-muted-foreground font-medium">Deal</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Amount</TableHead>
                    <TableHead className="text-muted-foreground font-medium">Stage</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">Contact</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden sm:table-cell">Account</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Close Date</TableHead>
                    <TableHead className="text-muted-foreground font-medium hidden md:table-cell">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence>
                    {filteredDeals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="py-16">
                          <div className="flex flex-col items-center justify-center gap-3">
                            <KanbanSquare className="h-10 w-10 text-muted-foreground/30" />
                            <p className="text-base font-medium text-foreground">No deals found</p>
                            <p className="text-sm text-muted-foreground">Try adjusting your filters or create a new deal.</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-1"
                              onClick={() => { setCreateOpen(true); fetchContactsAndAccounts(); }}
                            >
                              <Plus className="h-3.5 w-3.5 mr-1.5" /> New Deal
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredDeals.map((deal, i) => (
                        <motion.tr key={deal.id}
                          initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                          transition={{ duration: 0.15, delay: i * 0.02 }}
                          className="border-border row-hover-active cursor-pointer"
                          onClick={() => navigate(`/dashboard/crm/deals/${deal.id}`)}
                        >
                          <TableCell className="font-medium text-foreground">{deal.title}</TableCell>
                          <TableCell className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {fmtMoney(deal.amount, deal.currency)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: deal.stage?.color }} />
                              <span className="text-sm text-foreground">{deal.stage?.name ?? '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{deal.contact?.name ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm hidden sm:table-cell">{deal.account?.name ?? '—'}</TableCell>
                          <TableCell className="text-muted-foreground text-sm hidden md:table-cell">
                            {deal.expected_close_date ? new Date(deal.expected_close_date).toLocaleDateString() : '—'}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <span className={cn('text-xs px-1.5 py-0.5 rounded-full border font-medium', STATUS_COLORS[deal.status])}>
                              {deal.status}
                            </span>
                          </TableCell>
                        </motion.tr>
                      ))
                    )}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* Create Deal Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="w-full max-w-lg flex flex-col max-h-[90vh]">
          <DialogHeader className="shrink-0">
            <DialogTitle className="text-xl font-bold text-foreground">New Deal</DialogTitle>
            <DialogDescription className="text-muted-foreground">Add a new deal to your pipeline</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 overflow-y-auto flex-1 pr-1">
            <div className="space-y-1.5">
              <Label>Title <span className="text-red-500">*</span></Label>
              <Input placeholder={t('deals.dealTitlePlaceholder')} value={newDeal.title}
                onChange={e => setNewDeal({ ...newDeal, title: e.target.value })}
                className="bg-background border-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Amount</Label>
                <Input type="number" placeholder="10000" value={newDeal.amount}
                  onChange={e => setNewDeal({ ...newDeal, amount: e.target.value })}
                  className="bg-background border-border" />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Select value={newDeal.currency} onValueChange={v => setNewDeal({ ...newDeal, currency: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {['USD', 'EUR', 'GBP', 'INR', 'AED'].map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Contact</Label>
                <Select value={newDeal.contact_id} onValueChange={v => setNewDeal({ ...newDeal, contact_id: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder={t('deals.selectContact')} /></SelectTrigger>
                  <SelectContent>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.name || c.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Account</Label>
                <Select value={newDeal.account_id} onValueChange={v => setNewDeal({ ...newDeal, account_id: v })}>
                  <SelectTrigger className="bg-background border-border"><SelectValue placeholder={t('deals.selectAccount')} /></SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Expected Close Date</Label>
              <Input type="date" value={newDeal.expected_close_date}
                onChange={e => setNewDeal({ ...newDeal, expected_close_date: e.target.value })}
                className="bg-background border-border" />
            </div>

            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder={t('deals.dealNotesPlaceholder')} value={newDeal.description} rows={3}
                onChange={e => setNewDeal({ ...newDeal, description: e.target.value })}
                className="bg-background border-border" />
            </div>

            {dealCFDefs.length > 0 && (
              <div className="space-y-3 pt-2 border-t">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Custom Fields</p>
                {dealCFDefs.map(def => (
                  <div key={def.id} className="space-y-1">
                    <Label className="text-xs">{def.label}{def.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                    <CustomFieldInput
                      definition={def}
                      value={dealCF[def.name] ?? null}
                      onChange={v => setDealCF(cf => ({ ...cf, [def.name]: v }))}
                      hierarchyNodes={dealHierarchyNodes}
                    />
                  </div>
                ))}
              </div>
            )}

          </div>
          <div className="shrink-0 flex justify-end gap-2 pt-3 border-t">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateDeal} disabled={!newDeal.title}>
              <Plus className="h-4 w-4 mr-2" /> Create Deal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transition dialog */}
      <Dialog open={!!pendingTransition} onOpenChange={() => setPendingTransition(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{pendingTransition?.transition?.name ?? t('deals.moveDeal')}</DialogTitle>
          </DialogHeader>
          {pendingTransition?.transition?.screen_fields?.map(f => (
            <div key={f.field} className="space-y-1.5">
              <Label className="text-sm">{f.label}{f.required && <span className="text-red-500 ml-1">*</span>}</Label>
              <Input
                value={transitionFields[f.field] ?? ''}
                onChange={e => setTransitionFields(p => ({ ...p, [f.field]: e.target.value }))}
                className="bg-background border-border"
              />
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setPendingTransition(null)}>Cancel</Button>
            <Button onClick={submitTransition} disabled={transitionSaving}>
              {transitionSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

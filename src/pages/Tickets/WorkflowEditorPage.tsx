import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import ReactFlow, {
  Node, Edge, Controls, Background, MiniMap, BackgroundVariant,
  useNodesState, useEdgesState, Connection,
  Handle, Position, NodeProps, EdgeProps, getBezierPath,
  EdgeLabelRenderer,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Plus, Settings2, Loader2, Trash2, Check,
  ArrowRight, Info, X, Search, Filter,
  GitBranch, Circle, CheckCircle2, Clock,
  Workflow as WorkflowIcon, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Status {
  id: number;
  name: string;
  color: string;
  category: 'todo' | 'in_progress' | 'done';
  position: number;
  is_default: boolean;
}

interface ScreenField { field: string; label: string; required: boolean; }

interface Transition {
  id: number;
  name: string;
  from_status_id?: number;
  to_status_id: number;
  from_status?: Status;
  to_status?: Status;
  screen_fields?: ScreenField[];
  post_actions?: Record<string, any>;
}

interface Workflow {
  id: number;
  name: string;
  description?: string;
  is_default: boolean;
  entity_type?: string | null;
  statuses: Status[];
  transitions: Transition[];
}

const ENTITY_BADGE: Record<string, { labelKey: string; className: string }> = {
  lead:    { labelKey: 'tickets.workflow.lead',    className: 'bg-muted text-muted-foreground dark:bg-white/10 dark:text-white/70' },
  deal:    { labelKey: 'tickets.workflow.deal',    className: 'bg-muted text-muted-foreground dark:bg-white/10 dark:text-white/70' },
  contact: { labelKey: 'tickets.workflow.contact', className: 'bg-muted text-muted-foreground dark:bg-white/10 dark:text-white/70' },
};

const STATUS_COLORS = [
  '#94a3b8', '#6366f1', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6',
];

const CATEGORY_META: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  todo:        { label: 'To Do',       icon: <Circle className="w-3 h-3" />,        color: 'text-slate-500' },
  in_progress: { label: 'In Progress', icon: <Clock className="w-3 h-3" />,         color: 'text-amber-500' },
  done:        { label: 'Done',        icon: <CheckCircle2 className="w-3 h-3" />,  color: 'text-emerald-500' },
};

// ── Custom status node ──────────────────────────────────────────────────────
function StatusNode({ data, selected }: NodeProps) {
  const { t } = useTranslation();
  const cat = CATEGORY_META[data.category] || CATEGORY_META.todo;

  return (
    <div className={cn(
      'relative min-w-[168px] rounded-xl border bg-white dark:bg-card overflow-hidden',
      'transition-all duration-150',
      selected
        ? 'border-foreground/30 shadow-[0_0_0_2px_hsl(var(--foreground)/0.12),0_4px_16px_rgb(0_0_0/0.12)]'
        : 'border-border shadow-[0_2px_8px_rgb(0_0_0/0.06),0_1px_2px_rgb(0_0_0/0.04)]',
      data.isDefault && 'ring-1 ring-emerald-400/60 ring-offset-1'
    )}>
      {/* Color band */}
      <div className="h-[3px] w-full" style={{ backgroundColor: data.color }} />

      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-white dark:!border-card"
        style={{ background: data.color, left: -6 }}
      />

      <div className="px-3.5 py-2.5">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
          <span className="font-semibold text-sm text-foreground leading-none truncate">{data.name}</span>
        </div>
        <div className={cn('flex items-center gap-1 text-[11px] font-medium', cat.color)}>
          {cat.icon}
          <span>{data.category === 'todo' ? t('tickets.workflow.todo') : data.category === 'in_progress' ? t('tickets.workflow.inProgress') : t('tickets.workflow.done')}</span>
        </div>
        {data.isDefault && (
          <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-full">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Default
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !rounded-full !border-2 !border-white dark:!border-card"
        style={{ background: data.color, right: -6 }}
      />
    </div>
  );
}

// ── Custom edge with floating pill label ────────────────────────────────────
function TransitionEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, label, style,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({ sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition });

  return (
    <>
      <path
        id={id}
        d={edgePath}
        fill="none"
        strokeWidth={1.5}
        stroke="hsl(var(--border))"
        style={style}
        className="react-flow__edge-path"
        markerEnd="url(#arrow)"
      />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`, pointerEvents: 'all' }}
          className="absolute nodrag nopan"
        >
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white dark:bg-card border border-border text-muted-foreground shadow-sm whitespace-nowrap">
            <ArrowRight className="w-2.5 h-2.5" />
            {label as string}
          </span>
        </div>
      </EdgeLabelRenderer>
    </>
  );
}

const nodeTypes = { status: StatusNode };
const edgeTypes = { transition: TransitionEdge };

const AVAILABLE_FIELDS: ScreenField[] = [
  { field: 'comment',       label: 'Comment',       required: false },
  { field: 'attachment',    label: 'Attachment',    required: false },
  { field: 'assignee_id',   label: 'Assignee',      required: false },
  { field: 'priority',      label: 'Priority',      required: false },
  { field: 'due_date',      label: 'Due Date',      required: false },
  { field: 'time_estimate', label: 'Time Estimate', required: false },
];

export default function WorkflowEditorPage() {
  const { t } = useTranslation();
  const [workflows, setWorkflows]             = useState<Workflow[]>([]);
  const [selectedWf, setSelectedWf]           = useState<Workflow | null>(null);
  const [loading, setLoading]                 = useState(true);
  const [wfSearch, setWfSearch]               = useState('');
  const [wfFilter, setWfFilter]               = useState<string | null>(null);
  const [saving, setSaving]                   = useState(false);
  const [nodes, setNodes, onNodesChange]      = useNodesState([]);
  const [edges, setEdges, onEdgesChange]      = useEdgesState([]);

  const [showAddStatus, setShowAddStatus]         = useState(false);
  const [showEditStatus, setShowEditStatus]       = useState(false);
  const [editingStatus, setEditingStatus]         = useState<Status | null>(null);
  const [showAddTransition, setShowAddTransition] = useState(false);
  const [showCreateWf, setShowCreateWf]           = useState(false);
  const [configuringTransition, setConfiguringTransition] = useState<Transition | null>(null);
  const [transitionConfig, setTransitionConfig]   = useState<{
    screen_fields: ScreenField[];
    post_actions: { assign_to: { type: string; value: string }; notify_watchers: boolean; };
  }>({ screen_fields: [], post_actions: { assign_to: { type: 'none', value: '' }, notify_watchers: false } });
  const [savingConfig, setSavingConfig] = useState(false);
  const [roles, setRoles]               = useState<{ id: number; name: string }[]>([]);

  const [statusForm, setStatusForm]         = useState({ name: '', color: '#6366f1', category: 'todo', is_default: false });
  const [transitionForm, setTransitionForm] = useState({ name: '', from_status_id: '', to_status_id: '' });
  const [wfForm, setWfForm]                 = useState({ name: '', description: '' });

  const headers = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/v1/tickets/workflows', { headers: headers() });
      setWorkflows(res.data);
      if (res.data.length > 0 && !selectedWf) {
        const def = res.data.find((w: Workflow) => w.is_default) || res.data[0];
        setSelectedWf(def);
      } else if (selectedWf) {
        const refreshed = res.data.find((w: Workflow) => w.id === selectedWf.id);
        if (refreshed) setSelectedWf(refreshed);
      }
    } catch { toast.error(t('tickets.workflow.loadFailed')); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!selectedWf) return;
    const sorted = [...selectedWf.statuses].sort((a, b) => a.position - b.position);
    const cols = Math.max(3, Math.ceil(Math.sqrt(sorted.length)));
    const newNodes: Node[] = sorted.map((s, i) => ({
      id: String(s.id),
      type: 'status',
      position: { x: (i % cols) * 240, y: Math.floor(i / cols) * 160 },
      data: { ...s, isDefault: s.is_default, onEdit: () => openEditStatus(s) },
    }));
    const newEdges: Edge[] = selectedWf.transitions.map(tr => ({
      id: String(tr.id),
      source: tr.from_status_id ? String(tr.from_status_id) : 'any',
      target: String(tr.to_status_id),
      label: tr.name,
      animated: false,
      type: 'transition',
      style: { stroke: 'hsl(var(--border))' },
    }));
    setNodes(newNodes);
    setEdges(newEdges);
  }, [selectedWf]);

  const onConnect = useCallback((connection: Connection) => {
    if (connection.source && connection.target) {
      setTransitionForm({ name: '', from_status_id: connection.source, to_status_id: connection.target });
      setShowAddTransition(true);
    }
  }, []);

  const openEditStatus = (s: Status) => {
    setEditingStatus(s);
    setStatusForm({ name: s.name, color: s.color, category: s.category, is_default: s.is_default });
    setShowEditStatus(true);
  };

  const saveStatus = async () => {
    if (!selectedWf || !statusForm.name.trim()) return;
    setSaving(true);
    try {
      if (editingStatus) {
        await axios.put(`/api/v1/tickets/workflows/statuses/${editingStatus.id}`, statusForm, { headers: headers() });
        toast.success(t('tickets.workflow.statusUpdated'));
        setShowEditStatus(false);
      } else {
        await axios.post(`/api/v1/tickets/workflows/${selectedWf.id}/statuses`, statusForm, { headers: headers() });
        toast.success(t('tickets.workflow.statusAdded'));
        setShowAddStatus(false);
      }
      load();
    } catch { toast.error('Failed to save status'); }
    finally { setSaving(false); }
  };

  const deleteStatus = async (statusId: number) => {
    if (!confirm('Delete this status? Tickets in this status will lose their status.')) return;
    try {
      await axios.delete(`/api/v1/tickets/workflows/statuses/${statusId}`, { headers: headers() });
      toast.success('Status deleted');
      load();
    } catch { toast.error('Failed to delete status'); }
  };

  const saveTransition = async () => {
    if (!selectedWf || !transitionForm.name.trim() || !transitionForm.to_status_id) return;
    setSaving(true);
    try {
      await axios.post(`/api/v1/tickets/workflows/${selectedWf.id}/transitions`, {
        name: transitionForm.name,
        from_status_id: transitionForm.from_status_id ? parseInt(transitionForm.from_status_id) : null,
        to_status_id: parseInt(transitionForm.to_status_id),
      }, { headers: headers() });
      toast.success('Transition added');
      setShowAddTransition(false);
      load();
    } catch { toast.error('Failed to save transition'); }
    finally { setSaving(false); }
  };

  const deleteTransition = async (transitionId: number) => {
    try {
      await axios.delete(`/api/v1/tickets/workflows/transitions/${transitionId}`, { headers: headers() });
      toast.success('Transition deleted');
      load();
    } catch { toast.error('Failed to delete transition'); }
  };

  const createWorkflow = async () => {
    if (!wfForm.name.trim()) return;
    try {
      await axios.post('/api/v1/tickets/workflows', wfForm, { headers: headers() });
      toast.success('Workflow created');
      setShowCreateWf(false);
      load();
    } catch { toast.error('Failed to create workflow'); }
  };

  const openTransitionConfig = async (tr: Transition) => {
    setConfiguringTransition(tr);
    setTransitionConfig({
      screen_fields: tr.screen_fields || [],
      post_actions: {
        assign_to: tr.post_actions?.assign_to || { type: 'none', value: '' },
        notify_watchers: tr.post_actions?.notify_watchers || false,
      },
    });
    if (roles.length === 0) {
      try {
        const res = await axios.get('/api/v1/roles/', { headers: headers() });
        setRoles(res.data || []);
      } catch { /* non-critical */ }
    }
  };

  const saveTransitionConfig = async () => {
    if (!configuringTransition) return;
    setSavingConfig(true);
    try {
      const pa = transitionConfig.post_actions;
      const isDefaultPostActions = pa.assign_to.type === 'none' && !pa.notify_watchers;
      await axios.put(`/api/v1/tickets/workflows/transitions/${configuringTransition.id}`, {
        screen_fields: transitionConfig.screen_fields.length > 0 ? transitionConfig.screen_fields : null,
        post_actions: isDefaultPostActions ? null : pa,
      }, { headers: headers() });
      toast.success('Transition config saved');
      setConfiguringTransition(null);
      load();
    } catch { toast.error('Failed to save config'); }
    finally { setSavingConfig(false); }
  };

  const toggleScreenField = (field: string) => {
    const existing = transitionConfig.screen_fields.find(f => f.field === field);
    if (existing) {
      setTransitionConfig(prev => ({ ...prev, screen_fields: prev.screen_fields.filter(f => f.field !== field) }));
    } else {
      const template = AVAILABLE_FIELDS.find(f => f.field === field)!;
      setTransitionConfig(prev => ({ ...prev, screen_fields: [...prev.screen_fields, { ...template }] }));
    }
  };

  const toggleFieldRequired = (field: string) => {
    setTransitionConfig(prev => ({
      ...prev,
      screen_fields: prev.screen_fields.map(f => f.field === field ? { ...f, required: !f.required } : f),
    }));
  };

  const deleteWorkflow = async (wf: Workflow) => {
    if (!confirm(`Delete workflow "${wf.name}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`/api/v1/tickets/workflows/${wf.id}`, { headers: headers() });
      toast.success('Workflow deleted');
      if (selectedWf?.id === wf.id) setSelectedWf(null);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to delete workflow');
    }
  };

  const categorizedStatuses = selectedWf
    ? (['todo', 'in_progress', 'done'] as const).map(cat => ({
        cat,
        meta: CATEGORY_META[cat],
        items: [...selectedWf.statuses].filter(s => s.category === cat).sort((a, b) => a.position - b.position),
      })).filter(g => g.items.length > 0)
    : [];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="flex h-full overflow-hidden">

      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div className="w-[268px] border-r border-border flex flex-col flex-shrink-0 bg-card">

        {/* Panel header */}
        <div className="px-4 pt-4 pb-3 border-b border-border/60 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-md bg-muted dark:bg-white/[0.09] border border-border dark:border-white/[0.07] flex items-center justify-center">
                <WorkflowIcon className="w-3.5 h-3.5 text-foreground/60 dark:text-white/70" />
              </div>
              <span className="text-sm font-semibold text-foreground">{t('tickets.workflow.workflowsTitle')}</span>
            </div>
            <button
              onClick={() => setShowCreateWf(true)}
              className="h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground row-hover-active transition-colors"
              title="New workflow"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t('tickets.workflow.searchPlaceholder')}
              value={wfSearch}
              onChange={e => setWfSearch(e.target.value)}
              className="h-7 pl-7 text-xs bg-muted/50 border-border/60 focus:bg-background"
            />
            {wfSearch && (
              <button onClick={() => setWfSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1 flex-wrap">
            {[
              { key: null,      label: t('tickets.workflow.filterAll') },
              { key: 'tickets', label: t('tickets.workflow.filterTickets') },
              { key: 'lead',    label: t('tickets.workflow.lead') },
              { key: 'deal',    label: t('tickets.workflow.deal') },
              { key: 'contact', label: t('tickets.workflow.contact') },
            ].map(({ key, label }) => (
              <button
                key={String(key)}
                onClick={() => setWfFilter(key)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors border',
                  wfFilter === key
                    ? 'bg-foreground text-background dark:bg-white dark:text-foreground border-transparent'
                    : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Workflow list */}
        <div className="px-2 py-2 space-y-0.5">
          {workflows
            .filter(wf => {
              if (wfSearch && !wf.name.toLowerCase().includes(wfSearch.toLowerCase())) return false;
              if (wfFilter === null) return true;
              if (wfFilter === 'tickets') return !wf.entity_type;
              return wf.entity_type === wfFilter;
            })
            .map(wf => {
              const isActive = selectedWf?.id === wf.id;
              return (
                <div key={wf.id}
                  className={cn(
                    'flex items-center gap-1 rounded-lg text-sm transition-colors group',
                    isActive ? 'team-channel-active' : 'row-hover-active'
                  )}>
                  <button onClick={() => setSelectedWf(wf)}
                    className="flex-1 text-left px-3 py-2 flex items-center gap-2.5 min-w-0">
                    <div className="h-7 w-7 rounded-md bg-muted dark:bg-white/[0.08] border border-border dark:border-white/[0.07] flex items-center justify-center flex-shrink-0">
                      <GitBranch className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-foreground truncate leading-tight">{wf.name}</p>
                      <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                        {wf.entity_type && ENTITY_BADGE[wf.entity_type] && (
                          <span className={cn('text-[9px] px-1.5 py-0 rounded-full font-medium leading-4', ENTITY_BADGE[wf.entity_type].className)}>
                            {t(ENTITY_BADGE[wf.entity_type].labelKey)}
                          </span>
                        )}
                        {!wf.entity_type && (
                          <span className="text-[9px] px-1.5 py-0 rounded-full font-medium leading-4 bg-muted text-muted-foreground">
                            {t('tickets.workflow.filterTickets')}
                          </span>
                        )}
                        {wf.is_default && (
                          <span className="text-[9px] px-1.5 py-0 rounded-full font-medium leading-4 bg-muted text-muted-foreground border border-border">
                            {t('tickets.workflow.default')}
                          </span>
                        )}
                      </div>
                    </div>
                    {isActive && <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
                  </button>
                  <button
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors mr-1.5 flex-shrink-0 rounded"
                    title={wf.is_default ? 'Cannot delete default workflow' : 'Delete workflow'}
                    disabled={wf.is_default}
                    onClick={e => { e.stopPropagation(); deleteWorkflow(wf); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
        </div>

        {/* ── Selected workflow detail ────────────────────────────────── */}
        {selectedWf && (
          <div className="flex-1 overflow-y-auto border-t border-border/60">

            {/* Statuses */}
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Statuses</span>
                <button
                  onClick={() => { setEditingStatus(null); setStatusForm({ name: '', color: '#6366f1', category: 'todo', is_default: false }); setShowAddStatus(true); }}
                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground row-hover-active"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3">
                {categorizedStatuses.map(({ cat, meta, items }) => (
                  <div key={cat}>
                    <div className={cn('flex items-center gap-1.5 mb-1.5 text-[10px] font-semibold uppercase tracking-wider', meta.color)}>
                      {meta.icon}
                      {meta.label}
                    </div>
                    <div className="space-y-1 pl-1">
                      {items.map(s => (
                        <div key={s.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/60 bg-background dark:bg-muted/20 group row-hover-active">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="text-xs flex-1 truncate text-foreground">{s.name}</span>
                          {s.is_default && (
                            <span className="text-[9px] text-emerald-600 font-semibold">default</span>
                          )}
                          <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 flex-shrink-0 transition-opacity">
                            <button
                              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                              onClick={() => openEditStatus(s)}
                            >
                              <Settings2 className="w-3 h-3" />
                            </button>
                            <button
                              className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => deleteStatus(s.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transitions */}
            <div className="px-4 pt-2 pb-4">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">Transitions</span>
                <button
                  onClick={() => { setTransitionForm({ name: '', from_status_id: '', to_status_id: '' }); setShowAddTransition(true); }}
                  className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground row-hover-active"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1">
                {selectedWf.transitions.map(tr => (
                  <div key={tr.id}
                    className="rounded-lg border border-border/60 bg-background dark:bg-muted/20 group overflow-hidden row-hover-active">
                    <div className="flex items-center gap-1.5 px-2.5 py-2">
                      <div className="flex items-center gap-1 flex-1 min-w-0">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tr.from_status?.color || '#94a3b8' }} />
                        <span className="text-[11px] text-muted-foreground truncate max-w-[52px]">
                          {tr.from_status?.name || <em className="not-italic opacity-60">Any</em>}
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 flex-shrink-0 text-muted-foreground/50" />
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tr.to_status?.color || '#6366f1' }} />
                        <span className="text-[11px] font-medium text-foreground truncate flex-1">{tr.name}</span>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 flex-shrink-0 transition-opacity">
                        <button
                          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                          title="Configure"
                          onClick={() => openTransitionConfig(tr)}
                        >
                          <Settings2 className="w-3 h-3" />
                        </button>
                        <button
                          className="h-5 w-5 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                          onClick={() => deleteTransition(tr.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {tr.screen_fields && tr.screen_fields.length > 0 && (
                      <div className="px-2.5 pb-1.5 flex flex-wrap gap-1">
                        {tr.screen_fields.map(sf => (
                          <span key={sf.field}
                            className={cn('px-1.5 py-0 rounded-full text-[9px] font-medium leading-4',
                              sf.required ? 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' : 'bg-muted text-muted-foreground')}>
                            {sf.label}{sf.required ? '*' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Hint */}
              <div className="mt-3 flex items-start gap-1.5 px-2.5 py-2 rounded-lg bg-muted/50 border border-border/40">
                <Info className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Drag from a status handle to another to quickly add a transition.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Canvas ──────────────────────────────────────────────────────── */}
      <div className="flex-1 relative bg-[#f8f9fb] dark:bg-[#0e0f11]">
        {selectedWf ? (
          <>
            {/* Canvas toolbar */}
            <div className="absolute top-3 left-3 right-3 z-10 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-card rounded-lg border border-border shadow-sm">
                <div className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-medium text-foreground">{selectedWf.name}</span>
                {selectedWf.is_default && (
                  <span className="text-[10px] px-1.5 rounded-full bg-muted text-muted-foreground border border-border">default</span>
                )}
                <span className="text-[10px] text-muted-foreground ml-1">
                  {selectedWf.statuses.length} statuses · {selectedWf.transitions.length} transitions
                </span>
              </div>
            </div>

            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              onNodeDoubleClick={(_, node) => {
                const status = selectedWf.statuses.find(s => String(s.id) === node.id);
                if (status) openEditStatus(status);
              }}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="hsl(var(--border))"
              />
              <Controls
                className="!border-border !bg-white dark:!bg-card !shadow-sm !rounded-lg overflow-hidden"
                showInteractive={false}
              />
              <MiniMap
                nodeColor={n => n.data?.color || '#94a3b8'}
                className="!border-border !bg-white dark:!bg-card !rounded-lg overflow-hidden"
                maskColor="hsl(var(--muted) / 0.7)"
              />
            </ReactFlow>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <div className="h-12 w-12 rounded-xl bg-muted border border-border flex items-center justify-center">
              <WorkflowIcon className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Select a workflow to edit</p>
            <p className="text-xs text-muted-foreground">Choose from the sidebar or create a new one</p>
          </div>
        )}
      </div>

      {/* ── Add/Edit Status Dialog ──────────────────────────────────────── */}
      <Dialog open={showAddStatus || showEditStatus}
        onOpenChange={() => { setShowAddStatus(false); setShowEditStatus(false); setEditingStatus(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingStatus ? 'Edit Status' : 'Add Status'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name</Label>
              <Input value={statusForm.name} onChange={e => setStatusForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={statusForm.category} onValueChange={v => setStatusForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(['todo', 'in_progress', 'done'] as const).map(v => (
                    <SelectItem key={v} value={v}>
                      <span className={cn('flex items-center gap-2', CATEGORY_META[v].color)}>
                        {CATEGORY_META[v].icon}
                        {CATEGORY_META[v].label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_COLORS.map(c => (
                  <button key={c} type="button"
                    className={cn('w-6 h-6 rounded-full transition-transform', statusForm.color === c ? 'scale-125 ring-2 ring-offset-1 ring-foreground' : 'hover:scale-110')}
                    style={{ backgroundColor: c }}
                    onClick={() => setStatusForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-lg border border-border bg-muted/30">
              <input type="checkbox" id="is_default" checked={statusForm.is_default}
                onChange={e => setStatusForm(f => ({ ...f, is_default: e.target.checked }))}
                className="rounded" />
              <Label htmlFor="is_default" className="text-xs cursor-pointer text-foreground">
                Set as default — new tickets start here
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowAddStatus(false); setShowEditStatus(false); setEditingStatus(null); }}>Cancel</Button>
            <Button onClick={saveStatus} disabled={saving || !statusForm.name.trim()}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              <span className="ml-1.5">Save</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add Transition Dialog ───────────────────────────────────────── */}
      <Dialog open={showAddTransition} onOpenChange={setShowAddTransition}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Transition</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name</Label>
              <Input placeholder="e.g. Start Progress" value={transitionForm.name}
                onChange={e => setTransitionForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">From Status <span className="text-muted-foreground font-normal">(leave empty = any)</span></Label>
              <Select value={transitionForm.from_status_id || '__any__'}
                onValueChange={v => setTransitionForm(f => ({ ...f, from_status_id: v === '__any__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Any status</SelectItem>
                  {selectedWf?.statuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">To Status <span className="text-destructive">*</span></Label>
              <Select value={transitionForm.to_status_id}
                onValueChange={v => setTransitionForm(f => ({ ...f, to_status_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  {selectedWf?.statuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTransition(false)}>Cancel</Button>
            <Button onClick={saveTransition} disabled={saving || !transitionForm.name.trim() || !transitionForm.to_status_id}>
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Add Transition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Create Workflow Dialog ──────────────────────────────────────── */}
      <Dialog open={showCreateWf} onOpenChange={setShowCreateWf}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
          <div className="space-y-4 py-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Bug Workflow" value={wfForm.name}
                onChange={e => setWfForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
              <Input placeholder="Short description…" value={wfForm.description}
                onChange={e => setWfForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWf(false)}>Cancel</Button>
            <Button onClick={createWorkflow} disabled={!wfForm.name.trim()}>Create Workflow</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Transition Config Dialog ────────────────────────────────────── */}
      <Dialog open={!!configuringTransition} onOpenChange={v => { if (!v) setConfiguringTransition(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-muted border border-border flex items-center justify-center flex-shrink-0">
                <Settings2 className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <span className="block text-sm font-semibold truncate">Configure: {configuringTransition?.name}</span>
              </div>
              {configuringTransition?.to_status && (
                <span className="ml-auto flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: configuringTransition.to_status.color }}>
                  <ArrowRight className="w-2.5 h-2.5" />
                  {configuringTransition.to_status.name}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="screen">
            <TabsList className="w-full">
              <TabsTrigger value="screen" className="flex-1">Screen Fields</TabsTrigger>
              <TabsTrigger value="post" className="flex-1">Post Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="screen" className="space-y-3 pt-3">
              <p className="text-xs text-muted-foreground">Fields shown in the transition dialog. Mark required fields with *.</p>
              <div className="space-y-2">
                {AVAILABLE_FIELDS.map(af => {
                  const active = transitionConfig.screen_fields.find(f => f.field === af.field);
                  return (
                    <div key={af.field} className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      active ? 'border-foreground/20 bg-muted/30' : 'border-border bg-background'
                    )}>
                      <Switch checked={!!active} onCheckedChange={() => toggleScreenField(af.field)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{af.label}</p>
                        <p className="text-xs text-muted-foreground">{af.field.replace(/_/g, ' ')} field</p>
                      </div>
                      {active && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor={`req-${af.field}`}>Required</Label>
                          <Switch id={`req-${af.field}`} checked={active.required} onCheckedChange={() => toggleFieldRequired(af.field)} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="post" className="space-y-4 pt-3">
              <p className="text-xs text-muted-foreground">Actions automatically applied after this transition completes.</p>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Auto-assign ticket to</Label>
                <Select
                  value={transitionConfig.post_actions.assign_to.type}
                  onValueChange={v => setTransitionConfig(prev => ({
                    ...prev,
                    post_actions: { ...prev.post_actions, assign_to: { type: v, value: '' } }
                  }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No change</SelectItem>
                    <SelectItem value="reporter">Reporter (ticket creator)</SelectItem>
                    <SelectItem value="role">Specific role</SelectItem>
                    <SelectItem value="unassign">Unassign</SelectItem>
                  </SelectContent>
                </Select>

                {transitionConfig.post_actions.assign_to.type === 'role' && (
                  roles.length > 0 ? (
                    <Select
                      value={transitionConfig.post_actions.assign_to.value}
                      onValueChange={v => setTransitionConfig(prev => ({
                        ...prev,
                        post_actions: { ...prev.post_actions, assign_to: { ...prev.post_actions.assign_to, value: v } }
                      }))}>
                      <SelectTrigger><SelectValue placeholder="Select role…" /></SelectTrigger>
                      <SelectContent>
                        {roles.map(r => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Role name (e.g. agent, support)"
                      value={transitionConfig.post_actions.assign_to.value}
                      onChange={e => setTransitionConfig(prev => ({
                        ...prev,
                        post_actions: { ...prev.post_actions, assign_to: { ...prev.post_actions.assign_to, value: e.target.value } }
                      }))}
                    />
                  )
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Notify watchers</p>
                  <p className="text-xs text-muted-foreground">Send notification to all ticket watchers</p>
                </div>
                <Switch
                  checked={transitionConfig.post_actions.notify_watchers}
                  onCheckedChange={v => setTransitionConfig(prev => ({
                    ...prev,
                    post_actions: { ...prev.post_actions, notify_watchers: v }
                  }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => setConfiguringTransition(null)}>Cancel</Button>
            <Button onClick={saveTransitionConfig} disabled={savingConfig}>
              {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Save Config
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

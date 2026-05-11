import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import ReactFlow, {
  Node, Edge, Controls, Background, MiniMap,
  useNodesState, useEdgesState, Connection,
  Handle, Position, NodeProps,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Plus, Settings2, Loader2, Trash2, Check,
  ArrowRight, Info, X, GripVertical, Search, Filter,
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

const ENTITY_BADGE: Record<string, { label: string; className: string }> = {
  lead: { label: 'Lead', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  deal: { label: 'Deal', className: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  contact: { label: 'Contact', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
};

const STATUS_COLORS = [
  '#94a3b8', '#6366f1', '#8b5cf6', '#ec4899',
  '#ef4444', '#f97316', '#f59e0b', '#22c55e',
  '#06b6d4', '#3b82f6',
];

const CATEGORY_LABELS: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
};

// Custom node component for status
function StatusNode({ data, selected }: NodeProps) {
  return (
    <div className={cn(
      'px-4 py-3 rounded-lg border-2 bg-background shadow-sm min-w-[140px] text-center transition-all',
      selected ? 'border-primary shadow-md' : 'border-border',
      data.isDefault && 'ring-2 ring-offset-1 ring-green-400'
    )}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-muted-foreground" />
      <div className="flex items-center justify-center gap-2">
        <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: data.color }} />
        <span className="font-medium text-sm">{data.name}</span>
      </div>
      <div className="text-xs text-muted-foreground mt-0.5 capitalize">{CATEGORY_LABELS[data.category]}</div>
      {data.isDefault && (
        <div className="text-xs text-green-600 font-medium mt-0.5">Default</div>
      )}
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-muted-foreground" />
    </div>
  );
}

const nodeTypes = { status: StatusNode };

const AVAILABLE_FIELDS: ScreenField[] = [
  { field: 'comment', label: 'Comment', required: false },
  { field: 'attachment', label: 'Attachment', required: false },
  { field: 'assignee_id', label: 'Assignee', required: false },
  { field: 'priority', label: 'Priority', required: false },
  { field: 'due_date', label: 'Due Date', required: false },
  { field: 'time_estimate', label: 'Time Estimate', required: false },
];

export default function WorkflowEditorPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [selectedWf, setSelectedWf] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [wfSearch, setWfSearch] = useState('');
  const [wfFilter, setWfFilter] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Dialogs
  const [showAddStatus, setShowAddStatus] = useState(false);
  const [showEditStatus, setShowEditStatus] = useState(false);
  const [editingStatus, setEditingStatus] = useState<Status | null>(null);
  const [showAddTransition, setShowAddTransition] = useState(false);
  const [showCreateWf, setShowCreateWf] = useState(false);
  const [configuringTransition, setConfiguringTransition] = useState<Transition | null>(null);
  const [transitionConfig, setTransitionConfig] = useState<{
    screen_fields: ScreenField[];
    post_actions: { assign_to: { type: string; value: string }; notify_watchers: boolean; };
  }>({ screen_fields: [], post_actions: { assign_to: { type: 'none', value: '' }, notify_watchers: false } });
  const [savingConfig, setSavingConfig] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);

  const [statusForm, setStatusForm] = useState({ name: '', color: '#6366f1', category: 'todo', is_default: false });
  const [transitionForm, setTransitionForm] = useState({ name: '', from_status_id: '', to_status_id: '' });
  const [wfForm, setWfForm] = useState({ name: '', description: '' });

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
    } catch { toast.error('Failed to load workflows'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Build ReactFlow graph whenever selectedWf changes
  useEffect(() => {
    if (!selectedWf) return;
    const sorted = [...selectedWf.statuses].sort((a, b) => a.position - b.position);
    const cols = Math.ceil(Math.sqrt(sorted.length));
    const newNodes: Node[] = sorted.map((s, i) => ({
      id: String(s.id),
      type: 'status',
      position: { x: (i % cols) * 220, y: Math.floor(i / cols) * 140 },
      data: { ...s, isDefault: s.is_default, onEdit: () => openEditStatus(s) },
    }));
    const newEdges: Edge[] = selectedWf.transitions.map(t => ({
      id: String(t.id),
      source: t.from_status_id ? String(t.from_status_id) : 'any',
      target: String(t.to_status_id),
      label: t.name,
      animated: false,
      style: { stroke: '#94a3b8' },
      labelStyle: { fontSize: 10, fill: '#64748b' },
      labelBgStyle: { fill: '#f8fafc' },
      type: 'smoothstep',
    }));
    setNodes(newNodes);
    setEdges(newEdges);
  }, [selectedWf]);

  const onConnect = useCallback((connection: Connection) => {
    // Opening add transition dialog pre-filled
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
        toast.success('Status updated');
        setShowEditStatus(false);
      } else {
        await axios.post(`/api/v1/tickets/workflows/${selectedWf.id}/statuses`, statusForm, { headers: headers() });
        toast.success('Status added');
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

  const openTransitionConfig = async (t: Transition) => {
    setConfiguringTransition(t);
    setTransitionConfig({
      screen_fields: t.screen_fields || [],
      post_actions: {
        assign_to: t.post_actions?.assign_to || { type: 'none', value: '' },
        notify_watchers: t.post_actions?.notify_watchers || false,
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
      const isDefaultPostActions =
        pa.assign_to.type === 'none' && !pa.notify_watchers;

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

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="flex h-full">
      {/* Left panel: workflow list + status list */}
      <div className="w-72 border-r flex flex-col flex-shrink-0">
        <div className="p-4 border-b space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Workflows</h2>
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowCreateWf(true)}>
              <Plus className="w-3 h-3 mr-1" />New
            </Button>
          </div>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search workflows…"
              value={wfSearch}
              onChange={e => setWfSearch(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
            {wfSearch && (
              <button onClick={() => setWfSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          {/* Filter chips */}
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="w-3 h-3 text-muted-foreground shrink-0" />
            {[
              { key: null, label: 'All' },
              { key: 'tickets', label: 'Tickets' },
              { key: 'lead', label: 'Lead' },
              { key: 'deal', label: 'Deal' },
              { key: 'contact', label: 'Contact' },
            ].map(({ key, label }) => (
              <button
                key={String(key)}
                onClick={() => setWfFilter(key)}
                className={cn(
                  'text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors border',
                  wfFilter === key
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-muted text-muted-foreground border-transparent hover:border-border'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="space-y-1">
            {workflows
              .filter(wf => {
                if (wfSearch && !wf.name.toLowerCase().includes(wfSearch.toLowerCase())) return false;
                if (wfFilter === null) return true;
                if (wfFilter === 'tickets') return !wf.entity_type;
                return wf.entity_type === wfFilter;
              })
              .map(wf => (
              <div key={wf.id}
                className={cn(
                  'flex items-center gap-1 rounded-md text-sm transition-colors group',
                  selectedWf?.id === wf.id ? 'bg-accent' : 'hover:bg-muted'
                )}>
                <button onClick={() => setSelectedWf(wf)}
                  className="flex-1 text-left px-3 py-2 flex flex-col gap-0.5 min-w-0">
                  <span className="truncate font-medium">{wf.name}</span>
                  <div className="flex items-center gap-1 flex-wrap">
                    {wf.entity_type && ENTITY_BADGE[wf.entity_type] && (
                      <span className={cn('text-[10px] px-1.5 py-0 rounded-full font-medium leading-4', ENTITY_BADGE[wf.entity_type].className)}>
                        {ENTITY_BADGE[wf.entity_type].label}
                      </span>
                    )}
                    {!wf.entity_type && (
                      <span className="text-[10px] px-1.5 py-0 rounded-full font-medium leading-4 bg-muted text-muted-foreground">
                        Tickets
                      </span>
                    )}
                    {wf.is_default && <Badge variant="secondary" className="text-[10px] h-4 px-1.5 shrink-0">Default</Badge>}
                  </div>
                </button>
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive shrink-0 mr-1"
                  title={wf.is_default ? 'Cannot delete the default workflow' : 'Delete workflow'}
                  disabled={wf.is_default}
                  onClick={e => { e.stopPropagation(); deleteWorkflow(wf); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {selectedWf && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Statuses</h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                onClick={() => {
                  setEditingStatus(null);
                  setStatusForm({ name: '', color: '#6366f1', category: 'todo', is_default: false });
                  setShowAddStatus(true);
                }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {[...selectedWf.statuses].sort((a, b) => a.position - b.position).map(s => (
                <div key={s.id} className="flex items-center gap-2 p-2 rounded-md border bg-background group hover:bg-muted/50">
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-sm flex-1 truncate">{s.name}</span>
                  {s.is_default && <span className="text-xs text-green-600">default</span>}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-0.5">
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => openEditStatus(s)}>
                      <Settings2 className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive" onClick={() => deleteStatus(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <h3 className="text-sm font-medium">Transitions</h3>
              <Button size="sm" variant="ghost" className="h-6 w-6 p-0"
                onClick={() => { setTransitionForm({ name: '', from_status_id: '', to_status_id: '' }); setShowAddTransition(true); }}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="space-y-1.5">
              {selectedWf.transitions.map(t => (
                <div key={t.id} className="rounded-md border bg-background group hover:bg-muted/30 text-xs overflow-hidden">
                  <div className="flex items-center gap-1.5 p-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.from_status?.color || '#94a3b8' }} />
                    <span className="text-muted-foreground truncate max-w-[60px]">
                      {t.from_status?.name || <span className="italic">Any</span>}
                    </span>
                    <ArrowRight className="w-3 h-3 flex-shrink-0 text-muted-foreground" />
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: t.to_status?.color || '#6366f1' }} />
                    <span className="truncate font-medium flex-1">{t.name}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-5 w-5"
                        title="Configure screen fields & post-actions"
                        onClick={() => openTransitionConfig(t)}>
                        <Settings2 className="w-3 h-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive"
                        onClick={() => deleteTransition(t.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {/* badges for configured screen fields */}
                  {t.screen_fields && t.screen_fields.length > 0 && (
                    <div className="px-2 pb-1.5 flex flex-wrap gap-1">
                      {t.screen_fields.map(sf => (
                        <span key={sf.field}
                          className={cn('px-1.5 py-0.5 rounded text-[10px]',
                            sf.required ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground')}>
                          {sf.label}{sf.required ? '*' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  {t.post_actions?.assign_to?.type && t.post_actions.assign_to.type !== 'none' && (
                    <div className="px-2 pb-1.5">
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                        → assign to {t.post_actions.assign_to.type}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="pt-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2 flex gap-1.5">
              <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              Drag from a status handle to another to add a transition
            </div>
          </div>
        )}
      </div>

      {/* Right: ReactFlow canvas */}
      <div className="flex-1 relative">
        {selectedWf ? (
          <ReactFlow
            nodes={nodes} edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            onNodeDoubleClick={(_, node) => {
              const status = selectedWf.statuses.find(s => String(s.id) === node.id);
              if (status) openEditStatus(status);
            }}>
            <Background />
            <Controls />
            <MiniMap nodeColor={n => n.data?.color || '#6366f1'} />
          </ReactFlow>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Select a workflow to edit
          </div>
        )}
      </div>

      {/* Add/Edit Status Dialog */}
      <Dialog open={showAddStatus || showEditStatus}
        onOpenChange={open => { setShowAddStatus(false); setShowEditStatus(false); setEditingStatus(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingStatus ? 'Edit Status' : 'Add Status'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label className="text-xs">Name</Label>
              <Input value={statusForm.name} onChange={e => setStatusForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1"><Label className="text-xs">Category</Label>
              <Select value={statusForm.category} onValueChange={v => setStatusForm(f => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CATEGORY_LABELS).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Color</Label>
              <div className="flex gap-2 flex-wrap">
                {STATUS_COLORS.map(c => (
                  <button key={c} type="button"
                    className={cn('w-6 h-6 rounded-full transition-transform', statusForm.color === c ? 'scale-125 ring-2 ring-offset-1 ring-foreground' : 'hover:scale-110')}
                    style={{ backgroundColor: c }}
                    onClick={() => setStatusForm(f => ({ ...f, color: c }))} />
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="is_default" checked={statusForm.is_default}
                onChange={e => setStatusForm(f => ({ ...f, is_default: e.target.checked }))} />
              <Label htmlFor="is_default" className="text-xs cursor-pointer">Set as default (new tickets start here)</Label>
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

      {/* Add Transition Dialog */}
      <Dialog open={showAddTransition} onOpenChange={setShowAddTransition}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Add Transition</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label className="text-xs">Name</Label>
              <Input placeholder="e.g. Start Progress" value={transitionForm.name}
                onChange={e => setTransitionForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1"><Label className="text-xs">From Status (leave empty = any)</Label>
              <Select value={transitionForm.from_status_id || '__any__'}
                onValueChange={v => setTransitionForm(f => ({ ...f, from_status_id: v === '__any__' ? '' : v }))}>
                <SelectTrigger><SelectValue placeholder="Any status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__any__">Any status</SelectItem>
                  {selectedWf?.statuses.map(s => <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">To Status *</Label>
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
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-1" />}Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Workflow Dialog */}
      <Dialog open={showCreateWf} onOpenChange={setShowCreateWf}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>Create Workflow</DialogTitle></DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1"><Label className="text-xs">Name *</Label>
              <Input placeholder="e.g. Bug Workflow" value={wfForm.name}
                onChange={e => setWfForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            </div>
            <div className="space-y-1"><Label className="text-xs">Description</Label>
              <Input placeholder="Optional" value={wfForm.description}
                onChange={e => setWfForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateWf(false)}>Cancel</Button>
            <Button onClick={createWorkflow} disabled={!wfForm.name.trim()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transition Config Dialog */}
      <Dialog open={!!configuringTransition} onOpenChange={v => { if (!v) setConfiguringTransition(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="w-4 h-4" />
              Configure: {configuringTransition?.name}
              {configuringTransition?.to_status && (
                <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: configuringTransition.to_status.color }}>
                  → {configuringTransition.to_status.name}
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
              <p className="text-xs text-muted-foreground">
                Fields shown in the transition dialog. Mark required fields with *.
              </p>
              <div className="space-y-2">
                {AVAILABLE_FIELDS.map(af => {
                  const active = transitionConfig.screen_fields.find(f => f.field === af.field);
                  return (
                    <div key={af.field} className={cn(
                      'flex items-center gap-3 p-3 rounded-lg border transition-colors',
                      active ? 'border-primary/50 bg-primary/5' : 'border-border bg-background'
                    )}>
                      <Switch checked={!!active} onCheckedChange={() => toggleScreenField(af.field)} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{af.label}</p>
                        <p className="text-xs text-muted-foreground capitalize">{af.field.replace('_', ' ')} field</p>
                      </div>
                      {active && (
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor={`req-${af.field}`}>
                            Required
                          </Label>
                          <Switch
                            id={`req-${af.field}`}
                            checked={active.required}
                            onCheckedChange={() => toggleFieldRequired(af.field)}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            <TabsContent value="post" className="space-y-4 pt-3">
              <p className="text-xs text-muted-foreground">
                Actions automatically applied after this transition completes.
              </p>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Auto-assign ticket to</Label>
                <Select
                  value={transitionConfig.post_actions.assign_to.type}
                  onValueChange={v => setTransitionConfig(prev => ({
                    ...prev,
                    post_actions: { ...prev.post_actions, assign_to: { type: v, value: '' } }
                  }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
                        post_actions: {
                          ...prev.post_actions,
                          assign_to: { ...prev.post_actions.assign_to, value: v }
                        }
                      }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role…" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(r => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      placeholder="Role name (e.g. agent, support)"
                      className="text-sm"
                      value={transitionConfig.post_actions.assign_to.value}
                      onChange={e => setTransitionConfig(prev => ({
                        ...prev,
                        post_actions: {
                          ...prev.post_actions,
                          assign_to: { ...prev.post_actions.assign_to, value: e.target.value }
                        }
                      }))}
                    />
                  )
                )}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border">
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

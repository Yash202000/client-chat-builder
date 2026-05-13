import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Edit2, GripVertical, ChevronRight, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import HierarchyNodePicker from '@/components/HierarchyNodePicker';

const ENTITY_TAB_KEYS = [
  { key: 'ticket', tKey: 'routingRules.entities.ticket' },
  { key: 'lead', tKey: 'routingRules.entities.lead' },
  { key: 'deal', tKey: 'routingRules.entities.deal' },
];

const OPERATORS = [
  { value: 'eq', label: 'equals' },
  { value: 'neq', label: 'not equals' },
  { value: 'in', label: 'is one of' },
  { value: 'not_in', label: 'is not one of' },
  { value: 'contains', label: 'contains' },
  { value: 'gte', label: '≥' },
  { value: 'lte', label: '≤' },
  { value: 'exists', label: 'is set' },
  { value: 'not_exists', label: 'is not set' },
];

const ACTION_TYPE_KEYS = [
  { value: 'assign_to_user', tKey: 'routingRules.actions.assign_to_user' },
  { value: 'assign_by_role', tKey: 'routingRules.actions.assign_by_role' },
  { value: 'assign_round_robin', tKey: 'routingRules.actions.assign_round_robin' },
  { value: 'assign_by_skill', tKey: 'routingRules.actions.assign_by_skill' },
  { value: 'assign_by_node_match', tKey: 'routingRules.actions.assign_by_node_match' },
  { value: 'assign_by_department', tKey: 'routingRules.actions.assign_by_department' },
  { value: 'no_action', tKey: 'routingRules.actions.no_action' },
];

const DEPT_ROLES = ['agent', 'supervisor', 'approver', 'manager'];

const TRIGGER_OPTION_KEYS = [
  { value: 'on_create', tKey: 'routingRules.triggers.on_create' },
  { value: 'on_transition', tKey: 'routingRules.triggers.on_transition' },
  { value: 'both', tKey: 'routingRules.triggers.both' },
];

const COMMON_FIELD_KEYS: Record<string, { value: string; tKey: string }[]> = {
  ticket: [
    { value: 'priority', tKey: 'routingRules.conditions.priority' },
    { value: 'issue_type_id', tKey: 'routingRules.conditions.issue_type_id' },
    { value: 'labels', tKey: 'routingRules.conditions.labels' },
    { value: 'custom_fields.department', tKey: 'routingRules.conditions.department' },
  ],
  lead: [
    { value: 'source', tKey: 'routingRules.conditions.source' },
    { value: 'score', tKey: 'routingRules.conditions.score' },
    { value: 'qualification_status', tKey: 'routingRules.conditions.qualification_status' },
    { value: 'custom_fields.tier', tKey: 'routingRules.conditions.tier' },
  ],
  deal: [
    { value: 'status', tKey: 'routingRules.conditions.status' },
    { value: 'amount', tKey: 'routingRules.conditions.amount' },
    { value: 'custom_fields.region', tKey: 'routingRules.conditions.region' },
  ],
};

interface Condition { field: string; operator: string; value?: any }
interface RoutingRule {
  id: number;
  entity_type: string;
  name: string;
  priority: number;
  trigger: string;
  trigger_transition_id?: number;
  conditions?: Condition[];
  action_type: string;
  action_config?: Record<string, any>;
  is_active: boolean;
}
interface User { id: number; full_name: string; email: string }
interface Team { id: number; name: string }
interface HierarchyType { id: number; name: string }
interface HierarchyNode { id: number; name: string; code: string; type_id: number; path: string }
interface CustomFieldDef { id: number; name: string; label: string; entity_type: string }
interface WorkflowTransition { id: number; name: string; workflow_id: number; workflowName: string }

const emptyForm = {
  entity_type: 'ticket',
  name: '',
  priority: 0,
  trigger: 'on_create',
  trigger_transition_id: undefined as number | undefined,
  conditions: [] as Condition[],
  action_type: 'assign_to_user',
  action_config: {} as Record<string, any>,
  is_active: true,
};

// ── TransitionPicker ─────────────────────────────────────────────────────────

interface TransitionPickerProps {
  allTransitions: WorkflowTransition[];
  workflowFilter: number | null;
  onWorkflowFilterChange: (id: number | null) => void;
  value: number | null;
  onChange: (id: number | null) => void;
}

function TransitionPicker({ allTransitions, workflowFilter, onWorkflowFilterChange, value, onChange }: TransitionPickerProps) {
  const [wfOpen, setWfOpen] = useState(false);
  const [txOpen, setTxOpen] = useState(false);

  // Unique workflows derived from allTransitions
  const workflows = useMemo(() => {
    const seen = new Map<number, string>();
    for (const t of allTransitions) {
      if (!seen.has(t.workflow_id)) seen.set(t.workflow_id, t.workflowName);
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [allTransitions]);

  const visibleTransitions = workflowFilter
    ? allTransitions.filter(t => t.workflow_id === workflowFilter)
    : allTransitions;

  const selectedTransition = value ? allTransitions.find(t => t.id === value) : null;
  const selectedWorkflow = workflowFilter ? workflows.find(w => w.id === workflowFilter) : null;

  return (
    <div className="space-y-2">
      <Label>Trigger Transition <span className="text-muted-foreground font-normal text-xs">(optional — blank matches any)</span></Label>
      <div className="flex gap-2">
        {/* Workflow filter combobox */}
        <Popover open={wfOpen} onOpenChange={setWfOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="w-44 justify-between text-xs h-9 font-normal">
              <span className="truncate">{selectedWorkflow?.name ?? 'All workflows'}</span>
              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search workflow…" className="h-8 text-xs" />
              <CommandList>
                <CommandEmpty>No workflows found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__all__"
                    onSelect={() => { onWorkflowFilterChange(null); setWfOpen(false); }}
                    className="text-xs"
                  >
                    <Check className={cn('mr-2 h-3.5 w-3.5', workflowFilter === null ? 'opacity-100' : 'opacity-0')} />
                    All workflows
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Workflows">
                  {workflows.map(wf => (
                    <CommandItem
                      key={wf.id}
                      value={wf.name}
                      onSelect={() => {
                        onWorkflowFilterChange(wf.id);
                        // Clear transition selection if it doesn't belong to new workflow
                        if (value) {
                          const t = allTransitions.find(t => t.id === value);
                          if (t && t.workflow_id !== wf.id) onChange(null);
                        }
                        setWfOpen(false);
                      }}
                      className="text-xs"
                    >
                      <Check className={cn('mr-2 h-3.5 w-3.5', workflowFilter === wf.id ? 'opacity-100' : 'opacity-0')} />
                      {wf.name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {/* Transition combobox */}
        <Popover open={txOpen} onOpenChange={setTxOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" role="combobox" className="flex-1 justify-between text-xs h-9 font-normal">
              <span className="truncate">{selectedTransition?.name ?? 'Any transition'}</span>
              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search transition…" className="h-8 text-xs" />
              <CommandList>
                <CommandEmpty>No transitions found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem
                    value="__any__"
                    onSelect={() => { onChange(null); setTxOpen(false); }}
                    className="text-xs"
                  >
                    <Check className={cn('mr-2 h-3.5 w-3.5', value === null ? 'opacity-100' : 'opacity-0')} />
                    Any transition
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
                {workflowFilter ? (
                  <CommandGroup heading={selectedWorkflow?.name}>
                    {visibleTransitions.map(t => (
                      <CommandItem
                        key={t.id}
                        value={t.name}
                        onSelect={() => { onChange(t.id); setTxOpen(false); }}
                        className="text-xs"
                      >
                        <Check className={cn('mr-2 h-3.5 w-3.5', value === t.id ? 'opacity-100' : 'opacity-0')} />
                        {t.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ) : (
                  workflows.map(wf => {
                    const wfTransitions = allTransitions.filter(t => t.workflow_id === wf.id);
                    if (wfTransitions.length === 0) return null;
                    return (
                      <CommandGroup key={wf.id} heading={wf.name}>
                        {wfTransitions.map(t => (
                          <CommandItem
                            key={t.id}
                            value={`${wf.name} ${t.name}`}
                            onSelect={() => { onChange(t.id); setTxOpen(false); }}
                            className="text-xs"
                          >
                            <Check className={cn('mr-2 h-3.5 w-3.5', value === t.id ? 'opacity-100' : 'opacity-0')} />
                            {t.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    );
                  })
                )}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>
      {selectedTransition && (
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">{selectedTransition.workflowName}</span> → {selectedTransition.name}
        </p>
      )}
    </div>
  );
}

// ── RuleRow ───────────────────────────────────────────────────────────────────

interface RuleRowProps {
  rule: RoutingRule;
  idx: number;
  allTransitions: WorkflowTransition[];
  hierarchyNodes: HierarchyNode[];
  noValueOps: string[];
  actionLabel: (r: RoutingRule) => string;
  onEdit: (r: RoutingRule) => void;
  onDelete: (id: number) => void;
  onToggle: (r: RoutingRule) => void;
}

function RuleRow({ rule: r, idx, allTransitions, hierarchyNodes, noValueOps, actionLabel, onEdit, onDelete, onToggle }: RuleRowProps) {
  const transition = r.trigger_transition_id ? allTransitions.find(t => t.id === r.trigger_transition_id) : null;
  return (
    <div className={cn('flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors', !r.is_active && 'opacity-50')}>
      <div className="flex items-center gap-2 shrink-0">
        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
        <span className="text-xs font-mono text-muted-foreground w-5 text-center">{idx + 1}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm">{r.name}</span>
          <Badge variant="outline" className="text-xs capitalize">{r.trigger.replace(/_/g, ' ')}</Badge>
          {transition && <Badge variant="secondary" className="text-xs">→ {transition.name}</Badge>}
        </div>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground flex-wrap">
          {(r.conditions || []).length === 0 ? (
            <span className="italic">Match all</span>
          ) : (
            r.conditions!.map((c, i) => {
              const opLabel = OPERATORS.find(o => o.value === c.operator)?.label ?? c.operator;
              let valSummary = '';
              if (!noValueOps.includes(c.operator)) {
                if (Array.isArray(c.value)) {
                  const names = c.value.slice(0, 3).map((code: string) => {
                    const n = hierarchyNodes.find(n => n.code === code);
                    return n?.name ?? code;
                  });
                  valSummary = ` ${names.join(', ')}${c.value.length > 3 ? ` +${c.value.length - 3}` : ''}`;
                } else {
                  valSummary = ` "${c.value}"`;
                }
              }
              return (
                <span key={i} className="bg-muted rounded px-1.5 py-0.5">
                  {c.field} {opLabel}{valSummary}
                </span>
              );
            })
          )}
          <ChevronRight className="h-3 w-3 mx-1" />
          <span className="text-foreground font-medium">{actionLabel(r)}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <Switch checked={r.is_active} onCheckedChange={() => onToggle(r)} />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(r)}>
          <Edit2 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => onDelete(r.id)}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export default function RoutingRulesPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  const ENTITY_TABS = ENTITY_TAB_KEYS.map(e => ({ key: e.key, label: t(e.tKey) }));
  const ACTION_TYPES = ACTION_TYPE_KEYS.map(a => ({ value: a.value, label: t(a.tKey) }));
  const TRIGGER_OPTIONS = TRIGGER_OPTION_KEYS.map(o => ({ value: o.value, label: t(o.tKey) }));
  const COMMON_FIELDS: Record<string, { value: string; label: string }[]> = Object.fromEntries(
    Object.entries(COMMON_FIELD_KEYS).map(([entity, fields]) => [
      entity,
      fields.map(f => ({ value: f.value, label: t(f.tKey) })),
    ])
  );
  const [rules, setRules] = useState<RoutingRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ticket');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [hierarchyTypes, setHierarchyTypes] = useState<HierarchyType[]>([]);
  const [hierarchyNodes, setHierarchyNodes] = useState<HierarchyNode[]>([]);
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);
  const [allTransitions, setAllTransitions] = useState<WorkflowTransition[]>([]);
  const [formWorkflowFilter, setFormWorkflowFilter] = useState<number | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  useEffect(() => { fetchRules(); fetchUsersAndTeams(); fetchHierarchyAndFields(); fetchTransitions(); }, []);

  const fetchRules = async () => {
    try {
      const res = await axios.get('/api/v1/routing-rules/', { headers });
      setRules(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load routing rules', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchUsersAndTeams = async () => {
    try {
      const [ur, tr] = await Promise.all([
        axios.get('/api/v1/users/', { headers, params: { limit: 200 } }),
        axios.get('/api/v1/teams/', { headers }),
      ]);
      setUsers(ur.data);
      setTeams(tr.data);
    } catch { /* non-fatal */ }
  };

  const fetchHierarchyAndFields = async () => {
    try {
      const [ht, cf] = await Promise.all([
        axios.get('/api/v1/hierarchy/types', { headers }),
        axios.get('/api/v1/custom-fields/', { headers }),
      ]);
      const types: HierarchyType[] = ht.data;
      setHierarchyTypes(types);
      setCustomFieldDefs(cf.data);
      // Load nodes for all types in parallel
      const nodeResponses = await Promise.all(
        types.map(t => axios.get(`/api/v1/hierarchy/types/${t.id}/nodes`, { headers }).catch(() => ({ data: [] })))
      );
      setHierarchyNodes(nodeResponses.flatMap(r => r.data));
    } catch { /* non-fatal */ }
  };

  const fetchTransitions = async () => {
    try {
      const res = await axios.get('/api/v1/tickets/workflows', { headers });
      const flat: WorkflowTransition[] = (res.data as any[]).flatMap((wf: any) =>
        (wf.transitions ?? []).map((t: any) => ({
          id: t.id,
          name: t.name,
          workflow_id: wf.id,
          workflowName: wf.name,
        }))
      );
      setAllTransitions(flat);
    } catch { /* non-fatal */ }
  };

  const tabRules = rules.filter(r => r.entity_type === activeTab).sort((a, b) => a.priority - b.priority);

  const openCreate = (workflowId?: number) => {
    const count = rules.filter(r => r.entity_type === activeTab).length;
    setForm({
      ...emptyForm,
      entity_type: activeTab,
      priority: count,
      trigger: workflowId ? 'on_transition' : 'on_create',
    });
    setFormWorkflowFilter(workflowId ?? null);
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (r: RoutingRule) => {
    // Ensure in/not_in values are always string arrays
    const normalizedConditions = (r.conditions || []).map(c => ({
      ...c,
      value: (c.operator === 'in' || c.operator === 'not_in')
        ? (Array.isArray(c.value) ? c.value : typeof c.value === 'string' ? c.value.split(',').map((s: string) => s.trim()).filter(Boolean) : [])
        : c.value,
    }));
    setForm({
      entity_type: r.entity_type,
      name: r.name,
      priority: r.priority,
      trigger: r.trigger,
      trigger_transition_id: r.trigger_transition_id,
      conditions: normalizedConditions,
      action_type: r.action_type,
      action_config: r.action_config || {},
      is_active: r.is_active,
    });
    setFormWorkflowFilter(null);
    setEditingId(r.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    const payload = { ...form };
    try {
      if (editingId) {
        await axios.put(`/api/v1/routing-rules/${editingId}`, payload, { headers });
        toast({ title: 'Rule updated' });
      } else {
        await axios.post('/api/v1/routing-rules/', payload, { headers });
        toast({ title: 'Rule created' });
      }
      setDialogOpen(false);
      fetchRules();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/v1/routing-rules/${deleteId}`, { headers });
      toast({ title: 'Rule deleted' });
      setDeleteId(null);
      fetchRules();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete rule', variant: 'destructive' });
    }
  };

  const toggleActive = async (r: RoutingRule) => {
    try {
      await axios.put(`/api/v1/routing-rules/${r.id}`, { is_active: !r.is_active }, { headers });
      fetchRules();
    } catch {
      toast({ title: 'Error', description: 'Failed to update rule', variant: 'destructive' });
    }
  };

  const addCondition = () => {
    setForm(f => ({ ...f, conditions: [...f.conditions, { field: 'priority', operator: 'eq', value: '' }] }));
  };

  const updateCondition = (idx: number, patch: Partial<Condition>) => {
    setForm(f => ({
      ...f,
      conditions: f.conditions.map((c, i) => i === idx ? { ...c, ...patch } : c),
    }));
  };

  const removeCondition = (idx: number) => {
    setForm(f => ({ ...f, conditions: f.conditions.filter((_, i) => i !== idx) }));
  };

  const actionLabel = (r: RoutingRule) => {
    const type = ACTION_TYPES.find(a => a.value === r.action_type);
    const cfg = r.action_config || {};
    if (r.action_type === 'assign_to_user') {
      const u = users.find(u => u.id === cfg.user_id);
      return `→ ${u?.full_name ?? `User #${cfg.user_id}`}`;
    }
    if (r.action_type === 'assign_round_robin') {
      const t = teams.find(t => t.id === cfg.team_id);
      return `→ Round-robin: ${t?.name ?? `Team #${cfg.team_id}`}`;
    }
    if (r.action_type === 'assign_by_skill') {
      return `→ Skill: ${cfg.skill ?? '—'}`;
    }
    if (r.action_type === 'assign_by_node_match') {
      const fields = (cfg.node_fields ?? []).join(', ');
      const role = cfg.match_role ?? 'agent';
      return `→ Node match [${fields}] as ${role}`;
    }
    if (r.action_type === 'assign_by_department') {
      const fields = (cfg.node_fields ?? []).join(', ');
      const role = cfg.role ?? 'agent';
      return `→ Dept routing [${fields}] → ${role}`;
    }
    return type?.label ?? r.action_type;
  };

  const noValueOps = ['exists', 'not_exists'];

  // Group rules by workflow (for on_transition rules) or into "General"
  const groupedRules = useMemo(() => {
    const wfMap = new Map<number, { id: number; name: string; rules: RoutingRule[] }>();
    const general: RoutingRule[] = [];

    for (const r of tabRules) {
      if (r.trigger_transition_id) {
        const t = allTransitions.find(tr => tr.id === r.trigger_transition_id);
        if (t) {
          if (!wfMap.has(t.workflow_id)) {
            wfMap.set(t.workflow_id, { id: t.workflow_id, name: t.workflowName, rules: [] });
          }
          wfMap.get(t.workflow_id)!.rules.push(r);
          continue;
        }
      }
      general.push(r);
    }

    const workflows = Array.from(wfMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    return { workflows, general };
  }, [tabRules, allTransitions]);

  const toggleSection = (key: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t('routingRules.title')}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-assign tickets, leads and deals based on conditions. Rules run in priority order — first match wins.
          </p>
        </div>
        <Button onClick={() => openCreate()} className="gap-2">
          <Plus className="h-4 w-4" />Add Rule
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {ENTITY_TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
              <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">
                {rules.filter(r => r.entity_type === t.key && r.is_active).length}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {ENTITY_TABS.map(t => (
          <TabsContent key={t.key} value={t.key} className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
              </div>
            ) : tabRules.length === 0 ? (
              <div className="border border-dashed rounded-xl p-12 text-center">
                <Zap className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No routing rules for {t.label} yet.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => openCreate()}>
                  <Plus className="h-4 w-4 mr-2" />Add First Rule
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Workflow sections */}
                {groupedRules.workflows.map(wf => {
                  const sectionKey = `wf-${wf.id}`;
                  const collapsed = collapsedSections.has(sectionKey);
                  return (
                    <div key={wf.id} className="border rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                        onClick={() => toggleSection(sectionKey)}
                      >
                        <div className="flex items-center gap-2">
                          {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-semibold text-sm">{wf.name}</span>
                          <Badge variant="secondary" className="text-xs">{wf.rules.length} rule{wf.rules.length !== 1 ? 's' : ''}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={e => { e.stopPropagation(); openCreate(wf.id); }}
                        >
                          <Plus className="h-3 w-3" />Add Rule
                        </Button>
                      </div>
                      {!collapsed && (
                        <div className="divide-y">
                          {wf.rules.map((r, idx) => (
                            <RuleRow
                              key={r.id}
                              rule={r}
                              idx={idx}
                              allTransitions={allTransitions}
                              hierarchyNodes={hierarchyNodes}
                              noValueOps={noValueOps}
                              actionLabel={actionLabel}
                              onEdit={openEdit}
                              onDelete={setDeleteId}
                              onToggle={toggleActive}
                            />
                          ))}
                          {wf.rules.length === 0 && (
                            <p className="text-xs text-muted-foreground italic p-4 text-center">No rules yet — add one above.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* General / on-create section */}
                {(() => {
                  const sectionKey = 'general';
                  const collapsed = collapsedSections.has(sectionKey);
                  return (
                    <div className="border rounded-xl overflow-hidden">
                      <div
                        className="flex items-center justify-between px-4 py-3 bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors"
                        onClick={() => toggleSection(sectionKey)}
                      >
                        <div className="flex items-center gap-2">
                          {collapsed ? <ChevronRight className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                          <span className="font-semibold text-sm">General</span>
                          <span className="text-xs text-muted-foreground">on create &amp; unscoped rules</span>
                          <Badge variant="secondary" className="text-xs">{groupedRules.general.length} rule{groupedRules.general.length !== 1 ? 's' : ''}</Badge>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={e => { e.stopPropagation(); openCreate(); }}
                        >
                          <Plus className="h-3 w-3" />Add Rule
                        </Button>
                      </div>
                      {!collapsed && (
                        <div className="divide-y">
                          {groupedRules.general.map((r, idx) => (
                            <RuleRow
                              key={r.id}
                              rule={r}
                              idx={idx}
                              allTransitions={allTransitions}
                              hierarchyNodes={hierarchyNodes}
                              noValueOps={noValueOps}
                              actionLabel={actionLabel}
                              onEdit={openEdit}
                              onDelete={setDeleteId}
                              onToggle={toggleActive}
                            />
                          ))}
                          {groupedRules.general.length === 0 && (
                            <p className="text-xs text-muted-foreground italic p-4 text-center">No general rules — add one above.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[580px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Routing Rule' : 'New Routing Rule'}</DialogTitle>
            <DialogDescription>Rules are evaluated top-to-bottom. First match wins.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {!editingId && (
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={form.entity_type} onValueChange={v => setForm(f => ({ ...f, entity_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ENTITY_TABS.map(t => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Rule Name <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Critical tickets to senior support" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger</Label>
                <Select
                  value={form.trigger}
                  onValueChange={v => setForm(f => ({
                    ...f,
                    trigger: v,
                    trigger_transition_id: v === 'on_create' ? undefined : f.trigger_transition_id,
                  }))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TRIGGER_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority (lower = first)</Label>
                <Input type="number" min={0} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))} />
              </div>
            </div>

            {/* Transition picker — shown when trigger fires on transitions */}
            {(form.trigger === 'on_transition' || form.trigger === 'both') && (
              <TransitionPicker
                allTransitions={allTransitions}
                workflowFilter={formWorkflowFilter}
                onWorkflowFilterChange={setFormWorkflowFilter}
                value={form.trigger_transition_id ?? null}
                onChange={id => setForm(f => ({ ...f, trigger_transition_id: id ?? undefined }))}
              />
            )}

            {/* Conditions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conditions</Label>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={addCondition}>
                  <Plus className="h-3 w-3" />Add Condition
                </Button>
              </div>
              {form.conditions.length === 0 ? (
                <p className="text-xs text-muted-foreground italic border rounded-lg p-3 text-center">No conditions — rule matches everything.</p>
              ) : (
                <div className="space-y-2">
                  {form.conditions.map((c, idx) => {
                    const commonOpts = COMMON_FIELDS[form.entity_type] || [];
                    return (
                    <div key={idx} className="flex items-start gap-2">
                      <div className="flex-1 space-y-1">
                        <Input
                          className="h-8 text-xs"
                          placeholder="Field (e.g. priority, custom_fields.classification)"
                          value={c.field}
                          onChange={e => updateCondition(idx, { field: e.target.value })}
                          list={`fields-${idx}`}
                        />
                        <datalist id={`fields-${idx}`}>
                          {commonOpts.map(f => <option key={f.value} value={f.value} label={f.label} />)}
                        </datalist>
                      </div>
                      <Select value={c.operator} onValueChange={v => updateCondition(idx, { operator: v })}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {!noValueOps.includes(c.operator) && (
                        <div className="flex-1">
                          {(c.operator === 'in' || c.operator === 'not_in') ? (
                            <HierarchyNodePicker
                              value={Array.isArray(c.value) ? c.value : []}
                              onChange={codes => updateCondition(idx, { value: codes })}
                              hierarchyTypes={hierarchyTypes}
                              hierarchyNodes={hierarchyNodes}
                              typeFilter={(() => {
                                const segment = c.field.split('.').pop()?.toLowerCase() ?? '';
                                const match = hierarchyTypes.find(ht => ht.name.toLowerCase() === segment);
                                return match ? [match.id] : undefined;
                              })()}
                            />
                          ) : (
                            <Input
                              className="h-8 text-xs"
                              placeholder="value"
                              value={c.value ?? ''}
                              onChange={e => updateCondition(idx, { value: e.target.value })}
                            />
                          )}
                        </div>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 mt-0.5" onClick={() => removeCondition(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  );})}
                </div>
              )}
            </div>

            {/* Action */}
            <div className="space-y-3 pt-2 border-t">
              <Label>Action</Label>
              <Select value={form.action_type} onValueChange={v => setForm(f => ({ ...f, action_type: v, action_config: {} }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                </SelectContent>
              </Select>

              {form.action_type === 'assign_to_user' && (
                <Select
                  value={form.action_config.user_id?.toString() ?? ''}
                  onValueChange={v => setForm(f => ({ ...f, action_config: { user_id: parseInt(v) } }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select user" /></SelectTrigger>
                  <SelectContent>
                    {users.map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.full_name} — {u.email}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {form.action_type === 'assign_by_role' && (
                <div className="space-y-2">
                  <Select
                    value={form.action_config.role ?? '__none__'}
                    onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, role: v === '__none__' ? undefined : v } }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Any role</SelectItem>
                      {DEPT_ROLES.map(r => (
                        <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Round-robins among users with this role. If conditions include classification or location fields,
                    only users in matching departments are considered.
                  </p>
                </div>
              )}

              {form.action_type === 'assign_round_robin' && (
                <div className="space-y-2">
                  <Select
                    value={form.action_config.team_id?.toString() ?? '__none__'}
                    onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, team_id: v === '__none__' ? undefined : parseInt(v) } }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any team" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Any team</SelectItem>
                      {teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select
                    value={form.action_config.role ?? '__none__'}
                    onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, role: v === '__none__' ? undefined : v } }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any role" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Any role</SelectItem>
                      {['agent', 'supervisor', 'approver', 'manager'].map(r => (
                        <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.action_type === 'assign_by_skill' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Skill name (e.g. billing, technical)"
                    value={form.action_config.skill ?? ''}
                    onChange={e => setForm(f => ({ ...f, action_config: { ...f.action_config, skill: e.target.value } }))}
                  />
                  <Select
                    value={form.action_config.team_id?.toString() ?? '__none__'}
                    onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, team_id: v === '__none__' ? undefined : parseInt(v) } }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Any team" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Any team</SelectItem>
                      {teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {form.action_type === 'assign_by_node_match' && (() => {
                const nodeFields: string[] = form.action_config.node_fields ?? [];
                const typeMap: Record<string, number> = form.action_config.type_map ?? {};
                const entityCfDefs = customFieldDefs.filter(d => d.entity_type === form.entity_type);
                const toggleField = (name: string) => {
                  const updated = nodeFields.includes(name)
                    ? nodeFields.filter(f => f !== name)
                    : [...nodeFields, name];
                  setForm(f => ({ ...f, action_config: { ...f.action_config, node_fields: updated } }));
                };
                return (
                  <div className="space-y-3">
                    {/* Node fields selector */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Custom fields that carry hierarchy node codes</Label>
                      {entityCfDefs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No custom fields defined for this entity type.</p>
                      ) : (
                        <div className="space-y-1 border rounded-lg p-2">
                          {entityCfDefs.map(def => (
                            <div key={def.id} className="flex items-center gap-2 text-sm">
                              <input
                                type="checkbox"
                                id={`nf_${def.name}`}
                                checked={nodeFields.includes(def.name)}
                                onChange={() => toggleField(def.name)}
                                className="rounded"
                              />
                              <label htmlFor={`nf_${def.name}`} className="flex-1 cursor-pointer">
                                {def.label} <code className="text-xs text-muted-foreground ml-1">{def.name}</code>
                              </label>
                              {nodeFields.includes(def.name) && hierarchyTypes.length > 0 && (
                                <Select
                                  value={typeMap[def.name]?.toString() ?? ''}
                                  onValueChange={v => setForm(f => ({
                                    ...f,
                                    action_config: {
                                      ...f.action_config,
                                      type_map: { ...(f.action_config.type_map ?? {}), [def.name]: parseInt(v) },
                                    },
                                  }))}
                                >
                                  <SelectTrigger className="h-7 text-xs w-40">
                                    <SelectValue placeholder="Hierarchy type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {hierarchyTypes.map(ht => (
                                      <SelectItem key={ht.id} value={ht.id.toString()} className="text-xs">{ht.name}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Role */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Match user role</Label>
                      <Select
                        value={form.action_config.match_role ?? 'agent'}
                        onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, match_role: v } }))}
                      >
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEPT_ROLES.map(r => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Team filter */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Limit to team (optional)</Label>
                      <Select
                        value={form.action_config.team_id?.toString() ?? '__none__'}
                        onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, team_id: v === '__none__' ? undefined : parseInt(v) } }))}
                      >
                        <SelectTrigger className="h-8"><SelectValue placeholder="Any team" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Any team</SelectItem>
                          {teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Ancestor match */}
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={form.action_config.ancestor_match !== false}
                        onCheckedChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, ancestor_match: v } }))}
                      />
                      <div>
                        <Label className="text-xs font-medium">Ancestor matching</Label>
                        <p className="text-xs text-muted-foreground">A city-level agent also matches all wards under that city</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {form.action_type === 'assign_by_department' && (() => {
                const nodeFields: string[] = form.action_config.node_fields ?? [];
                const typeMap: Record<string, number> = form.action_config.type_map ?? {};
                const entityCfDefs = customFieldDefs.filter(d => d.entity_type === form.entity_type);
                const toggleField = (name: string) => {
                  const updated = nodeFields.includes(name)
                    ? nodeFields.filter(f => f !== name)
                    : [...nodeFields, name];
                  setForm(f => ({ ...f, action_config: { ...f.action_config, node_fields: updated } }));
                };
                return (
                  <div className="space-y-3 mt-2">
                    <div className="rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground">
                      Two-hop routing: ticket field → classification node → matching department → user by role
                    </div>
                    {/* Node fields */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Custom fields that carry hierarchy node codes</Label>
                      {entityCfDefs.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No custom fields defined. You can also type a field name manually below.</p>
                      ) : (
                        <div className="space-y-1 border rounded-lg p-2">
                          {entityCfDefs.map(def => (
                            <div key={def.id} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" id={`dept_nf_${def.name}`}
                                checked={nodeFields.includes(def.name)}
                                onChange={() => toggleField(def.name)} className="rounded" />
                              <label htmlFor={`dept_nf_${def.name}`} className="flex-1 cursor-pointer">
                                {def.label} <code className="text-xs text-muted-foreground ml-1">{def.name}</code>
                              </label>
                              {nodeFields.includes(def.name) && hierarchyTypes.length > 0 && (
                                <Select value={typeMap[def.name]?.toString() ?? ''}
                                  onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, type_map: { ...(f.action_config.type_map ?? {}), [def.name]: parseInt(v) } } }))}>
                                  <SelectTrigger className="h-7 text-xs w-40"><SelectValue placeholder="Hierarchy type" /></SelectTrigger>
                                  <SelectContent>
                                    {hierarchyTypes.map(ht => <SelectItem key={ht.id} value={ht.id.toString()} className="text-xs">{ht.name}</SelectItem>)}
                                  </SelectContent>
                                </Select>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      <Input className="h-7 text-xs" placeholder="Or type field name e.g. classification"
                        value={(nodeFields.filter(f => !entityCfDefs.some(d => d.name === f))).join(', ')}
                        onChange={e => {
                          const extra = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                          const known = nodeFields.filter(f => entityCfDefs.some(d => d.name === f));
                          setForm(f => ({ ...f, action_config: { ...f.action_config, node_fields: [...known, ...extra] } }));
                        }} />
                    </div>
                    {/* Role */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Pick users with role</Label>
                      <Select value={form.action_config.role ?? 'agent'}
                        onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, role: v } }))}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DEPT_ROLES.map(r => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {/* Ancestor match */}
                    <div className="flex items-center gap-2">
                      <Switch checked={form.action_config.ancestor_match !== false}
                        onCheckedChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, ancestor_match: v } }))} />
                      <div>
                        <Label className="text-xs font-medium">Ancestor matching</Label>
                        <p className="text-xs text-muted-foreground">A parent-node dept also matches its child node tickets</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Label className="text-sm">Active</Label>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Rule'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Routing Rule</AlertDialogTitle>
            <AlertDialogDescription>This routing rule will no longer auto-assign new items.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

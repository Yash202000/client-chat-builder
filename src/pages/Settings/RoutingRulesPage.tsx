import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, GripVertical, ChevronRight, ToggleLeft, ToggleRight, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import axios from 'axios';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const ENTITY_TABS = [
  { key: 'ticket', label: 'Tickets' },
  { key: 'lead', label: 'Leads' },
  { key: 'deal', label: 'Deals' },
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

const ACTION_TYPES = [
  { value: 'assign_to_user', label: 'Assign to specific user' },
  { value: 'assign_round_robin', label: 'Round-robin from team' },
  { value: 'assign_by_skill', label: 'Assign by agent skill' },
  { value: 'assign_by_node_match', label: 'Assign by jurisdiction (hierarchy match)' },
  { value: 'no_action', label: 'No assignment' },
];

const TRIGGER_OPTIONS = [
  { value: 'on_create', label: 'On creation' },
  { value: 'on_transition', label: 'On status transition' },
  { value: 'both', label: 'Both' },
];

const COMMON_FIELDS: Record<string, { value: string; label: string }[]> = {
  ticket: [
    { value: 'priority', label: 'Priority' },
    { value: 'issue_type_id', label: 'Issue Type' },
    { value: 'labels', label: 'Labels' },
    { value: 'custom_fields.department', label: 'Department (custom)' },
  ],
  lead: [
    { value: 'source', label: 'Source' },
    { value: 'score', label: 'Lead Score' },
    { value: 'qualification_status', label: 'Qualification Status' },
    { value: 'custom_fields.tier', label: 'Tier (custom)' },
  ],
  deal: [
    { value: 'status', label: 'Status' },
    { value: 'amount', label: 'Amount' },
    { value: 'custom_fields.region', label: 'Region (custom)' },
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
interface CustomFieldDef { id: number; name: string; label: string; entity_type: string }

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

export default function RoutingRulesPage() {
  const { toast } = useToast();
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
  const [customFieldDefs, setCustomFieldDefs] = useState<CustomFieldDef[]>([]);

  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  useEffect(() => { fetchRules(); fetchUsersAndTeams(); fetchHierarchyAndFields(); }, []);

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
      setHierarchyTypes(ht.data);
      setCustomFieldDefs(cf.data);
    } catch { /* non-fatal */ }
  };

  const tabRules = rules.filter(r => r.entity_type === activeTab).sort((a, b) => a.priority - b.priority);

  const openCreate = () => {
    setForm({ ...emptyForm, entity_type: activeTab, priority: tabRules.length });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (r: RoutingRule) => {
    setForm({
      entity_type: r.entity_type,
      name: r.name,
      priority: r.priority,
      trigger: r.trigger,
      trigger_transition_id: r.trigger_transition_id,
      conditions: r.conditions || [],
      action_type: r.action_type,
      action_config: r.action_config || {},
      is_active: r.is_active,
    });
    setEditingId(r.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast({ title: 'Name is required', variant: 'destructive' }); return; }
    setSaving(true);
    try {
      if (editingId) {
        await axios.put(`/api/v1/routing-rules/${editingId}`, form, { headers });
        toast({ title: 'Rule updated' });
      } else {
        await axios.post('/api/v1/routing-rules/', form, { headers });
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
    return type?.label ?? r.action_type;
  };

  const noValueOps = ['exists', 'not_exists'];

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Routing Rules</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Auto-assign tickets, leads and deals based on conditions. Rules run in priority order — first match wins.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
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
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />Add First Rule
                </Button>
              </div>
            ) : (
              <div className="border rounded-xl divide-y overflow-hidden">
                {tabRules.map((r, idx) => (
                  <div key={r.id} className={cn('flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors', !r.is_active && 'opacity-50')}>
                    <div className="flex items-center gap-2 shrink-0">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      <span className="text-xs font-mono text-muted-foreground w-5 text-center">{idx + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{r.name}</span>
                        <Badge variant="outline" className="text-xs capitalize">{r.trigger.replace('_', ' ')}</Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground flex-wrap">
                        {(r.conditions || []).length === 0 ? (
                          <span className="italic">Match all</span>
                        ) : (
                          r.conditions!.map((c, i) => (
                            <span key={i} className="bg-muted rounded px-1.5 py-0.5">
                              {c.field} {OPERATORS.find(o => o.value === c.operator)?.label ?? c.operator}
                              {!noValueOps.includes(c.operator) && ` "${c.value}"`}
                            </span>
                          ))
                        )}
                        <ChevronRight className="h-3 w-3 mx-1" />
                        <span className="text-foreground font-medium">{actionLabel(r)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(r)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
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
                <Select value={form.trigger} onValueChange={v => setForm(f => ({ ...f, trigger: v }))}>
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
                  {form.conditions.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Select value={c.field} onValueChange={v => updateCondition(idx, { field: v })}>
                        <SelectTrigger className="flex-1 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {(COMMON_FIELDS[form.entity_type] || []).map(f => (
                            <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={c.operator} onValueChange={v => updateCondition(idx, { operator: v })}>
                        <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {OPERATORS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {!noValueOps.includes(c.operator) && (
                        <Input
                          className="flex-1 h-8 text-xs"
                          placeholder="value"
                          value={c.value ?? ''}
                          onChange={e => updateCondition(idx, { value: e.target.value })}
                        />
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeCondition(idx)}>
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  ))}
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

              {form.action_type === 'assign_round_robin' && (
                <Select
                  value={form.action_config.team_id?.toString() ?? ''}
                  onValueChange={v => setForm(f => ({ ...f, action_config: { team_id: parseInt(v) } }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger>
                  <SelectContent>
                    {teams.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}

              {form.action_type === 'assign_by_skill' && (
                <div className="space-y-2">
                  <Input
                    placeholder="Skill name (e.g. billing, technical)"
                    value={form.action_config.skill ?? ''}
                    onChange={e => setForm(f => ({ ...f, action_config: { ...f.action_config, skill: e.target.value } }))}
                  />
                  <Select
                    value={form.action_config.team_id?.toString() ?? ''}
                    onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, team_id: parseInt(v) } }))}
                  >
                    <SelectTrigger><SelectValue placeholder="Limit to team (optional)" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any team</SelectItem>
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
                          {['agent', 'supervisor', 'approver', 'manager'].map(r => (
                            <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Team filter */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Limit to team (optional)</Label>
                      <Select
                        value={form.action_config.team_id?.toString() ?? ''}
                        onValueChange={v => setForm(f => ({ ...f, action_config: { ...f.action_config, team_id: v ? parseInt(v) : undefined } }))}
                      >
                        <SelectTrigger className="h-8"><SelectValue placeholder="Any team" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any team</SelectItem>
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

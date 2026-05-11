import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, GripVertical, ChevronDown, Check, X } from 'lucide-react';
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
  { key: 'contact', label: 'Contacts' },
];

const FIELD_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Decimal' },
  { value: 'boolean', label: 'Yes / No' },
  { value: 'date', label: 'Date' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'multi_select', label: 'Multi-select' },
  { value: 'user_picker', label: 'User Picker' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
];

const OPTION_COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#3b82f6','#8b5cf6','#ec4899','#14b8a6','#f97316','#64748b'];

interface FieldOption { value: string; label: string; color?: string }
interface CustomField {
  id: number;
  entity_type: string;
  name: string;
  label: string;
  field_type: string;
  options?: FieldOption[];
  required: boolean;
  default_value?: any;
  position: number;
  is_active: boolean;
  group_name?: string;
}

const emptyForm = {
  entity_type: 'ticket',
  name: '',
  label: '',
  field_type: 'text',
  options: [] as FieldOption[],
  required: false,
  default_value: '',
  group_name: '',
  is_active: true,
};

export default function CustomFieldsPage() {
  const { toast } = useToast();
  const [fields, setFields] = useState<CustomField[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ticket');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [newOption, setNewOption] = useState('');
  const [newOptionColor, setNewOptionColor] = useState(OPTION_COLORS[0]);

  const headers = { Authorization: `Bearer ${localStorage.getItem('accessToken')}` };

  useEffect(() => { fetchFields(); }, []);

  const fetchFields = async () => {
    try {
      const res = await axios.get('/api/v1/custom-fields/', { headers, params: { include_inactive: true } });
      setFields(res.data);
    } catch {
      toast({ title: 'Error', description: 'Failed to load custom fields', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const tabFields = fields.filter(f => f.entity_type === activeTab).sort((a, b) => a.position - b.position);

  const openCreate = () => {
    setForm({ ...emptyForm, entity_type: activeTab });
    setEditingId(null);
    setDialogOpen(true);
  };

  const openEdit = (f: CustomField) => {
    setForm({
      entity_type: f.entity_type,
      name: f.name,
      label: f.label,
      field_type: f.field_type,
      options: f.options || [],
      required: f.required,
      default_value: f.default_value ?? '',
      group_name: f.group_name || '',
      is_active: f.is_active,
    });
    setEditingId(f.id);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.label.trim()) { toast({ title: 'Label is required', variant: 'destructive' }); return; }
    if (!editingId && !form.name.trim()) { toast({ title: 'Field key is required', variant: 'destructive' }); return; }

    setSaving(true);
    try {
      const payload: any = {
        label: form.label,
        field_type: form.field_type,
        options: ['dropdown','multi_select'].includes(form.field_type) ? form.options : undefined,
        required: form.required,
        default_value: form.default_value || undefined,
        group_name: form.group_name || undefined,
        is_active: form.is_active,
      };

      if (editingId) {
        await axios.put(`/api/v1/custom-fields/${editingId}`, payload, { headers });
        toast({ title: 'Field updated' });
      } else {
        payload.entity_type = form.entity_type;
        payload.name = form.name;
        await axios.post('/api/v1/custom-fields/', payload, { headers });
        toast({ title: 'Field created' });
      }

      setDialogOpen(false);
      fetchFields();
    } catch (err: any) {
      toast({ title: 'Error', description: err.response?.data?.detail || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await axios.delete(`/api/v1/custom-fields/${deleteId}`, { headers });
      toast({ title: 'Field deleted' });
      setDeleteId(null);
      fetchFields();
    } catch {
      toast({ title: 'Error', description: 'Failed to delete field', variant: 'destructive' });
    }
  };

  const toggleActive = async (f: CustomField) => {
    try {
      await axios.put(`/api/v1/custom-fields/${f.id}`, { is_active: !f.is_active }, { headers });
      fetchFields();
    } catch {
      toast({ title: 'Error', description: 'Failed to update field', variant: 'destructive' });
    }
  };

  const addOption = () => {
    const v = newOption.trim();
    if (!v) return;
    setForm(f => ({ ...f, options: [...f.options, { value: v.toLowerCase().replace(/\s+/g, '_'), label: v, color: newOptionColor }] }));
    setNewOption('');
    setNewOptionColor(OPTION_COLORS[(form.options.length + 1) % OPTION_COLORS.length]);
  };

  const removeOption = (idx: number) => {
    setForm(f => ({ ...f, options: f.options.filter((_, i) => i !== idx) }));
  };

  const needsOptions = ['dropdown', 'multi_select'].includes(form.field_type);

  // Auto-generate name from label (create mode only)
  const handleLabelChange = (val: string) => {
    setForm(f => ({
      ...f,
      label: val,
      ...(!editingId && { name: val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').replace(/^_+/, '') }),
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Custom Fields</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Define typed fields for tickets, leads, deals, and contacts. Fields appear on entity forms and can be required during workflow transitions.
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />Add Field
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          {ENTITY_TABS.map(t => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
              <span className="ml-1.5 text-xs bg-muted rounded-full px-1.5 py-0.5">
                {fields.filter(f => f.entity_type === t.key && f.is_active).length}
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
            ) : tabFields.length === 0 ? (
              <div className="border border-dashed rounded-xl p-12 text-center">
                <p className="text-muted-foreground text-sm">No custom fields yet for {t.label}.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />Add First Field
                </Button>
              </div>
            ) : (
              <div className="border rounded-xl divide-y overflow-hidden">
                {tabFields.map(f => (
                  <div key={f.id} className={cn('flex items-center gap-4 p-4 bg-card hover:bg-muted/30 transition-colors', !f.is_active && 'opacity-50')}>
                    <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 cursor-grab" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{f.label}</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-muted-foreground">{f.name}</code>
                        <Badge variant="outline" className="text-xs">{FIELD_TYPES.find(ft => ft.value === f.field_type)?.label ?? f.field_type}</Badge>
                        {f.required && <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">Required</Badge>}
                        {f.group_name && <span className="text-xs text-muted-foreground">· {f.group_name}</span>}
                      </div>
                      {f.field_type === 'dropdown' || f.field_type === 'multi_select' ? (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {(f.options || []).map(o => (
                            <span key={o.value} className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (o.color || '#6366f1') + '20', color: o.color || '#6366f1' }}>
                              {o.label}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch checked={f.is_active} onCheckedChange={() => toggleActive(f)} />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(f)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600" onClick={() => setDeleteId(f.id)}>
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
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Field' : 'New Custom Field'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update field configuration.' : 'Define a new typed field. The key cannot be changed after creation.'}
            </DialogDescription>
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
              <Label>Label <span className="text-red-500">*</span></Label>
              <Input placeholder="e.g. Customer Tier" value={form.label} onChange={e => handleLabelChange(e.target.value)} />
            </div>

            {!editingId && (
              <div className="space-y-2">
                <Label>Field Key <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. customer_tier"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }))}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Lowercase letters, numbers and underscores only. Used as the key in custom_fields JSON.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select value={form.field_type} onValueChange={v => setForm(f => ({ ...f, field_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(ft => <SelectItem key={ft.value} value={ft.value}>{ft.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {needsOptions && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="border rounded-lg divide-y">
                  {form.options.map((o, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: o.color || '#6366f1' }} />
                      <span className="flex-1 text-sm">{o.label}</span>
                      <code className="text-xs text-muted-foreground font-mono">{o.value}</code>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeOption(idx)}>
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1">
                    {OPTION_COLORS.map(c => (
                      <button
                        key={c}
                        className={cn('w-5 h-5 rounded-full border-2 transition-all', newOptionColor === c ? 'border-foreground scale-110' : 'border-transparent')}
                        style={{ backgroundColor: c }}
                        onClick={() => setNewOptionColor(c)}
                      />
                    ))}
                  </div>
                  <Input
                    className="flex-1"
                    placeholder="Add option..."
                    value={newOption}
                    onChange={e => setNewOption(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addOption()}
                  />
                  <Button variant="outline" size="sm" onClick={addOption}><Plus className="h-4 w-4" /></Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Section / Group (optional)</Label>
              <Input placeholder="e.g. CRM Details" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Required</Label>
                <p className="text-xs text-muted-foreground">Blocks saving if empty</p>
              </div>
              <Switch checked={form.required} onCheckedChange={v => setForm(f => ({ ...f, required: v }))} />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Active</Label>
                <p className="text-xs text-muted-foreground">Hidden fields won't appear in forms</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Field'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Field</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the field definition. Existing values stored in entity records will remain in custom_fields JSON but won't be validated or shown.
            </AlertDialogDescription>
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

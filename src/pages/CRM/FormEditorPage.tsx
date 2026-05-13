import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Save, Loader2, Plus, Trash2, GripVertical,
  Eye, Settings2, Type, Mail, Phone, AlignLeft, ChevronDown,
  ToggleLeft, ListFilter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getForm, updateForm, CaptureForm, FormField, FormSettings } from '@/services/formService';

const FIELD_TYPES = [
  { value: 'name',     label: 'Name',       icon: Type },
  { value: 'email',    label: 'Email',      icon: Mail },
  { value: 'phone',    label: 'Phone',      icon: Phone },
  { value: 'text',     label: 'Text',       icon: Type },
  { value: 'textarea', label: 'Long Text',  icon: AlignLeft },
  { value: 'select',   label: 'Dropdown',   icon: ListFilter },
  { value: 'checkbox', label: 'Checkbox',   icon: ToggleLeft },
];

function FieldTypeIcon({ type }: { type: string }) {
  const meta = FIELD_TYPES.find(t => t.value === type) ?? FIELD_TYPES[0];
  const Icon = meta.icon;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

function FormPreview({ fields, settings }: { fields: FormField[]; settings: Partial<FormSettings> }) {
  const primary = settings.primary_color ?? '#6366f1';
  return (
    <div className="bg-white rounded-xl border border-border p-6 max-w-md mx-auto shadow-sm">
      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.id} className={field.width === 'half' ? 'w-1/2' : 'w-full'}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {field.type === 'textarea' ? (
              <textarea
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none resize-none"
                rows={3}
                disabled
              />
            ) : field.type === 'select' ? (
              <select className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" disabled>
                <option>{field.placeholder ?? 'Select…'}</option>
                {field.options?.map(o => <option key={o}>{o}</option>)}
              </select>
            ) : field.type === 'checkbox' ? (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input type="checkbox" disabled />
                {field.placeholder ?? field.label}
              </label>
            ) : (
              <input
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                placeholder={field.placeholder}
                className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none"
                disabled
              />
            )}
          </div>
        ))}
        <button
          className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-opacity"
          style={{ backgroundColor: primary }}
          disabled
        >
          {settings.submit_label ?? 'Submit'}
        </button>
      </div>
    </div>
  );
}

function FieldEditor({
  field,
  onChange,
  onDelete,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onDelete: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const { t } = useTranslation();
  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div
        className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer hover:bg-muted/40 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
        <FieldTypeIcon type={field.type} />
        <span className="flex-1 text-sm font-medium text-foreground">{field.label || t('captureforms.fieldEditor.untitled')}</span>
        {field.required && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('captureforms.fieldEditor.required')}</Badge>}
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0"
          onClick={e => { e.stopPropagation(); onDelete(); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform flex-shrink-0", expanded && "rotate-180")} />
      </div>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">{t('captureforms.fieldEditor.typeLabel')}</Label>
              <Select value={field.type} onValueChange={v => onChange({ ...field, type: v as any })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map(ft => (
                    <SelectItem key={ft.value} value={ft.value} className="text-xs">{ft.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t('captureforms.fieldEditor.widthLabel')}</Label>
              <Select value={field.width} onValueChange={v => onChange({ ...field, width: v as any })}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="full" className="text-xs">{t('captureforms.fieldEditor.fullWidth')}</SelectItem>
                  <SelectItem value="half" className="text-xs">{t('captureforms.fieldEditor.halfWidth')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('captureforms.fieldEditor.labelLabel')}</Label>
            <Input value={field.label} onChange={e => onChange({ ...field, label: e.target.value })} className="h-7 text-xs" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">{t('captureforms.fieldEditor.placeholderLabel')}</Label>
            <Input value={field.placeholder ?? ''} onChange={e => onChange({ ...field, placeholder: e.target.value })} className="h-7 text-xs" />
          </div>
          {field.type === 'select' && (
            <div className="space-y-1">
              <Label className="text-xs">{t('captureforms.fieldEditor.optionsLabel')}</Label>
              <Textarea
                value={(field.options ?? []).join('\n')}
                onChange={e => onChange({ ...field, options: e.target.value.split('\n').filter(Boolean) })}
                className="text-xs min-h-[72px] resize-none"
                placeholder="Option 1&#10;Option 2&#10;Option 3"
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <Switch
              id={`req-${field.id}`}
              checked={field.required}
              onCheckedChange={v => onChange({ ...field, required: v })}
            />
            <Label htmlFor={`req-${field.id}`} className="text-xs cursor-pointer">{t('captureforms.fieldEditor.required')}</Label>
          </div>
        </div>
      )}
    </div>
  );
}

export default function FormEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();

  const [form, setForm] = useState<CaptureForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [settings, setSettings] = useState<Partial<FormSettings>>({});
  const [activeTab, setActiveTab] = useState<'fields' | 'settings' | 'preview'>('fields');

  useEffect(() => { fetchForm(); }, [id]);

  const fetchForm = async () => {
    try {
      setLoading(true);
      const f = await getForm(parseInt(id!));
      setForm(f);
      setName(f.name);
      setFields(f.fields as FormField[]);
      setSettings(f.settings ?? {});
    } catch {
      toast({ title: t('captureforms.toast.errorTitle'), description: t('captureforms.toast.loadFormError'), variant: 'destructive' });
      navigate('/dashboard/crm/forms');
    } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setNameError(t('captureforms.editor.nameRequired'));
      return;
    }
    setSaving(true);
    try {
      await updateForm(parseInt(id!), { name, fields, settings });
      toast({ title: t('captureforms.toast.savedTitle') });
    } catch {
      toast({ title: t('captureforms.toast.errorTitle'), description: t('captureforms.toast.saveError'), variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const addField = () => {
    const uid = `field_${Date.now()}`;
    setFields(prev => [...prev, {
      id: uid,
      type: 'text',
      label: t('captureforms.fieldEditor.newFieldLabel'),
      required: false,
      width: 'full',
    }]);
  };

  const updateField = (index: number, field: FormField) => {
    setFields(prev => prev.map((f, i) => i === index ? field : f));
  };

  const deleteField = (index: number) => {
    setFields(prev => prev.filter((_, i) => i !== index));
  };

  const setSetting = (key: keyof FormSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center gap-3 px-4 py-2.5 border-b border-border bg-card">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/dashboard/crm/forms')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <Input
            value={name}
            onChange={e => { setName(e.target.value); if (e.target.value.trim()) setNameError(''); }}
            className={`h-8 text-sm font-semibold bg-transparent border-transparent hover:border-border focus:border-border px-2 w-full${nameError ? ' border-destructive' : ''}`}
          />
          {nameError && <p className="text-xs text-destructive mt-1">{nameError}</p>}
        </div>
        <Badge variant="outline" className="text-xs font-mono">/f/{form?.slug}</Badge>
        <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5"
          onClick={() => window.open(`/f/${form?.slug}`, '_blank')}>
          <Eye className="h-3.5 w-3.5" /> {t('captureforms.editor.preview')}
        </Button>
        <Button size="sm" onClick={handleSave} disabled={saving}
          className="h-8 gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          {t('captureforms.editor.save')}
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left panel */}
        <div className="hidden lg:flex lg:w-80 flex-shrink-0 border-r border-border flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={v => setActiveTab(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="flex-shrink-0 mx-3 mt-3 h-8">
              <TabsTrigger value="fields" className="text-xs flex-1">{t('captureforms.editor.tabFields')}</TabsTrigger>
              <TabsTrigger value="settings" className="text-xs flex-1">
                <Settings2 className="h-3 w-3 mr-1" />{t('captureforms.editor.tabSettings')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fields" className="flex-1 overflow-y-auto px-3 pb-3 mt-3 space-y-2">
              {fields.map((field, i) => (
                <FieldEditor
                  key={field.id}
                  field={field}
                  onChange={f => updateField(i, f)}
                  onDelete={() => deleteField(i)}
                />
              ))}
              <Button onClick={addField} variant="outline" size="sm" className="w-full text-xs gap-1.5 border-dashed mt-1">
                <Plus className="h-3.5 w-3.5" /> {t('captureforms.editor.addField')}
              </Button>
            </TabsContent>

            <TabsContent value="settings" className="flex-1 overflow-y-auto px-3 pb-3 mt-3 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">{t('captureforms.settings.submitLabel')}</Label>
                <Input value={settings.submit_label ?? 'Submit'} onChange={e => setSetting('submit_label', e.target.value)} className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('captureforms.settings.successMessage')}</Label>
                <Textarea
                  value={settings.submit_message ?? "Thank you! We'll be in touch."}
                  onChange={e => setSetting('submit_message', e.target.value)}
                  className="text-xs resize-none min-h-[60px]"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('captureforms.settings.redirectUrl')}</Label>
                <Input
                  value={settings.redirect_url ?? ''}
                  onChange={e => setSetting('redirect_url', e.target.value)}
                  placeholder="https://example.com/thank-you"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('captureforms.settings.notifyEmail')}</Label>
                <Input
                  value={settings.notify_email ?? ''}
                  onChange={e => setSetting('notify_email', e.target.value)}
                  placeholder="you@company.com"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{t('captureforms.settings.primaryColor')}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={settings.primary_color ?? '#6366f1'}
                    onChange={e => setSetting('primary_color', e.target.value)}
                    className="h-8 w-8 rounded cursor-pointer border border-border"
                  />
                  <Input
                    value={settings.primary_color ?? '#6366f1'}
                    onChange={e => setSetting('primary_color', e.target.value)}
                    className="h-8 text-xs font-mono flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-2">
                  <Switch
                    id="create-contact"
                    checked={settings.create_contact !== false}
                    onCheckedChange={v => setSetting('create_contact', v)}
                  />
                  <Label htmlFor="create-contact" className="text-xs cursor-pointer">{t('captureforms.settings.createContact')}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="create-lead"
                    checked={settings.create_lead === true}
                    onCheckedChange={v => setSetting('create_lead', v)}
                  />
                  <Label htmlFor="create-lead" className="text-xs cursor-pointer">{t('captureforms.settings.createLead')}</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview panel */}
        <div className="flex-1 overflow-y-auto bg-muted/30 p-8">
          <p className="text-xs text-center text-muted-foreground mb-4">{t('captureforms.editor.livePreview')}</p>
          <FormPreview fields={fields} settings={settings} />
        </div>
      </div>
    </div>
  );
}
